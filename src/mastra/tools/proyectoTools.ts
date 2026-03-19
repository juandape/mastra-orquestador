import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
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
      if (
        f === 'node_modules' ||
        f === '.git' ||
        f === 'coverage' ||
        f === 'build' ||
        f === 'dist'
      )
        continue;
      files = files.concat(readdirRecursive(full, exts, maxDepth, depth + 1));
    } else if (exts.length === 0 || exts.includes(path.extname(f))) {
      files.push(full);
    }
  }
  return files;
}

export const analizarEstructuraTool = createTool({
  id: 'analizar-estructura-proyecto',
  description:
    'Lee el package.json y la estructura de carpetas de un proyecto React/React Native para obtener dependencias, directorios y scripts disponibles.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto a analizar'),
  }),
  outputSchema: z.object({
    nombre: z.string(),
    dependencias: z.array(z.string()),
    devDependencies: z.array(z.string()),
    carpetas: z.array(z.string()),
    scripts: z.record(z.string(), z.string()),
    tieneStandards: z.boolean(),
    framework: z.string(),
    gestorPaquetes: z.string(),
    lenguaje: z.string(),
    tsAliases: z.record(z.string(), z.string()),
    screensDir: z.string(),
    i18n: z.object({
      libreria: z.string(),
      patron: z.string(),
      carpetaTraduccion: z.string(),
    }),
    analytics: z.object({
      firebase: z.boolean(),
      googleAnalytics: z.boolean(),
      appsFlyer: z.boolean(),
      mixpanel: z.boolean(),
      patron: z.string(),
    }),
    testing: z.object({
      libreria: z.string(),
      framework: z.string(),
      umbralCobertura: z.number(),
    }),
    componentes: z.object({
      ui: z.string(),
      patronCustom: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;

    let nombre = 'Desconocido';
    let dependencias: string[] = [];
    let devDependencies: string[] = [];
    let carpetas: string[] = [];
    let scripts: Record<string, string> = {};
    let tieneStandards = false;
    let framework = 'desconocido';

    const pkgPath = path.join(proyectoPath, 'package.json');
    let allDeps: string[] = [];
    let depsObj: Record<string, string> = {};

    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      nombre = pkg.name || 'Desconocido';
      dependencias = Object.keys(pkg.dependencies || {});
      devDependencies = Object.keys(pkg.devDependencies || {});
      scripts = pkg.scripts || {};
      tieneStandards = !!scripts['standards'];
      depsObj = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      allDeps = [...dependencias, ...devDependencies];

      if (allDeps.includes('expo')) framework = 'Expo (React Native)';
      else if (allDeps.includes('react-native')) framework = 'React Native';
      else if (allDeps.includes('next')) framework = 'Next.js';
      else if (allDeps.includes('react'))
        framework = allDeps.includes('vite') ? 'React + Vite' : 'React (CRA)';
    }

    const srcPath = path.join(proyectoPath, 'src');
    if (fs.existsSync(srcPath)) {
      carpetas = fs
        .readdirSync(srcPath)
        .filter((f) => fs.statSync(path.join(srcPath, f)).isDirectory());
    }

    // Gestor de paquetes
    const gestorPaquetes = fs.existsSync(path.join(proyectoPath, 'yarn.lock'))
      ? 'yarn'
      : fs.existsSync(path.join(proyectoPath, 'pnpm-lock.yaml'))
        ? 'pnpm'
        : 'npm';

    // Lenguaje y aliases TS
    const tsconfigPath = path.join(proyectoPath, 'tsconfig.json');
    const lenguaje = fs.existsSync(tsconfigPath) ? 'typescript' : 'javascript';
    let tsAliases: Record<string, string> = {};
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const paths = tsconfig?.compilerOptions?.paths ?? {};
        tsAliases = Object.fromEntries(
          Object.entries(paths).map(([k, v]) => [
            k,
            Array.isArray(v) ? (v[0] as string) : String(v),
          ]),
        );
      } catch {
        /* invalid json */
      }
    }

    // screensDir
    const screensCandidates = [
      'src/screens',
      'src/pages',
      'src/app',
      'src/views',
      'app',
    ];
    const screensDir =
      screensCandidates
        .map((c) => path.join(proyectoPath, c))
        .find((p) => fs.existsSync(p)) ??
      path.join(proyectoPath, 'src', 'screens');

    // i18n
    let i18nLib = 'ninguna';
    if ('react-i18next' in depsObj || 'i18next' in depsObj)
      i18nLib = 'react-i18next';
    else if ('react-intl' in depsObj) i18nLib = 'react-intl';
    else if ('@lingui/react' in depsObj) i18nLib = 'lingui';
    else if ('next-intl' in depsObj) i18nLib = 'next-intl';

    const i18nCarpetaCandidates = [
      'src/locales',
      'src/i18n',
      'src/translations',
      'locales',
      'public/locales',
    ];
    const carpetaTraduccion =
      i18nCarpetaCandidates
        .map((c) => path.join(proyectoPath, c))
        .find((p) => fs.existsSync(p)) ?? '';

    const i18n = {
      libreria: i18nLib,
      patron: i18nLib !== 'ninguna' ? 'detectado' : 'ninguno',
      carpetaTraduccion,
    };

    // Analytics
    const firebase =
      '@react-native-firebase/analytics' in depsObj || 'firebase' in depsObj;
    const googleAnalytics = 'react-ga4' in depsObj || 'react-ga' in depsObj;
    const appsFlyer = 'react-native-appsflyer' in depsObj;
    const mixpanel =
      'mixpanel-browser' in depsObj || 'react-native-mixpanel' in depsObj;

    let analyticsPatron = 'ninguno';
    if (firebase || googleAnalytics || appsFlyer || mixpanel) {
      analyticsPatron = 'directo';
      try {
        const hookNames = [
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
          for (const hookName of hookNames) {
            if (content.includes('export') && content.includes(hookName)) {
              analyticsPatron = hookName;
              break;
            }
          }
          if (analyticsPatron !== 'directo') break;
        }
      } catch {
        /* ignore */
      }
    }

    const analytics = {
      firebase,
      googleAnalytics,
      appsFlyer,
      mixpanel,
      patron: analyticsPatron,
    };

    // Testing
    let testLibreria = 'ninguna';
    if ('@testing-library/react-native' in depsObj)
      testLibreria = '@testing-library/react-native';
    else if ('@testing-library/react' in depsObj)
      testLibreria = '@testing-library/react';
    else if ('enzyme' in depsObj) testLibreria = 'enzyme';
    const testFramework = 'vitest' in depsObj ? 'vitest' : 'jest';

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

    const testing = {
      libreria: testLibreria,
      framework: testFramework,
      umbralCobertura,
    };

    // Componentes UI
    let ui = 'primitivos';
    if ('native-base' in depsObj) ui = 'nativebase';
    else if ('@mui/material' in depsObj) ui = 'mui';
    else if ('tailwindcss' in depsObj || 'nativewind' in depsObj)
      ui = 'tailwind';
    else if ('@chakra-ui/react' in depsObj) ui = 'chakra';
    else if ('@shadcn/ui' in depsObj || 'shadcn' in depsObj) ui = 'shadcn';

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
          const matches = content.match(
            /export\s+(?:const|function)\s+([\w]+Custom[\w]*|Custom[\w]+)/g,
          );
          if (matches) {
            matches.forEach((m) => {
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

    const componentes = { ui, patronCustom };

    return {
      nombre,
      dependencias,
      devDependencies,
      carpetas,
      scripts,
      tieneStandards,
      framework,
      gestorPaquetes,
      lenguaje,
      tsAliases,
      screensDir,
      i18n,
      analytics,
      testing,
      componentes,
    };
  },
});

export const buscarImplementacionesSimilaresTool = createTool({
  id: 'buscar-implementaciones-similares',
  description:
    'Busca en los archivos fuente JS/TS/JSX/TSX del proyecto implementaciones que contengan la palabra clave dada.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
    palabraClave: z
      .string()
      .describe(
        'Término de búsqueda para encontrar implementaciones similares',
      ),
  }),
  outputSchema: z.object({
    resultados: z.array(
      z.object({
        archivo: z.string(),
        fragmento: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const { proyectoPath, palabraClave } = context;
    const srcPath = path.join(proyectoPath, 'src');
    const extensiones = ['.js', '.jsx', '.ts', '.tsx'];

    function buscarArchivos(dir: string): string[] {
      if (!fs.existsSync(dir)) return [];
      let files: string[] = [];
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          files = files.concat(buscarArchivos(full));
        } else if (extensiones.includes(path.extname(f))) {
          files.push(full);
        }
      }
      return files;
    }

    const archivos = buscarArchivos(srcPath);
    const resultados: { archivo: string; fragmento: string }[] = [];

    for (const archivo of archivos) {
      const contenido = fs.readFileSync(archivo, 'utf8');
      if (contenido.toLowerCase().includes(palabraClave.toLowerCase())) {
        resultados.push({ archivo, fragmento: contenido.slice(0, 500) });
      }
    }

    return { resultados };
  },
});

// ── Ejecutar script de standards ──────────────────────────────────────────────

export const ejecutarStandardsTool = createTool({
  id: 'ejecutar-standards',
  description:
    'Verifica si el proyecto tiene un script "standards" en package.json y lo ejecuta para comprobar estándares de código frontend. Si no existe el script, lo indica sin error.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
  }),
  outputSchema: z.object({
    tieneStandards: z.boolean(),
    exito: z.boolean(),
    salida: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;
    const pkgPath = path.join(proyectoPath, 'package.json');

    if (!fs.existsSync(pkgPath)) {
      return {
        tieneStandards: false,
        exito: false,
        salida: 'No se encontró package.json en el proyecto.',
      };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const tieneStandards = !!pkg.scripts?.standards;

    if (!tieneStandards) {
      return {
        tieneStandards: false,
        exito: true,
        salida:
          'El proyecto no tiene un script "standards" en package.json. ' +
          'No se ejecutó verificación de estándares de código.',
      };
    }

    try {
      const gestor = fs.existsSync(path.join(proyectoPath, 'yarn.lock'))
        ? 'yarn'
        : fs.existsSync(path.join(proyectoPath, 'pnpm-lock.yaml'))
          ? 'pnpm'
          : 'npm run';
      const salida = execSync(`${gestor} standards`, {
        cwd: proyectoPath,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 120_000,
      });
      return {
        tieneStandards: true,
        exito: true,
        salida: salida || 'Script "standards" ejecutado sin errores.',
      };
    } catch (e: unknown) {
      const err = e as any;
      const output: string = err.stdout ?? '';
      const stderr: string = err.stderr ?? '';
      const combined = [output, stderr].filter(Boolean).join('\n');
      return {
        tieneStandards: true,
        exito: false,
        salida:
          'El script "standards" encontró problemas de estándares de código.',
        error: combined || String(e),
      };
    }
  },
});
