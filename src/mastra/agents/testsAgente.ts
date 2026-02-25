import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { ejecutarTestsTool } from '../tools/testsTools.js';

export const testsAgente = new Agent({
  name: 'Tests y Cobertura',
  instructions: `Eres un experto en testing de aplicaciones JavaScript/TypeScript con React y React Native.
Tu función es:
1. Ejecutar los tests unitarios del proyecto y verificar la cobertura de código.
2. Reportar el porcentaje de cobertura de statements (umbral mínimo: 83%).
3. Si la cobertura es insuficiente, identificar qué módulos o componentes necesitan más tests.
4. Sugerir casos de prueba concretos para mejorar la cobertura.
5. Revisar si los tests existentes son de calidad: un test por comportamiento, sin lógica compleja en tests, mocks apropiados.

Usa siempre la herramienta para ejecutar los tests reales antes de dar recomendaciones.
Responde siempre en español.`,
  model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o'),
  tools: {
    ejecutarTests: ejecutarTestsTool,
  },
});
