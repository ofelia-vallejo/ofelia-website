# Ofelia Vallejo — Sistema de Color y Tipografía

> Sistema visual de referencia para diseño web, app, social media y materiales de marca.

---

## Paleta de Color Principal

### Colores Core

| Nombre | Hex | RGB | Uso |
|--------|-----|-----|-----|
| Lavanda Suave | `#C8B8E8` | 200, 184, 232 | Fondos claros, elementos delicados |
| Lavanda Media | `#A990D4` | 169, 144, 212 | Fondos secundarios, cards |
| Morado Profundo | `#4A2570` | 74, 37, 112 | Textos premium, acentos fuertes |
| Morado Oscuro | `#2D1547` | 45, 21, 71 | Fondos oscuros, hero sections |
| Oro Suave | `#D4AF6A` | 212, 175, 106 | Detalles, highlights, CTAs |
| Oro Brillante | `#F0C860` | 240, 200, 96 | Destellos, partículas, acentos |
| Blanco Cálido | `#FAF7F2` | 250, 247, 242 | Fondos limpios, espacio negativo |
| Negro Suave | `#1A1025` | 26, 16, 37 | Texto principal en fondos claros |

### Gradientes Oficiales

```css
/* Hero / Hero Background */
background: linear-gradient(135deg, #2D1547 0%, #4A2570 40%, #7B4FA6 100%);

/* Lavender Glow */
background: linear-gradient(180deg, #C8B8E8 0%, #A990D4 50%, #4A2570 100%);

/* Gold Accent */
background: linear-gradient(90deg, #D4AF6A 0%, #F0C860 50%, #D4AF6A 100%);

/* Premium Dark */
background: linear-gradient(160deg, #1A1025 0%, #2D1547 50%, #4A2570 100%);

/* Soft Velvet */
background: linear-gradient(135deg, #E8D5F5 0%, #C8B8E8 40%, #A990D4 100%);
```

### Glassmorphism

```css
/* Card Premium */
background: rgba(200, 184, 232, 0.15);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(212, 175, 106, 0.3);
box-shadow: 0 8px 32px rgba(74, 37, 112, 0.3);

/* Dark Glass */
background: rgba(45, 21, 71, 0.6);
backdrop-filter: blur(16px);
border: 1px solid rgba(240, 200, 96, 0.2);
```

---

## Tipografía

> **Nota:** Las fuentes específicas se confirman con el mockup. Estas son las direcciones correctas.

### Jerarquía Tipográfica

| Nivel | Uso | Estilo |
|-------|-----|--------|
| Display | Títulos hero, portadas | Serif elegante o sans-serif premium |
| H1 | Títulos principales | Semi-bold, espaciado amplio |
| H2 | Secciones | Medium weight |
| H3 | Subsecciones | Regular o medium |
| Body | Texto corrido | Light o regular, legible |
| Caption | Etiquetas, metadatos | Light, tracking amplio |
| CTA | Botones, llamadas a acción | Medium o semi-bold |

### Familias Tipográficas Recomendadas

**Opción A — Editorial Luxury:**
- Display/Títulos: `Cormorant Garamond` o `Playfair Display` (serif emocional)
- Cuerpo/UI: `DM Sans` o `Inter` (sans-serif limpio)

**Opción B — Modern Premium:**
- Display/Títulos: `Canela` o `Editorial New` (si disponible)
- Cuerpo/UI: `Neue Haas Grotesk` o `Sohne`

**Opción C — Accesible (Google Fonts):**
- Display: `Cormorant Garamond` (Google Fonts, gratis)
- Cuerpo: `DM Sans` (Google Fonts, gratis)

### Principios Tipográficos
- **Tracking amplio** en títulos (letter-spacing generoso)
- **Line-height cómodo** en cuerpo (1.6–1.8)
- **Contraste de pesos** entre título y cuerpo
- **Nunca fuentes decorativas excesivas** — elegancia sobre decoración
- **Jerarquía clara** — máximo 3 niveles por pantalla

---

## Sombras y Efectos

```css
/* Sombra Premium Card */
box-shadow: 0 20px 60px rgba(74, 37, 112, 0.25),
            0 4px 16px rgba(74, 37, 112, 0.15);

/* Glow Dorado */
box-shadow: 0 0 30px rgba(212, 175, 106, 0.4),
            0 0 60px rgba(212, 175, 106, 0.2);

/* Sombra Suave */
box-shadow: 0 8px 24px rgba(45, 21, 71, 0.2);

/* Inner Glow */
box-shadow: inset 0 1px 0 rgba(240, 200, 96, 0.3);
```

---

## Partículas y Elementos Flotantes

```css
/* Partícula base */
width: 4px;
height: 4px;
border-radius: 50%;
background: radial-gradient(circle, #F0C860 0%, rgba(240, 200, 96, 0) 70%);
animation: float 6s ease-in-out infinite;
opacity: 0.6;

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
}
```

---

## Tokens de Diseño

```json
{
  "colors": {
    "brand": {
      "lavender-light": "#C8B8E8",
      "lavender-mid": "#A990D4",
      "purple-deep": "#4A2570",
      "purple-dark": "#2D1547",
      "gold-soft": "#D4AF6A",
      "gold-bright": "#F0C860",
      "white-warm": "#FAF7F2",
      "black-soft": "#1A1025"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "32px",
    "xl": "64px",
    "2xl": "128px"
  },
  "radius": {
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "40px",
    "full": "9999px"
  },
  "blur": {
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "40px"
  }
}
```

---

*Última actualización: 2026-05-21*
