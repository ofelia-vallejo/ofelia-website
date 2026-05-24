# Cursor Prompt — Manifiesto v1

> Ya creé el archivo `manifiesto.html` en la raíz del proyecto. Este prompt es para que Cursor (a) verifique el archivo y (b) actualice el `index.html` para conectar el link "Historia".

---

## Prompt corto (wiring only) — RECOMENDADO

```
Ya existe el archivo `manifiesto.html` en la raíz del proyecto (página completa del manifiesto, autosuficiente, mismo aesthetic que index.html).

Tareas:

1) ABRE `manifiesto.html` y confirma que carga sin errores (revisa rutas del logo, fuentes Cinzel, scripts inline).

2) ACTUALIZA `index.html` (SOLO estos dos cambios, nada más):

   a) En el navbar, busca:
      `<a href="#">Historia</a>`
      y reemplázalo por:
      `<a href="manifiesto.html">Historia</a>`

   b) Confirma que el footer no tiene actualmente un link "Historia". Si no existe, NO añadas nada. Si existe con `href="#"`, cámbialo a `href="manifiesto.html"`.

3) NO toques nada más del index.html. No modifiques CSS, JS, otros links, ni estructura.

4) Al terminar muéstrame el diff de los cambios.
```

---

## Prompt largo (si necesitas regenerar el archivo desde cero)

Si por algún motivo necesitas que Cursor recree `manifiesto.html` (porque borraste, hiciste git revert, etc.), usa esta variante:

```
Crea el archivo `manifiesto.html` en la raíz del proyecto. La página debe:

- Reusar el mismo aesthetic que `index.html`: tipografía Cinzel + Helvetica Neue light, colores marfil/navy/espresso, cursor custom de 6px, reveal-on-scroll suave.
- Tener navbar fijo (idéntico al index, con el link "Historia" apuntando a manifiesto.html y los otros links apuntando a `index.html#productos`, `index.html#custom`, `index.html#contacto`).
- Tener un hero con:
  - Eyebrow: "Manifiesto"
  - Título grande Cinzel: "No nacimos para encajar. Nacimos para dejar huella."
  - Subtítulo: "Ofelia Vallejo no es una marca creada para seguir tendencias, llenar espacios vacíos o perseguir validación. Es una declaración silenciosa de identidad."
- Tener 5 pilares numerados (— I a — V), cada uno con título Cinzel y cuerpo en Helvetica light:
  I. Una presencia, no una tendencia.
  II. La belleza también puede ser refugio.
  III. Creemos en la feminidad con profundidad.
  IV. Nuestro lenguaje es visual, emocional y eterno.
  V. Menos ruido. Más intención.
- Tener una sección de cierre sobre fondo navy con el texto "Esto es Ofelia Vallejo." + las dos líneas finales.
- Footer idéntico al index.html (con tag "Leather House · Medellín → Zürich" y copyright 2026).

El texto completo de cada pilar está en `05_Copy_y_Voz/02_manifiesto_v1.md` — úsalo como fuente de verdad.

Después de crear el archivo, actualiza también el navbar de `index.html`:
`<a href="#">Historia</a>` → `<a href="manifiesto.html">Historia</a>`

Muéstrame el diff completo al final.
```

---

## Verificación posterior

Después de aplicar (cualquiera de las dos opciones):

1. Abre `index.html` en navegador → click en "Historia" del navbar → debe navegar a `manifiesto.html` ✓
2. En `manifiesto.html`:
   - [ ] Tipografía Cinzel se carga (Google Fonts)
   - [ ] Logo arriba a la izquierda
   - [ ] Hero con título grande y subtítulo
   - [ ] 5 pilares con numeración romana (— I a — V)
   - [ ] Cada pilar tiene su título Cinzel + cuerpo Helvetica light
   - [ ] Sección final "Esto es Ofelia Vallejo." sobre fondo navy
   - [ ] Footer con copyright 2026 + Medellín → Zürich
   - [ ] Cursor custom de 6px funciona en desktop
   - [ ] Reveal-on-scroll funciona suavemente
3. Click logo arriba izquierda → regresa al `index.html` ✓
4. Click "Personalizar" o "Colección" en el navbar de manifiesto.html → debe llevar a las secciones correctas del index.html

---

## Si Vercel no auto-detecta la nueva página

`vercel.json` actual debería seguir funcionando porque sirve estáticos por default. Si por algún motivo no aparece tras el deploy, abre `vercel.json` y verifica que NO tenga rewrites que excluyan archivos nuevos. Si está vacío o solo tiene `{}`, todo bien.

---

*v1 · 2026-05-22*
