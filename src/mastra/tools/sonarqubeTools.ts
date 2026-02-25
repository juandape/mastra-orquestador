import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { execSync } from 'child_process';

export const ejecutarSonarScannerTool = createTool({
  id: 'ejecutar-sonar-scanner',
  description:
    'Ejecuta sonar-scanner en el proyecto para analizar calidad de código. Requiere sonar-scanner instalado y configurado.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
  }),
  outputSchema: z.object({
    exito: z.boolean(),
    mensaje: z.string(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;
    try {
      execSync('sonar-scanner', { cwd: proyectoPath, stdio: 'pipe' });
      return {
        exito: true,
        mensaje: 'Análisis SonarQube completado exitosamente.',
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        exito: false,
        mensaje: `Error ejecutando sonar-scanner: ${msg}`,
      };
    }
  },
});

export const ejecutarNpmAuditTool = createTool({
  id: 'ejecutar-npm-audit',
  description:
    'Ejecuta npm audit para detectar vulnerabilidades de seguridad en las dependencias del proyecto.',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
  }),
  outputSchema: z.object({
    vulnerabilidades: z.record(z.unknown()),
    mensaje: z.string(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath } = context;
    try {
      const output = execSync('npm audit --json', {
        cwd: proyectoPath,
        stdio: 'pipe',
      }).toString();
      const result = JSON.parse(output);
      const vulns = result.metadata?.vulnerabilities ?? {};
      const total = Object.values(vulns).reduce(
        (acc: number, v) => acc + (typeof v === 'number' ? v : 0),
        0,
      );
      return {
        vulnerabilidades: vulns,
        mensaje:
          total === 0
            ? 'No se encontraron vulnerabilidades.'
            : `Se encontraron vulnerabilidades: ${JSON.stringify(vulns)}`,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        vulnerabilidades: {},
        mensaje: 'Error ejecutando npm audit.',
        error: msg,
      };
    }
  },
});
