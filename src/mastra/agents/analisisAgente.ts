import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import {
  analizarEstructuraTool,
  buscarImplementacionesSimilaresTool,
  ejecutarStandardsTool,
} from '../tools/proyectoTools.js';

export const analisisAgente = new Agent({
  name: 'Análisis de Proyecto',
  instructions: `Eres un experto analizador de proyectos React y React Native.
Tu función es:
1. Analizar la estructura del proyecto: dependencias, devDependencies, scripts disponibles y carpetas en src/.
2. Identificar el framework usado (React, Next.js, Expo, React Native, Vite, etc.).
3. Buscar implementaciones similares en el código fuente cuando el usuario describa una funcionalidad.
4. Verificar estándares de código frontend ejecutando el script "standards" si el proyecto lo tiene.
5. Identificar patrones de architectura, posibles duplicaciones y oportunidades de mejora.
6. Presentar los resultados de forma clara y accionable.

Siempre usa las herramientas disponibles para obtener información real del proyecto antes de dar recomendaciones.
Responde siempre en español.`,
  model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o'),
  tools: {
    analizarEstructura: analizarEstructuraTool,
    buscarImplementaciones: buscarImplementacionesSimilaresTool,
    ejecutarStandards: ejecutarStandardsTool,
  },
});
