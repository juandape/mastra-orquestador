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

El agente te guiará paso a paso de forma interactiva:

1. Pregunta la **historia de usuario** — responde en el chat
2. Pregunta la **imagen de referencia** — pega con `Cmd+V` / `Ctrl+V`, escribe la ruta, o escribe `skip`
3. Pregunta las **consideraciones adicionales** — escribe lo que necesites o `skip`
4. Pregunta la **ruta del proyecto** — pega la ruta absoluta
5. Crea un archivo **`_plan_[Feature].md`** con el plan y checklist para tu aprobación
6. Una vez apruebes con `aprobar`, ejecuta cada paso actualizando el checklist en tiempo real

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
│  14 herramientas: analizar · buscar · leer · listar ·         │
│  tests · standards · audit · escribir · sesión · limpiar ·   │
│  invoke-http · coredce-generate · interest-account (×3)       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│           Agentes Mastra  (src/mastra/agents/)                │
│  Solo se activan cuando hay un modelo IA en .env              │
│  12 agentes: mediador · análisis · historias · pantallas ·    │
│              tests · integraciones · sonarqube ·              │
│              coredce · coredce-entities · coredce-repos ·     │
│              interest-account · blupersonas-integration       │
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

Ya tienes todo listo. Tienes tres formas de iniciar según tu preferencia:

#### Opción A — Flujo interactivo (recomendado)

Escribe `@orquestar` en el chat. El agente te hará **una pregunta a la vez**:

| Paso | Qué pide                    | Obligatorio | Tip                                                |
| ---- | --------------------------- | ----------- | -------------------------------------------------- |
| 1/4  | Historia de usuario         | ✅          | Texto libre, JSON o Markdown                       |
| 2/4  | Imagen de referencia        | ➖          | `Cmd+V` para pegar screenshot, ruta, URL, o `skip` |
| 3/4  | Consideraciones adicionales | ➖          | Carpeta destino, patrones, o `skip`                |
| 4/4  | Ruta del proyecto           | ✅          | Ruta absoluta, ej: `/Users/juan.pena/Projects/...` |

Después de responder los 4 pasos, el agente crea el plan y espera tu `aprobar`.

#### Opción B — Prompt file `/orquestar` (más rápido)

Escribe `/orquestar` en el chat de Copilot (modo Agent). VS Code carga directamente
el archivo [.github/prompts/orquestar.prompt.md](.github/prompts/orquestar.prompt.md)
con el formulario ya estructurado. Edítalo en el input y envía.

> Esta opción solo funciona con **GitHub Copilot en modo Agent**.

#### Opción C — Texto libre directo

Si ya tienes todo claro, envía todo en un solo mensaje sin formulario:

```
Usa el mediador-agente con esta historia:
"Como usuario quiero ver el resumen de mi cuenta de ahorros con saldo e historial"
Imagen de referencia: /ruta/a/figma-screenshot.png
Ruta del proyecto: /Users/juan.pena/Projects/Blu20/BluPersonasApp
```

---

En todos los casos, una vez que el agente recibe la información:

1. Analiza el proyecto y detecta el stack automáticamente
2. Crea el archivo **`_plan_[Feature].md`** en la raíz del proyecto con:
   - Stack detectado · Historia · Imagen · Consideraciones
   - Checklist de pasos a ejecutar
3. Te muestra el plan en el chat y espera tu **`aprobar`**
4. Ejecuta cada fase marcando el checklist en vivo:
   - `- [x] Paso N` — exitoso ✅
   - `- [!] Paso N` — error ❌ (con motivo)
   - `- [~] Paso N` — no aplica ➖

> El archivo `_plan_[Feature].md` queda en tu proyecto como registro del trabajo.

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

| Agente                           | Para qué sirve                                                    | Tools MCP que usa principalmente                              |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `mediador-agente`                | Coordinador general — flujo completo de extremo a extremo         | Todas                                                         |
| `analisis-agente`                | Solo analizar la estructura de un proyecto                        | `analizar-proyecto`, `buscar-en-codigo`, `ejecutar-standards` |
| `historias-agente`               | Mejorar o desglosar una historia de usuario                       | `leer-archivo`, `listar-directorio`                           |
| `pantallas-agente`               | Solo generar componentes de pantallas                             | `analizar-proyecto`, `leer-archivo`, `escribir-archivo`       |
| `tests-agente`                   | Generar tests y verificar cobertura                               | `ejecutar-tests`, `leer-archivo`, `escribir-archivo`          |
| `integraciones-agente`           | Configurar analytics (Katalon, AppsFlyer, GA)                     | `buscar-en-codigo`, `leer-archivo`, `escribir-archivo`        |
| `sonarqube-agente`               | Revisar seguridad y calidad del código                            | `npm-audit`, `buscar-en-codigo`                               |
| `coredce-agente`                 | Generar estructura CoreDCE completa desde un contrato OpenAPI     | `coredce-generate-from-contract`, `escribir-archivo`          |
| `coredce-entities-agente`        | Solo generar entidades y interfaces de CoreDCE                    | `coredce-generate-from-contract`                              |
| `coredce-repos-agente`           | Solo generar repositorios e implementaciones de CoreDCE           | `coredce-generate-from-contract`                              |
| `interest-account-agente`        | Integrar endpoints de InterestAccount (CoreDCE ↔ Front)           | `invoke-http-endpoint`, interest-account tools                |
| `blupersonas-integration-agente` | Orquestador genérico CoreDCE ↔ BluPersonasApp (cualquier feature) | `coredce-generate-from-contract`, `invoke-http-endpoint`      |

**Generador CoreDCE + Mutación del front (genérico)**

El agente `@coredce` genera la estructura mínima CoreDCE a partir de un contrato OpenAPI/JSON para **cualquier integración nueva** — no solo InterestAccount. Ahora también genera automáticamente el archivo de mutación del front (BluPersonasApp) siguiendo el patrón genérico.

- Palabra clave: `@coredce` (chat de Copilot o flujo del `mediador-agente`).
- Tool MCP: `coredce-generate-from-contract` — acepta `{ proyectoPath, contractPathOrUrl, force, only, frontPath, featureName }`.
- Agente: `coredce-agente` — flujo interactivo que pregunta ruta del contrato, ruta CoreDCE, nombre de feature, y si generar la mutación del front.

Qué genera en **CoreDCE** (`proyectoPath`):

| Archivo                                                             | Descripción                                           |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/core/domain/entities/{resource}.ts`                            | Tipos `Request`/`Response` con TODOs para mapear      |
| `src/core/domain/interfaces/{resource}.interface.ts`                | Interfaz del repositorio (`AsyncApiResponse<T>`)      |
| `src/core/infraestructure/repositories/{resource}.repositoryImp.ts` | Implementación que llama a `sendRequest`              |
| `src/core/infraestructure/controllers/{resource}.controller.ts`     | Clase estática con método `execute` y manejo de error |

Qué genera en el **front** (`frontPath` + `featureName`, opcional):

| Archivo                                   | Descripción                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `src/mutations/{featureName}.mutation.ts` | Hook genérico con `createQuery` (GET) o `createMutation` (POST/PUT/etc.) |

**Patrón genérico de mutaciones del front** — aplica a CUALQUIER integración nueva:

```typescript
// src/mutations/{featureName}.mutation.ts
import { createQuery, createMutation } from '@Mutations/mutationCore.mutation'
import {
  ApiResponse,
  FeatureController,       // exportado por @dcefront/coredce después de publicar
  KEYS_FEATURE,            // si está disponible en el paquete
  FeatureRequest,
  FeatureResponse,
} from '@dcefront/coredce'  // ← SIEMPRE desde aquí, NUNCA desde node_modules directos

const featureMutation = () => ({
  // GET → createQuery  (auto-fetch al montar la pantalla)
  getData: createQuery<FeatureRequest, ApiResponse<FeatureResponse>>(
    KEYS_FEATURE.dataKey,
    FeatureController.getData
  ),
  // POST/PUT/DELETE → createMutation  (on-demand)
  saveData: createMutation<FeatureSaveRequest, ApiResponse<FeatureSaveResponse>>(
    FeatureController.saveData
  ),
})
export default featureMutation
```

Luego exportar en `src/mutations/index.ts`:

```typescript
export { default as featureMutation } from './feature.mutation'
```

Modo de uso (Copilot / VS Code):

```
@coredce
contrato: ./specs/customer-api.json
proyecto: /ruta/al/BluCoreDCE
front: /ruta/al/BluPersonasApp
feature: customerApi
forzar: no
```

Si solo quieres una parte, usa el parámetro `only`:

```
@coredce-entities  → solo entidades e interfaces
@coredce-repos     → solo repositorios e implementaciones
```

> **Nota:** Los archivos generados tienen `TODO` que deben completarse con los tipos exactos del contrato. El front solo puede importar desde `@dcefront/coredce` **después** de publicar el paquete.

**Integrador genérico CoreDCE ↔ Front (`@blupersonas-integrate`)**

Para cualquier integración nueva (no solo InterestAccount):

```
@blupersonas-integrate
acción: generar-core
contrato: ./specs/nueva-feature.json
proyecto: /ruta/BluCoreDCE
front: /ruta/BluPersonasApp
feature: nuevaFeature
```

El agente genera CoreDCE + mutación del front y entrega el checklist de pasos siguientes.

**Verificar endpoints directamente (`invoke-http-endpoint`)**

Sin necesidad de modelo IA, puedes invocar cualquier endpoint desde el chat:

```
Usa la tool invoke-http-endpoint para probar el endpoint POST /api/mi-feature
con apiBaseUrl: http://localhost:3000 y body: { "id": "123" }
```

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

## Guía rápida — Cómo usar las tools desde el chat de Copilot

> Modo requerido: **Agent** (`Cmd + Shift + I` → selector de modo → "Agent")

### Flujo 1 — Historia de usuario + imagen de Figma → pantallas

El caso de uso más común: tienes una historia de usuario (y opcionalmente una imagen de Figma) y quieres que Copilot genere los componentes en tu proyecto.

**Paso 1 — Inicia el flujo guiado (recomendado):**

```
@orquestar
```

El agente te hace **una pregunta a la vez** en el chat:

1. **Historia de usuario** — responde en texto libre, JSON o Markdown
2. **Imagen de referencia** — pega con `Cmd+V` / `Ctrl+V`, escribe la ruta/URL, o escribe `skip`
3. **Consideraciones adicionales** — instrucciones extra, o `skip`
4. **Ruta del proyecto** — ruta absoluta al proyecto

Luego creará el plan y esperará tu aprobación antes de ejecutar.

**Paso 2 — Alternativa directa (sin preguntas):**

```
Usa el mediador-agente con esta historia:
"Como usuario quiero ver el resumen de mi cuenta de ahorros con saldo e historial"
Imagen de referencia: /ruta/a/figma-screenshot.png
Ruta del proyecto: /Users/juan.pena/Projects/Blu20/BluPersonasApp
```

**¿Qué hace Copilot internamente?**

```
→ analizar-proyecto    Lee dependencias, framework, i18n, analytics, carpeta de pantallas
→ leer-archivo         Inspecciona componentes existentes para reutilizarlos
→ buscar-en-codigo     Encuentra patrones de hooks, estilos y navegación del proyecto
→ escribir-archivo     Crea los archivos en src/containers/ o src/screens/
                       (si ya existe, lo guarda en _staging/ para revisión)
→ ejecutar-standards   Verifica estándares de código del proyecto
→ ejecutar-tests       Corre tests con cobertura (umbral ≥83%)
```

**Resultado esperado:**

- `src/screens/<NombrePantalla>/index.tsx` — componente generado
- `src/locales/<feature>Es.json` y `<feature>En.json` — traducciones (si el proyecto usa i18n)
- `_staging/` — propuestas de cambios en archivos existentes (enums, hooks, navegación)

---

### Flujo 2 — Generar estructura CoreDCE desde un contrato

Tienes un contrato OpenAPI/JSON del backend y quieres generar la estructura en BluCoreDCE **y** el archivo de mutación en BluPersonasApp.

**En el chat de Copilot (modo Agent):**

```
Usa la tool coredce-generate-from-contract con estos parámetros:
- proyectoPath: /Users/juan.pena/Projects/Blu20/BluCoreDCE
- contractPathOrUrl: /ruta/al/contrato.json
- frontPath: /Users/juan.pena/Projects/Blu20/BluPersonasApp
- featureName: miNuevaFeature
- force: false
```

O usando la palabra clave del agente:

```
@coredce
contrato: /ruta/al/contrato.json
proyecto: /Users/juan.pena/Projects/Blu20/BluCoreDCE
front: /Users/juan.pena/Projects/Blu20/BluPersonasApp
feature: miNuevaFeature
forzar: no
```

**¿Qué genera?**

En **BluCoreDCE** (`proyectoPath`):

```
src/core/domain/entities/mi-nueva-feature.ts            → Request + Response con TODOs
src/core/domain/interfaces/mi-nueva-feature.interface.ts → Interfaz del repo
src/core/infraestructure/repositories/mi-nueva-feature.repositoryImp.ts
src/core/infraestructure/controllers/mi-nueva-feature.controller.ts
```

En **BluPersonasApp** (`frontPath`):

```
src/mutations/miNuevaFeature.mutation.ts  → Hook con createQuery/createMutation
```

El archivo de mutación generado sigue el patrón obligatorio del front:

```typescript
import { createQuery, createMutation } from '@Mutations/mutationCore.mutation'
import {
  ApiResponse,
  MiNuevaFeatureController,   // exportado por @dcefront/coredce
  KEYS_MI_NUEVA_FEATURE,
  MiNuevaFeatureRequest,
  MiNuevaFeatureResponse,
} from '@dcefront/coredce'     // ← SIEMPRE desde aquí

const miNuevaFeatureMutation = () => ({
  // GET → createQuery (auto-fetch)
  getData: createQuery<MiNuevaFeatureRequest, ApiResponse<MiNuevaFeatureResponse>>(
    KEYS_MI_NUEVA_FEATURE.dataKey,
    MiNuevaFeatureController.getData
  ),
  // POST → createMutation (on-demand)
  saveData: createMutation<MiNuevaFeatureSaveRequest, ApiResponse<MiNuevaFeatureSaveResponse>>(
    MiNuevaFeatureController.saveData
  ),
})
export default miNuevaFeatureMutation
```

> Después de generar recuerda:
>
> 1. Completar los `TODO` en las entidades con los tipos exactos del contrato.
> 2. Publicar el paquete `@dcefront/coredce` para que el front pueda importarlo.
> 3. Agregar la exportación en `src/mutations/index.ts`:
>    `export { default as miNuevaFeatureMutation } from './miNuevaFeature.mutation'`

---

### Flujo 3 — Verificar un endpoint directamente

Sin modelo IA ni configuración extra:

```
Usa la tool invoke-http-endpoint:
- apiBaseUrl: http://localhost:3000
- path: /api/cbf-loandepo-interest-account/v0/payment-history
- method: POST
- body: { "savingsAccountFacility": { "accountReference": { "accountIdentification": "1234567890" } } }
```

---

### Flujo 4 — Solo historia → Figma → CoreDCE + Front (flujo completo)

Si quieres cubrir todo el ciclo desde la historia hasta los archivos listos:

```
Usa el blupersonas-integration-agente:
acción: generar-core
contrato: /ruta/al/contrato.json
proyecto CoreDCE: /Users/juan.pena/Projects/Blu20/BluCoreDCE
proyecto front: /Users/juan.pena/Projects/Blu20/BluPersonasApp
feature: accountInterests
```

El agente genera la estructura CoreDCE, la mutación del front y entrega el checklist de pasos para completar la integración.

Estas son las **14 tools** que el servidor MCP expone a GitHub Copilot. Copilot las llama
automáticamente según lo que necesite — generalmente no tienes que invocarlas directo.

### Tools de análisis y escritura

| Tool                 | Ícono | Descripción                                                                         |
| -------------------- | ----- | ----------------------------------------------------------------------------------- |
| `analizar-proyecto`  | 🔍    | Lee `package.json` y `src/` — detecta framework, i18n, analytics, testing, gestor   |
| `buscar-en-codigo`   | 🔎    | Grep en archivos JS/TS/JSX/TSX — útil para encontrar patrones reutilizables         |
| `leer-archivo`       | 📄    | Lee uno o más archivos completos                                                    |
| `listar-directorio`  | 📂    | Muestra el árbol de un directorio (sin `node_modules`/`build`/`dist`)               |
| `ejecutar-tests`     | 🧪    | Corre Jest con cobertura. Informa si supera el umbral mínimo de 83%                 |
| `ejecutar-standards` | 📐    | Ejecuta `yarn/npm standards` según el gestor detectado; si no existe, lo indica     |
| `npm-audit`          | 🛡️    | Detecta vulnerabilidades con `yarn audit` o `npm audit`, clasificadas por severidad |
| `escribir-archivo`   | 💾    | Escribe un archivo. Si ya existe, lo guarda en `_staging/` en vez de sobreescribir  |
| `resumen-sesion`     | 📊    | Muestra el estado de la memoria de sesión (proyectos activos y outputs almacenados) |
| `limpiar-contexto`   | 🗑️    | Limpia la memoria de sesión de un proyecto para empezar desde cero                  |

### Tools de integración CoreDCE ↔ Front

| Tool                                           | Ícono | Descripción                                                                                |
| ---------------------------------------------- | ----- | ------------------------------------------------------------------------------------------ |
| `coredce-generate-from-contract`               | 🏗️    | Genera entidades, repos, controllers en CoreDCE + archivo de mutación del front (genérico) |
| `invoke-http-endpoint`                         | 🌐    | Realiza peticiones HTTP genéricas (GET/POST/PUT/PATCH/DELETE) sin necesidad de modelo IA   |
| `interest-account-get-payment-history`         | 💰    | Llama al endpoint `POST /api/cbf-loandepo-interest-account/v0/payment-history`             |
| `interest-account-get-amount-range-projection` | 📈    | Llama al endpoint `POST /api/cbf-loandepo-interest-account/v0/amount-range-projection`     |
| `interest-account-get-accrued-detail`          | 🔢    | Llama al endpoint `POST /api/cbf-loandepo-interest-account/v0/accrued-detail`              |

> **`coredce-generate-from-contract`** acepta los parámetros:
>
> - `proyectoPath` — ruta al repo CoreDCE
> - `contractPathOrUrl` — archivo local o URL del contrato OpenAPI/JSON
> - `force` — si `true`, sobreescribe con backup
> - `only` — `entities` | `repos` | `controllers` | `all`
> - `frontPath` _(opcional)_ — ruta de BluPersonasApp para generar el archivo de mutación del front
> - `featureName` _(opcional)_ — nombre de la feature en camelCase (ej: `transfers`, `newFeature`)

---

## Estructura del proyecto

```
src/
├── mcp-server.ts             ← Servidor MCP (punto de entrada para Copilot) — 14 tools
├── setup.ts                  ← Carga de variables de entorno (.env)
└── mastra/
    ├── index.ts              ← Instancia Mastra (para uso autónomo con modelo externo)
    ├── model.ts              ← Fábrica de modelos: openai · anthropic · google · groq · ollama
    ├── agents/
    │   ├── index.ts                        ← Barrel de agentes (12 exportados)
    │   ├── analisisAgente.ts               ← Análisis + buscar + standards
    │   ├── historiasAgente.ts
    │   ├── integracionesAgente.ts
    │   ├── mediadorAgente.ts
    │   ├── pantallasAgente.ts
    │   ├── sonarqubeAgente.ts
    │   ├── testsAgente.ts
    │   ├── coredceAgente.ts                ← Generador CoreDCE completo (+ mutación front)
    │   ├── coredceEntitiesAgente.ts        ← Solo entidades e interfaces
    │   ├── coredceReposAgente.ts           ← Solo repos e implementaciones
    │   ├── interestAccountAgente.ts        ← Endpoints InterestAccount con patrón genérico
    │   └── blupersonasIntegrationAgente.ts ← Orquestador CoreDCE ↔ Front (genérico)
    ├── tools/
    │   ├── index.ts              ← Barrel de herramientas (todas exportadas)
    │   ├── proyectoTools.ts      ← analizarEstructura + buscarImplementaciones + ejecutarStandards
    │   ├── pantallasTools.ts     ← generarPantallas (detecta screens/, RN vs web, TS vs JS)
    │   ├── testsTools.ts         ← ejecutarTests con cobertura
    │   ├── integracionesTools.ts ← insertarTagsIntegracion (idempotente)
    │   ├── sonarqubeTools.ts     ← ejecutarSonarScanner + ejecutarNpmAudit
    │   ├── coredceTools.ts       ← coredceGenerateFromContract (CoreDCE + mutación front genérica)
    │   ├── httpTools.ts          ← invokeHttpEndpoint (HTTP genérico)
    │   └── interestAccountTools.ts ← getPaymentHistory + getAmountRangeProjection + getAccruedDetail
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

- **`src/mcp-server.ts`** — servidor MCP: expone las **14 tools** que usa GitHub Copilot (10 de análisis/escritura + 4 de integración CoreDCE/HTTP)
- **`src/setup.ts`** — carga las variables de entorno del `.env` antes de inicializar los agentes
- **`src/mastra/agents`** — **12 agentes** IA (usados en modo autónomo con modelo externo)
- **`src/mastra/model.ts`** — fábrica de modelos: resuelve qué proveedor usar según el `.env` (openai · anthropic · google · groq · ollama)
- **`src/mastra/workflows`** — orquestación con `.step().then().commit()`
- **`src/mastra/tools`** — adaptadores a sistemas externos (fs, execSync, axios) para los agentes Mastra

> Las tools de `src/mastra/tools/` son exclusivas de los agentes Mastra. El MCP server
> (`mcp-server.ts`) implementa su propia lógica directamente, sin depender de ellas.
> Esto permite que el MCP funcione sin inicializar Mastra ni requerir un modelo IA.

Para cambiar el flujo, edita `src/mastra/workflows/orquestadorWorkflow.ts`.

> **Nota sobre SonarQube:** La ejecución de `sonar-scanner` (análisis completo) requiere
> que los agentes Mastra tengan modelo externo configurado en `.env`. Con solo Copilot,
> el `sonarqube-agente` puede revisar patrones problemáticos y ejecutar `npm-audit`,
> pero no lanza el servidor de SonarQube.
