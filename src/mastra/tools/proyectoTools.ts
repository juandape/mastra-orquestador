import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
    scripts: z.record(z.string()),
    tieneStandards: z.boolean(),
    framework: z.string(),
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
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      nombre = pkg.name || 'Desconocido';
      dependencias = Object.keys(pkg.dependencies || {});
      devDependencies = Object.keys(pkg.devDependencies || {});
      scripts = pkg.scripts || {};
      tieneStandards = !!scripts['standards'];

      // Detectar framework
      const allDeps = [...dependencias, ...devDependencies];
      if (allDeps.includes('react-native') || allDeps.includes('expo')) {
        framework = allDeps.includes('expo')
          ? 'Expo (React Native)'
          : 'React Native';
      } else if (allDeps.includes('next')) {
        framework = 'Next.js';
      } else if (allDeps.includes('react')) {
        framework = allDeps.includes('vite') ? 'React + Vite' : 'React (CRA)';
      }
    }

    const srcPath = path.join(proyectoPath, 'src');
    if (fs.existsSync(srcPath)) {
      carpetas = fs
        .readdirSync(srcPath)
        .filter((f) => fs.statSync(path.join(srcPath, f)).isDirectory());
    }

    return {
      nombre,
      dependencias,
      devDependencies,
      carpetas,
      scripts,
      tieneStandards,
      framework,
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
      const salida = execSync('npm run standards', {
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
