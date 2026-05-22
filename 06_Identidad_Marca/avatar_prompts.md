# Ofelia Vallejo — Prompts de Modelo de Campaña Editorial

> Biblioteca de prompts para generar imágenes editoriales con modelo de campaña.
> La marca **NO tiene avatar Pixar / CGI / cartoon**. Tiene **modelos reales en fotografía editorial fashion-house**.
> Antes de usar, leer obligatoriamente `CLAUDE.md` y `brand_discovery.md`.
> Sistema visual técnico: `paleta_tipografia.md`.

---

## ⛔ Regla absoluta — Firma/Logo bloqueado

Los 3 logos en `/06_Identidad_Marca/logos/` son **la firma manuscrita de la abuela Ofelia Vallejo**, ya rasterizada. NO son assets de diseño editables. Son patrimonio.

**Cuando un prompt mencione "logo", "monograma OV", "firma cursiva" o "grabado láser":**
- Adjuntar SIEMPRE como referencia el archivo correspondiente (`logo_sello_laser.png` para grabados láser sobre cuero, `logo_firma_completa.png` para firma cursiva visible).
- La IA debe reproducir el archivo 1:1, no inventar trazos, no estilizar, no generar variantes.
- Si el modelo generativo distorsiona la firma → descartar la imagen y regenerar.

**Prohibido absoluto en cualquier prompt:**
- ❌ "stylized OV monogram", "elegant cursive", "luxury logo design"
- ❌ Generar la firma como texto vectorial nuevo
- ❌ Cambiar color, agregar adornos, marcos decorativos, foil dorado
- ❌ Modificar proporción o redibujar la O o la V

---

## 1. Perfil oficial del modelo de campaña

### Mujer (línea femenina y campañas hero)
```
Latin woman, late 20s to mid 30s, natural sun-touched olive skin,
no obvious makeup, hair pulled back in a low chignon or worn loose
at the shoulders, calm self-possessed gaze either downcast or
three-quarter turned away from camera so face is partially obscured.

Energy: serene, confident, unhurried, editorial — never an influencer
smile, never centered head-on to camera.
```

### Hombre (línea unisex y travel campaigns)
```
Latin man, early 30s to mid 40s, natural olive complexion, clean
short hair or relaxed natural cut, no facial hair styling beyond
groomed stubble or clean shave, calm posture, gaze lateral or
focused on the product, never engaging the camera with a smile.

Energy: heritage, considered, traveler, editorial — never lifestyle-stock.
```

### Wardrobe obligatorio
Estrictamente tonal dentro de la paleta de marca:
- Marfil `#F3EEE6` (cashmere knit, raw linen, cream tailoring)
- Navy `#0B1F3A` (wool coat, dark suit, denim deep indigo)
- Espresso `#3B2B26` (wide-leg trousers, leather pieces matching the bag)
- Vino `#5B1E24` (acento de campaña, knit ocasional)
- Verde `#1F3527` (knit moss, wool deep forest)
- Carbón `#141414` (negro absoluto, hardware oscuro)

**Sin logos visibles. Sin joyería llamativa. Sin accesorios competidores. Sin maquillaje pesado.**

### Posa
Siempre editorial:
- Caminando con la pieza en mano
- Sentada/o en banco de mármol travertino o nogal
- En transición (entrando/saliendo de cuadro)
- Apoyado/a en ventana arqueada
- Cropped editorialmente (sin cara, de perfil, tres-cuartos atrás)

**Nunca:** head-on a cámara, smile to camera, brazos cruzados commercial, pose de Instagram, "yoga zen", "rezando".

---

## 2. Lista de NUNCA para el modelo

- ~~Pixar 3D / CGI / cartoon / anime~~
- ~~Bob negro corto con flequillo recto verde-eyed~~ (versión obsoleta wellness)
- ~~Joyería lunar, ropa bordada púrpura, aretes dorados decorativos~~ (versión obsoleta)
- ~~Pose de meditación, manos en mudra, ojos cerrados espiritual~~
- ~~Smile to camera commercial / influencer pose~~
- ~~Maquillaje editorial agresivo / contour pronunciado~~
- ~~Wardrobe lavanda, morado, fucsia, neón~~
- ~~Logos de otras marcas visibles~~
- ~~Sombreros vueltiao, mochilas Wayuu, ruanas, ponchos~~
- ~~Cualquier referencia narco / Pablo Escobar~~

---

## 3. Prompt Base (Gemini / Midjourney / DALL-E / Firefly)

```
Editorial fashion photograph for Ofelia Vallejo — Leather House,
Colombian heritage leather brand from Medellín presented to the
European luxury market.

Subject: [Latin woman / Latin man] in early 30s, natural olive skin,
no obvious makeup, [hair detail], calm editorial gaze, cropped framing,
never head-on smiling.

Wardrobe: strictly tonal in [marfil cream / navy / espresso / vino /
verde] — fine wool, raw linen, cashmere, no visible logos, no
competing accessories.

Product hero: [Travel Bag / Bolso Dama / Bandolera / Morral / Belt]
in [espresso / navy / verde / negro / cognac] full-grain Colombian
leather, hand-rubbed pull-up patina, visible saddle stitching in
tonal waxed thread, brushed antique brass hardware. The product is
the unambiguous hero — the model frames it.

Brand mark: real CO2 laser engraving on the leather, ~0.3mm deep,
recessed warm dark mark with faint carbonized edge, reproducing the
EXACT OV monogram from `06_Identidad_Marca/logos/logo_sello_laser.png`
(the grandmother's hand-rendered mark — never redraw, never restyle,
never AI-generate a new monogram; the engraving must read as a
faithful 1:1 reproduction of that file). Position per product:
Travel Bag → lower-right of front panel (~4 cm from edges);
Tote → centered front-low (~6 cm from base);
Belt → centered at tip (~2 cm from end);
Crossbody → lower-right of front panel (~3 cm from edges);
Backpack → upper passant or lower-right of front panel.

Scene: [European hotel lobby / Medellín atelier / arched window /
travertine bench] — quiet luxury atmosphere with subtle Antioqueño
details (hand-troweled lime-wash wall, Carmen de Viboral ceramic,
Colombian coffee beans, cabuya twine, walnut wood, andean fern)
rendered with Milanese restraint, never folkloric.

Light: single directional warm window light from side, soft natural
falloff, dimensional shadows, ~3200K, no studio flash.

Camera: ARRI Alexa Mini LF or Hasselblad H6D simulation, 50–80mm
prime, ISO 100–400, f/2.0–f/2.8, shallow depth of field, leather
tack-sharp.

Color palette strict: marfil #F3EEE6, beige medio #EDE5D8,
navy #0B1F3A, espresso #3B2B26, vino #5B1E24, verde #1F3527.
No lavender, no purple, no neon, no gold vector veins.

Style references: Hermès Travel campaign, Loewe Spring lookbook,
Bottega Veneta Voyage editorial, The Row, Khaite, Brunello Cucinelli,
Lemaire, Aimé Leon Dore.

Post-processing: Kodak Vision3 250D or Portra 400 emulation, slightly
desaturated highlights, rich shadows, fine grain, no HDR, no plastic
skin, micro-contrast preserved.

Negative prompt: no Pixar 3D, no CGI cartoon, no anime, no
glassmorphism, no lavender/purple/pink/neon, no influencer smile,
no centered retail pose, no logos applied in post, no plastic shine,
no marble vector veins, no rounded gold frames, no sombrero vueltiao,
no Wayuu mochila, no ruana, no Botero, no narco aesthetic, no
tropical kitsch, no AI-warped stitching, no floating text.

Aspect ratio: [4:5 vertical / 16:9 hero / 1:1 square / 3:4 portrait]
Quality: ultra high resolution, photoreal, magazine-print quality.
```

---

## 4. Escenarios oficiales de campaña

### A. Hero web — Travel Bag departure
*Mood: la mañana de un viaje, lobby de hotel europeo con detalles paisas.*
- Producto: Travel Bag espresso / navy / verde
- Locación: lobby con ventana arqueada, banco travertino, pared lime-wash
- Modelo: mujer con abrigo navy o knit cream, caminando o pausada
- Crop: 16:9, modelo a la izquierda parcial, bolso a la derecha
- Light: window light from camera-right, 3200K
- Ver JSON activo en `04_Prompts_Visuales/` cuando esté aprobado

### B. Atelier — Made in Medellín
*Mood: taller artesanal paisa al amanecer, énfasis en savoir-faire.*
- Producto: cualquier pieza en proceso (cinturón siendo cosido, tote a medio terminar)
- Locación: workbench de nogal, herramientas de marroquinería, ventana al patio paisa
- Modelo opcional: manos del artesano (no cara), o presencia indirecta
- Crop: 1:1 flat-lay overhead, o 4:5 vertical lateral
- Light: warm soft window from upper-left

### C. Statement — Nacida de una firma
*Mood: macro de la firma láser-grabada, herencia patrimonial.*
- Producto: pieza de cuero en plano cerrado mostrando láser
- Sin modelo
- Crop: macro 1:1, micro-detail
- Light: rasante para revelar profundidad del láser y grano

### D. Personalización — Tu nombre. En cuero.
*Mood: el cliente recibiendo su pieza con nombre láser-grabado.*
- Producto: pieza con nombre personalizado fresco (sutil humo escapando)
- Manos del cliente sosteniéndola
- Crop: 4:5 o 1:1
- Light: warm cinematic

### E. Línea femenina — Bolso Dama
*Mood: día en la ciudad europea, elegancia heredada.*
- Producto: Bolso Dama tote cognac / espresso
- Modelo: mujer en cashmere navy o cream, sentada o caminando
- Locación: café europeo, banco en parque parisino, escalera de mármol
- Crop: 4:5 o 3:4 vertical
- Light: golden hour cool

### F. Línea unisex / cinturones
*Mood: gentleman heritage moderno.*
- Producto: cinturón cognac con monograma "O" láser en la punta
- Modelo: hombre cropped (sin cara), camiseta gris carbón, denim deep indigo
- Locación: calle empedrada europea, fondo arquitectura medieval/colonial
- Crop: 4:5 vertical
- Light: side natural

---

## 5. Plantilla JSON reutilizable para Gemini

```json
{
  "task": "[hero web / atelier / macro firma / personalización / línea femenina / línea unisex]",
  "brand": "Ofelia Vallejo — Leather House, handcrafted in Medellín, Antioquia, Colombia, presented to the European luxury market. Tagline: 'Elegancia que permanece' / 'Cuero hecho para durar'.",
  "subject_primary": "[describir pieza de cuero exacta + color + detalles + hardware]",
  "subject_secondary": {
    "model": "[perfil del modelo según guía, sin smile, cropped]",
    "wardrobe": "[tonal navy / cream / espresso / vino / verde — fine wool / cashmere / linen]",
    "pose": "[caminando / sentada / transición / cropped]",
    "important": "the model exists to elevate the bag, not to upstage it"
  },
  "brand_mark": {
    "type": "real CO2 laser engraving on leather (not embossed, not printed, not foil)",
    "appearance": "burned ~0.3mm deep, recessed warm dark mark with faint carbonized edge, compressed grain heat-glossed inside",
    "content": "[handwritten cursive signature 'Ofelia Vallejo' / monogram 'O']",
    "size": "[1.2cm / 3cm / 4cm]",
    "position": "[según producto — ver CLAUDE.md sección Logo aplicado]",
    "no": "no metal plate, no foil, no embroidered patch, no shiny applique, no logo applied in post"
  },
  "scene": "[describir locación con DNA paisa sutil + restraint europeo]",
  "composition": "[ratio + posición producto + negative space para copy]",
  "camera": "[ARRI Alexa Mini LF / Hasselblad H6D / Phase One IQ4] + lens + ISO + aperture",
  "lighting": "[directional warm window light from camera-X at 3200K, soft falloff, dimensional shadows]",
  "color_palette_strict": {
    "primary": "[hex del producto]",
    "secondary": "[hex de wardrobe / pared]",
    "neutral": "[hex de fondo]",
    "supporting": "[walnut, brass, ceramic accent]",
    "never_use": "no lavender, no purple, no pink, no neon, no oversaturated colors"
  },
  "materials_textures": "[full-grain Colombian leather, brushed antique brass, hand-troweled lime plaster, travertine, dark walnut, raw cabuya linen, Carmen de Viboral ceramic, etc.]",
  "mood": "[describir el momento narrativo]",
  "style_references": "Hermès Travel campaign, Loewe Spring lookbook, Bottega Veneta Voyage editorial, The Row, Khaite, Brunello Cucinelli, Lemaire, Aimé Leon Dore",
  "post_processing": "Kodak Vision3 250D or Portra 400 emulation, slightly desaturated highlights, rich shadows, fine grain, no HDR",
  "negative_prompt": "no Pixar 3D, no CGI cartoon, no anime, no glassmorphism, no lavender/purple/pink/neon, no influencer smile, no centered retail pose, no logos applied in post, no plastic shine, no marble vector veins, no rounded gold frames, no sombrero vueltiao, no Wayuu mochila, no ruana, no Botero, no narco aesthetic, no kitsch, no AI-warped stitching, no floating text",
  "aspect_ratio": "[4:5 / 16:9 / 1:1 / 3:4]",
  "output_quality": "ultra high resolution, photoreal, magazine-print quality"
}
```

---

## 6. Checklist antes de generar

- [ ] ¿Es fotografía editorial fashion-house, no still-life retail?
- [ ] ¿El modelo está cropped editorialmente, sin smile?
- [ ] ¿Wardrobe estrictamente tonal en paleta de marca?
- [ ] ¿Producto de cuero como héroe?
- [ ] ¿Láser-grabado en spot correcto del producto?
- [ ] ¿DNA paisa sutil (Carmen de Viboral, café, cabuya, lime-wash, helecho)?
- [ ] ¿Locación atmosférica con restraint europeo?
- [ ] ¿Light natural lateral, no flat retail?
- [ ] ¿Negative prompt incluye TODO lo prohibido?
- [ ] ¿Aspect ratio correcto según uso?

---

*Última actualización: 2026-05-22 — Archivo completamente reemplazado: eliminado el avatar Pixar femenino lavanda (versión obsoleta de proyecto wellness anterior). Convertido en biblioteca de prompts de modelo de campaña editorial fashion-house alineada con la marca real Leather House.*
