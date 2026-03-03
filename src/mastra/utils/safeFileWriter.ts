/**
 * safeFileWriter.ts — Escritura segura de archivos del proyecto del usuario
 *
 * ─────────────────────────────────────────────────────────────────
 *  PRINCIPIOS APLICADOS
 *  • SRP  — única responsabilidad: operaciones seguras sobre archivos
 *  • OCP  — nuevos modos se agregan sin modificar los consumidores
 *  • DRY  — toda la lógica de seguridad en un solo lugar
 *  • KISS — API simple: writeFileSafe(path, content, mode)
 * ─────────────────────────────────────────────────────────────────
 *
 *  MODOS disponibles:
 *  ┌──────────────────┬────────────────────────────────────────────────────┐
 *  │ create-only      │ Escribe SOLO si el archivo no existe.              │
 *  │                  │ Si existe → escribe en _staging/ y avisa.         │
 *  ├──────────────────┼────────────────────────────────────────────────────┤
 *  │ staging          │ Siempre escribe en _staging/ (nunca en producción).│
 *  ├──────────────────┼────────────────────────────────────────────────────┤
 *  │ backup-overwrite │ Crea un .bak.{timestamp} del archivo existente    │
 *  │                  │ y luego sobreescribe. El flujo sigue intacto.      │
 *  └──────────────────┴────────────────────────────────────────────────────┘
 *
 *  La carpeta _staging/ es visible para el desarrollador pero ignorada
 *  por Git si se añade a .gitignore. El agente siempre indica la ruta
 *  final en el resultado para que el usuario sepa dónde revisar.
 */

import fs from 'fs';
import path from 'path';

// ── Tipos públicos ─────────────────────────────────────────────────────────────

/** Modos de escritura segura */
export type WriteMode = 'create-only' | 'staging' | 'backup-overwrite';

/** Resultado de una operación de escritura segura */
export interface WriteResult {
  /** Si se realizó alguna escritura */
  written: boolean;
  /** Ruta final donde se escribió (puede ser staging) */
  finalPath: string;
  /** Modo que se aplicó */
  mode: WriteMode;
  /** Ruta del backup si se creó */
  backupPath?: string;
  /** Mensaje explicativo para el agente / usuario */
  message: string;
}

// ── Helpers internos ──────────────────────────────────────────────────────────

/** Construye la ruta equivalente dentro de _staging/ */
function toStagingPath(filePath: string, projectRoot: string): string {
  const relative = path.relative(projectRoot, filePath);
  return path.join(projectRoot, '_staging', relative);
}

/** Timestamp compacto para nombres de backup: 20260303_142530 */
function timestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .replace(/\..+/, '')
    .slice(0, 15);
}

/** Asegura que el directorio padre exista */
function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/** Añade _staging/ al .gitignore de raíz si no está ya */
function ensureStagingIgnored(projectRoot: string): void {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const entry = '_staging/';
  if (!fs.existsSync(gitignorePath)) return;
  const content = fs.readFileSync(gitignorePath, 'utf8');
  if (!content.includes(entry)) {
    fs.appendFileSync(
      gitignorePath,
      `\n# mastra-orquestador — propuestas pendientes de revisión\n${entry}\n`,
    );
  }
}

// ── API pública ────────────────────────────────────────────────────────────────

/**
 * Escribe `content` en `filePath` aplicando la estrategia `mode`.
 *
 * @param filePath    Ruta absoluta del archivo destino (producción).
 * @param content     Contenido a escribir.
 * @param mode        Estrategia de seguridad (default: 'create-only').
 * @param projectRoot Raíz del proyecto; necesario para calcular rutas staging.
 *                    Si no se provee se infiere como el directorio que contiene `src/`.
 */
export function writeFileSafe(
  filePath: string,
  content: string,
  mode: WriteMode = 'create-only',
  projectRoot?: string,
): WriteResult {
  // Inferir projectRoot si no se pasó
  const root = projectRoot ?? inferProjectRoot(filePath);
  const fileExists = fs.existsSync(filePath);

  switch (mode) {
    // ── create-only ─────────────────────────────────────────────────────────
    case 'create-only': {
      if (!fileExists) {
        ensureDir(filePath);
        fs.writeFileSync(filePath, content, 'utf8');
        return {
          written: true,
          finalPath: filePath,
          mode,
          message: `✅ Archivo creado: ${filePath}`,
        };
      }

      // El archivo ya existe → proponer en staging, NUNCA sobrescribir
      const stagingPath = toStagingPath(filePath, root);
      ensureDir(stagingPath);
      fs.writeFileSync(stagingPath, content, 'utf8');
      ensureStagingIgnored(root);
      return {
        written: true,
        finalPath: stagingPath,
        mode,
        message:
          `⚠️  El componente ya existe en producción. La propuesta se guardó en:\n` +
          `   ${stagingPath}\n` +
          `   Revisa las diferencias y decide si quieres integrarla manualmente.`,
      };
    }

    // ── staging ──────────────────────────────────────────────────────────────
    case 'staging': {
      const stagingPath = toStagingPath(filePath, root);
      ensureDir(stagingPath);
      fs.writeFileSync(stagingPath, content, 'utf8');
      ensureStagingIgnored(root);
      return {
        written: true,
        finalPath: stagingPath,
        mode,
        message:
          `📁 Propuesta guardada en staging (sin tocar producción):\n` +
          `   ${stagingPath}`,
      };
    }

    // ── backup-overwrite ─────────────────────────────────────────────────────
    case 'backup-overwrite': {
      let backupPath: string | undefined;

      if (fileExists) {
        backupPath = `${filePath}.bak.${timestamp()}`;
        fs.copyFileSync(filePath, backupPath);
      }

      ensureDir(filePath);
      fs.writeFileSync(filePath, content, 'utf8');

      return {
        written: true,
        finalPath: filePath,
        mode,
        backupPath,
        message: backupPath
          ? `✅ Archivo actualizado. Backup guardado en:\n   ${backupPath}`
          : `✅ Archivo creado (no existía backup previo): ${filePath}`,
      };
    }
  }
}

// ── Helpers de conveniencia ───────────────────────────────────────────────────

/**
 * Infiere la raíz del proyecto buscando hacia arriba el directorio que
 * contenga `package.json`. Fallback al directorio del archivo.
 */
function inferProjectRoot(filePath: string): string {
  let dir = path.dirname(filePath);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.dirname(filePath);
}
