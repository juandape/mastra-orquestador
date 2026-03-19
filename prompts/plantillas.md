# 📋 Plantillas de Prompts — Mastra Orquestador

Copia el prompt que necesitas, pégalo en el chat de Copilot (modo **Agent**) y reemplaza
los valores entre `[corchetes]` con tu información real.

> **¿Cómo saber la ruta de tu proyecto?**
> Abre una terminal dentro de tu proyecto y escribe `pwd`. Copia el resultado.

> **¿Con qué proyectos funciona?**
> Con cualquier proyecto React (CRA, Vite, Next.js), React Native o Expo.
> El orquestador detecta automáticamente el framework, lenguaje, i18n, analytics y testing.

---

## 🚀 Flujo completo (pantalla nueva de cero)

```
Usa el mediador-agente con la siguiente información:

Historia de usuario:
Como [tipo de usuario] quiero [acción o funcionalidad]
para [beneficio o motivo].

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

**Ejemplo — React Native:**

```
Usa el mediador-agente con la siguiente información:

Historia de usuario:
Como cliente del banco quiero ver un resumen de mi tarjeta adicional
con el cupo disponible y el número de tarjeta enmascarado,
para tener visibilidad rápida de mi cuenta.

Ruta del proyecto: /Users/juan/Projects/MiAppMobil
```

**Ejemplo — React web (Next.js / Vite):**

```
Usa el mediador-agente con la siguiente información:

Historia de usuario:
Como administrador quiero ver un dashboard con las métricas
de usuarios activos y conversiones del último mes.

Ruta del proyecto: /Users/juan/Projects/MiAppWeb
```

---

## 🔍 Solo analizar el proyecto (sin generar código)

```
Usa el analisis-agente para analizar la estructura de mi proyecto.

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

---

## 📃 Mejorar o desglosar una historia de usuario

```
Usa el historias-agente para mejorar esta historia de usuario
y dividirla en tareas concretas si es demasiado grande:

Historia:
[Escribe o pega aquí tu historia de usuario]

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

---

## 🎨 Solo generar pantallas (ya tengo la historia definida)

```
Usa el pantallas-agente para generar los componentes de esta pantalla:

Pantalla: [nombre de la pantalla, ej: "ConfirmacionPedido"]

Descripción:
[Describe qué debe mostrar y qué acciones tiene la pantalla]

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

---

## 🧪 Solo ejecutar tests y verificar cobertura

```
Usa el tests-agente para verificar la cobertura de mi proyecto.

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

**Con filtro por nombre de componente:**

```
Usa el tests-agente para ejecutar los tests del componente [NombreComponente]
y verificar que la cobertura alcanza el umbral configurado en el proyecto.

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

---

## 📊 Solo agregar analytics (pantalla ya existente)

```
Usa el integraciones-agente para agregar el tracking de analytics
a la pantalla [NombrePantalla].

La pantalla ya existe en: [src/containers/Modulo/screens/NombrePantalla]
El hook principal es: [use{NombrePantalla}.hook.ts]

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

---

## 🛡️ Solo auditar seguridad

```
Usa el sonarqube-agente para revisar vulnerabilidades y problemas
de calidad en mi proyecto.

Ruta del proyecto: [/ruta/completa/a/tu-proyecto]
```

---

## ✏️ Ver el estado de la sesión actual

```
Muéstrame el resumen de la sesión actual del proyecto
en [/ruta/completa/a/tu-proyecto]
```

---

## 🗑️ Limpiar la sesión y empezar de cero

```
Limpia el contexto del proyecto en [/ruta/completa/a/tu-proyecto]
para empezar desde cero.
```
