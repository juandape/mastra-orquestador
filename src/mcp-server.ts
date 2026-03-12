#!/usr/bin/env node
/**
 * src/mcp-server.ts — Servidor MCP (Model Context Protocol)
 *
 * Expone todos los agentes de mastra-orquestador como herramientas MCP.
 * Esto permite usarlos directamente desde el chat de GitHub Copilot
 * en cualquier proyecto, sin necesidad de publicar en npm.
 *
 * Uso:
 *   tsx src/mcp-server.ts          (desarrollo)
 *   node dist/mcp-server.js        (producción)
 *
 * Configurar en .vscode/mcp.json del proyecto destino.
 */

import { cargarEnv } from './setup.js';
cargarEnv();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  sessionStore,
  extractProjectPath,
} from './mastra/memory/sessionStore.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { mastra } from './mastra/index.js';

// ── Definición de herramientas expuestas ──────────────────────────────────────

const HERRAMIENTAS = [
  {
    name: 'orquestar-flujo',
    agentId: '',
    description:
      '⭐ PUNTO DE ENTRADA RECOMENDADO. Ejecuta el flujo completo de desarrollo en 6 pasos: ' +
      '🔍 Análisis → 📋 Historias → 🎨 Pantallas → 🧪 Tests → 🔌 Integraciones → 🛡️ Seguridad. ' +
      'Muestra un plan de trabajo tipo checklist ANTES de iniciar y el estado de cada paso al finalizar. ' +
      'Ideal para nuevas features completas. Ejemplo: proyectoPath=/Users/yo/MiApp, historiasRaw="Como usuario quiero ver mi perfil".',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description:
            'Ruta absoluta al directorio raíz del proyecto. Ejemplo: /Users/tu-usuario/Proyectos/MiApp',
        },
        historiasRaw: {
          type: 'string',
          description:
            'Historia(s) de usuario o descripción de la funcionalidad a implementar.',
        },
        imagenFigma: {
          type: 'string',
          description:
            '(Opcional) URL, base64 o ruta local del diseño Figma de referencia.',
        },
      },
      required: ['proyectoPath', 'historiasRaw'],
    },
  },
  {
    name: 'mediador-agente',
    agentId: 'mediador-agente',
    description:
      'Agente coordinador libre. Recibe instrucciones en lenguaje natural y coordina el flujo. ' +
      'A diferencia de orquestar-flujo, aquí el LLM decide qué pasos ejecutar según el contexto. ' +
      'Útil para flujos parciales, consultas, o cuando el usuario quiere dar más contexto antes de empezar. ' +
      'Siempre muestra un plan de trabajo al inicio de cada respuesta.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Instrucción o solicitud para el agente mediador. Puede incluir: historia de usuario, descripción de pantalla, ruta del proyecto, etc.',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'analisis-agente',
    agentId: 'analisis-agente',
    description:
      '🔍 Agente especializado en análisis de proyectos React/RN. Detecta: framework, estructura de carpetas, ' +
      'path aliases TypeScript, componentes reutilizables, sistema de iconos (SVG/IconVector), ' +
      'traducciones (i18next), integraciones analytics existentes, y gestor de paquetes (yarn/npm). ' +
      'Clasifica cada archivo como 🟢 NUEVO / 🟡 EXTENDER / 🔴 MODIFICAR. ' +
      'Pasa la ruta del proyecto y una descripción de lo que quieres implementar.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta del proyecto a analizar y contexto de los cambios a realizar. Ejemplo: "Analiza /Users/yo/MiApp. Quiero agregar una pantalla de perfil".',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'historias-agente',
    agentId: 'historias-agente',
    description:
      '📋 Estructura y mejora historias de usuario. Aplica formato INVEST, genera criterios de aceptación, ' +
      'divide épicas en historias atómicas, detecta historias que modifican producción (🔴) vs nuevas (🟢), ' +
      'y agrega banderas técnicas ([ICONO-SVG], [NUEVA-TRADUCCION], [INPUT-TEXTO]) para el agente de pantallas. ' +
      'Acepta cualquier formato: texto libre, Markdown, JSON.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Historia de usuario a revisar o descripción de funcionalidad a convertir en historia. Ejemplo: "Quiero una pantalla donde el usuario vea su saldo y pueda recargarlo".',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'pantallas-agente',
    agentId: 'pantallas-agente',
    description:
      '🎨 Genera componentes de pantallas React/React Native. Respeta el framework detectado (RN/Expo/Next.js/Vite), ' +
      'usa los componentes UI del proyecto (TextCustom, ButtonCustom, BoxCustom…), genera traducciones en archivos ' +
      'separados {feature}Es/En.json, y guarda propuestas de modificaciones en _staging/ para aprobación manual. ' +
      'Nunca sobreescribe producción. Acepta diseños Figma como URL, base64 o ruta.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Historia de usuario procesada, descripción de la pantalla y ruta del proyecto destino.',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'tests-agente',
    agentId: 'tests-agente',
    description:
      '🧪 Genera y ejecuta tests unitarios con Jest + React Native Testing Library. ' +
      'Verifica cobertura mínima del 83%, detecta regresiones (🔴), problemas de configuración (🟡) ' +
      'y provee ejemplos concretos de tests por componente. Conoce los patrones críticos: hoisting de jest.mock, ' +
      'mocks de módulos nativos, wrapping con Provider de Redux, y casteo de t() para i18next.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta del componente/hook a testear, o descripción de los tests a generar. Ejemplo: "Genera tests para /Users/yo/MiApp/src/screens/Perfil/index.tsx".',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'integraciones-agente',
    agentId: 'integraciones-agente',
    description:
      '🔌 Configura integraciones de analytics y testing: Katalon (E2E), AppsFlyer (analytics móvil) ' +
      'y Google Analytics. Detecta si ya existen en el proyecto, reutiliza el archivo analytics.ts si existe, ' +
      'o crea uno. Inserta en el punto correcto (App.tsx, public/index.html, etc.) según el framework.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Herramienta a integrar y contexto del proyecto. Ejemplo: "Agrega AppsFlyer y GA a /Users/yo/MiApp".',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'sonarqube-agente',
    agentId: 'sonarqube-agente',
    description:
      '🛡️ Analiza calidad y seguridad del código con SonarQube y npm audit. ' +
      'Detecta vulnerabilidades (🔴 Crítico / 🟠 Alto / 🟡 Medio), code smells, deuda técnica y ' +
      'dependencias con CVEs conocidos. Prioriza hallazgos y provee soluciones concretas por tipo.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta del proyecto o archivo a analizar. Ejemplo: "Analiza seguridad de /Users/yo/MiApp".',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'resumen-sesion',
    agentId: '',
    description:
      '📊 Muestra el estado de la memoria reactiva: qué proyectos tienen contexto acumulado, ' +
      'qué agentes ya ejecutaron, cuántos outputs están almacenados y cuándo fue la última actividad. ' +
      'Útil para saber en qué punto del flujo está cada proyecto antes de continuar.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        proyectoPath: {
          type: 'string',
          description:
            '(Opcional) Ruta del proyecto para ver su detalle. Sin valor, muestra todas las sesiones.',
        },
      },
      required: [],
    },
  },
  {
    name: 'limpiar-contexto',
    agentId: '',
    description:
      '🗑️ Limpia la memoria reactiva de un proyecto para empezar un flujo desde cero. ' +
      'Pasa la ruta del proyecto para limpiar solo ese, o "todo" para borrar todas las sesiones. ' +
      'Recomendado antes de iniciar una nueva feature en un proyecto que ya tiene contexto previo.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta absoluta del proyecto a limpiar, o "todo" para limpiar todas las sesiones activas.',
        },
      },
      required: ['mensaje'],
    },
  },
] as const;

// ── Servidor MCP ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'mastra-orquestador', version: '2.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: HERRAMIENTAS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const herramienta = HERRAMIENTAS.find((h) => h.name === name);
  if (!herramienta) {
    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Agente desconocido: ${name}` }],
    };
  }

  const mensaje = (args as { mensaje: string }).mensaje;
  if (!mensaje?.trim()) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: 'El campo "mensaje" es requerido y no puede estar vacío.',
        },
      ],
    };
  }

  // ── Tool: orquestar-flujo — pipeline completo con checklist ────────────────
  if (name === 'orquestar-flujo') {
    const { proyectoPath, historiasRaw, imagenFigma } = args as {
      proyectoPath: string;
      historiasRaw: string;
      imagenFigma?: string;
    };

    if (!proyectoPath?.trim() || !historiasRaw?.trim()) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Se requieren proyectoPath y historiasRaw.',
          },
        ],
      };
    }

    const SEP = '═'.repeat(58);
    const SEP2 = '─'.repeat(58);

    const PASOS = [
      {
        agentId: 'analisis-agente',
        emoji: '🔍',
        label: 'Análisis del proyecto',
      },
      {
        agentId: 'historias-agente',
        emoji: '📋',
        label: 'Revisión de historias de usuario',
      },
      {
        agentId: 'pantallas-agente',
        emoji: '🎨',
        label: 'Generación de pantallas React/RN',
      },
      {
        agentId: 'tests-agente',
        emoji: '🧪',
        label: 'Tests unitarios y cobertura (≥83%)',
      },
      {
        agentId: 'integraciones-agente',
        emoji: '🔌',
        label: 'Integraciones (Analytics, Katalon, AppsFlyer)',
      },
      {
        agentId: 'sonarqube-agente',
        emoji: '🛡️',
        label: 'Análisis de seguridad / SonarQube',
      },
    ] as const;

    // ── Plan inicial ──────────────────────────────────────────────────────────
    let output = `📋 PLAN DE TRABAJO\n${SEP}\n`;
    output += `📁 Proyecto  : ${proyectoPath}\n`;
    output += `📝 Historia  : ${historiasRaw.slice(0, 100)}${historiasRaw.length > 100 ? '…' : ''}\n`;
    if (imagenFigma) output += `🎨 Diseño    : ${imagenFigma.slice(0, 80)}\n`;
    output += `\n`;
    PASOS.forEach((p, i) => {
      output += `  ⬜  Paso ${i + 1} — ${p.emoji} ${p.label}\n`;
    });
    output += `\n${SEP}\n⏳ Iniciando orquestación…\n\n`;

    const resultados: Record<string, string> = {};
    const estados: Record<string, '✅' | '❌'> = {};

    // Mensajes iniciales de cada agente (el contexto reactivo se inyecta vía sessionStore)
    const mensajesBase: Record<string, string> = {
      'analisis-agente': `Analiza el proyecto en "${proyectoPath}".\n\nEl usuario quiere implementar:\n"""\n${historiasRaw}\n"""\n\nPor favor usa analizarEstructura y buscarImplementaciones para obtener información real del proyecto.`,
      'historias-agente': `Revisa y estructura la siguiente historia de usuario para el proyecto en "${proyectoPath}":\n"""\n${historiasRaw}\n"""`,
      'pantallas-agente': `Genera los componentes para las historias procesadas del proyecto en "${proyectoPath}".${imagenFigma ? `\n\nDiseño Figma: ${imagenFigma}` : ''}\n\nUsa la herramienta generarPantallas para crear los archivos reales.`,
      'tests-agente': `Ejecuta los tests y verifica la cobertura del proyecto en "${proyectoPath}". Usa la herramienta ejecutarTests.`,
      'integraciones-agente': `Aplica las integraciones de Katalon, AppsFlyer y Google Analytics al proyecto en "${proyectoPath}". Usa la herramienta insertarTags.`,
      'sonarqube-agente': `Realiza el análisis de calidad y seguridad del proyecto en "${proyectoPath}". Usa sonarScanner y npmAudit.`,
    };

    // ── Ejecutar agentes en secuencia ─────────────────────────────────────────
    for (const paso of PASOS) {
      try {
        const mensajeBase =
          mensajesBase[paso.agentId] ?? `Proyecto: "${proyectoPath}"`;
        const mensajeConContexto = await sessionStore.injectContext(
          proyectoPath,
          mensajeBase,
        );
        const agente = mastra.getAgent(paso.agentId);
        const resultado = await agente.generate(mensajeConContexto);
        resultados[paso.agentId] = resultado.text;
        estados[paso.agentId] = '✅';
        await sessionStore.addOutput(
          proyectoPath,
          paso.agentId,
          resultado.text,
        );
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        resultados[paso.agentId] = `Error al ejecutar: ${raw}`;
        estados[paso.agentId] = '❌';
      }
    }

    // ── Checklist con estado final ────────────────────────────────────────────
    const completados = Object.values(estados).filter((e) => e === '✅').length;
    output += `\n📋 RESUMEN DEL PLAN — ${completados} / ${PASOS.length} pasos completados\n${SEP}\n`;
    PASOS.forEach((p, i) => {
      const marca = estados[p.agentId] ?? '⬜';
      output += `  ${marca}  Paso ${i + 1} — ${p.emoji} ${p.label}\n`;
    });
    output += `${SEP}\n`;

    // ── Resultados por sección ────────────────────────────────────────────────
    PASOS.forEach((p, i) => {
      output += `\n${SEP2}\n${p.emoji}  PASO ${i + 1}: ${p.label.toUpperCase()}\n${SEP2}\n`;
      output += resultados[p.agentId] ?? '⬜ No ejecutado.';
      output += '\n';
    });

    output += `\n${SEP}\n✅ FLUJO COMPLETO — Usa resumen-sesion para ver el estado de la memoria reactiva\n${SEP}\n`;

    return { content: [{ type: 'text' as const, text: output }] };
  }

  // ── Tool: resumen-sesion — estado de la memoria reactiva ─────────────────
  if (name === 'resumen-sesion') {
    const { proyectoPath } = (args ?? {}) as { proyectoPath?: string };
    const sessions = await sessionStore.listSessions();
    const SEP = '═'.repeat(58);

    if (sessions.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `📭 No hay sesiones activas en memoria.\n\nUsa orquestar-flujo o cualquier agente especificando la ruta del proyecto para iniciar una sesión.`,
          },
        ],
      };
    }

    const AGENTES_ORDEN = [
      { id: 'analisis-agente', emoji: '🔍', label: 'Análisis' },
      { id: 'historias-agente', emoji: '📋', label: 'Historias' },
      { id: 'pantallas-agente', emoji: '🎨', label: 'Pantallas' },
      { id: 'tests-agente', emoji: '🧪', label: 'Tests' },
      { id: 'integraciones-agente', emoji: '🔌', label: 'Integraciones' },
      { id: 'sonarqube-agente', emoji: '🛡️', label: 'Seguridad' },
    ];

    let text = `📊 MEMORIA REACTIVA — ESTADO ACTUAL\n${SEP}\n\n`;

    const sessionsFiltradas = proyectoPath
      ? sessions.filter((s) => s.projectPath.includes(proyectoPath))
      : sessions;

    if (sessionsFiltradas.length === 0) {
      text += `⚠️ No se encontraron sesiones para "${proyectoPath}".`;
      return { content: [{ type: 'text' as const, text }] };
    }

    for (const s of sessionsFiltradas) {
      text += `📁 ${s.projectPath}\n`;
      text += `   Outputs almacenados : ${s.outputCount}\n`;
      text += `   Última actividad    : ${s.lastUpdated}\n`;

      // Detalle de qué agentes tienen outputs
      const details = await sessionStore.getSessionDetail(s.projectPath);
      const agentesCon = new Set(details.map((d) => d.agentId));

      text += `   Progreso del flujo  :\n`;
      AGENTES_ORDEN.forEach((a, i) => {
        const marca = agentesCon.has(a.id) ? '✅' : '⬜';
        text += `     ${marca} Paso ${i + 1} — ${a.emoji} ${a.label}\n`;
      });
      text += '\n';
    }

    text += `${SEP}\nUsa limpiar-contexto para reiniciar una sesión antes de una nueva feature.\n`;
    return { content: [{ type: 'text' as const, text }] };
  }

  // ── Tool especial: limpiar contexto reactivo ─────────────────────────────
  if (name === 'limpiar-contexto') {
    if (mensaje.trim().toLowerCase() === 'todo') {
      await sessionStore.clearAll();
      return {
        content: [
          {
            type: 'text' as const,
            text: '✅ Memoria reactiva limpiada — todas las sesiones eliminadas.',
          },
        ],
      };
    }
    const cleared = await sessionStore.clear(mensaje.trim());
    const sessions = await sessionStore.listSessions();
    const resumen =
      sessions.length > 0
        ? `Sesiones activas restantes:\n${sessions.map((s) => `  • ${s.projectPath} (${s.outputCount} outputs)`).join('\n')}`
        : 'No hay sesiones activas.';
    return {
      content: [
        {
          type: 'text' as const,
          text: cleared
            ? `✅ Contexto del proyecto "${mensaje.trim()}" eliminado.\n\n${resumen}`
            : `⚠️  No se encontró sesión para "${mensaje.trim()}".\n\n${resumen}`,
        },
      ],
    };
  }

  try {
    // ── Memoria reactiva: inyectar contexto acumulado ────────────────────────
    const projectPath = extractProjectPath(mensaje);
    const mensajeConContexto = projectPath
      ? await sessionStore.injectContext(projectPath, mensaje)
      : mensaje;

    const agente = mastra.getAgent(herramienta.agentId);
    const resultado = await agente.generate(mensajeConContexto);

    // ── Almacenar output para que próximos agentes lo lean ───────────────────
    if (projectPath) {
      await sessionStore.addOutput(
        projectPath,
        herramienta.agentId,
        resultado.text,
      );
    }

    return {
      content: [{ type: 'text' as const, text: resultado.text }],
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);

    // Error de API Key no configurada → mensaje accionable
    const sinClave =
      raw.includes('API key') ||
      raw.includes('api_key') ||
      raw.includes('apiKey') ||
      raw.includes('401') ||
      raw.includes('Unauthorized') ||
      raw.includes('authentication');

    const mensajeError = sinClave
      ? [
          `⚠️  Sin modelo de IA configurado para "${name}".`,
          ``,
          `Crea el archivo .env en la carpeta mastra-orquestador con tu proveedor:`,
          ``,
          `  AI_PROVIDER=openai`,
          `  AI_MODEL=gpt-4o`,
          `  OPENAI_API_KEY=sk-...tu-clave...`,
          ``,
          `Otros proveedores soportados: anthropic, google, groq, ollama`,
          `Ver README para detalles de configuración.`,
        ].join('\n')
      : `Error al ejecutar ${name}: ${raw}`;

    return {
      isError: true,
      content: [{ type: 'text' as const, text: mensajeError }],
    };
  }
});

// ── Iniciar transporte stdio ──────────────────────────────────────────────────
// Inicializar base de datos SQLite antes de aceptar requests
await sessionStore.init();

const transport = new StdioServerTransport();
await server.connect(transport);
