#!/usr/bin/env node
/**
 * src/mcp-server.ts — Servidor MCP sin LLM
 *
 * Expone herramientas de análisis y acción como tools MCP.
 * No requiere ningún modelo de IA externo: GitHub Copilot (en VS Code)
 * es el motor de razonamiento; estas tools proveen contexto y ejecutan acciones.
 *
 * Herramientas expuestas:
 *   🔍  analizar-proyecto   — detecta framework, deps, scripts, aliases TS
 *   🔎  buscar-en-codigo    — grep en archivos JS/TS del proyecto
 *   📄  leer-archivo        — lee contenido de uno o más archivos
 *   📂  listar-directorio   — árbol de directorios
 *   🧪  ejecutar-tests      — corre Jest con cobertura
 *   📐  ejecutar-standards  — verifica estándares de código
 *   🛡️  npm-audit           — detecta vulnerabilidades en dependencias
 *   💾  escribir-archivo    — escribe archivo (en _staging/ si ya existe)
 *   📊  resumen-sesion      — estado de la memoria de sesión
 *   🗑️  limpiar-contexto    — limpia la sesión de un proyecto
 *
 * Uso:
 *   tsx src/mcp-server.ts          (desarrollo)
 *   node dist/mcp-server.js        (producción)
 *
 * Configurar en .vscode/mcp.json del proyecto destino.
 */

import { cargarEnv } from './setup.js';
cargarEnv();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { sessionStore } from './mastra/memory/sessionStore.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ── Helpers internos ──────────────────────────────────────────────────────────

function readdirRecursive(
  dir: string,
  exts: string[],
  maxDepth = 4,
  depth = 0,
): string[] {
  if (!fs.existsSync(dir) || depth > maxDepth) return [];
  let files: string[] = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(readdirRecursive(full, exts, maxDepth, depth + 1));
    } else if (exts.length === 0 || exts.includes(path.extname(f))) {
      files.push(full);
    }
  }
  return files;
}

function treeDir(dir: string, prefix = '', maxDepth = 3, depth = 0): string {
  if (!fs.existsSync(dir) || depth > maxDepth) return '';
  const IGNORAR = new Set([
    'node_modules',
    '.git',
    'coverage',
    'build',
    'dist',
    '.expo',
    'lib',
    'out',
  ]);
  const items = fs.readdirSync(dir).filter((f) => !IGNORAR.has(f));
  let result = '';
  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    result += `${prefix}${isLast ? '└── ' : '├── '}${item}\n`;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory() && depth < maxDepth) {
      result += treeDir(
        full,
        prefix + (isLast ? '    ' : '│   '),
        maxDepth,
        depth + 1,
      );
    }
  });
  return result;
}

// ── Definición de herramientas ────────────────────────────────────────────────

const HERRAMIENTAS = [
  {
    name: 'analizar-proyecto',
    description:
      '🔍 Lee package.json y estructura de src/ para obtener: framework detectado, dependencias, ' +
      'scripts disponibles, aliases TypeScript, gestor de paquetes (yarn/npm) y si tiene script "standards". ' +
      'Úsalo PRIMERO en cualquier tarea para entender el proyecto antes de crear o modificar archivos.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description:
            'Ruta absoluta al directorio raíz del proyecto a analizar',
        },
      },
      required: ['proyectoPath'],
    },
  },
  {
    name: 'buscar-en-codigo',
    description:
      '🔎 Busca en archivos JS/TS/JSX/TSX del proyecto que contengan una palabra clave. ' +
      'Devuelve ruta relativa y las líneas que coinciden. ' +
      'Útil para encontrar patrones de implementación, componentes reutilizables, importaciones o exports.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description: 'Ruta absoluta al directorio raíz del proyecto',
        },
        palabraClave: {
          type: 'string',
          description: 'Término de búsqueda (case-insensitive)',
        },
        maxResultados: {
          type: 'number',
          description: 'Número máximo de archivos a devolver (default: 10)',
        },
      },
      required: ['proyectoPath', 'palabraClave'],
    },
  },
  {
    name: 'leer-archivo',
    description:
      '📄 Lee el contenido completo de uno o más archivos. ' +
      'Úsalo para leer el código fuente de un componente, hook, configuración, navegador, etc. ' +
      'Puedes pasar múltiples rutas a la vez.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rutas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista de rutas absolutas de los archivos a leer',
        },
      },
      required: ['rutas'],
    },
  },
  {
    name: 'listar-directorio',
    description:
      '📂 Muestra el árbol de directorios de una ruta (sin node_modules/build/dist). ' +
      'Útil para entender la estructura del proyecto antes de decidir dónde crear archivos.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ruta: {
          type: 'string',
          description: 'Ruta absoluta del directorio a listar',
        },
        profundidad: {
          type: 'number',
          description: 'Profundidad máxima del árbol (default: 3)',
        },
      },
      required: ['ruta'],
    },
  },
  {
    name: 'ejecutar-tests',
    description:
      '🧪 Ejecuta los tests unitarios con cobertura en el proyecto. ' +
      'Devuelve el porcentaje de cobertura de statements y si cumple el umbral del 83%. ' +
      'Soporta filtrar por patrón de nombre de test.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description: 'Ruta absoluta al directorio raíz del proyecto',
        },
        testPattern: {
          type: 'string',
          description:
            '(Opcional) Patrón para filtrar tests. Ejemplo: "LoginScreen"',
        },
      },
      required: ['proyectoPath'],
    },
  },
  {
    name: 'ejecutar-standards',
    description:
      '📐 Ejecuta el script "standards" del package.json si existe. ' +
      'Verifica estándares de código del frontend. Si no existe el script, lista los scripts disponibles.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description: 'Ruta absoluta al directorio raíz del proyecto',
        },
      },
      required: ['proyectoPath'],
    },
  },
  {
    name: 'npm-audit',
    description:
      '🛡️ Detecta vulnerabilidades de seguridad en las dependencias con npm/yarn audit. ' +
      'Clasifica por severidad: critical, high, moderate, low.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description: 'Ruta absoluta al directorio raíz del proyecto',
        },
      },
      required: ['proyectoPath'],
    },
  },
  {
    name: 'escribir-archivo',
    description:
      '💾 Escribe contenido en un archivo. ' +
      'Si el archivo ya existe y forzar=false (default), guarda la propuesta en _staging/ para revisión manual. ' +
      'Si forzar=true, sobreescribe directamente. Crea los directorios intermedios automáticamente.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ruta: {
          type: 'string',
          description: 'Ruta absoluta del archivo a crear o actualizar',
        },
        contenido: {
          type: 'string',
          description: 'Contenido completo del archivo',
        },
        forzar: {
          type: 'boolean',
          description:
            'Si true, sobreescribe aunque el archivo ya exista (default: false)',
        },
      },
      required: ['ruta', 'contenido'],
    },
  },
  {
    name: 'resumen-sesion',
    description:
      '📊 Muestra el estado de la memoria de sesión: proyectos activos, ' +
      'cantidad de outputs almacenados y cuándo fue la última actividad.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description:
            '(Opcional) Ruta del proyecto para ver su detalle. Sin valor, muestra todas las sesiones.',
        },
      },
      required: [],
    },
  },
  {
    name: 'limpiar-contexto',
    description:
      '🗑️ Limpia la memoria de sesión de un proyecto para empezar desde cero. ' +
      'Pasa la ruta del proyecto o "todo" para limpiar todas las sesiones activas.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta absoluta del proyecto a limpiar, o "todo" para borrar todo.',
        },
      },
      required: ['mensaje'],
    },
  },
] as const;

// ── Servidor MCP ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'mastra-orquestador', version: '3.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: HERRAMIENTAS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // ── analizar-proyecto ─────────────────────────────────────────────────────
  if (name === 'analizar-proyecto') {
    const { proyectoPath } = args as { proyectoPath: string };
    const info: Record<string, unknown> = {};

    const pkgPath = path.join(proyectoPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const allDeps = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
      ];
      let framework = 'web';
      if (allDeps.includes('expo')) framework = 'Expo (React Native)';
      else if (allDeps.includes('react-native')) framework = 'React Native';
      else if (allDeps.includes('next')) framework = 'Next.js';
      else if (allDeps.includes('react'))
        framework = allDeps.includes('vite') ? 'React + Vite' : 'React';

      info.nombre = pkg.name;
      info.version = pkg.version;
      info.framework = framework;
      info.scripts = pkg.scripts ?? {};
      info.dependencias = Object.keys(pkg.dependencies ?? {});
      info.devDependencies = Object.keys(pkg.devDependencies ?? {});
      info.tieneStandards = !!pkg.scripts?.standards;
      info.gestorPaquetes = fs.existsSync(path.join(proyectoPath, 'yarn.lock'))
        ? 'yarn'
        : 'npm';
    }

    // Detectar lenguaje
    const tsconfigPath = path.join(proyectoPath, 'tsconfig.json');
    info.lenguaje = fs.existsSync(tsconfigPath) ? 'typescript' : 'javascript';
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        info.tsAliases = Object.keys(tsconfig?.compilerOptions?.paths ?? {});
      } catch {
        /* invalid json */
      }
    }

    const srcPath = path.join(proyectoPath, 'src');
    if (fs.existsSync(srcPath)) {
      info.estructuraSrc = fs
        .readdirSync(srcPath)
        .filter((f) => fs.statSync(path.join(srcPath, f)).isDirectory());
    }

    // Detectar screensDir
    const screensCandidates = [
      'src/screens',
      'src/pages',
      'src/app',
      'src/views',
      'app',
    ];
    info.screensDir =
      screensCandidates
        .map((c) => path.join(proyectoPath, c))
        .find((p) => fs.existsSync(p)) ??
      path.join(proyectoPath, 'src', 'screens');

    // Detectar i18n
    const allDepsI18n = [
      ...Object.keys((info as any).dependencias ?? []),
      ...Object.keys((info as any).devDependencies ?? []),
    ];
    {
      const pkgI18n = fs.existsSync(path.join(proyectoPath, 'package.json'))
        ? JSON.parse(
            fs.readFileSync(path.join(proyectoPath, 'package.json'), 'utf8'),
          )
        : {};
      const deps18n = {
        ...(pkgI18n.dependencies ?? {}),
        ...(pkgI18n.devDependencies ?? {}),
      };
      let i18nLib = 'ninguna';
      if ('react-i18next' in deps18n || 'i18next' in deps18n)
        i18nLib = 'react-i18next';
      else if ('react-intl' in deps18n) i18nLib = 'react-intl';
      else if ('@lingui/react' in deps18n) i18nLib = 'lingui';
      else if ('next-intl' in deps18n) i18nLib = 'next-intl';
      else if ('vue-i18n' in deps18n) i18nLib = 'vue-i18n';

      // Detectar carpeta de traducciones
      const i18nCandidates = [
        'src/locales',
        'src/i18n',
        'src/translations',
        'locales',
        'public/locales',
      ];
      const carpetaTraduccion =
        i18nCandidates
          .map((c) => path.join(proyectoPath, c))
          .find((p) => fs.existsSync(p)) ?? '';

      info.i18n = {
        libreria: i18nLib,
        patron: i18nLib !== 'ninguna' ? 'detectado' : 'ninguno',
        carpetaTraduccion,
      };
    }

    // Detectar analytics
    {
      const pkgAn = fs.existsSync(path.join(proyectoPath, 'package.json'))
        ? JSON.parse(
            fs.readFileSync(path.join(proyectoPath, 'package.json'), 'utf8'),
          )
        : {};
      const depsAn = {
        ...(pkgAn.dependencies ?? {}),
        ...(pkgAn.devDependencies ?? {}),
      };
      const firebase =
        '@react-native-firebase/analytics' in depsAn || 'firebase' in depsAn;
      const googleAnalytics =
        'react-ga4' in depsAn || 'react-ga' in depsAn || 'gtag' in depsAn;
      const appsFlyer = 'react-native-appsflyer' in depsAn;
      const mixpanel =
        'mixpanel-browser' in depsAn || 'react-native-mixpanel' in depsAn;

      // Detectar hook centralizado de analytics buscando patrones en src/
      let patron = 'ninguno';
      if (firebase || googleAnalytics || appsFlyer || mixpanel) {
        patron = 'directo'; // fallback si no se encuentra hook centralizado
        try {
          const analyticsHookPatterns = [
            'useEventTracker',
            'useAnalytics',
            'useTracking',
            'useTracker',
          ];
          const srcFiles = fs.existsSync(srcPath)
            ? readdirRecursive(srcPath, ['.ts', '.tsx', '.js', '.jsx'])
            : [];
          for (const file of srcFiles.slice(0, 200)) {
            const content = fs.readFileSync(file, 'utf8');
            for (const hookName of analyticsHookPatterns) {
              if (content.includes(`export`) && content.includes(hookName)) {
                patron = hookName;
                break;
              }
            }
            if (patron !== 'directo') break;
          }
        } catch {
          /* ignore */
        }
      }

      info.analytics = {
        firebase,
        googleAnalytics,
        appsFlyer,
        mixpanel,
        patron,
      };
    }

    // Detectar testing
    {
      const pkgT = fs.existsSync(path.join(proyectoPath, 'package.json'))
        ? JSON.parse(
            fs.readFileSync(path.join(proyectoPath, 'package.json'), 'utf8'),
          )
        : {};
      const depsT = {
        ...(pkgT.dependencies ?? {}),
        ...(pkgT.devDependencies ?? {}),
      };
      let testLib = 'ninguna';
      if ('@testing-library/react-native' in depsT)
        testLib = '@testing-library/react-native';
      else if ('@testing-library/react' in depsT)
        testLib = '@testing-library/react';
      else if ('enzyme' in depsT) testLib = 'enzyme';
      const framework2 = 'vitest' in depsT ? 'vitest' : 'jest';

      // Leer umbral de cobertura del jest.config.js/ts — pero siempre mínimo 83
      let umbralCobertura = 83;
      const jestConfigCandidates = [
        'jest.config.js',
        'jest.config.ts',
        'jest.config.mjs',
      ];
      for (const cfg of jestConfigCandidates) {
        const cfgPath = path.join(proyectoPath, cfg);
        if (fs.existsSync(cfgPath)) {
          const cfgContent = fs.readFileSync(cfgPath, 'utf8');
          const match = cfgContent.match(/statements['"]*\s*:\s*(\d+)/);
          if (match) {
            const configured = parseInt(match[1], 10);
            umbralCobertura = Math.max(configured, 83);
          }
          break;
        }
      }

      info.testing = {
        libreria: testLib,
        framework: framework2,
        umbralCobertura,
      };
    }

    // Detectar componentes UI
    {
      const pkgC = fs.existsSync(path.join(proyectoPath, 'package.json'))
        ? JSON.parse(
            fs.readFileSync(path.join(proyectoPath, 'package.json'), 'utf8'),
          )
        : {};
      const depsC = {
        ...(pkgC.dependencies ?? {}),
        ...(pkgC.devDependencies ?? {}),
      };
      let ui = 'primitivos';
      if ('native-base' in depsC) ui = 'nativebase';
      else if ('@mui/material' in depsC) ui = 'mui';
      else if ('tailwindcss' in depsC || 'nativewind' in depsC) ui = 'tailwind';
      else if ('@chakra-ui/react' in depsC) ui = 'chakra';
      else if ('@shadcn/ui' in depsC || 'shadcn' in depsC) ui = 'shadcn';

      // Detectar componentes custom buscando patrones en src/components
      let patronCustom = '';
      const componentsDir = path.join(proyectoPath, 'src', 'components');
      if (fs.existsSync(componentsDir)) {
        try {
          const files = readdirRecursive(
            componentsDir,
            ['.tsx', '.ts', '.jsx', '.js'],
            2,
          );
          const customNames: string[] = [];
          for (const file of files.slice(0, 50)) {
            const content = fs.readFileSync(file, 'utf8');
            const exportMatch = content.match(
              /export\s+(?:const|function)\s+([\w]+Custom[\w]*|Custom[\w]+)/g,
            );
            if (exportMatch) {
              exportMatch.forEach((m) => {
                const name = m
                  .replace(/export\s+(?:const|function)\s+/, '')
                  .trim();
                if (!customNames.includes(name)) customNames.push(name);
              });
            }
          }
          patronCustom = customNames.slice(0, 10).join(', ');
        } catch {
          /* ignore */
        }
      }

      info.componentes = { ui, patronCustom };
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(info, null, 2) }],
    };
  }

  // ── buscar-en-codigo ──────────────────────────────────────────────────────
  if (name === 'buscar-en-codigo') {
    const {
      proyectoPath,
      palabraClave,
      maxResultados = 10,
    } = args as {
      proyectoPath: string;
      palabraClave: string;
      maxResultados?: number;
    };
    const srcPath = path.join(proyectoPath, 'src');
    const archivos = readdirRecursive(srcPath, ['.js', '.jsx', '.ts', '.tsx']);
    const resultados: { archivo: string; lineas: string }[] = [];

    for (const archivo of archivos) {
      if (resultados.length >= maxResultados) break;
      const contenido = fs.readFileSync(archivo, 'utf8');
      if (contenido.toLowerCase().includes(palabraClave.toLowerCase())) {
        const lineas = contenido
          .split('\n')
          .map((l, i) => ({ n: i + 1, l }))
          .filter(({ l }) =>
            l.toLowerCase().includes(palabraClave.toLowerCase()),
          )
          .map(({ n, l }) => `  L${n}: ${l.trim()}`)
          .slice(0, 5)
          .join('\n');
        resultados.push({ archivo: archivo.replace(proyectoPath, ''), lineas });
      }
    }

    const texto =
      resultados.length === 0
        ? `No se encontró "${palabraClave}" en ${srcPath}`
        : resultados.map((r) => `📄 ${r.archivo}\n${r.lineas}`).join('\n\n');

    return { content: [{ type: 'text' as const, text: texto }] };
  }

  // ── leer-archivo ──────────────────────────────────────────────────────────
  if (name === 'leer-archivo') {
    const { rutas } = args as { rutas: string[] };
    const partes: string[] = [];
    for (const ruta of rutas) {
      if (!fs.existsSync(ruta)) {
        partes.push(`⚠️ No encontrado: ${ruta}`);
        continue;
      }
      const contenido = fs.readFileSync(ruta, 'utf8');
      partes.push(`📄 ${ruta}\n${'─'.repeat(60)}\n${contenido}`);
    }
    return { content: [{ type: 'text' as const, text: partes.join('\n\n') }] };
  }

  // ── listar-directorio ─────────────────────────────────────────────────────
  if (name === 'listar-directorio') {
    const { ruta, profundidad = 3 } = args as {
      ruta: string;
      profundidad?: number;
    };
    if (!fs.existsSync(ruta)) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `⚠️ Directorio no encontrado: ${ruta}`,
          },
        ],
      };
    }
    const arbol = `${ruta}\n` + treeDir(ruta, '', profundidad);
    return { content: [{ type: 'text' as const, text: arbol }] };
  }

  // ── ejecutar-tests ────────────────────────────────────────────────────────
  if (name === 'ejecutar-tests') {
    const { proyectoPath, testPattern } = args as {
      proyectoPath: string;
      testPattern?: string;
    };
    try {
      const gestor = fs.existsSync(path.join(proyectoPath, 'yarn.lock'))
        ? 'yarn'
        : 'npm run';
      const patronFlag = testPattern
        ? ` --testPathPattern="${testPattern}"`
        : '';
      const cmd = `${gestor} test -- --coverage --passWithNoTests${patronFlag}`;
      const salida = execSync(cmd, {
        cwd: proyectoPath,
        stdio: 'pipe',
        timeout: 120000,
      }).toString();

      const summaryPath = path.join(
        proyectoPath,
        'coverage',
        'coverage-summary.json',
      );
      if (fs.existsSync(summaryPath)) {
        const cov = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const pct: number = cov.total?.statements?.pct ?? 0;
        return {
          content: [
            {
              type: 'text' as const,
              text: `🧪 Tests ejecutados\nCobertura: ${pct}% ${pct >= 83 ? '✅' : '⚠️ (<83%)'}\n\n${salida.slice(-3000)}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `🧪 Tests OK\n\n${salida.slice(-3000)}`,
          },
        ],
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `❌ Error en tests:\n${msg.slice(0, 3000)}`,
          },
        ],
      };
    }
  }

  // ── ejecutar-standards ────────────────────────────────────────────────────
  if (name === 'ejecutar-standards') {
    const { proyectoPath } = args as { proyectoPath: string };
    const pkgPath = path.join(proyectoPath, 'package.json');
    const pkg = fs.existsSync(pkgPath)
      ? JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      : {};

    if (!pkg.scripts?.standards) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `ℹ️ Sin script "standards". Scripts disponibles:\n${Object.keys(pkg.scripts ?? {}).join(', ')}`,
          },
        ],
      };
    }

    try {
      const gestor = fs.existsSync(path.join(proyectoPath, 'yarn.lock'))
        ? 'yarn'
        : 'npm run';
      const salida = execSync(`${gestor} standards`, {
        cwd: proyectoPath,
        stdio: 'pipe',
        timeout: 60000,
      }).toString();
      return {
        content: [
          {
            type: 'text' as const,
            text: `📐 Standards OK\n\n${salida.slice(-2000)}`,
          },
        ],
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `❌ Standards fallaron:\n${msg.slice(0, 2000)}`,
          },
        ],
      };
    }
  }

  // ── npm-audit ─────────────────────────────────────────────────────────────
  if (name === 'npm-audit') {
    const { proyectoPath } = args as { proyectoPath: string };
    const esYarn = fs.existsSync(path.join(proyectoPath, 'yarn.lock'));
    const cmd = esYarn ? 'yarn audit --json' : 'npm audit --json';

    try {
      const output = execSync(cmd, {
        cwd: proyectoPath,
        stdio: 'pipe',
        timeout: 60000,
      }).toString();
      const result = JSON.parse(output);
      const vulns =
        result.metadata?.vulnerabilities ?? result.vulnerabilities ?? {};
      const total = Object.values(vulns).reduce(
        (acc: number, v) => acc + (typeof v === 'number' ? v : 0),
        0,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text:
              total === 0
                ? '✅ Sin vulnerabilidades detectadas.'
                : `⚠️ Vulnerabilidades:\n${JSON.stringify(vulns, null, 2)}`,
          },
        ],
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // npm/yarn audit exits with non-zero when vulnerabilities exist
      const jsonMatch = msg.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          const vulns =
            result.metadata?.vulnerabilities ?? result.vulnerabilities ?? {};
          return {
            content: [
              {
                type: 'text' as const,
                text: `⚠️ Vulnerabilidades encontradas:\n${JSON.stringify(vulns, null, 2)}`,
              },
            ],
          };
        } catch {
          /* ignore parse error */
        }
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `🛡️ npm audit:\n${msg.slice(0, 2000)}`,
          },
        ],
      };
    }
  }

  // ── escribir-archivo ──────────────────────────────────────────────────────
  if (name === 'escribir-archivo') {
    const {
      ruta,
      contenido,
      forzar = false,
    } = args as {
      ruta: string;
      contenido: string;
      forzar?: boolean;
    };

    if (fs.existsSync(ruta) && !forzar) {
      const stagingDir = path.join(path.dirname(ruta), '_staging');
      const stagingPath = path.join(stagingDir, path.basename(ruta));
      fs.mkdirSync(stagingDir, { recursive: true });
      fs.writeFileSync(stagingPath, contenido, 'utf8');
      return {
        content: [
          {
            type: 'text' as const,
            text: `⚠️ El archivo ya existe. Propuesta guardada en:\n${stagingPath}\n\nRevisa y mueve manualmente si apruebas los cambios.`,
          },
        ],
      };
    }

    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, contenido, 'utf8');
    return {
      content: [{ type: 'text' as const, text: `✅ Archivo escrito: ${ruta}` }],
    };
  }

  // ── resumen-sesion ────────────────────────────────────────────────────────
  if (name === 'resumen-sesion') {
    const { proyectoPath } = (args ?? {}) as { proyectoPath?: string };
    const sessions = await sessionStore.listSessions();

    if (sessions.length === 0) {
      return {
        content: [
          { type: 'text' as const, text: '📭 No hay sesiones activas.' },
        ],
      };
    }

    const filtradas = proyectoPath
      ? sessions.filter((s) => s.projectPath.includes(proyectoPath))
      : sessions;

    const texto = filtradas
      .map(
        (s) =>
          `📁 ${s.projectPath}\n   Outputs: ${s.outputCount} | Última actividad: ${s.lastUpdated}`,
      )
      .join('\n\n');

    return { content: [{ type: 'text' as const, text: texto }] };
  }

  // ── limpiar-contexto ──────────────────────────────────────────────────────
  if (name === 'limpiar-contexto') {
    const { mensaje } = args as { mensaje: string };
    if (mensaje.trim().toLowerCase() === 'todo') {
      await sessionStore.clearAll();
      return {
        content: [
          { type: 'text' as const, text: '✅ Todas las sesiones eliminadas.' },
        ],
      };
    }
    const cleared = await sessionStore.clear(mensaje.trim());
    return {
      content: [
        {
          type: 'text' as const,
          text: cleared
            ? `✅ Sesión "${mensaje.trim()}" eliminada.`
            : `⚠️ No se encontró sesión para "${mensaje.trim()}".`,
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: 'text' as const, text: `Tool desconocida: ${name}` }],
  };
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────

await sessionStore.init();

const transport = new StdioServerTransport();
await server.connect(transport);
