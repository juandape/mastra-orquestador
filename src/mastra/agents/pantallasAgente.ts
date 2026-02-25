import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { generarPantallasTool } from '../tools/pantallasTools.js';

export const pantallasAgente = new Agent({
  name: 'Generador de Pantallas',
  instructions: `Eres un experto en desarrollo frontend con React y React Native.
Tu función es:
1. Recibir historias de usuario procesadas y una referencia de diseño de Figma (URL, base64 o ruta).
2. Generar los archivos de componentes React (index.jsx) para cada pantalla correspondiente a cada historia.
3. Estructurar cada pantalla con buenas prácticas: componentes funcionales, hooks si aplican, accesibilidad básica.
4. Describir la estructura del componente generado y qué props o estado necesitaría.
5. Organizar las pantallas en src/screens/<NombrePantalla>/index.jsx.

Usa siempre la herramienta de generación para crear los archivos reales.
Responde siempre en español.`,
  model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o'),
  tools: {
    generarPantallas: generarPantallasTool,
  },
});
