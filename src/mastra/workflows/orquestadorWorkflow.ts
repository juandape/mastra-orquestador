import { createStep, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ── Schemas compartidos ────────────────────────────────────────────────────────

const historiasSchema = z.array(
  z.object({
    titulo: z.string(),
    descripcion: z.string().optional(),
  }),
);

// ── Step 1: Análisis del proyecto ─────────────────────────────────────────────

const analisisStep = createStep({
  id: 'analizar-proyecto',
  description:
    'Analiza la estructura y dependencias del proyecto React/React Native.',
  inputSchema: z.object({
    proyectoPath: z.string().describe('Ruta absoluta al proyecto a analizar'),
    funcionalidad: z
      .string()
      .describe('Descripción de la funcionalidad a implementar'),
  }),
  outputSchema: z.object({
    resumenAnalisis: z.string(),
    proyectoPath: z.string(),
    funcionalidad: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.context.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('analisis-agente');
    if (!agent) throw new Error('analisis-agente no encontrado');
    const result = await agent.generate(
      `Analiza el proyecto en "${input.proyectoPath}".
      El desarrollador quiere implementar: "${input.funcionalidad}".
      1. Usa la herramienta analizarEstructura para obtener dependencias y carpetas.
      2. Usa buscarImplementaciones para buscar código relacionado con "${input.funcionalidad}".
      3. Resume los hallazgos.`,
    );
    return {
      resumenAnalisis: result.text,
      proyectoPath: input.proyectoPath,
      funcionalidad: input.funcionalidad,
    };
  },
});

// ── Step 2: Revisión de historias de usuario ──────────────────────────────────

const historiasStep = createStep({
  id: 'revisar-historias',
  description: 'Revisa y mejora las historias de usuario proporcionadas.',
  inputSchema: z.object({
    resumenAnalisis: z.string(),
    proyectoPath: z.string(),
    funcionalidad: z.string(),
    historiasRaw: z
      .string()
      .describe('Historias de usuario en JSON, Markdown o texto plano'),
  }),
  outputSchema: z.object({
    resumenHistorias: z.string(),
    historias: historiasSchema,
    proyectoPath: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.context.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('historias-agente');
    if (!agent) throw new Error('historias-agente no encontrado');
    const result = await agent.generate(
      `Revisa y analiza las siguientes historias de usuario:

${input.historiasRaw}

Contexto del proyecto: ${input.resumenAnalisis}

Por favor:
1. Extrae todas las historias en formato estructurado.
2. Evalúa su calidad y completitud.
3. Sugiere mejoras si son necesarias.
4. Devuelve al final un JSON con el array de historias: [{"titulo": "...", "descripcion": "..."}]`,
    );
    let historias: Array<{ titulo: string; descripcion?: string }> = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        historias = JSON.parse(jsonMatch[0]);
      }
    } catch {
      historias = [
        { titulo: input.funcionalidad, descripcion: input.historiasRaw },
      ];
    }
    return {
      resumenHistorias: result.text,
      historias,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Step 3: Generación de pantallas ──────────────────────────────────────────

const pantallasStep = createStep({
  id: 'generar-pantallas',
  description: 'Genera los componentes React para cada historia de usuario.',
  inputSchema: z.object({
    resumenHistorias: z.string(),
    historias: historiasSchema,
    proyectoPath: z.string(),
    imagenFigma: z.string().optional(),
  }),
  outputSchema: z.object({
    resumenPantallas: z.string(),
    proyectoPath: z.string(),
    historias: historiasSchema,
  }),
  execute: async (ctx) => {
    const input = ctx.context.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('pantallas-agente');
    if (!agent) throw new Error('pantallas-agente no encontrado');
    const historiasStr = JSON.stringify(input.historias, null, 2);
    const imagenInfo = input.imagenFigma
      ? `Imagen de Figma proporcionada: ${input.imagenFigma.substring(0, 100)}...`
      : 'No se proporcionó imagen de Figma.';
    const result = await agent.generate(
      `Genera las pantallas React para las siguientes historias de usuario:

${historiasStr}

Proyecto en: ${input.proyectoPath}
${imagenInfo}

Usa la herramienta generarPantallas con:
${input.imagenFigma ? `- imagenFigma: "${input.imagenFigma}"` : ''}

Después describe brevemente cada componente generado.`,
    );
    return {
      resumenPantallas: result.text,
      proyectoPath: input.proyectoPath,
      historias: input.historias,
    };
  },
});

// ── Step 4: Tests y cobertura ─────────────────────────────────────────────────

const testsStep = createStep({
  id: 'ejecutar-tests',
  description: 'Ejecuta tests unitarios y verifica la cobertura de código.',
  inputSchema: z.object({
    resumenPantallas: z.string(),
    proyectoPath: z.string(),
    historias: historiasSchema,
  }),
  outputSchema: z.object({
    resumenTests: z.string(),
    proyectoPath: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.context.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('tests-agente');
    if (!agent) throw new Error('tests-agente no encontrado');
    const result = await agent.generate(
      `Ejecuta los tests del proyecto en "${input.proyectoPath}" y verifica la cobertura.

Usa la herramienta ejecutarTests con proyectoPath: "${input.proyectoPath}".

Basándote en los resultados:
1. Reporta el porcentaje de cobertura.
2. Indica si cumple el umbral del 83%.
3. Si no cumple, sugiere qué pantallas o componentes recién generados necesitan tests:
${input.historias.map((h: any) => `- ${h.titulo}`).join('\n')}`,
    );
    return {
      resumenTests: result.text,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Step 5: Integraciones ─────────────────────────────────────────────────────

const integracionesStep = createStep({
  id: 'aplicar-integraciones',
  description: 'Inserta Katalon, AppsFlyer y Google Analytics en el proyecto.',
  inputSchema: z.object({
    resumenTests: z.string(),
    proyectoPath: z.string(),
  }),
  outputSchema: z.object({
    resumenIntegraciones: z.string(),
    proyectoPath: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.context.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('integraciones-agente');
    if (!agent) throw new Error('integraciones-agente no encontrado');
    const result = await agent.generate(
      `Aplica las integraciones de Katalon, AppsFlyer y Google Analytics al proyecto en "${input.proyectoPath}".

Usa la herramienta insertarTags con proyectoPath: "${input.proyectoPath}".

Explica qué tags se insertaron y las configuraciones necesarias para cada herramienta.`,
    );
    return {
      resumenIntegraciones: result.text,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Step 6: SonarQube y seguridad ─────────────────────────────────────────────

const sonarqubeStep = createStep({
  id: 'validar-seguridad',
  description:
    'Ejecuta análisis de calidad y seguridad con SonarQube y npm audit.',
  inputSchema: z.object({
    resumenIntegraciones: z.string(),
    proyectoPath: z.string(),
  }),
  outputSchema: z.object({
    resumenSeguridad: z.string(),
    proyectoPath: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.context.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('sonarqube-agente');
    if (!agent) throw new Error('sonarqube-agente no encontrado');
    const result = await agent.generate(
      `Realiza el análisis de calidad de código y seguridad para el proyecto en "${input.proyectoPath}".

1. Usa la herramienta sonarScanner para ejecutar SonarQube (si está disponible).
2. Usa la herramienta npmAudit para detectar vulnerabilidades en dependencias.
3. Presenta un informe priorizado con los hallazgos y recomendaciones.`,
    );
    return {
      resumenSeguridad: result.text,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Workflow completo ─────────────────────────────────────────────────────────

export const orquestadorWorkflow = new Workflow({
  name: 'orquestador-workflow',
  triggerSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al proyecto React/React Native'),
    funcionalidad: z
      .string()
      .describe('Descripción de la funcionalidad a implementar'),
    historiasRaw: z
      .string()
      .describe('Historias de usuario en JSON, Markdown o texto plano'),
    imagenFigma: z
      .string()
      .optional()
      .describe('URL, base64 o ruta de la imagen de Figma (opcional)'),
  }),
  result: {
    schema: z.object({
      resumenSeguridad: z.string(),
      proyectoPath: z.string(),
    }),
  },
  steps: [
    analisisStep,
    historiasStep,
    pantallasStep,
    testsStep,
    integracionesStep,
    sonarqubeStep,
  ],
});
