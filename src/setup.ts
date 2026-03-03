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
  {
    id: 1,
    model: 'gpt-4o',
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    label: 'GPT-4o',
    tag: '⭐  Recomendado',
    description:
      'El más capaz. Ideal para código complejo y diseños detallados.',
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

  for (const m of MODELOS_DISPONIBLES) {
    console.log(`   ${m.id}.  ${m.label.padEnd(16)}${m.tag}`);
    console.log(`       ${m.description}\n`);
  }

  let modelo = MODELOS_DISPONIBLES[0];
  while (true) {
    const raw = await preguntar(
      rl,
      '   Escribe el número (1-3) y presiona Enter [1 por defecto]: ',
    );
    const n = raw === '' ? 1 : parseInt(raw, 10);
    const found = MODELOS_DISPONIBLES.find((m) => m.id === n);
    if (found) {
      modelo = found;
      break;
    }
    console.log('   ⚠️  Por favor escribe 1, 2 o 3.\n');
  }

  console.log(`\n   ✅  Seleccionaste: ${modelo.label}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 2. API Key ──────────────────────────────────────────────────────────────
  if (!process.env[modelo.envVar]) {
    console.log(
      `🔑  Para usar ${modelo.label} necesitas una API Key de OpenAI.`,
    );
    console.log('');
    console.log(
      '   Si aún no tienes una, créala aquí (es gratis registrarse):',
    );
    console.log(`   👉  ${modelo.docsUrl}\n`);
    console.log('   Una vez que la tengas, pégala aquí abajo.\n');

    let apiKey = '';
    while (!apiKey) {
      apiKey = await preguntar(rl, '   Pega tu OPENAI_API_KEY: ');
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

  // ── 3. Guardar modelo ───────────────────────────────────────────────────────
  escribirEnvVar('OPENAI_MODEL', modelo.model);
  process.env.OPENAI_MODEL = modelo.model;

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
