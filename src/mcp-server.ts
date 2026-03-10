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
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { mastra } from './mastra/index.js';

// ── Definición de herramientas expuestas ──────────────────────────────────────

const HERRAMIENTAS = [
  {
    name: 'mediador-agente',
    agentId: 'mediador-agente',
    description:
      'Agente coordinador principal. Orquesta el flujo completo de desarrollo: análisis, historias de usuario, pantallas React/RN, tests, integraciones y SonarQube. Úsalo para iniciar cualquier tarea de desarrollo con IA.',
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
      'Analiza un proyecto React o React Native existente. Clasifica archivos como NUEVO, EXTENDER o MODIFICAR. Detecta patrones, estructura y dependencias.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta del proyecto a analizar y contexto de los cambios a realizar.',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'historias-agente',
    agentId: 'historias-agente',
    description:
      'Revisa y mejora historias de usuario. Genera criterios de aceptación, divide épicas en tareas atómicas y verifica estándares INVEST.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Historia de usuario a revisar o descripción de funcionalidad a convertir en historia.',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'pantallas-agente',
    agentId: 'pantallas-agente',
    description:
      'Genera componentes de pantallas React/React Native a partir de historias de usuario e imágenes de diseño Figma. Aplica las convenciones del proyecto.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Historia de usuario, descripción de la pantalla y/o ruta del proyecto destino.',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'tests-agente',
    agentId: 'tests-agente',
    description:
      'Genera y ejecuta tests unitarios y de integración para componentes React/RN. Verifica cobertura mínima del 83% y detecta regresiones.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta del componente a testear o descripción de los tests a generar.',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'integraciones-agente',
    agentId: 'integraciones-agente',
    description:
      'Configura integraciones de herramientas: Katalon (testing E2E), AppsFlyer (analytics móvil) y Google Analytics. Genera el código de integración.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Herramienta a integrar y contexto del proyecto (Katalon, AppsFlyer, Google Analytics).',
        },
      },
      required: ['mensaje'],
    },
  },
  {
    name: 'sonarqube-agente',
    agentId: 'sonarqube-agente',
    description:
      'Analiza la calidad y seguridad del código con SonarQube y npm audit. Detecta vulnerabilidades, code smells y problemas de seguridad.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mensaje: {
          type: 'string',
          description:
            'Ruta del proyecto o archivo a analizar, o descripción del análisis requerido.',
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

  try {
    const agente = mastra.getAgent(herramienta.agentId);
    const resultado = await agente.generate(mensaje);
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
const transport = new StdioServerTransport();
await server.connect(transport);
