/**
 * mastra-orquestador — Library entry point
 *
 * Importa este módulo en tu proyecto React / React Native:
 *
 *   import { mastra, mediadorAgente, orquestadorWorkflow } from 'mastra-orquestador';
 *
 * Asegúrate de tener OPENAI_API_KEY definida en las variables de entorno del
 * proyecto consumidor antes de instanciar los agentes.
 */

// ── Instancia Mastra ──────────────────────────────────────────────────────────
export { mastra } from './mastra/index.js';

// ── Agentes ───────────────────────────────────────────────────────────────────
export { analisisAgente } from './mastra/agents/analisisAgente.js';
export { historiasAgente } from './mastra/agents/historiasAgente.js';
export { integracionesAgente } from './mastra/agents/integracionesAgente.js';
export { mediadorAgente } from './mastra/agents/mediadorAgente.js';
export { pantallasAgente } from './mastra/agents/pantallasAgente.js';
export { sonarqubeAgente } from './mastra/agents/sonarqubeAgente.js';
export { testsAgente } from './mastra/agents/testsAgente.js';

// ── Workflow ──────────────────────────────────────────────────────────────────
export {
  orquestadorWorkflow,
  historiasSchema,
} from './mastra/workflows/orquestadorWorkflow.js';

// ── Setup / Configuración ─────────────────────────────────────────────────────
export { MODELOS_DISPONIBLES, cargarEnv, preguntar } from './setup.js';
export type { ModelOption } from './setup.js';

// ── Modelo IA (fábrica multi-proveedor) ───────────────────────────────────────
export {
  getModelInstance,
  getProviderActivo,
  PROVIDER_CONFIGS,
} from './mastra/model.js';
export type { AIProvider, ProviderConfig } from './mastra/model.js';

// ── Escritura segura de archivos (protección de código en producción) ─────────
export { writeFileSafe } from './mastra/utils/safeFileWriter.js';
export type { WriteMode, WriteResult } from './mastra/utils/safeFileWriter.js';

export {
  analizarEstructuraTool,
  buscarImplementacionesSimilaresTool,
  ejecutarStandardsTool,
} from './mastra/tools/proyectoTools.js';

export { generarPantallasTool } from './mastra/tools/pantallasTools.js';

export { ejecutarTestsTool } from './mastra/tools/testsTools.js';

export { insertarTagsIntegracionTool } from './mastra/tools/integracionesTools.js';

export {
  ejecutarSonarScannerTool,
  ejecutarNpmAuditTool,
} from './mastra/tools/sonarqubeTools.js';
