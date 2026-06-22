# Hero Video — "Nacida de una firma"

> Video cinemático para el hero del sitio donde aparece el statement **"Nacida de una firma."**
> Protagonista, atelier, luz y paleta deben mantenerse **idénticos** entre todas las tomas — el espectador debe sentir que es **un solo momento continuo** en el taller, no un compilado.
> Formato pensado para **loop silencioso de 10–12 s** en autoplay muted (web hero).

---

## ⛔ Reglas absolutas (no negociables)

1. **Character lock — un solo maestro.** El artesano es **el mismo** en todas las tomas (cara, pelo, manos, ropa). No puede aparecer otro hombre, ni cambiar de edad, ni cambiar de pelo, ni cambiar de delantal.
2. **Scene lock — un solo atelier.** Mismo banco de trabajo de nogal, misma puerta arqueada al fondo, mismas montañas verdes al otro lado. La cámara se mueve dentro del mismo cuarto, no salta a locaciones distintas.
3. **Logo lock — sello inmutable.** Si aparece el sello/monograma OV sobre cuero:
   > *"use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were silk-screened/lasered onto the leather."*

   Archivo a adjuntar siempre: `06_Identidad_Marca/logos/logo_sello.png`.
4. **Paleta cerrada:** marfil `#F3EEE6`, beige `#EDE5D8`, navy `#0B1F3A`, espresso `#3B2B26`, vino `#5B1E24`, verde `#1F3527`, carbón `#141414`. Ni morado, ni lavanda, ni neón, ni dorado vector.

---

## Imágenes de referencia (adjuntar TODAS al generar)

Adjunta las 4 fotos del maestro que ya tienes — son el **anchor de consistencia** del personaje, el atelier y la luz. Más el sello.

| # | Archivo (sube tal cual al generador) | Función en el prompt |
|---|---|---|
| 1 | foto maestro **sosteniendo travel-bag cognac** terminada sobre banco (la del frente con vista a montañas) | Anchor de **producto terminado + montañas + atelier** |
| 2 | foto **manos cosiendo con lezna** (macro hands) | Anchor de **manos + costura + texturas** |
| 3 | foto **maestro cortando patrón** (vista 3/4 cuerpo completo) | Anchor de **cara del maestro + delantal + postura** |
| 4 | foto **manos sobre cuero crudo cognac** (palmando la piel) | Anchor de **textura del cuero + iluminación cálida** |
| 5 | `06_Identidad_Marca/logos/logo_sello.png` | Sello OV — graphic transfer only |

> Sugerencia: en el panel de "image references" del generador, etiqueta la #3 como **"character reference"** (rostro) y la #1 como **"environment reference"** (atelier). Así casi todos los modelos respetan la consistencia.

---

## Prompt JSON — video hero loop 10–12 s

```json
{
  "task": "hero_video_nacida_de_una_firma",
  "format": "cinematic editorial loop, silent (muted autoplay on web), seamless start↔end, 9:16 or 16:9 (generate both passes)",
  "duration_seconds": 12,
  "loopable": true,
  "narrative_intent": "the story of a single signature — the same paisa master, his hands, his bench, and the piece born from them; not a montage, a single quiet moment we are allowed to witness",

  "character_lock": {
    "rule": "ONE single artisan across the entire clip — identical face, identical hair, identical clothing in every frame. Do NOT introduce a second person. Do NOT age him up or down. Do NOT change his apron or shirt.",
    "anchor_image": "use the attached image #3 (master cutting pattern, 3/4 body) as the canonical face/character reference",
    "description": "Latin Antioqueño master craftsman, late 50s to mid 60s, weathered olive skin with deep dignified wrinkles, silver-grey hair brushed back, neatly trimmed silver moustache, calloused hands with prominent veins and clean short nails, no rings, no watch, no visible logos on clothing",
    "wardrobe_fixed": "deep navy work shirt (button-down, rolled to forearm, sleeves slightly wrinkled with wear), oatmeal/raw-linen apron with brass D-ring at the chest strap, no other colors on his body"
  },

  "scene_lock": {
    "rule": "ONE single atelier across the entire clip — identical bench, identical doorway, identical mountain view. The camera moves inside this single room; it never cuts to a different location.",
    "anchor_image": "use the attached image #1 (master holding the cognac travel bag with mountain view) as the canonical environment reference",
    "description": "Medellín / Eje Cafetero atelier interior — aged dark walnut workbench with deep patina and tool marks, hand-troweled cream lime-wash walls, a single arched wooden doorway open to the right revealing a soft-focus view of Andean green mountains and a clay-tile roof, golden warm interior light, weathered terracotta floor (out of frame), brass head awl, curved leather needle, wooden burnisher, brass measuring weights and rings, a small oil lamp with a steady warm flame, a coil of cabuya twine, rolled scraps of full-grain cognac leather, a Carmen de Viboral white-and-cobalt ceramic mug holding pencils (very far back, soft bokeh, NEVER in focus)",
    "props_NOT_allowed": "no sombrero vueltiao, no Wayuu mochila, no ruana, no Colombian flag, no religious imagery, no modern electronics, no plastic, no neon, no glossy surfaces"
  },

  "product_in_scene": {
    "hero_object": "ONE Travel Bag in cognac full-grain Colombian leather — rolled handles, brushed antique brass hardware (D-rings, buckles, rivets), tonal saddle stitching in waxed thread, soft pull-up patina on edges. Same bag in every frame, same color, same hardware.",
    "anchor_image": "use the attached image #1 as the canonical product reference for silhouette and color"
  },

  "brand_mark": {
    "rule": "use the uploaded OV seal image AS AN EXACT GRAPHIC TRANSFER ONLY — do NOT redraw, do NOT restyle, do NOT generate a new monogram, do NOT 'improve' the strokes; reproduce the file 1:1 as if it were laser-engraved onto the leather",
    "where_visible": "very briefly during shot 4 (engraving close-up); the rest of the time it can sit just out of focus on the bag's lower-right panel",
    "technique": "real CO2 laser engraving look, ~0.3mm deep, recessed warm-dark mark with faint carbonized edge, leather grain slightly compressed inside the mark",
    "scale": "~3 cm wide on the bag"
  },

  "shot_list": [
    {
      "shot": 1,
      "start_seconds": 0.0,
      "end_seconds": 3.0,
      "framing": "macro close-up of weathered hands smoothing a sheet of cognac full-grain leather on the walnut bench",
      "camera": "static or extremely slow push-in (less than 2cm of travel), 100mm macro feel, f/2.8",
      "motion": "hand glides slowly across the leather, palm contact, almost a caress; no fast movement",
      "based_on_reference": "image #4"
    },
    {
      "shot": 2,
      "start_seconds": 3.0,
      "end_seconds": 6.0,
      "framing": "very tight on the master's hands stitching the side of the cognac bag with a curved needle and waxed thread; awl just put down nearby",
      "camera": "static, 80mm, f/2.0, shallow DOF, focus on the needle entering the leather",
      "motion": "one slow, deliberate stitch pull — the thread tightens, the needle exits clean",
      "based_on_reference": "image #2"
    },
    {
      "shot": 3,
      "start_seconds": 6.0,
      "end_seconds": 9.0,
      "framing": "wide quiet portrait — the master at the bench, profile 3/4, cutting a leather pattern with a curved blade; arched doorway with green mountains in soft background",
      "camera": "static, 50mm, f/2.0, full atelier visible, master is the centerpiece",
      "motion": "almost still — only the curl of leather peeling under the blade and the breath of the oil-lamp flame",
      "based_on_reference": "image #3"
    },
    {
      "shot": 4,
      "start_seconds": 9.0,
      "end_seconds": 12.0,
      "framing": "the finished cognac Travel Bag held by the master on the bench, mountain view in deep bokeh behind; we briefly see the OV seal engraved on the lower-right panel as his hand moves away",
      "camera": "very slow 1.5x push-in toward the bag, 65mm, f/2.0, leather tack-sharp, mountains soft",
      "motion": "his hand lifts and exits frame to the left, revealing the seal for the last 1 s before the loop restarts",
      "based_on_reference": "image #1",
      "loop_handoff": "last frame composition matches first frame's tonal palette and warm key light so the cut back to shot 1 reads as seamless"
    }
  ],

  "light": {
    "rule": "ONE single light source across the entire clip — warm directional window light from the right (the open arched doorway). Never switch to overhead, never add a second source, never go cool.",
    "color_temp": "3000–3200K, golden hour interior",
    "quality": "soft falloff into rich shadow on the left side of the bench, micro-glow on the leather grain, the oil-lamp flame adds a tiny secondary warm point but never competes"
  },

  "camera_and_lens_consistency": {
    "format": "ARRI Alexa Mini LF or Sony Venice cinematic look, anamorphic feel optional but subtle (no obvious flares)",
    "lenses": "50mm, 65mm, 80mm, 100mm macro — all matched warm vintage glass, consistent contrast curve across shots",
    "aperture": "f/2.0 to f/2.8 across the clip — shallow but not dreamy",
    "ISO_look": "200–400, fine clean grain",
    "no_zoom": "no zoom-in/zoom-out motion; only static or sub-2cm push-ins"
  },

  "color_palette_strict": [
    "#F3EEE6 marfil — walls",
    "#EDE5D8 beige — apron",
    "#0B1F3A navy — shirt",
    "#3B2B26 espresso — bench, dark wood",
    "#1F3527 verde — mountains through doorway",
    "cognac leather (consistent rust-brown #8B4A2B-ish)",
    "brass antique (warm matte #9B7C4E)"
  ],

  "post_processing": {
    "grade": "Kodak Vision3 250D emulation, slightly desaturated highlights, rich deep shadows, micro-contrast preserved on grain and skin pores, no HDR, no plastic shine",
    "grain": "fine 35mm cinema grain, consistent across all shots",
    "vignette": "subtle natural lens vignette, no heavy dark corners"
  },

  "style_references": [
    "Loewe Craft Prize short films",
    "Hermès petit-h savoir-faire vignettes",
    "Brunello Cucinelli atelier documentary stills (Solomeo)",
    "Bottega Veneta artisan films",
    "Khaite quiet luxury motion",
    "Saddleback Leather process films — but elevated to editorial milanese restraint"
  ],

  "audio": {
    "intent": "intended for muted autoplay on web; if generator produces sound, request: faint ambient — wood creak, distant bird, faint mountain wind, the soft pull of waxed thread; absolutely NO music, NO voiceover, NO narration"
  },

  "negative_prompt": "no Pixar 3D, no CGI cartoon, no anime, no glassmorphism, no lavender/purple/pink/neon, no influencer smile, no second person appearing, no character swap between shots, no clothing change between shots, no atelier location swap between shots, no zoom-in/out, no whip pans, no fast cuts, no music sting, no voiceover, no on-screen text, no logos applied in post, no plastic shine, no marble vector veins, no rounded gold frames, no sombrero vueltiao, no Wayuu mochila, no ruana, no Botero, no narco aesthetic, no kitsch tropical, no AI-warped stitching, no floating text, no redrawn monogram, no stylized OV cursive, no foil gold, no embossed brand patch, no metal plate logo, no second light source, no cool blue grade, no HDR, no plastic skin"
}
```

---

## Cómo correrlo (sugerencia operativa)

1. **Genera 4 clips separados** uno por shot (es más fácil que cualquier modelo respete consistencia en 3 s que en 12 s seguidos).
2. **Para cada clip:** adjunta las 4 fotos del maestro como image references + el `logo_sello.png` + el bloque JSON del shot correspondiente.
3. **Cuando los 4 estén aprobados:** únelos en orden (1 → 2 → 3 → 4) con cortes secos editoriales (sin transiciones de fundido), exporta como `assets/video/hero-nacida-firma.mp4` (H.264, ~4 Mbps, sin audio) y un poster en `assets/img/hero-nacida-firma-poster.jpg` para el `<video poster="…">`.
4. **HTML en `home.html` para el hero:** lo dejo como pendiente y lo enchufo cuando tengas el archivo listo.

---

## Checklist de revisión antes de aprobar cada clip

- [ ] ¿Es el **mismo hombre** que en las 4 fotos de referencia? (pelo plateado, bigote, delantal beige)
- [ ] ¿Es el **mismo atelier**? (banco nogal + puerta arqueada + montañas verdes)
- [ ] ¿La luz viene del **mismo lado** (derecha, cálida)?
- [ ] ¿Aparece la misma Travel Bag cognac y mismo herraje brass?
- [ ] Si se ve el sello: ¿es el `logo_sello.png` tal cual, sin redibujos?
- [ ] ¿La cámara se mantiene **lenta y editorial** (sin zooms, sin whip pans)?
- [ ] ¿La paleta respeta los hex (sin azules eléctricos, sin morados, sin dorados vector)?
- [ ] ¿El último frame conecta tonalmente con el primero (para loop limpio)?

Si **cualquier** respuesta es NO → regenerar ese shot.

---

*Última actualización: 2026-06-15 — Hero video "Nacida de una firma", maestro paisa + atelier Eje Cafetero, loop 12 s.*
