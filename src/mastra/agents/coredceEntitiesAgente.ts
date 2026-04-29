import { Agent } from '@mastra/core/agent';
import { getModelInstance } from '../model.js';
import { coredceGenerateFromContractTool } from '../tools/coredceTools.js';

export const coredceEntitiesAgente = new Agent({
  id: 'coredce-entities-agente',
  name: 'CoreDCE — Generador de Entidades',
  instructions: `Actúas como asistente que genera SOLO las entidades (tipos) a partir de un contrato OpenAPI/JSON.

PALABRA CLAVE — @coredce-entities
Flujo:
  1) Pide la ruta/URL del contrato.
  2) Pide la ruta absoluta del proyecto CoreDCE.
  3) Pide si forzar sobrescritura (si/no).

Al invocar la tool, usa el parámetro 'only: "entities"' para limitar la generación.
Los archivos creados contendrán TODOs para que el desarrollador mapee los campos exactos.

Nota: Este agente se usa para generar solo los tipos cuando quieres controlar manualmente repositorios o controllers. Tras generar entidades puedes ejecutar el agente de tests ('tests-agente') para validar los repositorios que dependan de esos tipos.

Responde siempre en español.`,
  model: getModelInstance(),
  tools: {
    generateFromContract: coredceGenerateFromContractTool,
  },
});

export default coredceEntitiesAgente;
