/**
 * sessionStore.ts — Memoria reactiva persistente con SQLite (libsql)
 *
 * ─────────────────────────────────────────────────────────────────
 *  PATRÓN: Observer + Reactive Context + Persistent Storage
 *
 *  Cada vez que un agente completa su tarea, su output se almacena
 *  en SQLite (archivo local). El siguiente agente que se ejecute
 *  sobre el mismo proyecto recibe automáticamente todo el contexto.
 *
 *  Flujo reactivo:
 *    analisisAgente escribe → pantallasAgente lee
 *    pantallasAgente escribe → testsAgente lee
 *    testsAgente escribe → mediadorAgente consolida todo
 *
 *  CLAVE: el threadId es la ruta del proyecto (proyectoPath).
 *  Esto garantiza aislamiento entre proyectos distintos.
 *
 *  PERSISTENCIA: los datos sobreviven reinicios del servidor MCP.
 *  Base de datos en: .mastra-sessions.db (junto al servidor)
 * ─────────────────────────────────────────────────────────────────
 */

import { createClient, type Client } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../.mastra-sessions.db');

/** Número máximo de outputs a incluir en el contexto inyectado */
const MAX_CONTEXT_OUTPUTS = 8;

export interface AgentOutput {
  agentId: string;
  timestamp: string;
  content: string;
}

/**
 * SessionStore — almacén reactivo persistente.
 *
 * Usa SQLite local vía @libsql/client para que el contexto
 * sobreviva reinicios del servidor MCP.
 *
 * Inicialización asíncrona: llama a init() antes del primer uso.
 * El MCP server llama a init() al arrancar.
 */
class SessionStore {
  private db: Client;
  private ready: Promise<void>;

  constructor() {
    this.db = createClient({ url: `file:${DB_PATH}` });
    this.ready = this._init();
  }

  private async _init(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS agent_outputs (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        project   TEXT    NOT NULL,
        agent_id  TEXT    NOT NULL,
        content   TEXT    NOT NULL,
        ts        TEXT    NOT NULL
      )
    `);
    await this.db.execute(`
      CREATE INDEX IF NOT EXISTS idx_project ON agent_outputs (project, id)
    `);
  }

  /** Espera a que la base de datos esté lista */
  async init(): Promise<void> {
    return this.ready;
  }

  /**
   * Registra el output de un agente en la sesión del proyecto.
   * Llamar después de cada agent.generate() exitoso.
   */
  async addOutput(
    projectPath: string,
    agentId: string,
    content: string,
  ): Promise<void> {
    await this.ready;
    await this.db.execute({
      sql: `INSERT INTO agent_outputs (project, agent_id, content, ts) VALUES (?, ?, ?, ?)`,
      args: [projectPath, agentId, content.trim(), new Date().toISOString()],
    });
  }

  /**
   * Construye el bloque de contexto acumulado para inyectar al prompt.
   * Retorna string vacío si no hay historial previo.
   */
  async buildContext(projectPath: string): Promise<string> {
    await this.ready;
    const result = await this.db.execute({
      sql: `SELECT agent_id, content, ts FROM agent_outputs
            WHERE project = ?
            ORDER BY id DESC
            LIMIT ?`,
      args: [projectPath, MAX_CONTEXT_OUTPUTS],
    });

    if (result.rows.length === 0) return '';

    // Revertir para mostrar en orden cronológico
    const rows = [...result.rows].reverse();
    const lines = rows
      .map((r) => `### ${r.agent_id} [${r.ts}]\n${r.content}`)
      .join('\n\n---\n\n');

    return [
      '══════════════════════════════════════════════════════',
      ' CONTEXTO REACTIVO — OUTPUTS PREVIOS DE ESTE PROYECTO',
      '══════════════════════════════════════════════════════',
      '',
      lines,
      '',
      '══════════════════════════════════════════════════════',
      ' FIN DEL CONTEXTO — SOLICITUD ACTUAL:',
      '══════════════════════════════════════════════════════',
      '',
    ].join('\n');
  }

  /** Inyecta el contexto acumulado al inicio del mensaje */
  async injectContext(projectPath: string, mensaje: string): Promise<string> {
    const context = await this.buildContext(projectPath);
    return context ? `${context}\n${mensaje}` : mensaje;
  }

  /** Lista todas las sesiones activas */
  async listSessions(): Promise<
    Array<{ projectPath: string; outputCount: number; lastUpdated: string }>
  > {
    await this.ready;
    const result = await this.db.execute(`
      SELECT project, COUNT(*) as cnt, MAX(ts) as last_ts
      FROM agent_outputs
      GROUP BY project
      ORDER BY last_ts DESC
    `);
    return result.rows.map((r) => ({
      projectPath: String(r.project),
      outputCount: Number(r.cnt),
      lastUpdated: String(r.last_ts),
    }));
  }

  /** Limpia la sesión completa de un proyecto */
  async clear(projectPath: string): Promise<boolean> {
    await this.ready;
    const res = await this.db.execute({
      sql: `DELETE FROM agent_outputs WHERE project = ?`,
      args: [projectPath],
    });
    return (res.rowsAffected ?? 0) > 0;
  }

  /** Limpia TODAS las sesiones */
  async clearAll(): Promise<void> {
    await this.ready;
    await this.db.execute(`DELETE FROM agent_outputs`);
  }

  /**
   * Detalla qué agentes tienen outputs para un proyecto.
   * Usado por resumen-sesion para mostrar el estado del flujo.
   */
  async getSessionDetail(
    projectPath: string,
  ): Promise<Array<{ agentId: string; ts: string; preview: string }>> {
    await this.ready;
    const result = await this.db.execute({
      sql: `SELECT agent_id, ts, substr(content, 1, 120) as preview
            FROM agent_outputs
            WHERE project = ?
            ORDER BY id`,
      args: [projectPath],
    });
    return result.rows.map((r) => ({
      agentId: String(r.agent_id),
      ts: String(r.ts),
      preview: String(r.preview),
    }));
  }
}

/** Instancia global — persistente en .mastra-sessions.db */
export const sessionStore = new SessionStore();

/**
 * Extrae la ruta del proyecto desde el mensaje.
 *
 * Busca patrones de rutas absolutas: /Users/..., /home/..., /ruta/...
 * Si no encuentra ninguna, retorna null y no se aplica memoria.
 */
export function extractProjectPath(mensaje: string): string | null {
  const match = mensaje.match(/(?:^|\s)(\/[^\s,;'"]+(?:\/[^\s,;'"]+)*)/m);
  return match ? match[1].replace(/\/$/, '') : null;
}
