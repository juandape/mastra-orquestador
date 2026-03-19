# � Prompts por agente — Guía de uso

Plantillas listas para usar con **cualquier proyecto** React, React Native, Next.js, Vite o Expo.

> Reemplaza los valores entre `[corchetes]` antes de pegar en el chat.
> `[RUTA_DEL_PROYECTO]` = ruta absoluta de tu proyecto (obtén con `pwd` en la terminal).

---

## Pantalla nueva

```
Usa el mediador-agente con la siguiente información:

Historia de usuario:
Como [rol] quiero [descripción de la funcionalidad]
para [beneficio].

Nombre de la pantalla: [ej: LoginScreen, CheckoutPage, ProfileView]

Ruta del proyecto: [RUTA_DEL_PROYECTO]
```

---

## Agregar analytics a una pantalla existente

```
Usa el integraciones-agente para agregar el tracking completo
a la pantalla [NombrePantalla].

Contexto:
- La pantalla está en: [ruta relativa al componente]
- Acciones relevantes: screen_view, [acción_principal], success, error

Ruta del proyecto: [RUTA_DEL_PROYECTO]
```

---

## Generar tests para un componente

```
Usa el tests-agente para generar los tests unitarios del componente
[NombreComponente].

El componente está en:
[ruta relativa al componente]

Ruta del proyecto: [RUTA_DEL_PROYECTO]
```

---

## Auditar el código antes de un release

```
Usa el sonarqube-agente para auditar el código de la pantalla
[NombrePantalla] antes del release. Busca:
- Texto hardcodeado en JSX
- Vulnerabilidades en dependencias
- Problemas de plataforma (si React Native)

Ruta del proyecto: [RUTA_DEL_PROYECTO]
```

---

## Analizar el impacto de una nueva historia

```
Usa el analisis-agente para evaluar el impacto de esta historia en el proyecto:

Historia: [descripción de la funcionalidad]

Necesito saber:
1. ¿Qué archivos existentes se verían afectados? (🟢 NUEVO / 🟡 EXTENDER / 🔴 MODIFICAR)
2. ¿Hay componentes reutilizables que ya resuelven esto?
3. ¿Existe un patrón de tracking o i18n similar ya implementado?

Ruta del proyecto: [RUTA_DEL_PROYECTO]
```
