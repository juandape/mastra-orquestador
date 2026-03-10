# Mastra Orquestador de Agentes para Proyectos React/React Native

Orquestador de agentes IA con Mastra que automatiza las tareas de desarrollo en proyectos React y React Native. Se usa exclusivamente a través del chat de **GitHub Copilot** mediante el protocolo MCP.

## ¿Qué hace?

1. **Analiza** la estructura, dependencias y framework de tu proyecto
2. **Entiende** tu historia de usuario y la estructura en pantallas concretas
3. **Genera** los componentes React adaptados a tu framework (CRA, Next.js, Expo, etc.)
4. **Verifica** los estándares de código si tu proyecto tiene script `standards`
5. **Ejecuta** los tests unitarios y reporta cobertura (umbral mínimo: 83%)
6. **Agrega** tags de Katalon, AppsFlyer y Google Analytics
7. **Audita** seguridad con SonarQube y npm audit

## Usar los agentes desde el chat de GitHub Copilot (sin publicar en npm)

> Esta es la forma más sencilla si ya tienes el proyecto clonado localmente y quieres
> usar los agentes directamente desde el chat de VS Code, en cualquier otro proyecto tuyo.

### ¿Qué es esto y para qué sirve?

Este proyecto incluye un **servidor MCP** (Model Context Protocol). Piénsalo como un
"traductor" entre el chat de GitHub Copilot y los agentes de IA de este proyecto.
Una vez configurado, puedes escribir en el chat de Copilot cosas como:

> _"Usa el mediador-agente para generar la pantalla de login de mi app"_

...y el agente se encargará de analizar tu proyecto, generar los componentes, los tests
y todo lo demás — sin que tengas que ejecutar ningún comando adicional.

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
npm install
```

---

### Paso 2 — Configurar el modelo de IA

Los agentes usan el modelo de IA que esté configurado en el archivo `.env` dentro de la carpeta `mastra-orquestador`.
Crea ese archivo con el proveedor y la clave que ya tengas disponible:

**OpenAI:**

```bash
# .env
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=sk-...tu-clave-aqui...
```

**Anthropic (Claude):**

```bash
# .env
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...tu-clave-aqui...
```

**Google (Gemini):**

```bash
# .env
AI_PROVIDER=google
AI_MODEL=gemini-2.0-flash
GOOGLE_GENERATIVE_AI_API_KEY=AIza...tu-clave-aqui...
```

> Si ya tienes una cuenta en cualquiera de estos proveedores, usa la clave que ya tienes.
> Si no tienes ninguna, [OpenAI](https://platform.openai.com/api-keys) ofrece créditos gratuitos al registrarse.

---

### Paso 3 — Abrir ambos proyectos en VS Code

Para que el chat de Copilot pueda acceder a los agentes Y a tu proyecto al mismo tiempo,
debes tener los dos abiertos en la misma ventana de VS Code:

1. Abre VS Code
2. Ve a **File → Open Folder...** y abre la carpeta `mastra-orquestador`
3. Ve a **File → Add Folder to Workspace...** y agrega la carpeta de tu proyecto
   (por ejemplo: `blupersonasapp`)
4. Guarda el workspace: **File → Save Workspace As...**
   (guárdalo con un nombre como `mi-workspace.code-workspace`)

La próxima vez solo abres ese archivo `.code-workspace` y tendrás los dos proyectos listos.

---

### Paso 4 — Verificar que el servidor MCP está activo

Cuando abres el workspace, VS Code detecta automáticamente el archivo `.vscode/mcp.json`
y arrancar el servidor de agentes en segundo plano.

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

### Paso 6 — Enviar tu solicitud con la historia de usuario

Ya tienes todo listo. Escribe en el chat algo como esto:

```
Usa el mediador-agente con la siguiente información:

Historia de usuario:
Como usuario quiero ver la pantalla de perfil donde pueda
editar mi nombre, foto y correo electrónico.

Imagen de diseño: [arrastra tu imagen de Figma directamente al chat]

Ruta del proyecto: /Users/tu-usuario/Projects/blupersonasapp
```

> **¿Cómo sé la ruta de mi proyecto?** Abre una terminal dentro de la carpeta
> de tu proyecto y ejecuta `pwd`. Copia y pega el resultado.

---

### ¿Qué pasará después de enviar?

El `mediador-agente` coordinará automáticamente todos los demás agentes en orden:

```
1. Análisis del proyecto     → entiende la estructura de tu app
2. Revisión de la historia   → refina y organiza lo que pediste
3. Generación de pantallas   → crea los componentes React/React Native
4. Tests                     → genera y verifica pruebas automáticas
5. Integraciones             → agrega analytics si aplica
6. Seguridad                 → revisa vulnerabilidades con SonarQube
```

Al final recibirás un **resumen completo** con:

- Los archivos nuevos creados directamente en tu proyecto (`src/screens/`)
- Las propuestas de cambios en archivos existentes en una carpeta `_staging/`
  (para que los revises antes de aplicarlos manualmente)

> **¿Por qué hay una carpeta `_staging/`?** Los agentes nunca modifican código que
> ya existe en producción sin que lo revises primero. Es una medida de seguridad.

---

### Agentes disponibles en el chat

Si quieres hablar con un agente específico en lugar del mediador general, puedes
pedírselo directamente al chat:

| Agente                 | Para qué sirve                                     |
| ---------------------- | -------------------------------------------------- |
| `mediador-agente`      | Coordinador general — úsalo para el flujo completo |
| `analisis-agente`      | Solo analizar la estructura de un proyecto         |
| `historias-agente`     | Mejorar o desglosar una historia de usuario        |
| `pantallas-agente`     | Solo generar componentes de pantallas              |
| `tests-agente`         | Solo generar tests para un componente              |
| `integraciones-agente` | Configurar Katalon, AppsFlyer o Google Analytics   |
| `sonarqube-agente`     | Revisar seguridad y calidad del código             |

Ejemplo de uso directo:

```
Usa el historias-agente para desglosar esta épica en historias más pequeñas:
"Como usuario quiero gestionar mi perfil completo"
```

---

## Desarrollo local

## Estructura del proyecto

```
src/
├── mcp-server.ts             ← Servidor MCP (punto de entrada principal)
├── setup.ts                  ← Carga de variables de entorno (.env)
└── mastra/
    ├── index.ts              ← Instancia Mastra
    ├── agents/
    │   ├── index.ts          ← Barrel de agentes
    │   ├── analisisAgente.ts ← Análisis + standards
    │   ├── historiasAgente.ts
    │   ├── integracionesAgente.ts
    │   ├── mediadorAgente.ts
    │   ├── pantallasAgente.ts
    │   ├── sonarqubeAgente.ts
    │   └── testsAgente.ts
    ├── tools/
    │   ├── index.ts          ← Barrel de herramientas
    │   ├── proyectoTools.ts  ← analizarEstructura + buscarImplementaciones + ejecutarStandards
    │   ├── pantallasTools.ts
    │   ├── testsTools.ts
    │   ├── integracionesTools.ts
    │   └── sonarqubeTools.ts
    └── workflows/
        └── orquestadorWorkflow.ts
```

## Flujo del workflow (`orquestador-workflow`)

| Paso | ID del step             | Qué hace                                                 |
| ---- | ----------------------- | -------------------------------------------------------- |
| 1    | `analizar-proyecto`     | Lee estructura, dependencias y scripts del proyecto      |
| 2    | `revisar-historias`     | Estructura la historia de usuario en pantallas concretas |
| 3    | `generar-pantallas`     | Genera componentes React en `src/screens/<Pantalla>/`    |
| 4    | `verificar-standards`   | Ejecuta `npm run standards` si el proyecto lo tiene      |
| 5    | `ejecutar-tests`        | Tests con cobertura (umbral 83%)                         |
| 6    | `aplicar-integraciones` | Inserta tags de Katalon, AppsFlyer y Google Analytics    |
| 7    | `validar-seguridad`     | SonarQube + npm audit                                    |

## Arquitectura

- **`src/mcp-server.ts`** — servidor MCP: expone los 7 agentes como herramientas para el chat de Copilot
- **`src/setup.ts`** — carga las variables de entorno del `.env` (proveedor y clave de IA) antes de inicializar los agentes
- **`src/mastra/agents`** — lógica de cada agente IA
- **`src/mastra/model.ts`** — fábrica de modelos: resuelve qué proveedor usar según el `.env`
- **`src/mastra/workflows`** — orquestación con `.step().then().commit()`
- **`src/mastra/tools`** — adaptadores a sistemas externos (fs, execSync, axios)

Para cambiar el flujo, edita `src/mastra/workflows/orquestadorWorkflow.ts`.
