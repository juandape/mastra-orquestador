/**
 * setup.ts — Carga de variables de entorno
 *
 * Lee el archivo .env del proyecto. Busca en este orden:
 *   1. Directorio del script (robusto ante cualquier cwd)
 *   2. process.cwd() como fallback
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function envPath(): string {
  // 1. Relativo al archivo del script (independiente del cwd que use VS Code)
  try {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    // Desde src/ subir un nivel al raíz del proyecto
    const projectRoot = path.resolve(scriptDir, '..');
    const rootEnv = path.join(projectRoot, '.env');
    if (fs.existsSync(rootEnv)) return rootEnv;
  } catch {
    // import.meta.url no disponible en algunos contextos
  }
  // 2. Fallback: cwd
  return path.join(process.cwd(), '.env');
}

/**
 * Carga las variables del .env local al proceso.
 * Llama esto antes de importar los agentes Mastra.
 */
export function cargarEnv(): void {
  const ep = envPath();
  if (!fs.existsSync(ep)) return;
  for (const line of fs.readFileSync(ep, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
