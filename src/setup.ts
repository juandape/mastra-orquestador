/**
 * setup.ts — Wizard de configuración inicial
 *
 * Se ejecuta automáticamente en el primer uso cuando no hay
 * API Key ni modelo configurados. Guía al usuario paso a paso
 * sin requerir conocimiento previo de IA.
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ── Modelos disponibles ───────────────────────────────────────────────────────

export interface ModelOption {
  id: number;
  model: string;
  provider: string;
  envVar: string;
  label: string;
  tag: string;
  description: string;
  docsUrl: string;
}

export const MODELOS_DISPONIBLES: ModelOption[] = [
  // ── OpenAI ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    model: 'gpt-4o',
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    label: 'GPT-4o',
    tag: '⭐  Recomendado',
    description:
      'El más capaz de OpenAI. Ideal para código complejo y diseños detallados.',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 2,
    model: 'gpt-4o-mini',
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    label: 'GPT-4o-mini',
    tag: '💰  Económico',
    description: 'Más rápido y barato. Perfecto para proyectos pequeños.',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 3,
    model: 'gpt-4-turbo',
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    label: 'GPT-4-turbo',
    tag: '🚀  Potente',
    description: 'Gran ventana de contexto. Ideal para proyectos muy grandes.',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  // ── Anthropic ───────────────────────────────────────────────────────────────
  {
    id: 4,
    model: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    label: 'Claude 3.5 Sonnet',
    tag: '🧠  Muy capaz',
    description:
      'Excelente en razonamiento y código. Alternativa líder a GPT-4.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 5,
    model: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    label: 'Claude 3.5 Haiku',
    tag: '⚡  Rápido',
    description:
      'Velocidad máxima con buena calidad. Ideal para respuestas rápidas.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  // ── Google Gemini ────────────────────────────────────────────────────────────
  {
    id: 6,
    model: 'gemini-2.0-flash',
    provider: 'google',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    label: 'Gemini 2.0 Flash',
    tag: '🌐  Google',
    description: 'Modelo más reciente de Google. Rápido con gran contexto.',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 7,
    model: 'gemini-1.5-pro',
    provider: 'google',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    label: 'Gemini 1.5 Pro',
    tag: '🌐  Google Pro',
    description: 'Máxima capacidad de Google con 1M tokens de contexto.',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  // ── Groq (open-source, ultra rápido) ─────────────────────────────────────────
  {
    id: 8,
    model: 'llama-3.3-70b-versatile',
    provider: 'groq',
    envVar: 'GROQ_API_KEY',
    label: 'Llama 3.3 70B',
    tag: '🦙  Open Source',
    description:
      'Llama en infraestructura Groq. Velocidad extrema, tier gratuito disponible.',
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 9,
    model: 'mixtral-8x7b-32768',
    provider: 'groq',
    envVar: 'GROQ_API_KEY',
    label: 'Mixtral 8x7B',
    tag: '🦙  Open Source',
    description: 'Mixtral MoE vía Groq. Buena relación calidad/velocidad.',
    docsUrl: 'https://console.groq.com/keys',
  },
  // ── Ollama (local, sin API Key) ──────────────────────────────────────────────────────
  {
    id: 10,
    model: 'llama3.2',
    provider: 'ollama',
    envVar: '',
    label: 'Llama 3.2 (local)',
    tag: '🏠  Local / Gratis',
    description: 'Corre en tu máquina con Ollama. Sin costos, sin internet.',
    docsUrl: 'https://ollama.com/download',
  },
  {
    id: 11,
    model: 'qwen2.5-coder',
    provider: 'ollama',
    envVar: '',
    label: 'Qwen 2.5 Coder (local)',
    tag: '🏠  Local / Código',
    description:
      'Especializado en generación de código. Excelente para componentes React.',
    docsUrl: 'https://ollama.com/library/qwen2.5-coder',
  },
  {
    id: 12,
    model: 'deepseek-r1',
    provider: 'ollama',
    envVar: '',
    label: 'DeepSeek R1 (local)',
    tag: '🏠  Local / Razonamiento',
    description: 'Razonamiento avanzado tipo o1. Requiere máquina potente.',
    docsUrl: 'https://ollama.com/library/deepseek-r1',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function preguntar(
  rl: readline.Interface,
  prompt: string,
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

function envPath(): string {
  return path.join(process.cwd(), '.env');
}

function leerEnv(): Record<string, string> {
  const ep = envPath();
  if (!fs.existsSync(ep)) return {};
  const pairs: Record<string, string> = {};
  for (const line of fs.readFileSync(ep, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) pairs[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return pairs;
}

function escribirEnvVar(key: string, value: string): void {
  const ep = envPath();
  let content = fs.existsSync(ep) ? fs.readFileSync(ep, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  fs.writeFileSync(ep, content, 'utf8');
}

function estaConfigurado(): boolean {
  const env = leerEnv();
  // Cargar las vars si están en .env pero no en process.env
  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v;
  }

  // Compatibilidad con configuración nueva (AI_PROVIDER + AI_MODEL)
  if (process.env.AI_PROVIDER && process.env.AI_MODEL) {
    const config = MODELOS_DISPONIBLES.find(
      (m) =>
        m.provider === process.env.AI_PROVIDER &&
        m.model === process.env.AI_MODEL,
    );
    // Proveedores locales (Ollama) no requieren API Key
    if (config?.envVar === '') return true;
    const apiKeyVar = config?.envVar;
    return !!(apiKeyVar && process.env[apiKeyVar]);
  }

  // Retrocompatibilidad: configuración antigua solo OpenAI
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
}

// ── Setup wizard ──────────────────────────────────────────────────────────────

export async function runSetup(rl: readline.Interface): Promise<void> {
  if (estaConfigurado()) return;

  console.log('');
  console.log(
    '╔══════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║          ✨  CONFIGURACIÓN INICIAL  ✨                       ║',
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝',
  );
  console.log('');
  console.log('  Antes de empezar necesitamos configurar el modelo de IA.');
  console.log('  Solo tienes que hacer esto una vez — la configuración se');
  console.log('  guarda en un archivo .env en tu proyecto.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 1. Elegir modelo ────────────────────────────────────────────────────────
  console.log('🤖  ¿Qué modelo de IA quieres usar?\n');

  // Agrupar por proveedor para mejor lectura (SRP visual)
  const proveedores = [...new Set(MODELOS_DISPONIBLES.map((m) => m.provider))];
  for (const proveedor of proveedores) {
    console.log(`   ── ${proveedor.toUpperCase()} ──`);
    for (const m of MODELOS_DISPONIBLES.filter(
      (x) => x.provider === proveedor,
    )) {
      console.log(`   ${String(m.id).padEnd(3)} ${m.label.padEnd(22)}${m.tag}`);
      console.log(`       ${m.description}\n`);
    }
  }

  const total = MODELOS_DISPONIBLES.length;
  let modelo = MODELOS_DISPONIBLES[0];
  while (true) {
    const raw = await preguntar(
      rl,
      `   Escribe el número (1-${total}) y presiona Enter [1 por defecto]: `,
    );
    const n = raw === '' ? 1 : parseInt(raw, 10);
    const found = MODELOS_DISPONIBLES.find((m) => m.id === n);
    if (found) {
      modelo = found;
      break;
    }
    console.log(`   ⚠️  Por favor escribe un número entre 1 y ${total}.\n`);
  }

  console.log(`\n   ✅  Seleccionaste: ${modelo.label}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 2. API Key (se omite para proveedores locales como Ollama) ─────────────
  if (modelo.envVar === '') {
    // ── Ollama u otro proveedor local: preguntar base URL opcionalmente ─────
    console.log('🏠  Ollama corre localmente — no necesitas API Key.');
    console.log('');
    console.log('   Asegúrate de tener Ollama instalado y corriendo:');
    console.log(`   👉  ${modelo.docsUrl}`);
    console.log(`   👉  ollama pull ${modelo.model}\n`);
    const baseUrl = await preguntar(
      rl,
      '   URL base de Ollama [http://localhost:11434]: ',
    );
    const urlFinal = baseUrl || 'http://localhost:11434';
    escribirEnvVar('OLLAMA_BASE_URL', urlFinal);
    process.env.OLLAMA_BASE_URL = urlFinal;
    console.log(`\n   ✅  Ollama configurado en: ${urlFinal}\n`);
  } else if (!process.env[modelo.envVar]) {
    const proveedorNombre =
      modelo.provider.charAt(0).toUpperCase() + modelo.provider.slice(1);
    console.log(
      `🔑  Para usar ${modelo.label} necesitas una API Key de ${proveedorNombre}.`,
    );
    console.log('');
    console.log('   Si aún no tienes una, créala aquí:');
    console.log(`   👉  ${modelo.docsUrl}\n`);
    console.log('   Una vez que la tengas, pégala aquí abajo.\n');

    let apiKey = '';
    while (!apiKey) {
      apiKey = await preguntar(rl, `   Pega tu ${modelo.envVar}: `);
      if (!apiKey) {
        console.log(
          '   ⚠️  La API Key no puede estar vacía. Inténtalo de nuevo.\n',
        );
      }
    }

    escribirEnvVar(modelo.envVar, apiKey);
    process.env[modelo.envVar] = apiKey;
    console.log('\n   ✅  API Key guardada en .env\n');
  } else {
    console.log(`   ✅  API Key encontrada en el entorno.\n`);
  }

  // ── 3. Guardar proveedor y modelo ───────────────────────────────────────────
  // Nuevas vars (multi-proveedor)
  escribirEnvVar('AI_PROVIDER', modelo.provider);
  escribirEnvVar('AI_MODEL', modelo.model);
  process.env.AI_PROVIDER = modelo.provider;
  process.env.AI_MODEL = modelo.model;

  // Retrocompatibilidad: mantener OPENAI_MODEL si el proveedor es OpenAI
  if (modelo.provider === 'openai') {
    escribirEnvVar('OPENAI_MODEL', modelo.model);
    process.env.OPENAI_MODEL = modelo.model;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  🎉  ¡Configuración completa! Ya puedes usar el orquestador.');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Carga las variables del .env local al proceso.
 * Llama esto antes de importar los agentes Mastra.
 */
export function cargarEnv(): void {
  const ep = envPath();
  if (!fs.existsSync(ep)) return;
  for (const line of fs.readFileSync(ep, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
