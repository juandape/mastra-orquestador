#!/usr/bin/env node
/**
 * scripts/setup.js — Asistente interactivo de configuración inicial
 *
 * Guía paso a paso al desarrollador para dejar el proyecto listo:
 *   1. Verifica prerrequisitos (Node, dependencias)
 *   2. Detecta si ya existe .env, si no lo crea interactivamente
 *   3. Valida el archivo mcp.json
 *   4. Imprime los próximos pasos con instrucciones claras
 *
 * Uso: node scripts/setup.js  (o yarn setup)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, '.env');
const MCP_JSON_PATH = path.join(ROOT, '.vscode', 'mcp.json');

// ── Colores ANSI ─────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const ok = (msg) => console.log(`${c.green}  ✅ ${msg}${c.reset}`);
const warn = (msg) => console.log(`${c.yellow}  ⚠️  ${msg}${c.reset}`);
const fail = (msg) => console.log(`${c.red}  ❌ ${msg}${c.reset}`);
const info = (msg) => console.log(`${c.cyan}  ℹ️  ${msg}${c.reset}`);
const step = (msg) => console.log(`\n${c.bold}${c.cyan}▶ ${msg}${c.reset}`);
const sep = () => console.log(`${c.gray}${'─'.repeat(62)}${c.reset}`);

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ── 1. Verificar Node ─────────────────────────────────────────────────────────
function checkNode() {
  step('Verificando prerrequisitos');
  const [major] = process.versions.node.split('.').map(Number);
  if (major >= 18) {
    ok(`Node.js ${process.versions.node} detectado (≥18 requerido)`);
  } else {
    fail(`Node.js ${process.versions.node} — necesitas Node 18 o superior`);
    info('Descarga la última versión LTS en: https://nodejs.org/');
    process.exit(1);
  }
}

// ── 2. Verificar/instalar dependencias ───────────────────────────────────────
function checkDependencies() {
  const nodeModules = path.join(ROOT, 'node_modules');
  if (fs.existsSync(nodeModules)) {
    ok('Dependencias instaladas (node_modules/ encontrado)');
    return;
  }
  warn('Dependencias no instaladas — ejecutando yarn install...');
  try {
    execSync('yarn install', { cwd: ROOT, stdio: 'inherit' });
    ok('Dependencias instaladas correctamente');
  } catch {
    fail('No se pudieron instalar las dependencias');
    info('Ejecuta manualmente: yarn install');
    process.exit(1);
  }
}

// ── 3. Verificar mcp.json ─────────────────────────────────────────────────────
function checkMcpJson() {
  step('Verificando configuración MCP');
  if (!fs.existsSync(MCP_JSON_PATH)) {
    fail('.vscode/mcp.json no encontrado');
    info(
      'Este archivo debe existir en el repositorio. Verifica que clonaste correctamente.',
    );
    return false;
  }
  try {
    const mcp = JSON.parse(fs.readFileSync(MCP_JSON_PATH, 'utf8'));
    if (mcp.servers?.['mastra-orquestador']) {
      ok('.vscode/mcp.json configurado correctamente');
      return true;
    }
    fail('.vscode/mcp.json no tiene la clave "mastra-orquestador"');
    return false;
  } catch {
    fail('.vscode/mcp.json tiene un error de sintaxis — verifica el archivo');
    return false;
  }
}

// ── 4. Configurar .env ────────────────────────────────────────────────────────
async function configureEnv(rl) {
  step('Configurando modelo de IA (opcional)');

  // Si ya tiene .env con AI_PROVIDER configurado, no hacer nada
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    const providerLine = content
      .split('\n')
      .find((l) => l.startsWith('AI_PROVIDER='));
    if (providerLine) {
      ok('.env ya configurado — usando configuración existente');
      info(`Proveedor: ${providerLine.replace('AI_PROVIDER=', '').trim()}`);
      return;
    }
  }

  console.log(`
${c.gray}  ╔──────────────────────────────────────────────────────────╗
  │  💡 Con GitHub Copilot NO necesitas un modelo externo.   │
  │     Copilot ya es el motor de IA — las tools MCP solo    │
  │     ejecutan acciones (leer archivos, tests, escribir).  │
  │     Un modelo externo solo sirve para modo autónomo.     │
  ╚──────────────────────────────────────────────────────────╝${c.reset}
`);

  const quiereModelo = await ask(
    rl,
    `  ¿Configurar un modelo externo para uso sin Copilot? (s/N): `,
  );

  if (!quiereModelo.toLowerCase().startsWith('s')) {
    info('OK — usarás GitHub Copilot como motor de IA (recomendado)');
    if (!fs.existsSync(ENV_PATH)) {
      fs.writeFileSync(
        ENV_PATH,
        '# Configuración del modelo de IA (opcional con Copilot)\n',
      );
    }
    return;
  }

  console.log(`
  Elige tu proveedor:
  ${c.cyan}  1) OpenAI    ${c.gray}GPT-4o — requiere API key de pago${c.reset}
  ${c.cyan}  2) Anthropic ${c.gray}Claude 3.5 Sonnet — requiere API key de pago${c.reset}
  ${c.cyan}  3) Google    ${c.gray}Gemini 2.0 Flash — tiene plan gratuito${c.reset}
  ${c.cyan}  4) Groq      ${c.gray}Llama 3.3 — muy rápido, plan gratuito generoso${c.reset}
  ${c.cyan}  5) Ollama    ${c.gray}Local, sin costo, requiere Ollama instalado${c.reset}
`);

  const opcion = await ask(rl, '  Elige una opción (1-5): ');

  const proveedores = {
    '1': {
      id: 'openai',
      model: 'gpt-4o',
      key: 'OPENAI_API_KEY',
      url: 'https://platform.openai.com/api-keys',
    },
    '2': {
      id: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      key: 'ANTHROPIC_API_KEY',
      url: 'https://console.anthropic.com/settings/keys',
    },
    '3': {
      id: 'google',
      model: 'gemini-2.0-flash',
      key: 'GOOGLE_GENERATIVE_AI_API_KEY',
      url: 'https://aistudio.google.com/app/apikey',
    },
    '4': {
      id: 'groq',
      model: 'llama-3.3-70b-versatile',
      key: 'GROQ_API_KEY',
      url: 'https://console.groq.com/keys',
    },
    '5': {
      id: 'ollama',
      model: 'llama3.2',
      key: null,
      url: 'https://ollama.com',
    },
  };

  const p = proveedores[opcion.trim()];
  if (!p) {
    warn('Opción no válida — saltando configuración de modelo');
    return;
  }

  let apiKey = '';
  if (p.key) {
    info(`Obtén tu API key en: ${p.url}`);
    apiKey = await ask(
      rl,
      `  Pega tu ${p.key} (Enter para configurar después): `,
    );
  }

  const lineas = [
    '# Configuración del modelo de IA',
    `AI_PROVIDER=${p.id}`,
    `AI_MODEL=${p.model}`,
    p.key
      ? apiKey.trim()
        ? `${p.key}=${apiKey.trim()}`
        : `# ${p.key}=TU_CLAVE_AQUI`
      : '',
    p.id === 'ollama' ? '# OLLAMA_BASE_URL=http://localhost:11434' : '',
  ].filter(Boolean);

  fs.writeFileSync(ENV_PATH, lineas.join('\n') + '\n');
  ok(`.env creado con proveedor "${p.id}"`);

  if (p.key && !apiKey.trim()) {
    warn(
      `Recuerda agregar tu ${p.key} en el archivo .env antes de usar los agentes autónomos`,
    );
  }
}

// ── 5. Instrucciones finales ──────────────────────────────────────────────────
function printNextSteps(mcpOk) {
  sep();
  console.log(
    `\n${c.bold}${c.green}  🎉 ¡Listo! El proyecto está configurado.${c.reset}\n`,
  );

  if (!mcpOk) {
    console.log(
      `  ${c.red}⚠️  ACCIÓN REQUERIDA: Revisa .vscode/mcp.json${c.reset}`,
    );
    console.log(
      `     El archivo debe contener la clave "mastra-orquestador"\n`,
    );
  }

  console.log(`${c.bold}  PRÓXIMOS PASOS (sigue este orden):${c.reset}\n`);

  console.log(`  ${c.cyan}1. Abre el workspace multiraíz en VS Code${c.reset}`);
  console.log(
    `     a) File → Open Folder → selecciona esta carpeta (mastra-orquestador)`,
  );
  console.log(
    `     b) File → Add Folder to Workspace → agrega TU proyecto React/RN`,
  );
  console.log(
    `     c) File → Save Workspace As → guarda con el nombre que quieras`,
  );
  console.log(`     → La próxima vez solo abre ese archivo .code-workspace\n`);

  console.log(
    `  ${c.cyan}2. Verifica que el servidor MCP está activo${c.reset}`,
  );
  console.log(
    `     a) Abre la paleta: Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows)`,
  );
  console.log(`     b) Escribe: MCP: List Servers`);
  console.log(
    `     c) Debe aparecer "mastra-orquestador" con estado Running ✅`,
  );
  console.log(
    `     → Si dice Stopped: MCP: Restart Server → mastra-orquestador\n`,
  );

  console.log(`  ${c.cyan}3. Abre el chat de Copilot en modo Agent${c.reset}`);
  console.log(`     a) Cmd+Shift+I para abrir el chat`);
  console.log(`     b) Cambia el modo a "Agent" (NO "Ask" ni "Edit")\n`);

  console.log(
    `  ${c.cyan}4. Escribe tu primera solicitud en el chat${c.reset}`,
  );
  console.log(
    `     Copia una de las plantillas de la carpeta ${c.bold}prompts/${c.reset} y pégala en el chat`,
  );
  console.log(`     Solo reemplaza la ruta del proyecto con la tuya.\n`);

  console.log(`${c.gray}  Comandos útiles:`);
  console.log(
    `    yarn doctor      → verifica que todo sigue OK en cualquier momento`,
  );
  console.log(`    yarn setup       → vuelve a ejecutar este asistente`);
  console.log(
    `    ls prompts/      → ver las plantillas de prompts disponibles${c.reset}\n`,
  );
  sep();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════════════╗`,
  );
  console.log(`║    🤖 Mastra Orquestador — Asistente de Configuración    ║`);
  console.log(
    `╚══════════════════════════════════════════════════════════╝${c.reset}\n`,
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    checkNode();
    checkDependencies();
    const mcpOk = checkMcpJson();
    await configureEnv(rl);
    printNextSteps(mcpOk);
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  console.error(`\n${c.red}Error inesperado: ${e.message}${c.reset}`);
  process.exit(1);
});
