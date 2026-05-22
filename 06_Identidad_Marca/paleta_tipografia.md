# Ofelia Vallejo — Sistema de Color y Tipografía

> Sistema visual técnico de referencia para web, app, social media, fotografía y materiales impresos.
> Extraído directamente del mockup activo `index.html` — fuente única de verdad.
> Para contexto narrativo ver `brand_discovery.md` y `CLAUDE.md`.

---

## 1. Paleta de Color Principal

### Colores Core (CSS variables del mockup)

| Token | Hex | RGB | Uso |
|---|---|---|---|
| `--marfil` | `#F3EEE6` | 243, 238, 230 | Fondo principal, lime-wash, lino crudo |
| `--beige-medio` | `#EDE5D8` | 237, 229, 216 | Fondo secundario, transición suave |
| `--navy` | `#0B1F3A` | 11, 31, 58 | Texto principal, secciones oscuras, firma original |
| `--espresso` | `#3B2B26` | 59, 43, 38 | Cuero hero, atmósfera de taller |
| `--vino` | `#5B1E24` | 91, 30, 36 | Acento de campaña, cuero teñido vino |
| `--verde` | `#1F3527` | 31, 53, 39 | Cuero verde profundo, naturaleza andina |
| `--carbon` | `#141414` | 20, 20, 20 | Negro absoluto, hardware oscuro |

### Colores derivados (transparencias del mockup)

```css
--text:        var(--navy);                       /* #0B1F3A           */
--text-soft:   rgba(11, 31, 58, 0.45);            /* navy 45% opacity  */
--text-muted:  rgba(11, 31, 58, 0.35);            /* navy 35% opacity  */
--rule:        rgba(11, 31, 58, 0.10);            /* navy 10% opacity  */
--rule-strong: rgba(11, 31, 58, 0.20);            /* navy 20% opacity  */
```

### Acentos metálicos permitidos
- Latón antiguo cepillado (brass patinado, mate, ~`#9B7C4E`)
- Gunmetal cepillado (mate gris oscuro, ~`#3D4248`)
- Plata bruñida (mate, ~`#B8B5B0`)

**Nunca usar:** oro brillante vectorial, oro rosa, cromados espejo, foil dorado.

---

## 2. Gradientes Oficiales (extraídos del mockup)

```css
/* Hero / Hero Background — atmósfera espresso/vino/navy */
background: linear-gradient(160deg,
  var(--espresso) 0%,
  var(--vino) 40%,
  var(--navy) 100%);

/* Card Travel Bag I — espresso */
background: linear-gradient(170deg,
  var(--beige-medio) 0%,
  var(--espresso) 100%);

/* Card Travel Bag II — navy */
background: linear-gradient(170deg,
  var(--beige-medio) 0%,
  var(--navy) 100%);

/* Card Travel Bag III — verde */
background: linear-gradient(170deg,
  var(--beige-medio) 0%,
  var(--verde) 100%);

/* Split media — atelier oscuro */
background: linear-gradient(135deg,
  var(--espresso) 0%,
  #1a0d08 100%);
```

**No crear gradientes fuera de estos.** Si se requiere uno nuevo, aprobarlo y agregarlo aquí.

---

## 3. Tipografía

### Familias oficiales

**Display / Títulos:** `Cinzel`
- Serif romano italiano, peso 400 (regular)
- Carga via Google Fonts: `https://fonts.googleapis.com/css2?family=Cinzel:wght@400&display=swap`
- Uso: H1, H2, H3, captions de marca, watermarks tipográficos

**Body / UI:** `Helvetica Neue`
- Fallback: `Helvetica, Arial, sans-serif`
- Peso 300 (light) por defecto
- Uso: párrafos, navegación, CTAs, captions UI

### Configuración base (del mockup)

```css
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 300;
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--navy);
}

h1, h2, h3 {
  font-family: Cinzel, serif;
  font-weight: 400;
}
```

### Jerarquía Tipográfica

| Nivel | Familia | Size | Letter-spacing | Uso |
|---|---|---|---|---|
| Hero Title | Cinzel | `clamp(32px, 4vw, 52px)` | `-0.01em` | H1 hero |
| Statement Title | Cinzel | `clamp(24px, 3vw, 40px)` | `0.01em` | H2 statement |
| Split Title | Cinzel | `clamp(26px, 3vw, 42px)` | `0.02em` | H2 split |
| Custom Title | Cinzel | `clamp(28px, 4vw, 52px)` | `0.03em` | H2 custom |
| Card Name | Cinzel | `11px` | `0.12em` | Producto |
| Section Label | Cinzel | `11px` | `0.3em` UPPERCASE | Header sección |
| Navbar Link | Helvetica 400 | `11px` | `0.12em` UPPERCASE | Navegación |
| Body | Helvetica 300 | `13–14px` | `0.04em` | Párrafos |
| Caption / Meta | Helvetica 400 | `10–11px` | `0.2–0.3em` UPPERCASE | Etiquetas, índices |
| CTA | Helvetica 400 | `10px` | `0.2em` UPPERCASE | Botones, links accionables |

### Principios Tipográficos
- **Tracking generoso** en uppercase (entre 0.12em y 0.3em)
- **Line-height cómodo** (1.6–1.85) en body
- **Cinzel solo en mayúsculas o iniciales** — preserva su DNA romana
- **Helvetica light 300** para body — nunca regular o medium en párrafos
- **Jerarquía clara** — máximo 3 niveles por pantalla
- **Nunca decorativas** (cursivas swash, Comic, script extra)

---

## 4. Espaciado y Layout

### Padding lateral (responsive)
```css
:root { --pad-x: 48px; }              /* desktop */
@media (max-width: 900px) {
  :root { --pad-x: 20px; }            /* mobile  */
}
```

### Sistema de espaciado

| Token | Valor | Uso |
|---|---|---|
| `xs` | `4px` | Inline gaps mínimos |
| `sm` | `8px` | Gap entre meta-elementos |
| `md` | `16px` | Gap base, padding interno cards |
| `lg` | `32px` | Separación entre componentes |
| `xl` | `64px` | Margen entre secciones |
| `2xl` | `128px` | Hero / breathing room cinematográfico |

### Border radius
**El mockup actual no usa border-radius en cards ni secciones.** Esquinas rectas, editorial.
Excepciones permitidas: cursor custom (`50%` circular), reveal indicators.

---

## 5. Sombras y Efectos

**Filosofía:** sombras mínimas, casi inexistentes. El editorial fashion-house no necesita sombras drop-shadow exageradas; la profundidad viene de la fotografía y la luz natural dentro de las imágenes.

```css
/* Glass navbar (único glassmorphism aprobado, muy sutil) */
background: rgba(243, 238, 230, 0.92);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border-bottom: 1px solid var(--rule);

/* Card hover image scale */
transition: transform 1s var(--ease);
transform: scale(1.04); /* on hover */

/* Reveal on scroll */
opacity: 0 → 1;
transform: translateY(30px) → translateY(0);
transition: opacity 0.9s var(--ease), transform 0.9s var(--ease);
```

**Nunca:** drop-shadows tipo Material Design, glows neón, sombras coloradas, inner glow dorado.

---

## 6. Cursor Custom (del mockup)

```css
#cursor {
  position: fixed;
  width: 6px;
  height: 6px;
  background: var(--navy);
  border-radius: 50%;
  pointer-events: none;
  z-index: 10000;
  transition:
    width 0.25s var(--ease),
    height 0.25s var(--ease),
    background 0.25s var(--ease),
    border 0.25s var(--ease);
}

#cursor.is-hover {
  width: 18px;
  height: 18px;
  background: transparent;
  border: 1px solid var(--navy);
}

/* Sobre secciones oscuras */
#cursor[data-on-dark="true"] {
  background: var(--marfil);
}
#cursor[data-on-dark="true"].is-hover {
  background: transparent;
  border-color: var(--marfil);
}
```

Solo activo en `(hover: hover) and (pointer: fine)`.

---

## 7. Easing y Animaciones

```css
--ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

| Tipo | Duración | Easing |
|---|---|---|
| Hover link / nav | `0.3–0.4s` | `--ease` |
| Image scale hover | `1s` | `--ease` |
| Cursor lerp | continuous | `lerp(a, b, 0.45)` |
| Reveal scroll | `0.9s` | `--ease` |
| CTA gap expand | `0.4s` | `--ease` |

**Nunca:** rebotes (bounce), spring physics agresivos, animaciones llamativas, parallax pronunciado.

---

## 8. Tokens de Diseño (JSON exportable)

```json
{
  "colors": {
    "brand": {
      "marfil":       "#F3EEE6",
      "beige-medio":  "#EDE5D8",
      "navy":         "#0B1F3A",
      "espresso":     "#3B2B26",
      "vino":         "#5B1E24",
      "verde":        "#1F3527",
      "carbon":       "#141414"
    },
    "text": {
      "primary":  "rgba(11, 31, 58, 1)",
      "soft":     "rgba(11, 31, 58, 0.45)",
      "muted":    "rgba(11, 31, 58, 0.35)"
    },
    "rule": {
      "default": "rgba(11, 31, 58, 0.10)",
      "strong":  "rgba(11, 31, 58, 0.20)"
    }
  },
  "typography": {
    "display": {
      "family": "Cinzel, serif",
      "weight": 400
    },
    "body": {
      "family": "'Helvetica Neue', Helvetica, Arial, sans-serif",
      "weight": 300,
      "size": "13px",
      "line-height": 1.6,
      "letter-spacing": "0.04em"
    }
  },
  "spacing": {
    "xs":  "4px",
    "sm":  "8px",
    "md":  "16px",
    "lg":  "32px",
    "xl":  "64px",
    "2xl": "128px"
  },
  "layout": {
    "pad-x-desktop": "48px",
    "pad-x-mobile":  "20px",
    "navbar-height": "56px"
  },
  "motion": {
    "ease":        "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    "hover":       "0.3s",
    "reveal":      "0.9s",
    "image-scale": "1s"
  }
}
```

---

## 9. Aplicación en Fotografía

La paleta de marca debe leerse también dentro de las fotografías:
- **Fondos:** marfil (lime-wash paisa), beige medio (lino, travertino), navy (textiles, paredes oscuras)
- **Cuero:** espresso (hero), vino (campaña), verde (línea naturaleza), negro carbón (esencial)
- **Wardrobe del modelo:** estrictamente tonal en estos colores
- **Props:** latón antiguo, madera nogal, lino crudo, cerámica Carmen de Viboral (blanco + cobalto que NO entra en la paleta core pero sí como acento heritage)

**Color grading post:** Kodak Vision3 250D o Portra 400 emulation, ligeramente desaturado en highlights, sombras ricas, micro-contraste preservado.

---

## 10. Aplicación en Logo y Aplicación Láser

### Firma cursiva (logo principal)
- Color en pantalla: `var(--navy)` `#0B1F3A`
- Color en cuero (láser): café oscuro quemado natural sobre el tono del cuero (no se imprime navy literal, es la marca de la quemadura controlada)

### Sello para estampar
- Vector limpio, alto contraste, sin gradientes
- Optimizado para reproducción 1:1 sobre cuero a 1–6 cm de ancho según producto

Ver `CLAUDE.md` sección "Logo y marca aplicada" para spots por producto.

---

*Última actualización: 2026-05-22 — Reescritura completa: sistema visual real extraído del mockup activo `index.html`. Eliminada por completo la paleta lavanda/morado/oro brillante de la versión anterior obsoleta.*
