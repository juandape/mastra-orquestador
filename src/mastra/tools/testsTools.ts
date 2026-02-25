import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const ejecutarTestsTool = createTool({
  id: 'ejecutar-tests',
  description:
    'Ejecuta los tests unitarios del proyecto con cobertura y devuelve el porcentaje de cobertura de statements.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe(
        'Ruta absoluta al directorio raíz del proyecto donde correr los tests',
      ),
  }),
  outputSchema: z.object({
    cobertura: z.number(),
    cumpleUmbral: z.boolean(),
    mensaje: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;

    try {
      execSync('npm test -- --coverage --json --outputFile=coverage.json', {
        cwd: proyectoPath,
        stdio: 'pipe',
      });

      const summaryPath = path.join(
        proyectoPath,
        'coverage',
        'coverage-summary.json',
      );
      if (!fs.existsSync(summaryPath)) {
        return {
          cobertura: 0,
          cumpleUmbral: false,
          mensaje: 'No se encontró el reporte de cobertura.',
          error: 'Archivo coverage-summary.json no encontrado.',
        };
      }

      const coverage = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      const pct: number = coverage.total.statements.pct;
      const cumple = pct >= 83;

      return {
        cobertura: pct,
        cumpleUmbral: cumple,
        mensaje: cumple
          ? `Cobertura OK: ${pct}% (umbral: 83%)`
          : `Cobertura insuficiente: ${pct}% < 83%. Mejora los tests.`,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        cobertura: 0,
        cumpleUmbral: false,
        mensaje: 'Error al ejecutar tests.',
        error: msg,
      };
    }
  },
});
