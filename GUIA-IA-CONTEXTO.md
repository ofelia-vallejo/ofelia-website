# Cómo usar el contexto de marca en cada motor de IA
> Ofelia Vallejo Leather House — Guía de referencia

---

## CLAUDE (Cowork / Desktop)
**→ Automático. No tienes que hacer nada.**

Claude lee `CLAUDE.md` y la carpeta `memory/` al inicio de cada sesión.
Si abres una sesión nueva y quieres refrescarle el contexto rápido, escribe:

```
Lee memory/MEMORY.md y dime el estado actual del proyecto
```

Para tareas específicas, usa las plantillas del archivo `prompt_master.md`.

---

## CURSOR (editor de código)
**→ Automático. Abre el proyecto y ya tiene el contexto.**

Los archivos `.cursorrules` y `.cursor/rules/brand-context.mdc` se leen solos.
Cursor ya sabe: paleta, tipografía, stack técnico, reglas de logo, tono de voz.

No necesitas pegar nada. Solo abre la carpeta del proyecto en Cursor.

---

## CHATGPT
**→ Manual. Pegar una vez al inicio de cada conversación.**

1. Abre el archivo `ai-context-chatgpt.md` (está en la carpeta del proyecto)
2. Selecciona todo (Cmd+A)
3. Copia (Cmd+C)
4. Pégalo como primer mensaje en ChatGPT antes de hacer cualquier pregunta

---

## GEMINI (Google AI Studio / Gemini.google.com)
**→ Manual. Igual que ChatGPT.**

1. Abre `ai-context-chatgpt.md`
2. Copia todo el contenido
3. Pégalo como primer mensaje en Gemini

Alternativa: en Google AI Studio puedes crear un "System Prompt" fijo con el contenido del archivo para no tener que pegarlo cada vez.

---

## KIMI (Moonshot AI)
**→ Manual. Igual que ChatGPT.**

1. Abre `ai-context-chatgpt.md`
2. Copia todo el contenido
3. Pégalo como primer mensaje en Kimi

---

## CUALQUIER OTRO MOTOR DE IA
**→ Mismo procedimiento: copiar y pegar `ai-context-chatgpt.md`**

El archivo está escrito para ser universal — funciona en cualquier IA que acepte un mensaje de contexto inicial.

---

## Archivos que debes conocer

| Archivo | Para qué sirve |
|---|---|
| `CLAUDE.md` | Referencia maestra completa de la marca (18 KB) |
| `memory/MEMORY.md` | Índice de memoria — Claude lo lee automáticamente |
| `prompt_master.md` | Contexto comprimido + plantillas de prompt por tarea |
| `ai-context-chatgpt.md` | Bloque de contexto para ChatGPT, Gemini, Kimi y otros |
| `.cursorrules` | Contexto automático para Cursor |
| `.cursor/rules/brand-context.mdc` | Reglas detalladas para Cursor |

---

## Qué pasa cuando cambia algo en el proyecto

- **Claude:** actualiza el archivo `memory/` correspondiente o avísame y yo lo actualizo.
- **Cursor:** se actualiza solo (lee los archivos en cada sesión).
- **ChatGPT / Gemini / Kimi:** actualiza `ai-context-chatgpt.md` y pega la nueva versión.

---

## Reglas que nunca cambian (para cualquier IA)

1. Logo = firma de la abuela → NUNCA modificar
2. Paleta: solo los 7 colores de marca
3. Tipografía: solo Cinzel + Helvetica Neue
4. Tono: sobrio, romano — NUNCA "premium/exclusivo/disfruta/ritual"
5. Responder siempre en español

---

*Creado: 2026-05-28 · Proyecto: Ofelia Vallejo Leather House*
