import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export const analizarEstructuraTool = createTool({
  id: 'analizar-estructura-proyecto',
  description:
    'Lee el package.json y la estructura de carpetas de un proyecto React/React Native para obtener dependencias y directorios.',
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
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;

    let nombre = 'Desconocido';
    let dependencias: string[] = [];
    let devDependencies: string[] = [];
    let carpetas: string[] = [];

    const pkgPath = path.join(proyectoPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      nombre = pkg.name || 'Desconocido';
      dependencias = Object.keys(pkg.dependencies || {});
      devDependencies = Object.keys(pkg.devDependencies || {});
    }

    const srcPath = path.join(proyectoPath, 'src');
    if (fs.existsSync(srcPath)) {
      carpetas = fs
        .readdirSync(srcPath)
        .filter((f) => fs.statSync(path.join(srcPath, f)).isDirectory());
    }

    return { nombre, dependencias, devDependencies, carpetas };
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
