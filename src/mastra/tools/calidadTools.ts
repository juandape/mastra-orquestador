import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Executes a shell command and captures stdout + stderr.
 * Returns { exito, salida, error } without throwing.
 */
function runCmd(
  cmd: string,
  cwd: string,
  timeout = 120_000,
): { exito: boolean; salida: string; error?: string } {
  try {
    const salida = execSync(cmd, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout,
    });
    return { exito: true, salida: (salida ?? '').trim().slice(0, 4000) };
  } catch (e: unknown) {
    const err = e as any;
    const stdout: string = err.stdout ?? '';
    const stderr: string = err.stderr ?? '';
    const combined = [stdout, stderr].filter(Boolean).join('\n').trim();
    return {
      exito: false,
      salida: combined.slice(0, 4000),
      error: combined.slice(0, 4000) || String(e).slice(0, 1000),
    };
  }
}

// ── Tool principal ────────────────────────────────────────────────────────────

export const revisarYCorregirCalidadTool = createTool({
  id: 'revisar-y-corregir-calidad',
  description:
    'Ejecuta en secuencia: yarn standards, typecheck (tsc), eslint --fix y yarn test. ' +
    'Devuelve el resultado de cada paso con errores detallados para que el agente los corrija. ' +
    'ESLint se ejecuta con --fix para corregir automáticamente lo que pueda. ' +
    'Los tests son opcionales (incluirTests=false por defecto para agilizar la revisión).',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al directorio raíz del proyecto'),
    incluirTests: z
      .boolean()
      .optional()
      .describe(
        'Si true, ejecuta también yarn test con cobertura. Default: false.',
      ),
    testPattern: z
      .string()
      .optional()
      .describe(
        '(Opcional) Patrón para filtrar tests. Solo aplica si incluirTests=true.',
      ),
  }),
  outputSchema: z.object({
    standards: z.object({
      exito: z.boolean(),
      salida: z.string(),
      error: z.string().optional(),
    }),
    typecheck: z.object({
      exito: z.boolean(),
      salida: z.string(),
      error: z.string().optional(),
    }),
    eslint: z.object({
      exito: z.boolean(),
      salida: z.string(),
      error: z.string().optional(),
    }),
    tests: z
      .object({
        ejecutado: z.boolean(),
        exito: z.boolean(),
        cobertura: z.number(),
        salida: z.string(),
        error: z.string().optional(),
      })
      .optional(),
    resumen: z.string(),
    todoOk: z.boolean(),
  }),
  execute: async ({ context }) => {
    const { proyectoPath, incluirTests = false, testPattern } = context;

    const pkgPath = path.join(proyectoPath, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      const msg = `No se encontró package.json en: ${proyectoPath}`;
      return {
        standards: { exito: false, salida: msg },
        typecheck: { exito: false, salida: msg },
        eslint: { exito: false, salida: msg },
        resumen: `❌ ${msg}`,
        todoOk: false,
      };
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const gestor = fs.existsSync(path.join(proyectoPath, 'yarn.lock'))
      ? 'yarn'
      : 'npm run';

    const pasos: string[] = [];

    // ── 1. Standards ─────────────────────────────────────────────────────────
    let standards: { exito: boolean; salida: string; error?: string };
    if (pkg.scripts?.standards) {
      standards = runCmd(`${gestor} standards`, proyectoPath, 120_000);
      pasos.push(
        standards.exito
          ? '✅ standards'
          : `❌ standards: ${(standards.error ?? standards.salida).split('\n')[0]}`,
      );
    } else {
      standards = {
        exito: true,
        salida: 'No existe script "standards" en package.json — omitido.',
      };
      pasos.push('⏭️ standards (no existe script)');
    }

    // ── 2. Typecheck ─────────────────────────────────────────────────────────
    const typecheckCmd = pkg.scripts?.typecheck
      ? `${gestor} typecheck`
      : 'npx tsc --noEmit';
    const typecheck = runCmd(typecheckCmd, proyectoPath, 120_000);
    pasos.push(
      typecheck.exito
        ? '✅ typecheck'
        : `❌ typecheck: ${(typecheck.error ?? typecheck.salida).split('\n')[0]}`,
    );

    // ── 3. ESLint con --fix ───────────────────────────────────────────────────
    // Prefer yarn lint (which already includes --fix in BluPersonasApp).
    // If "lint" script doesn't exist, fall back to direct eslint invocation.
    let eslintCmd: string;
    if (pkg.scripts?.lint) {
      eslintCmd = `${gestor} lint`;
    } else {
      eslintCmd = `npx eslint ./src --fix --ext .ts,.tsx,.js,.jsx`;
    }
    const eslint = runCmd(eslintCmd, proyectoPath, 120_000);
    pasos.push(
      eslint.exito
        ? '✅ eslint (--fix aplicado)'
        : `❌ eslint: ${(eslint.error ?? eslint.salida).split('\n')[0]}`,
    );

    // ── 4. Tests (opcional) ───────────────────────────────────────────────────
    let tests:
      | {
          ejecutado: boolean;
          exito: boolean;
          cobertura: number;
          salida: string;
          error?: string;
        }
      | undefined;

    if (incluirTests) {
      const patronFlag = testPattern
        ? ` --testPathPattern="${testPattern}"`
        : '';
      const testCmd = `${gestor} test -- --coverage --passWithNoTests${patronFlag}`;
      const resultado = runCmd(testCmd, proyectoPath, 240_000);

      let cobertura = 0;
      const summaryPath = path.join(
        proyectoPath,
        'coverage',
        'coverage-summary.json',
      );
      if (fs.existsSync(summaryPath)) {
        try {
          const cov = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
          cobertura = cov.total?.statements?.pct ?? 0;
        } catch {
          /* ignore */
        }
      }

      tests = {
        ejecutado: true,
        exito: resultado.exito,
        cobertura,
        salida: resultado.salida,
        error: resultado.error,
      };

      if (resultado.exito) {
        pasos.push(`✅ tests (cobertura: ${cobertura}%)`);
      } else {
        pasos.push(
          `❌ tests: ${(resultado.error ?? resultado.salida).split('\n')[0]}`,
        );
      }
    } else {
      pasos.push(
        '⏭️ tests (omitidos — pasa incluirTests=true para ejecutarlos)',
      );
    }

    const todoOk =
      [standards, typecheck, eslint].every((r) => r.exito) &&
      (!tests || tests.exito);

    const resumen = [
      todoOk
        ? '🎉 Todos los checks pasaron correctamente.'
        : '⚠️ Algunos checks fallaron. Revisa los errores y corrige:',
      ...pasos,
    ].join('\n');

    return {
      standards,
      typecheck,
      eslint,
      tests,
      resumen,
      todoOk,
    };
  },
});
