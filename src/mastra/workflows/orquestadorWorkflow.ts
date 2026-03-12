import { createStep, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ── Schemas compartidos ────────────────────────────────────────────────────────

export const historiasSchema = z.array(
  z.object({
    titulo: z.string(),
    descripcion: z.string().optional(),
  }),
);

// ── Step 1: Análisis del proyecto ─────────────────────────────────────────────

const analisisStep = createStep({
  id: 'analizar-proyecto',
  description:
    'Analiza la estructura, dependencias y scripts del proyecto React/React Native.',
  inputSchema: z.object({
    proyectoPath: z.string().describe('Ruta absoluta al proyecto a analizar'),
    historiasRaw: z
      .string()
      .describe('Historia de usuario o descripción de la funcionalidad'),
  }),
  outputSchema: z.object({
    resumenAnalisis: z.string(),
    proyectoPath: z.string(),
    historiasRaw: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('analisis-agente');
    if (!agent) throw new Error('analisis-agente no encontrado');
    const result = await agent.generate(
      `Analiza el proyecto en "${input.proyectoPath}".
El usuario quiere implementar lo siguiente:
"""
${input.historiasRaw}
"""

Por favor:
1. Usa la herramienta analizarEstructura para obtener dependencias, scripts disponibles y carpetas.
2. Identifica el framework y la estructura del proyecto.
3. Usa buscarImplementaciones para buscar código relacionado con el tema de la historia.
4. Indica si el proyecto tiene script "standards" (para verificar estándares de código).
5. Resume los hallazgos de forma concisa.`,
    );
    return {
      resumenAnalisis: result.text,
      proyectoPath: input.proyectoPath,
      historiasRaw: input.historiasRaw,
    };
  },
});

// ── Step 2: Revisión de historias de usuario ──────────────────────────────────

const historiasStep = createStep({
  id: 'revisar-historias',
  description:
    'Revisa, mejora y estructura las historias de usuario proporcionadas.',
  inputSchema: z.object({
    resumenAnalisis: z.string(),
    proyectoPath: z.string(),
    historiasRaw: z.string().describe('Historia de usuario en texto libre'),
  }),
  outputSchema: z.object({
    resumenHistorias: z.string(),
    historias: historiasSchema,
    proyectoPath: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('historias-agente');
    if (!agent) throw new Error('historias-agente no encontrado');
    const result = await agent.generate(
      `Revisa y estructura la siguiente historia de usuario:

"""
${input.historiasRaw}
"""

Contexto del proyecto: ${input.resumenAnalisis}

Por favor:
1. Reformula en formato "Como [rol], quiero [acción] para [beneficio]" si no está así.
2. Evalúa calidad y completitud.
3. Si hay varias pantallas/funcionalidades, divídelas en historias separadas.
4. Devuelve al final un JSON con el array de historias:
   [{"titulo": "Nombre de la pantalla", "descripcion": "Descripción detallada"}]`,
    );

    let historias: Array<{ titulo: string; descripcion?: string }> = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        historias = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: crear una sola historia con el texto original
      historias = [
        { titulo: 'Nueva funcionalidad', descripcion: input.historiasRaw },
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
  description:
    'Genera los componentes React para cada historia de usuario, adaptados al framework del proyecto.',
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
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('pantallas-agente');
    if (!agent) throw new Error('pantallas-agente no encontrado');
    const historiasStr = JSON.stringify(input.historias, null, 2);
    const imagenInfo = input.imagenFigma
      ? `Diseño de referencia proporcionado: ${input.imagenFigma.substring(0, 120)}`
      : 'No se proporcionó diseño de referencia.';
    const result = await agent.generate(
      `Genera los componentes React para las siguientes historias de usuario:

${historiasStr}

Proyecto en: ${input.proyectoPath}
${imagenInfo}

Instrucciones:
- Usa la herramienta generarPantallas para crear los archivos reales.
  ${input.imagenFigma ? `- Pasa imagenFigma: "${input.imagenFigma}"` : ''}
- Adapta los componentes al framework detectado en el análisis (React, Next.js, Expo, etc.).
- Sigue las convenciones de carpetas del proyecto.
- Después describe brevemente cada componente generado.`,
    );
    return {
      resumenPantallas: result.text,
      proyectoPath: input.proyectoPath,
      historias: input.historias,
    };
  },
});

// ── Step 4: Verificación de estándares de código ──────────────────────────────

const standardsStep = createStep({
  id: 'verificar-standards',
  description:
    'Ejecuta el script "standards" del proyecto si existe, para verificar estándares frontend.',
  inputSchema: z.object({
    resumenPantallas: z.string(),
    proyectoPath: z.string(),
    historias: historiasSchema,
  }),
  outputSchema: z.object({
    resumenStandards: z.string(),
    proyectoPath: z.string(),
    historias: historiasSchema,
  }),
  execute: async (ctx) => {
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('analisis-agente');
    if (!agent) throw new Error('analisis-agente no encontrado');
    const result = await agent.generate(
      `Verifica los estándares de código del proyecto en "${input.proyectoPath}".

Usa la herramienta ejecutarStandards con proyectoPath: "${input.proyectoPath}".

Basándote en los resultados:
1. Si no existe el script "standards", indícalo claramente y sugiere cómo podría agregarse.
2. Si existe y pasó sin errores, confirma que el código cumple los estándares.
3. Si existe pero hay errores, lista los problemas encontrados y cómo solucionarlos.

Componentes recién generados para tener en cuenta:
${input.historias.map((h: { titulo: string }) => `- ${h.titulo}`).join('\n')}`,
    );
    return {
      resumenStandards: result.text,
      proyectoPath: input.proyectoPath,
      historias: input.historias,
    };
  },
});

// ── Step 5: Tests y cobertura ─────────────────────────────────────────────────

const testsStep = createStep({
  id: 'ejecutar-tests',
  description: 'Ejecuta tests unitarios y verifica la cobertura de código.',
  inputSchema: z.object({
    resumenStandards: z.string(),
    proyectoPath: z.string(),
    historias: historiasSchema,
  }),
  outputSchema: z.object({
    resumenTests: z.string(),
    proyectoPath: z.string(),
  }),
  execute: async (ctx) => {
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('tests-agente');
    if (!agent) throw new Error('tests-agente no encontrado');
    const result = await agent.generate(
      `Ejecuta los tests del proyecto en "${input.proyectoPath}" y verifica la cobertura.

Usa la herramienta ejecutarTests con proyectoPath: "${input.proyectoPath}".

Basándote en los resultados:
1. Reporta el porcentaje de cobertura de statements.
2. Indica si cumple el umbral mínimo del 83%.
3. Si no cumple, sugiere qué componentes recién generados necesitan tests:
${input.historias.map((h: { titulo: string }) => `   - ${h.titulo}`).join('\n')}
4. Proporciona ejemplos concretos de tests que se deberían escribir.`,
    );
    return {
      resumenTests: result.text,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Step 6: Integraciones ─────────────────────────────────────────────────────

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
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('integraciones-agente');
    if (!agent) throw new Error('integraciones-agente no encontrado');
    const result = await agent.generate(
      `Aplica las integraciones de Katalon, AppsFlyer y Google Analytics al proyecto en "${input.proyectoPath}".

Usa la herramienta insertarTags con proyectoPath: "${input.proyectoPath}".

Luego explica:
1. Qué tags se insertaron (o si ya existían).
2. Cómo configurar el GA_MEASUREMENT_ID correcto.
3. Cualquier configuración adicional necesaria para cada herramienta.`,
    );
    return {
      resumenIntegraciones: result.text,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Step 7: SonarQube y seguridad ─────────────────────────────────────────────

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
    const input = ctx.inputData;
    const mastra = ctx.mastra;
    const agent = mastra?.getAgent('sonarqube-agente');
    if (!agent) throw new Error('sonarqube-agente no encontrado');
    const result = await agent.generate(
      `Realiza el análisis de calidad de código y seguridad para el proyecto en "${input.proyectoPath}".

1. Usa la herramienta sonarScanner para ejecutar SonarQube (si está disponible y configurado).
2. Usa la herramienta npmAudit para detectar vulnerabilidades en dependencias.
3. Presenta un informe priorizado con los hallazgos:
   - Críticos (deben resolverse antes de producción)
   - Altos
   - Medios y bajos
4. Para cada problema crítico, proporciona la solución recomendada.`,
    );
    return {
      resumenSeguridad: result.text,
      proyectoPath: input.proyectoPath,
    };
  },
});

// ── Workflow completo ─────────────────────────────────────────────────────────

export const orquestadorWorkflow = new Workflow({
  id: 'orquestador-workflow',
  inputSchema: z.object({
    proyectoPath: z
      .string()
      .describe('Ruta absoluta al proyecto React/React Native'),
    historiasRaw: z
      .string()
      .describe(
        'Historia de usuario o descripción de la funcionalidad a implementar',
      ),
    imagenFigma: z
      .string()
      .optional()
      .describe(
        'URL, base64 o ruta local de la imagen de diseño de Figma (opcional)',
      ),
  }),
  outputSchema: z.object({
    resumenSeguridad: z.string(),
    proyectoPath: z.string(),
  }),
});

orquestadorWorkflow
  .then(analisisStep)
  .then(historiasStep)
  .then(pantallasStep)
  .then(standardsStep)
  .then(testsStep)
  .then(integracionesStep)
  .then(sonarqubeStep)
  .commit();
