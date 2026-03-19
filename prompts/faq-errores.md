# ❓ Preguntas frecuentes y errores comunes

## "No veo la opción Agent en el chat de Copilot"

**Causa:** El chat está en modo "Ask" o "Edit" en lugar de "Agent".

**Solución:**

1. Abre el chat con `Cmd+Shift+I`
2. Busca el selector de modo en la parte inferior del chat
3. Haz clic y elige **Agent** (no Ask ni Edit)

> El modo Agent es el único que puede usar herramientas externas como las de este proyecto.

---

## "MCP: List Servers no muestra mastra-orquestador"

**Causa:** VS Code no detectó el archivo `mcp.json`, o el workspace no está configurado correctamente.

**Solución paso a paso:**

1. Asegúrate de que `mastra-orquestador` está abierto como **carpeta raíz** en VS Code
   (File → Open Folder, no File → Open File)
2. Abre la paleta (`Cmd+Shift+P`) y ejecuta: `MCP: List Servers`
3. Si no aparece: `MCP: Restart Server` → selecciona `mastra-orquestador`
4. Si sigue sin aparecer: cierra y vuelve a abrir VS Code

---

## "El agente no hace nada después de mi mensaje"

**Causa:** Falta información clave en el prompt (ruta del proyecto, historia, etc.)

**Solución:** Asegúrate de incluir siempre:

- `Ruta del proyecto: /ruta/completa/a/tu-proyecto` (usa `pwd` para obtenerla)
- Qué agente quieres usar (ej: "Usa el mediador-agente...")

---

## "El agente hardcodeó texto en el componente generado"

**Causa:** Instrucción insuficiente en el prompt.

**Solución:** Agrega a tu prompt:

```
IMPORTANTE: Todo texto visible al usuario debe usar t('clave') de i18next.
No hardcodees ningún string. Crea los archivos {feature}Es.json y {feature}En.json.
```

---

## "No se generaron los archivos de traducción"

**Causa:** El agente omitió este paso.

**Solución:** Escribe en el chat un mensaje de seguimiento:

```
Faltaron los archivos de traducción. Por favor crea:
- src/configuration/language/{feature}Es.json
- src/configuration/language/{feature}En.json
con todas las claves que usa el componente generado.
También propone la actualización de language.constant.ts en _staging/.
```

---

## "No se ejecutaron los tests"

**Causa:** El agente omitió el paso de testing.

**Solución:** Escribe en el chat:

```
Faltó ejecutar los tests. Por favor:
1. Genera el archivo de test __tests__/{NombreComponente}.test.tsx
2. Ejecútalo con la herramienta ejecutar-tests filtrando por "{NombreComponente}"
3. Reporta si pasa y el porcentaje de cobertura
```

---

## "Error: Cannot find module '@mastra/core'"

**Causa:** Las dependencias no están instaladas.

**Solución:**

```bash
cd mastra-orquestador
yarn install
```

---

## "El servidor MCP dice 'Process exited with error'"

**Causa:** Error en el código TypeScript o dependencias faltantes.

**Solución:**

```bash
# 1. Verifica que TypeScript compila sin errores
cd mastra-orquestador
yarn type-check

# 2. Ejecuta el diagnóstico completo
yarn doctor

# 3. Si todo falla, reinstala dependencias
rm -rf node_modules
yarn install
```

---

## Los cambios en \_staging/ ¿cómo los aplico?

Los archivos en `_staging/` son propuestas que el agente no quiso aplicar directamente
porque ya existía el archivo original. Para aplicar:

1. Abre el archivo de staging: `_staging/<NombreComponente>/index.tsx`
2. Compáralo con el original: `src/containers/<Modulo>/screens/<NombreComponente>/index.tsx`
3. Copia los cambios que quieras aplicar al original
4. O reemplaza el archivo completo si la propuesta es lo que quieres

```bash
# Para ver las diferencias
diff _staging/MiComponente/index.tsx src/containers/Modulo/screens/MiComponente/index.tsx
```
