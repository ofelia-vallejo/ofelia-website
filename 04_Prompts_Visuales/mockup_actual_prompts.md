# Ofelia Vallejo — Prompts para Imágenes del Mockup Actual

> Set inicial de 6 imágenes que necesita el sitio `index.html` activo.
> Todos los prompts están en **inglés** para uso directo en Gemini / Midjourney / Imagen 3.
> Cada prompt indica **qué archivo adjuntar como referencia** y aplica la regla absoluta del sello.

---

## ⛔ REGLA ABSOLUTA DEL LOGO (en TODOS los prompts)

Cuando un prompt mencione el sello / monograma / firma sobre el cuero:

> **"use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather."**

**Archivo de sello a adjuntar SIEMPRE:** `06_Identidad_Marca/logos/logo_sello_laser.png` (OV con tridente).
Si la imagen generada cambia un solo trazo del monograma → descartar y regenerar.

---

## Imagen 1 — HERO (lado derecho del hero, 50% del viewport)

**Ubicación en mockup:** `.hero__media` (línea 733 de `index.html`). Reemplaza el gradient `espresso → vino → navy`.

**Imagen de referencia a adjuntar:**
- Archivo del sello: `06_Identidad_Marca/logos/logo_sello_laser.png` (obligatorio).
- Referencia de cuero/hardware/costura: `imagenes base/3d1a8b8c-8a9c-466c-83e7-8ff2d078bba4.JPG` (calidad de cuero y costura existente).
- Si tienes foto real de la Travel Bag I en espresso → adjúntala como ancla principal.

```json
{
  "task": "hero_image_travel_bag_I",
  "aspect_ratio": "4:5",
  "format": "vertical editorial hero, dark mood, atmospheric depth, the product is the unambiguous hero",
  "subject": {
    "product": "Travel Bag I — Colombian full-grain leather weekender duffel, espresso brown finish, hand-rubbed pull-up patina, structured silhouette with rolled top handles, removable shoulder strap with brushed antique brass hardware, visible tonal saddle stitching in waxed thread",
    "placement": "product set on a travertine bench or aged walnut wood surface, slightly off-center, three-quarter angle, viewer's eye-line, editorial crop",
    "human_presence": "optional, partial — a single hand or wrist of a Latin man in his early 30s, olive skin, charcoal cashmere sleeve, no watch, no rings, fingers resting near the strap; or fully absent if the product feels stronger alone"
  },
  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather",
    "technique": "real CO2 laser engraving, ~0.3mm deep, recessed warm dark mark with faint carbonized edge, leather grain slightly compressed inside the mark",
    "position": "lower-right of the front panel, ~4 cm from bottom and right edge",
    "scale": "~3 cm wide on the bag"
  },
  "scene": "atmospheric concierge desk of a Milanese hotel at dawn, hand-troweled lime-wash wall behind, a sliver of arched window with cold morning light, soft fog of dust in air; or a Medellín atelier shelf with rolled cabuya twine and a Carmen de Viboral ceramic bowl just out of focus — pick whichever serves the dark mood better",
  "light": "single directional warm window light from upper-left, dramatic falloff into shadow on the right, ~3200K, no studio flash, no fill bounce",
  "camera": "ARRI Alexa Mini LF cinematic still, 65mm prime, f/2.0, ISO 200, leather tack-sharp, background falling into bokeh",
  "color_palette_strict": ["#F3EEE6 marfil", "#EDE5D8 beige", "#0B1F3A navy", "#3B2B26 espresso (dominant)", "#5B1E24 vino accent", "#1F3527 verde"],
  "post_processing": "Kodak Vision3 250D emulation, slightly desaturated highlights, rich shadows, fine grain, no HDR, no plastic shine, micro-contrast preserved",
  "style_references": "Hermès Travel campaign, Loewe Voyage lookbook, Bottega Veneta editorial, The Row, Khaite, Brunello Cucinelli",
  "negative_prompt": "no Pixar 3D, no CGI cartoon, no anime, no glassmorphism, no lavender/purple/pink/neon, no influencer smile, no centered retail catalog pose, no logos applied in post, no plastic shine, no marble vector veins, no rounded gold frames, no sombrero vueltiao, no Wayuu mochila, no ruana, no Botero, no narco aesthetic, no kitsch tropical, no AI-warped stitching, no floating text, no redrawn monogram, no stylized OV cursive, no foil gold, no embossed brand patch, no metal plate logo"
}
```

---

## Imagen 2 — Card Travel Bag I (Espresso)

**Ubicación en mockup:** `.card__img` con `.card__gradient--1` (línea 758). Reemplaza el gradient `beige → espresso`.

**Imagen de referencia a adjuntar:**
- `06_Identidad_Marca/logos/logo_sello_laser.png` (obligatorio).
- Si tienes foto real de la Travel Bag I espresso → adjúntala. Si no: `imagenes base/3d1a8b8c-8a9c-466c-83e7-8ff2d078bba4.JPG` (cuero negro pero buena referencia de costura/hardware).

```json
{
  "task": "product_card_travel_bag_I_espresso",
  "aspect_ratio": "4:5",
  "format": "vertical product editorial card, soft warm tonal background, product centered-low, breathing space above",
  "subject": {
    "product": "Travel Bag I in espresso brown full-grain Colombian leather, weekender duffel, rolled handles, brushed antique brass hardware, tonal saddle stitching, soft pull-up patina visible on edges and stress points",
    "placement": "three-quarter front view, slightly tilted right, sitting on a travertine ledge",
    "human_presence": "none — product alone"
  },
  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather",
    "technique": "real CO2 laser engraving, ~0.3mm deep, recessed dark mark with faint carbonized edge",
    "position": "lower-right of the front panel, ~4 cm from bottom and right edge",
    "scale": "~3 cm wide"
  },
  "scene": "background is a soft gradient from beige (#EDE5D8) at the top to espresso (#3B2B26) at the bottom, evoking warm Antioqueño afternoon light against a lime-wash wall",
  "light": "soft directional from upper-left, gentle warm wrap, subtle shadow under the bag grounding it",
  "camera": "Hasselblad H6D simulation, 80mm, f/2.8, ISO 100, tack-sharp leather, very shallow background blur",
  "color_palette_strict": ["#EDE5D8 beige (background top)", "#3B2B26 espresso (product + bg bottom)", "#0B1F3A navy (mark)"],
  "post_processing": "Kodak Portra 400 emulation, warm but never orange, micro-contrast on grain, no plastic shine",
  "style_references": "Hermès .com product editorial, Loewe leather goods catalog, Bottega Veneta minimalist studio",
  "negative_prompt": "no humans, no Pixar 3D, no CGI cartoon, no lavender/purple/neon, no logos applied in post, no foil gold, no metal plate, no embossed patch, no redrawn monogram, no stylized OV cursive, no floating text, no busy props, no studio flash hotspots"
}
```

---

## Imagen 3 — Card Travel Bag II (Navy)

**Ubicación en mockup:** `.card__img` con `.card__gradient--2` (línea 768). Gradient `beige → navy`.

**Imagen de referencia a adjuntar:**
- `06_Identidad_Marca/logos/logo_sello_laser.png` (obligatorio).
- Foto real de Travel Bag II en navy si existe; si no, mismo set de referencia que Imagen 2.

```json
{
  "task": "product_card_travel_bag_II_navy",
  "aspect_ratio": "4:5",
  "format": "vertical product editorial card, deep tonal background, product centered-low",
  "subject": {
    "product": "Travel Bag II in deep navy (#0B1F3A) full-grain Colombian leather, identical silhouette to Travel Bag I, rolled handles, brushed antique brass hardware, tonal navy saddle stitching, soft micro-glow on the grain catching light",
    "placement": "three-quarter front view, slightly tilted right, sitting on a travertine ledge",
    "human_presence": "none"
  },
  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather",
    "technique": "real CO2 laser engraving, ~0.3mm deep, recessed dark mark with faint carbonized edge (the mark reads even darker than the navy leather, almost carbon)",
    "position": "lower-right of the front panel, ~4 cm from bottom and right edge",
    "scale": "~3 cm wide"
  },
  "scene": "background gradient from beige (#EDE5D8) at the top to navy (#0B1F3A) at the bottom, evoking pre-dawn editorial atmosphere",
  "light": "soft directional from upper-left, subtle cool-warm contrast, navy must read rich and inky, never flat blue",
  "camera": "Hasselblad H6D simulation, 80mm, f/2.8, ISO 100, tack-sharp leather grain, shallow background blur",
  "color_palette_strict": ["#EDE5D8 beige (bg top)", "#0B1F3A navy (product + bg bottom)", "#3B2B26 espresso (hardware accent)"],
  "post_processing": "Kodak Portra 400 emulation, rich shadows, micro-contrast on grain",
  "style_references": "Hermès .com product editorial, Loewe leather goods, Bottega Veneta studio",
  "negative_prompt": "no humans, no Pixar 3D, no CGI cartoon, no lavender/purple/neon, no logos applied in post, no foil gold, no metal plate, no embossed patch, no redrawn monogram, no stylized OV cursive, no floating text, no flat cobalt blue, no royal blue, no plastic shine, no studio flash"
}
```

---

## Imagen 4 — Card Travel Bag III (Verde Bosque)

**Ubicación en mockup:** `.card__img` con `.card__gradient--3` (línea 778). Gradient `beige → verde`.

**Imagen de referencia a adjuntar:**
- `06_Identidad_Marca/logos/logo_sello_laser.png` (obligatorio).
- Foto real de Travel Bag III en verde si existe; si no, mismo set de referencia.

```json
{
  "task": "product_card_travel_bag_III_verde",
  "aspect_ratio": "4:5",
  "format": "vertical product editorial card, deep forest tonal background, product centered-low",
  "subject": {
    "product": "Travel Bag III in deep Andean forest green (#1F3527) full-grain Colombian leather, identical silhouette to I and II, rolled handles, brushed antique brass hardware, tonal green saddle stitching, soft pull-up patina catching light",
    "placement": "three-quarter front view, slightly tilted right, sitting on a travertine ledge or aged walnut",
    "human_presence": "none"
  },
  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather",
    "technique": "real CO2 laser engraving, ~0.3mm deep, recessed dark mark with faint carbonized edge",
    "position": "lower-right of the front panel, ~4 cm from bottom and right edge",
    "scale": "~3 cm wide"
  },
  "scene": "background gradient from beige (#EDE5D8) at the top to deep verde (#1F3527) at the bottom, evoking Eje Cafetero highland fog at 7am",
  "light": "soft directional from upper-left, gentle cool wrap, green must read deep and earthy, never bright kelly or olive military",
  "camera": "Hasselblad H6D simulation, 80mm, f/2.8, ISO 100, tack-sharp grain, shallow background blur",
  "color_palette_strict": ["#EDE5D8 beige (bg top)", "#1F3527 verde (product + bg bottom)", "#3B2B26 espresso accent"],
  "post_processing": "Kodak Portra 400 emulation, rich micro-contrast, slightly desaturated highlights",
  "style_references": "Hermès .com product editorial, Loewe leather goods, The Row catalog",
  "negative_prompt": "no humans, no Pixar 3D, no CGI cartoon, no lavender/purple/neon, no bright kelly green, no olive military, no logos applied in post, no foil gold, no metal plate, no embossed patch, no redrawn monogram, no stylized OV cursive, no floating text, no plastic shine, no studio flash"
}
```

---

## Imagen 5 — Split Editorial "Hecho para durar" (Atelier)

**Ubicación en mockup:** `.split__media` (línea 791). Reemplaza el gradient `espresso → #1a0d08`.

**Imagen de referencia a adjuntar:**
- `06_Identidad_Marca/logos/logo_sello_laser.png` (obligatorio — el sello aparece grabándose sobre el cuero en el plano).
- `imagenes base/76879f1b-db4b-434c-98dc-cd11ad91df1c.JPG` como referencia de calidad de cuero y costura.

```json
{
  "task": "split_atelier_editorial",
  "aspect_ratio": "4:5",
  "format": "vertical editorial atelier scene, intimate craft moment, the hands and tools tell the story",
  "subject": {
    "scene_focus": "close-up of an artisan's hands at a Medellín leather atelier workbench: aged walnut surface, a half-cut espresso leather panel mid-construction, a brass head awl and a curved needle resting on the panel, a small CO2 laser machine in soft background bokeh with the OV seal visible on a finished piece just to the side",
    "hands": "Latin male hands, mid-40s, weathered but precise, no rings, charcoal apron strap visible on forearm, fingers holding a waxed thread mid-stitch",
    "human_presence": "hands and forearms only — no face, no body"
  },
  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather",
    "technique": "real CO2 laser engraving visible on a finished leather panel resting on the workbench beside the piece in progress",
    "position": "the marked leather panel is in the right-third of the frame, slightly out of focus",
    "scale": "~3 cm wide on that panel"
  },
  "scene": "Medellín atelier — hand-troweled lime-wash wall (cream) visible behind, dark walnut workbench, a Carmen de Viboral white-and-cobalt ceramic mug holding pencils far back in soft bokeh, a coil of cabuya twine, a tiny bunch of dried café cherries on the wood — all subtle, no clutter, no folk costume",
  "light": "single warm window light from the left, golden hour ~3200K, dimensional shadows across the wood grain, no studio flash, no fill",
  "camera": "ARRI Alexa Mini LF cinematic still, 50mm prime, f/2.0, ISO 400, hands and thread tack-sharp, atelier falling into rich bokeh",
  "color_palette_strict": ["#F3EEE6 marfil (wall)", "#3B2B26 espresso (leather + dominant)", "#0B1F3A navy (apron / shadow)", "#EDE5D8 beige (ceramic accent)"],
  "post_processing": "Kodak Vision3 250D emulation, slightly desaturated highlights, rich shadows, fine cinema grain, no HDR, no plastic shine",
  "style_references": "Loewe Craft Prize photography, Hermès petit-h documentary stills, Brunello Cucinelli atelier campaign, Bottega Veneta savoir-faire films",
  "negative_prompt": "no Pixar 3D, no CGI cartoon, no anime, no glassmorphism, no lavender/purple/pink/neon, no full faces, no influencer smile, no logos applied in post, no plastic shine, no marble vector veins, no rounded gold frames, no sombrero vueltiao, no Wayuu mochila, no ruana, no Botero, no narco aesthetic, no kitsch tropical, no AI-warped stitching, no redrawn monogram, no stylized OV cursive, no foil gold, no embossed brand patch, no metal plate logo, no busy clutter"
}
```

---

## Imagen 6 — Custom Section "Tu nombre. En cuero." (background opcional sobre navy)

**Ubicación en mockup:** `.custom` (línea 806). Actualmente fondo plano navy. Si quieres reforzarlo con foto de fondo atmosférica (con overlay navy al 70% encima para preservar contraste del copy), este es el prompt.

**Imagen de referencia a adjuntar:**
- `06_Identidad_Marca/logos/logo_sello_laser.png` (obligatorio).
- `imagenes base/3f366aac-8924-4a02-abd0-af213605c027.JPG` como referencia de pieza personalizable (cinturón cognac).

```json
{
  "task": "custom_section_background_laser_personalization",
  "aspect_ratio": "16:9",
  "format": "horizontal banner background, intentionally dark and atmospheric so navy overlay at 70% reads cleanly, the engraving moment is the visual hook",
  "subject": {
    "scene_focus": "macro detail shot of a CO2 laser engraver mid-cycle marking the OV seal onto a piece of espresso leather, a faint wisp of smoke rising, the freshly burned mark glowing slightly warm against the dark grain",
    "human_presence": "none — pure object + light + smoke"
  },
  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather",
    "technique": "real CO2 laser engraving in progress, ~0.3mm deep, freshly carbonized edge still slightly warm, faint smoke wisp",
    "position": "centered in the lower-right third of the frame",
    "scale": "the mark is ~6 cm wide, hero-scale within the macro"
  },
  "scene": "macro of leather panel on dark walnut, a single beam of warm window light cutting across diagonally, deep negative space on the left for type overlay",
  "light": "single hard directional warm light from upper-left, deep shadow falloff to the right, ~3000K, micro-glow on the engraving",
  "camera": "Phase One IQ4 macro simulation, 100mm macro, f/4, ISO 100, leather grain tack-sharp, smoke wisp soft",
  "color_palette_strict": ["#0B1F3A navy (overlay-friendly base)", "#3B2B26 espresso (leather)", "#141414 carbon (shadows)", "#F3EEE6 marfil (highlight glow)"],
  "post_processing": "Kodak Vision3 250D emulation, deep rich shadows, fine grain, micro-contrast on the engraved edge",
  "style_references": "Hermès craft macro stills, Loewe Craft Prize documentary, Saddleback Leather close-ups but elevated to editorial",
  "negative_prompt": "no Pixar 3D, no CGI cartoon, no anime, no glassmorphism, no lavender/purple/pink/neon, no logos applied in post, no foil gold, no metal plate, no embossed patch, no redrawn monogram, no stylized OV cursive, no floating text, no laser sparks fantasy, no neon laser red, no plastic shine"
}
```

---

## Resumen ejecutivo — qué adjuntar a cada generación

| # | Imagen | Archivo SEAL (siempre) | Imagen de referencia adicional |
|---|---|---|---|
| 1 | Hero Travel Bag I espresso | `logo_sello_laser.png` | foto real Travel Bag I (si existe) o `3d1a8b8c-8a9c-466c-83e7-8ff2d078bba4.JPG` |
| 2 | Card Travel Bag I espresso | `logo_sello_laser.png` | foto real Travel Bag I (si existe) |
| 3 | Card Travel Bag II navy | `logo_sello_laser.png` | foto real Travel Bag II (si existe) |
| 4 | Card Travel Bag III verde | `logo_sello_laser.png` | foto real Travel Bag III (si existe) |
| 5 | Split atelier "Hecho para durar" | `logo_sello_laser.png` | `76879f1b-db4b-434c-98dc-cd11ad91df1c.JPG` |
| 6 | Custom background láser | `logo_sello_laser.png` | `3f366aac-8924-4a02-abd0-af213605c027.JPG` |

**Orden recomendado de generación:** empieza por la #2 (Card Travel Bag I espresso) — es la más controlada, sin humanos, fondo controlado, y permite calibrar si el modelo respeta el seal antes de invertir en las composiciones complejas.

---

*Última actualización: 2026-05-23 — Set inicial alineado al `index.html` activo.*
