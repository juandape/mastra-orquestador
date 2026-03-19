# Mastra Orquestador de Agentes para Proyectos React/React Native

Orquestador de agentes IA con Mastra que automatiza las tareas de desarrollo en proyectos React y React Native. **Funciona con cualquier proyecto** basado en React, React Native, Next.js, Vite o Expo — detecta automáticamente el framework, lenguaje, i18n, analytics y testing de cada proyecto.

Funciona en **dos modos**: como servidor MCP para **GitHub Copilot** (modo principal, sin modelo externo requerido) y como sistema de agentes autónomos cuando se configura un proveedor de IA externo.

---

## ⚡ Quick Start — 4 pasos para empezar

> Si es tu primera vez, este es el camino más rápido.

```bash
# 1. Clona e instala
git clone https://github.com/juandape/mastra-orquestador.git
cd mastra-orquestador

# 2. Ejecuta el asistente de configuración guiada
yarn setup
```

Sigue las instrucciones del asistente. Cuando termine:

```bash
# 3. Verifica que todo está OK
yarn doctor
```

```
# 4. En el chat de Copilot (modo Agent), escribe:
@orquestar
```

El agente te guiará paso a paso:

1. Te pedirá la **historia de usuario**
2. Te pedirá una **imagen de referencia** (Figma/screenshot) — opcional
3. Te pedirá **consideraciones adicionales** (ruta del proyecto, carpeta destino, etc.)
4. Creará un archivo **`_plan_[Feature].md`** con el plan y checklist para tu aprobación
5. Una vez apruebes con `aprobar`, ejecuta cada paso actualizando el checklist en tiempo real

> Funciona con **cualquier proyecto React**: BluPersonasApp, Next.js, Vite, CRA, Expo, etc.
> El orquestador detecta el stack automáticamente. Si tiene i18n lo respeta, si no tiene lo omite.

> ¿Tienes dudas o algo no funciona? Consulta [prompts/faq-errores.md](prompts/faq-errores.md)

---

## ¿Con qué proyectos funciona?

| Framework    | Lenguaje | i18n                                    | Analytics                                 | Componentes UI                            |
| ------------ | -------- | --------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| React Native | TS / JS  | i18next, react-intl, lingui → detectado | Firebase, AppsFlyer, Mixpanel → detectado | Custom, NativeBase → detectado            |
| Expo         | TS / JS  | idem                                    | idem                                      | idem                                      |
| Next.js      | TS / JS  | idem                                    | Firebase, GA, Mixpanel → detectado        | MUI, Chakra, shadcn, Tailwind → detectado |
| React + Vite | TS / JS  | idem                                    | idem                                      | idem                                      |
| React (CRA)  | TS / JS  | idem                                    | idem                                      | idem                                      |

> **¿Qué pasa si mi proyecto no tiene i18n?** → el orquestador omite la creación de archivos de traducción.
> **¿Qué pasa si no tengo analytics?** → omite el paso de tracking.
> **¿Qué umbral de cobertura usa?** → siempre **≥83%** sin importar el proyecto.

---

## ¿Cómo funciona realmente?

### Arquitectura dual

```
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Copilot (Chat)                       │
│              ← motor de razonamiento principal →               │
└─────────────────────────┬────────────────────────────────────┘
                           │  llama tools MCP
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              MCP Server  (src/mcp-server.ts)                  │
│  10 herramientas: analizar · buscar · leer · listar ·         │
│  tests · standards · audit · escribir · sesión · limpiar      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│           Agentes Mastra  (src/mastra/agents/)                │
│  Solo se activan cuando hay un modelo IA en .env              │
│  7 agentes: mediador · análisis · historias · pantallas ·     │
│             tests · integraciones · sonarqube                 │
└──────────────────────────────────────────────────────────────┘
```

**Con Copilot (modo MCP):** Copilot actúa como el "cerebro" que razona, genera código y decide qué hacer. Las 10 tools MCP son sus "manos": leen archivos, ejecutan comandos y escriben código en el proyecto.

**Con modelo externo (modo Mastra):** Los 7 agentes se coordinan entre sí de forma autónoma usando sus propias tools internas. Requiere configurar `AI_PROVIDER` y `API_KEY` en `.env`.

---

## ¿Qué puedes hacer con él?

1. **Analiza** la estructura, dependencias y framework de tu proyecto
2. **Entiende** tu historia de usuario y la estructura en pantallas concretas
3. **Genera** los componentes React adaptados a tu framework (CRA, Next.js, Expo, etc.)
4. **Verifica** los estándares de código si tu proyecto tiene script `standards`
5. **Ejecuta** los tests unitarios y reporta cobertura (umbral mínimo: 83%)
6. **Agrega** tracking con Katalon, AppsFlyer y Google Analytics
7. **Audita** seguridad con npm audit (y SonarQube si está instalado)

---

## Comandos disponibles

| Comando       | Qué hace                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| `yarn setup`  | Asistente interactivo: instala deps, crea `.env`, verifica `mcp.json`       |
| `yarn doctor` | Diagnóstico rápido: verifica que Node, deps, `.env` y MCP están correctos   |
| `yarn mcp`    | Inicia el servidor MCP manualmente (VS Code lo hace automático en modo MCP) |

---

## Usar los agentes desde el chat de GitHub Copilot (modo principal)

> Esta es la forma más sencilla si ya tienes el proyecto clonado localmente y quieres
> usar los agentes directamente desde el chat de VS Code, en cualquier otro proyecto tuyo.

### ¿Qué es esto y para qué sirve?

Este proyecto incluye un **servidor MCP** (Model Context Protocol). Piénsalo como un
"puente" entre el chat de GitHub Copilot y las capacidades de acción sobre tu proyecto.
Una vez configurado, puedes escribir en el chat de Copilot cosas como:

> _"Usa el mediador-agente para generar la pantalla de login de mi app"_

Copilot actuará como el mediador: llamará automáticamente las herramientas MCP para
analizar tu proyecto, generará el código con su propio modelo, lo escribirá en los
archivos correctos, correrá los tests y reportará el resultado — sin que ejecutes
ningún comando adicional.

> **Nota:** Para el flujo completo con generación de código, Copilot es suficiente.
> Los agentes Mastra con modelo externo son para uso autónomo sin Copilot (ver más abajo).

---

### Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- [Node.js 18 o superior](https://nodejs.org/) — puedes verificarlo con `node -v` en la terminal
- [VS Code](https://code.visualstudio.com/) con la extensión **GitHub Copilot** activa
- Una cuenta con acceso a GitHub Copilot (el plan gratuito sirve)

---

### Paso 1 — Clonar y configurar este proyecto

```bash
# 1. Clona el repositorio en tu máquina
git clone https://github.com/juandape/mastra-orquestador.git

# 2. Entra a la carpeta
cd mastra-orquestador

# 3. Instala las dependencias
yarn install
```

---

### Paso 2 — (Opcional) Configurar un modelo de IA externo

> **Con GitHub Copilot no necesitas este paso.** El MCP server arranca sin ningún modelo
> configurado. Copilot usa su propio modelo para razonar y generar código; las tools MCP
> solo ejecutan acciones (leer archivos, correr tests, escribir código).
>
> Un modelo externo solo es necesario si quieres usar los **agentes Mastra de forma autónoma**,
> sin Copilot (modo headless, scripts, CI/CD, etc.).

Si quieres activar los agentes autónomos, crea un archivo `.env` dentro de la
carpeta `mastra-orquestador` con el proveedor que prefieras:

**OpenAI** (el más común):

```bash
# .env
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-...tu-clave-aqui...
```

**Anthropic (Claude):**

```bash
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...tu-clave-aqui...
```

**Google (Gemini):**

```bash
AI_PROVIDER=google
AI_MODEL=gemini-2.0-flash
GOOGLE_GENERATIVE_AI_API_KEY=AIza...tu-clave-aqui...
```

**Groq** (muy rápido, plan gratuito disponible):

```bash
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_...tu-clave-aqui...
```

**Ollama** (local, sin costo):

```bash
AI_PROVIDER=ollama
AI_MODEL=llama3.2
# OLLAMA_BASE_URL=http://localhost:11434  # opcional
```

---

### Paso 3 — Abrir los proyectos en VS Code

Para que el chat de Copilot pueda acceder a los agentes Y a tu proyecto al mismo tiempo,
debes tener los dos abiertos en la misma ventana de VS Code:

1. Abre VS Code
2. Ve a **File → Open Folder...** y abre la carpeta `mastra-orquestador`
   (VS Code detectará automáticamente el `mcp.json` que está dentro)
3. Ve a **File → Add Folder to Workspace...** y agrega la carpeta de tu proyecto React/React Native
4. Guarda el workspace: **File → Save Workspace As...**
   (ponle el nombre que quieras — no afecta al funcionamiento)

La próxima vez solo abres ese archivo `.code-workspace` y tendrás los dos proyectos listos.

> **Funciona en cualquier máquina y con cualquier ruta.** El `mcp.json` usa `${workspaceFolder}`,
> que VS Code resuelve automáticamente como el directorio `mastra-orquestador` sin importar
> dónde esté clonado el proyecto.

---

### Paso 4 — Verificar que el servidor MCP está activo

Cuando abres el workspace, VS Code detecta automáticamente el archivo `.vscode/mcp.json`
y arranca el servidor de agentes en segundo plano.

Para confirmar que está funcionando:

1. Abre la paleta de comandos: `Cmd + Shift + P`
2. Escribe: `MCP: List Servers`
3. Debe aparecer `mastra-orquestador` con estado **Running**

Si no aparece o dice "Stopped":

1. En la misma paleta: `MCP: Restart Server`
2. Selecciona `mastra-orquestador`

---

### Paso 5 — Abrir el chat de Copilot en modo Agent

1. Abre el chat de Copilot: `Cmd + Shift + I`
2. En la parte inferior del chat busca el selector de modo y elige **"Agent"**
   (no "Ask" ni "Edit" — debe decir exactamente "Agent")

> **¿Por qué modo Agent?** Es el único modo donde Copilot puede llamar herramientas
> externas como los agentes de este proyecto.

---

### Paso 6 — Iniciar el flujo con `@orquestar`

Ya tienes todo listo. Escribe en el chat simplemente:

```
@orquestar
```

El agente te guiará con preguntas en orden:

1. **Historia de usuario** — pégala en cualquier formato (texto libre, JSON, Markdown)
2. **Imagen de referencia** — ruta, URL o imagen directa; escribe `omitir` si no tienes
3. **Consideraciones adicionales** — ruta del proyecto, carpeta destino, convenciones; escribe `omitir` si no hay nada extra

Una vez recopilada la info:

4. El agente analiza el proyecto y crea el archivo **`_plan_[Feature].md`** en la raíz con:
   - Stack detectado · Historia · Imagen · Consideraciones
   - Checklist de pasos (`- [ ] Paso 1 — Análisis`, `- [ ] Paso 2 — ...`)
5. Te muestra el plan en el chat y espera tu **`aprobar`**
6. Ejecuta cada fase marcando el checklist en vivo:
   - `- [x] Paso N` — exitoso ✅
   - `- [!] Paso N` — error ❌ (con motivo)
   - `- [~] Paso N` — no aplica ➖

> El archivo `_plan_[Feature].md` queda en tu proyecto como registro del trabajo.

> **Flujo directo (sin pasos guiados):** si prefieres, puedes seguir usando el formato anterior:
> `Usa el mediador-agente. Historia: [...] Ruta: /tu/proyecto`

---

### ¿Qué pasará después de enviar?

Copilot (actuando como `mediador-agente`) llamará las herramientas MCP en orden:

```
Tool: analizar-proyecto     → Lee package.json, dependencias, scripts y tsconfig
Tool: leer-archivo          → Inspecciona componentes existentes
Tool: buscar-en-codigo      → Busca patrones e implementaciones reutilizables
                            → Copilot genera el código de las nuevas pantallas
Tool: escribir-archivo      → Crea los archivos en src/screens/ (o _staging/ si ya existen)
Tool: ejecutar-standards    → Ejecuta yarn standards si el proyecto lo tiene
Tool: ejecutar-tests        → Corre los tests con cobertura (umbral: ≥83%)
Tool: npm-audit             → Revisa vulnerabilidades en dependencias
Tool: resumen-sesion        → Guarda el estado de la sesión
```

Al final recibirás un **resumen completo** con:

- Los archivos nuevos creados directamente en tu proyecto (`src/screens/` o `src/containers/`)
- Los archivos de traducción `{feature}Es.json` y `{feature}En.json` creados
- El hook de tracking `use{Pantalla}Track.hook.ts` generado
- Las propuestas de cambios en archivos existentes en una carpeta `_staging/`
  (archivos de enums, `language.constant.ts`, hooks existentes — para que los revises)

> **¿Por qué hay una carpeta `_staging/`?** La tool `escribir-archivo` nunca sobreescribe
> código existente sin confirmación. Si el archivo ya existe, guarda la propuesta en
> `_staging/<Componente>/` para que lo revises antes de aplicarlo.

---

### Plantillas de prompts (copiar y pegar)

En lugar de escribir el prompt desde cero, usa las plantillas de la carpeta [`prompts/`](prompts/):

| Archivo                                                          | Contenido                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| [`prompts/plantillas.md`](prompts/plantillas.md)                 | Plantillas genéricas para cualquier proyecto React/RN   |
| [`prompts/agentes-referencia.md`](prompts/agentes-referencia.md) | Prompts listos por agente (mediador, tests, analytics…) |
| [`prompts/faq-errores.md`](prompts/faq-errores.md)               | Soluciones a los problemas más comunes                  |

---

### Agentes disponibles en el chat

Cuando dices "usa el `<agente>`" en el chat, le indicas a Copilot qué **modo de trabajo**
y qué **instrucciones específicas** aplicar. Copilot usa las tools MCP disponibles según
el contexto de cada agente.

| Agente                 | Para qué sirve                                            | Tools MCP que usa principalmente                              |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `mediador-agente`      | Coordinador general — flujo completo de extremo a extremo | Todas                                                         |
| `analisis-agente`      | Solo analizar la estructura de un proyecto                | `analizar-proyecto`, `buscar-en-codigo`, `ejecutar-standards` |
| `historias-agente`     | Mejorar o desglosar una historia de usuario               | `leer-archivo`, `listar-directorio`                           |
| `pantallas-agente`     | Solo generar componentes de pantallas                     | `analizar-proyecto`, `leer-archivo`, `escribir-archivo`       |
| `tests-agente`         | Generar tests y verificar cobertura                       | `ejecutar-tests`, `leer-archivo`, `escribir-archivo`          |
| `integraciones-agente` | Configurar analytics (Katalon, AppsFlyer, GA)             | `buscar-en-codigo`, `leer-archivo`, `escribir-archivo`        |
| `sonarqube-agente`     | Revisar seguridad y calidad del código                    | `npm-audit`, `buscar-en-codigo`                               |

> **Nota sobre SonarQube:** La ejecución de `sonar-scanner` (análisis completo) requiere
> que los agentes Mastra tengan modelo externo configurado en `.env`. Con solo Copilot,
> el `sonarqube-agente` puede revisar patrones problemáticos y ejecutar `npm-audit`,
> pero no lanza el servidor de SonarQube.

#### Ejemplos de uso directo por agente

```
# Solo analizar un proyecto
Usa el analisis-agente para analizar mi proyecto en /ruta/a/mi-proyecto

# Mejorar una historia de usuario
Usa el historias-agente para desglosar esta épica en historias más pequeñas:
"Como usuario quiero gestionar mi perfil completo"

# Solo generar pantallas (sin tests ni integraciones)
Usa el pantallas-agente con estas historias:
- Pantalla de confirmación de pedido con resumen de items y botón de pago
Ruta del proyecto: /ruta/a/mi-proyecto

# Solo correr los tests y ver la cobertura
Usa el tests-agente para verificar la cobertura de mi proyecto en /ruta/a/mi-proyecto

# Agregar analytics a una pantalla ya existente
Usa el integraciones-agente para agregar tracking a la pantalla RequestCard
en el proyecto /ruta/a/mi-proyecto

# Auditar seguridad
Usa el sonarqube-agente para revisar vulnerabilidades en /ruta/a/mi-proyecto
```

---

## Herramientas MCP disponibles (referencia técnica)

Estas son las 10 tools que el servidor MCP expone a GitHub Copilot. Copilot las llama
automáticamente según lo que necesite — generalmente no tienes que invocarlas directo.

| Tool                 | Ícono | Descripción                                                                          |
| -------------------- | ----- | ------------------------------------------------------------------------------------ |
| `analizar-proyecto`  | 🔍    | Lee `package.json` y `src/` — detecta framework, i18n, analytics, testing, gestor    |
| `buscar-en-codigo`   | 🔎    | Grep en archivos JS/TS/JSX/TSX — útil para encontrar patrones reutilizables          |
| `leer-archivo`       | 📄    | Lee uno o más archivos completos                                                     |
| `listar-directorio`  | 📂    | Muestra el árbol de un directorio (sin `node_modules`/`build`/`dist`)                |
| `ejecutar-tests`     | 🧪    | Corre Jest con cobertura. Informa si supera el umbral mínimo de 83%                  |
| `ejecutar-standards` | 📐    | Ejecuta `yarn/npm/pnpm standards` según el gestor detectado; si no existe, lo indica |
| `npm-audit`          | 🛡️    | Detecta vulnerabilidades con `yarn audit` o `npm audit`, clasificadas por severidad  |
| `escribir-archivo`   | 💾    | Escribe un archivo. Si ya existe, lo guarda en `_staging/` en vez de sobreescribir   |
| `resumen-sesion`     | 📊    | Muestra el estado de la memoria de sesión (proyectos activos y outputs almacenados)  |
| `limpiar-contexto`   | 🗑️    | Limpia la memoria de sesión de un proyecto para empezar desde cero                   |

---

## Estructura del proyecto

```
src/
├── mcp-server.ts             ← Servidor MCP (punto de entrada para Copilot)
├── setup.ts                  ← Carga de variables de entorno (.env)
└── mastra/
    ├── index.ts              ← Instancia Mastra (para uso autónomo con modelo externo)
    ├── agents/
    │   ├── index.ts          ← Barrel de agentes
    │   ├── analisisAgente.ts ← Análisis + buscar + standards
    │   ├── historiasAgente.ts
    │   ├── integracionesAgente.ts
    │   ├── mediadorAgente.ts
    │   ├── pantallasAgente.ts
    │   ├── sonarqubeAgente.ts
    │   └── testsAgente.ts
    ├── tools/
    │   ├── index.ts          ← Barrel de herramientas (usadas por agentes Mastra)
    │   ├── proyectoTools.ts  ← analizarEstructura + buscarImplementaciones + ejecutarStandards
    │   ├── pantallasTools.ts ← generarPantallas (detecta screens/, RN vs web, TS vs JS)
    │   ├── testsTools.ts     ← ejecutarTests con cobertura
    │   ├── integracionesTools.ts ← insertarTagsIntegracion (idempotente)
    │   └── sonarqubeTools.ts ← ejecutarSonarScanner + ejecutarNpmAudit
    └── workflows/
        └── orquestadorWorkflow.ts
```

## Flujo del workflow (`orquestador-workflow`)

> Este workflow se usa cuando los agentes Mastra corren con un modelo externo configurado
> en `.env`. Con Copilot, el mismo flujo lo coordina el `mediador-agente` usando las tools MCP.

| Paso | ID del step             | Qué hace                                                  |
| ---- | ----------------------- | --------------------------------------------------------- |
| 1    | `analizar-proyecto`     | Lee estructura, dependencias y scripts del proyecto       |
| 2    | `revisar-historias`     | Estructura la historia de usuario en pantallas concretas  |
| 3    | `generar-pantallas`     | Genera componentes React en `src/screens/<Pantalla>/`     |
| 4    | `verificar-standards`   | Ejecuta `yarn standards` si el proyecto lo tiene          |
| 5    | `ejecutar-tests`        | Tests con cobertura (umbral ≥83%)                         |
| 6    | `aplicar-integraciones` | Inserta tracking de Katalon, AppsFlyer y Google Analytics |
| 7    | `validar-seguridad`     | Ejecuta `sonar-scanner` + `yarn audit`                    |

## Arquitectura

- **`src/mcp-server.ts`** — servidor MCP: expone las **10 tools** que usa GitHub Copilot
- **`src/setup.ts`** — carga las variables de entorno del `.env` antes de inicializar los agentes
- **`src/mastra/agents`** — lógica de cada agente IA (usada en modo autónomo con modelo externo)
- **`src/mastra/model.ts`** — fábrica de modelos: resuelve qué proveedor usar según el `.env`
- **`src/mastra/workflows`** — orquestación con `.step().then().commit()`
- **`src/mastra/tools`** — adaptadores a sistemas externos (fs, execSync, axios) para los agentes Mastra

> Las tools de `src/mastra/tools/` son exclusivas de los agentes Mastra. El MCP server
> (`mcp-server.ts`) implementa su propia lógica de fs/execSync directamente, sin depender
> de ellas. Esto permite que el MCP funcione sin inicializar Mastra ni requerir un modelo IA.

Para cambiar el flujo, edita `src/mastra/workflows/orquestadorWorkflow.ts`.
