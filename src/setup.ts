/**
 * setup.ts — Carga de variables de entorno
 *
 * Lee el archivo .env del directorio de trabajo y carga
 * las variables al proceso antes de inicializar los agentes.
 */
import fs from 'fs';
import path from 'path';

function envPath(): string {
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
