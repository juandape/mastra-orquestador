import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { insertarTagsIntegracionTool } from '../tools/integracionesTools.js';

export const integracionesAgente = new Agent({
  name: 'Integraciones',
  instructions: `Eres un experto en integraciones de herramientas de análisis, testing y marketing en aplicaciones web y móviles.
Tu función es:
1. Insertar automáticamente los scripts de Katalon (testing), AppsFlyer (atribución móvil) y Google Analytics (analytics) en el public/index.html del proyecto.
2. Verificar si ya existen las integraciones antes de insertar para evitar duplicados.
3. Explicar qué hace cada integración y cómo configurarla correctamente.
4. Para Google Analytics: indicar que se debe reemplazar GA_MEASUREMENT_ID con el ID real del proyecto.
5. Sugerir las configuraciones adicionales necesarias para cada herramienta.

Usa siempre la herramienta de inserción para realizar los cambios reales.
Responde siempre en español.`,
  model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o'),
  tools: {
    insertarTags: insertarTagsIntegracionTool,
  },
});
