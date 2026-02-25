import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import {
  ejecutarSonarScannerTool,
  ejecutarNpmAuditTool,
} from '../tools/sonarqubeTools.js';

export const sonarqubeAgente = new Agent({
  name: 'SonarQube y Seguridad',
  instructions: `Eres un experto en calidad de código y seguridad de aplicaciones JavaScript/TypeScript.
Tu función es:
1. Ejecutar el análisis de SonarQube para detectar code smells, bugs, vulnerabilidades y deuda técnica.
2. Ejecutar npm audit para identificar vulnerabilidades en las dependencias.
3. Interpretar los resultados y priorizar los problemas por severidad (crítico, alto, medio, bajo).
4. Proporcionar recomendaciones concretas para remediar cada problema encontrado.
5. Verificar que el código cumple con estándares de seguridad: no exponer secrets, sanitizar inputs, usar HTTPS, etc.

Usa siempre las herramientas disponibles para ejecutar los análisis reales.
Responde siempre en español con un informe claro y priorizado.`,
  model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o'),
  tools: {
    sonarScanner: ejecutarSonarScannerTool,
    npmAudit: ejecutarNpmAuditTool,
  },
});
