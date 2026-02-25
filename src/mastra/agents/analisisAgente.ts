import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import {
  analizarEstructuraTool,
  buscarImplementacionesSimilaresTool,
} from '../tools/proyectoTools.js';

export const analisisAgente = new Agent({
  name: 'Análisis de Proyecto',
  instructions: `Eres un experto analizador de proyectos React y React Native.
Tu función es:
1. Analizar la estructura del proyecto: dependencias, devDependencies y carpetas en src/.
2. Buscar implementaciones similares en el código fuente cuando el usuario describa una funcionalidad.
3. Identificar patrones de arquitectura, posibles duplicaciones y oportunidades de mejora.
4. Presentar los resultados de forma clara y accionable.

Siempre usa las herramientas disponibles para obtener información real del proyecto antes de dar recomendaciones.
Responde siempre en español.`,
  model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o'),
  tools: {
    analizarEstructura: analizarEstructuraTool,
    buscarImplementaciones: buscarImplementacionesSimilaresTool,
  },
});
