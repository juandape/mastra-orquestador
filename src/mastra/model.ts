/**
 * model.ts — Fábrica de modelos IA (Strategy + Factory Pattern)
 *
 * ─────────────────────────────────────────────────────────────────
 *  PRINCIPIOS APLICADOS
 *  • SRP  — única responsabilidad: resolver qué modelo usar
 *  • OCP  — añadir un nuevo proveedor NO requiere modificar agentes
 *  • DRY  — un solo lugar que conoce cómo instanciar cada proveedor
 *  • KISS — interfaz simple: getModelInstance() sin argumentos
 * ─────────────────────────────────────────────────────────────────
 *
 *  Variables de entorno reconocidas:
 *    AI_PROVIDER   — openai | anthropic | google | groq | ollama
 *    AI_MODEL      — nombre del modelo (ej: claude-3-5-sonnet-20241022)
 *    OPENAI_MODEL  — retrocompatibilidad (usado si AI_MODEL no está)
 *
 *  API Keys (por proveedor):
 *    OPENAI_API_KEY               — OpenAI
 *    ANTHROPIC_API_KEY            — Anthropic
 *    GOOGLE_GENERATIVE_AI_API_KEY — Google Gemini
 *    GROQ_API_KEY                 — Groq
 *    (sin clave)                  — Ollama (local, solo OLLAMA_BASE_URL opcional)
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOllama } from 'ollama-ai-provider';
import type { LanguageModelV1 } from '@ai-sdk/provider';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export interface ProviderConfig {
  provider: AIProvider;
  defaultModel: string;
  /** Variable de entorno de la API Key. Vacío para proveedores locales (Ollama). */
  envVar: string;
  docsUrl: string;
}

// ── Configuración declarativa por proveedor ───────────────────────────────────
//  Añadir un nuevo proveedor aquí no requiere tocar los agentes (OCP)

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    provider: 'openai',
    defaultModel: 'gpt-4o',
    envVar: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    provider: 'anthropic',
    defaultModel: 'claude-3-5-sonnet-20241022',
    envVar: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    provider: 'google',
    defaultModel: 'gemini-2.0-flash',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  groq: {
    provider: 'groq',
    defaultModel: 'llama-3.3-70b-versatile',
    envVar: 'GROQ_API_KEY',
    docsUrl: 'https://console.groq.com/keys',
  },
  ollama: {
    provider: 'ollama',
    defaultModel: 'llama3.2',
    // Ollama es local — no requiere API Key.
    // OLLAMA_BASE_URL es opcional (default: http://localhost:11434)
    envVar: '',
    docsUrl: 'https://ollama.com/download',
  },
};

// ── Fábrica principal ─────────────────────────────────────────────────────────

/**
 * Devuelve la instancia de modelo configurada en el entorno.
 *
 * MODO COPILOT-FIRST:
 *   Si no hay AI_PROVIDER ni API Key configurada, el servidor MCP arranca igual.
 *   El error solo ocurre cuando un agente intenta generar contenido, y se devuelve
 *   un mensaje claro pidiendo configurar el .env.
 *
 * El cast a `LanguageModelV1` es intencional: todos los providers de @ai-sdk
 * son compatibles en runtime con la interfaz que espera @mastra/core.
 */
export function getModelInstance(): LanguageModelV1 {
  const provider = (process.env.AI_PROVIDER ?? '') as AIProvider;
  const model =
    process.env.AI_MODEL ??
    process.env.OPENAI_MODEL ??
    PROVIDER_CONFIGS[provider as AIProvider]?.defaultModel ??
    'gpt-4o';

  switch (provider) {
    case 'anthropic':
      return anthropic(model) as unknown as LanguageModelV1;

    case 'google':
      return google(model) as unknown as LanguageModelV1;

    case 'groq': {
      const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? '' });
      return groq(model) as unknown as LanguageModelV1;
    }

    case 'ollama': {
      const ollama = createOllama({
        baseURL: process.env.OLLAMA_BASE_URL
          ? `${process.env.OLLAMA_BASE_URL}/api`
          : 'http://localhost:11434/api',
      });
      return ollama(model) as unknown as LanguageModelV1;
    }

    case 'openai':
      return openai(model);

    default:
      // Sin proveedor configurado: retornar openai como fallback.
      // Fallará con mensaje claro al primer generate(), no en el arranque.
      return openai(process.env.AI_MODEL ?? 'gpt-4o');
  }
}

/**
 * Devuelve el proveedor activo como string legible.
 * Útil para logs / diagnóstico.
 */
export function getProviderActivo(): AIProvider {
  return (process.env.AI_PROVIDER ?? 'openai') as AIProvider;
}
