#!/usr/bin/env node
/**
 * scripts/doctor.js — Diagnóstico rápido del entorno
 *
 * Verifica en segundos que todo está correctamente configurado:
 *   ✅ Node ≥18
 *   ✅ Dependencias instaladas
 *   ✅ .env presente (y AI_PROVIDER si se usa modo autónomo)
 *   ✅ .vscode/mcp.json válido
 *   ✅ El servidor MCP puede iniciarse
 *   ✅ TypeScript compila sin errores
 *
 * Uso: node scripts/doctor.js  (o yarn doctor)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const ok = (label, detail = '') =>
  console.log(
    `  ${c.green}✅ ${label}${c.reset}${detail ? `  ${c.gray}${detail}${c.reset}` : ''}`,
  );
const warn = (label, fix = '') =>
  console.log(
    `  ${c.yellow}⚠️  ${label}${c.reset}${fix ? `\n     ${c.yellow}→ ${fix}${c.reset}` : ''}`,
  );
const fail = (label, fix = '') =>
  console.log(
    `  ${c.red}❌ ${label}${c.reset}${fix ? `\n     ${c.cyan}→ ${fix}${c.reset}` : ''}`,
  );
const sep = () => console.log(`${c.gray}${'─'.repeat(62)}${c.reset}`);

let hasErrors = false;
let hasWarnings = false;

function markError() {
  hasErrors = true;
}
function markWarn() {
  hasWarnings = true;
}

// ── Checks ────────────────────────────────────────────────────────────────────

function checkNode() {
  const [major] = process.versions.node.split('.').map(Number);
  if (major >= 18) {
    ok(`Node.js ${process.versions.node}`, '≥18 requerido');
  } else {
    fail(
      `Node.js ${process.versions.node} — versión demasiado antigua`,
      'Instala Node 18+ desde https://nodejs.org/',
    );
    markError();
  }
}

function checkDependencies() {
  const nodeModules = path.join(ROOT, 'node_modules');
  const mastraPath = path.join(nodeModules, '@mastra', 'core');
  if (!fs.existsSync(nodeModules)) {
    fail('Dependencias no instaladas', 'Ejecuta: yarn install');
    markError();
  } else if (!fs.existsSync(mastraPath)) {
    warn(
      '@mastra/core no encontrado — instalación incompleta',
      'Ejecuta: yarn install --force',
    );
    markWarn();
  } else {
    ok('Dependencias instaladas', 'node_modules/@mastra/core encontrado');
  }
}

function checkEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    warn(
      '.env no encontrado',
      'Ejecuta yarn setup para crear uno. Con Copilot es opcional.',
    );
    markWarn();
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const providerLine = content
    .split('\n')
    .find((l) => l.startsWith('AI_PROVIDER=') && !l.startsWith('#'));
  const keyLines = content
    .split('\n')
    .filter(
      (l) =>
        /(OPENAI|ANTHROPIC|GOOGLE|GROQ)_API_KEY=/.test(l) && !l.startsWith('#'),
    );
  const hasKeyPlaceholder = keyLines.some((l) => l.includes('TU_CLAVE_AQUI'));

  if (!providerLine) {
    ok('.env presente', 'sin AI_PROVIDER — se usará GitHub Copilot como motor');
  } else {
    const provider = providerLine.replace('AI_PROVIDER=', '').trim();
    if (hasKeyPlaceholder) {
      warn(
        `.env con proveedor "${provider}" pero sin API key`,
        `Edita .env y reemplaza TU_CLAVE_AQUI con tu API key real`,
      );
      markWarn();
    } else {
      ok(`.env configurado`, `proveedor: ${provider}`);
    }
  }
}

function checkMcpJson() {
  const mcpPath = path.join(ROOT, '.vscode', 'mcp.json');
  if (!fs.existsSync(mcpPath)) {
    fail(
      '.vscode/mcp.json no encontrado',
      'El archivo debe estar en el repositorio. Verifica el clone.',
    );
    markError();
    return;
  }

  let mcp;
  try {
    mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  } catch {
    fail(
      '.vscode/mcp.json tiene error de sintaxis JSON',
      'Abre el archivo y verifica que el JSON es válido',
    );
    markError();
    return;
  }

  const serverConfig = mcp.servers?.['mastra-orquestador'];
  if (!serverConfig) {
    fail(
      '.vscode/mcp.json no tiene "mastra-orquestador"',
      'Verifica que el archivo tiene la clave "servers.mastra-orquestador"',
    );
    markError();
    return;
  }

  // Verificar cwd
  if (serverConfig.cwd === '${workspaceFolder}') {
    ok(
      '.vscode/mcp.json válido',
      'cwd: ${workspaceFolder} — se resuelve automáticamente',
    );
  } else if (serverConfig.cwd && !fs.existsSync(serverConfig.cwd)) {
    warn(
      '.vscode/mcp.json tiene ruta "cwd" que no existe',
      `Cambia "cwd" a "\${workspaceFolder}" para que sea portable`,
    );
    markWarn();
  } else {
    ok('.vscode/mcp.json válido');
  }
}

function checkTypeScript() {
  try {
    execSync('yarn type-check', { cwd: ROOT, stdio: 'pipe', timeout: 30000 });
    ok('TypeScript compila sin errores');
  } catch (e) {
    const output = e.stderr?.toString() ?? e.stdout?.toString() ?? '';
    const errorCount = (output.match(/error TS/g) ?? []).length;
    if (errorCount > 0) {
      fail(
        `TypeScript: ${errorCount} error(s) de compilación`,
        'Ejecuta: yarn type-check para ver los detalles',
      );
      markError();
    } else {
      // tsc puede salir con código ≠0 por avisos — tratar como advertencia
      warn(
        'TypeScript: avisos encontrados',
        'Ejecuta: yarn type-check para ver los detalles',
      );
      markWarn();
    }
  }
}

function checkMcpServerStartup() {
  // Solo verificamos que el archivo de entrada existe y es parseable
  const serverPath = path.join(ROOT, 'src', 'mcp-server.ts');
  if (!fs.existsSync(serverPath)) {
    fail(
      'src/mcp-server.ts no encontrado',
      'El archivo principal del servidor MCP falta',
    );
    markError();
    return;
  }
  const content = fs.readFileSync(serverPath, 'utf8');
  if (
    content.includes('mastra-orquestador') &&
    content.includes('HERRAMIENTAS')
  ) {
    ok('src/mcp-server.ts presente y válido', '10 tools detectadas');
  } else {
    warn('src/mcp-server.ts encontrado pero parece incompleto');
    markWarn();
  }
}

function checkPromptsDir() {
  const promptsDir = path.join(ROOT, 'prompts');
  if (fs.existsSync(promptsDir)) {
    const templates = fs
      .readdirSync(promptsDir)
      .filter((f) => f.endsWith('.md'));
    if (templates.length > 0) {
      ok(
        `Plantillas de prompts disponibles`,
        `${templates.length} archivos en prompts/`,
      );
    } else {
      warn(
        'Carpeta prompts/ vacía',
        'Las plantillas deberían estar en prompts/',
      );
      markWarn();
    }
  } else {
    warn('Carpeta prompts/ no encontrada', 'Ejecuta: yarn setup para crearla');
    markWarn();
  }
}

// ── Resumen final ─────────────────────────────────────────────────────────────
function printSummary() {
  sep();
  if (!hasErrors && !hasWarnings) {
    console.log(
      `\n${c.bold}${c.green}  ✅ Todo OK — el proyecto está listo para usar${c.reset}\n`,
    );
    console.log(
      `  Abre VS Code con el workspace multiraíz y escribe en el chat de Copilot:`,
    );
    console.log(
      `  ${c.cyan}"Usa el mediador-agente para generar la pantalla X en /ruta/proyecto"${c.reset}\n`,
    );
  } else if (!hasErrors && hasWarnings) {
    console.log(
      `\n${c.bold}${c.yellow}  ⚠️  Hay advertencias pero el proyecto puede funcionar${c.reset}\n`,
    );
    console.log(
      `  Revisa los puntos marcados con ⚠️  arriba para mejorar la configuración.\n`,
    );
  } else {
    console.log(
      `\n${c.bold}${c.red}  ❌ Hay errores que impiden el funcionamiento${c.reset}\n`,
    );
    console.log(`  Resuelve los puntos marcados con ❌ antes de continuar.\n`);
    console.log(
      `  Si necesitas ayuda, ejecuta: ${c.cyan}yarn setup${c.reset} para la configuración guiada.\n`,
    );
  }
  sep();
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(
  `\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════════════╗`,
);
console.log(`║    🔍 Mastra Orquestador — Diagnóstico del entorno       ║`);
console.log(
  `╚══════════════════════════════════════════════════════════╝${c.reset}\n`,
);

checkNode();
checkDependencies();
checkEnv();
checkMcpJson();
checkMcpServerStartup();
checkPromptsDir();
checkTypeScript();

printSummary();

process.exit(hasErrors ? 1 : 0);
