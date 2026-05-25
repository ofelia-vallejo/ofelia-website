# Logo — Firma caligráfica OV (tridente central)

Marca de firma de **Ofelia Vallejo Leather House**. No es un logotipo tipográfico: es el trazo caligráfico OV con tridente central.

## Archivo actual

| Propiedad | Valor |
|-----------|--------|
| Ruta web | `assets/img/logo_firma_completa.svg` + `logo_tarjetas_sello.svg` (envuelven el PNG canónico) |
| PNG canónico | `assets/img/logo_firma_completa.png`, `assets/img/logo_tarjetas_sello.png` |
| Legacy raíz | `logo-firma.png` (deprecado — no usar en páginas nuevas) |
| Dimensiones | 200 × 80 px |
| Fondo | Transparente (RGBA) |
| Recorte | Bounding box del trazo (sin canvas con padding extra) |
| Ocupación | ~91% del ancho del archivo |
| Display navbar | `height: 34px` (26px mobile) → ancho proporcional |

## Uso en código

| Contexto | Tamaño | Color / efecto | Selector / notas |
|----------|--------|----------------|------------------|
| **Navbar desktop** | `max-width: 180px`, `height: 34px` | `mix-blend-mode: multiply` | `logo_firma_completa.svg` |
| **Navbar mobile** | `max-width: 48px`, `height: 38px` | `mix-blend-mode: multiply` | `logo_tarjetas_sello.svg` |
| **Intro step0 (fondo oscuro)** | `max-width: 120px`, `height: 52px` | `filter: brightness(10)` | `logo_tarjetas_sello.svg` |
| **Card intro (sello)** | en `.card .seal` 64×64 | `mix-blend-mode: multiply` | `logo_tarjetas_sello.svg` |
| **Footer** | `112` | Marfil sobre navy | `.foot__logo { filter: brightness(10); }` |
| **Statement** (marca de agua) | `132` | Navy al 18% | `.banner-statement__mark { opacity: 0.18; }` |
| **Signature banner** (mobile) | `clamp(220px, 70vw, 320px)` | Navy original | Solo `index.html` / páginas con bloque móvil |

### Reglas

- **Navbar y fondos marfil:** `mix-blend-mode: multiply` elimina blanco del PNG sobre `#F3EEE6`. Si el navbar es navy, quitar `multiply` y usar PNG transparente real.
- **Footer y zonas `data-dark`:** `filter: brightness(10)` convierte el trazo a marfil; no invertir con `filter: invert()` salvo prueba puntual.
- **Marca de agua:** solo `opacity`, nunca `brightness` en statement.
- Mantener `height="auto"` y `alt` descriptivo en logo con significado; `aria-hidden="true"` solo en watermark decorativa.

## Próximo paso: SVG

Vectorizar en Illustrator, Inkscape o Figma (Image Trace → Black & White Logo → Expand → limpieza manual de nodos).

Exportar SVG limpio (sin metadata de editor). Luego:

1. Guardar como `logo-firma.svg` en la raíz.
2. Reemplazar en todo el sitio: `logo-firma.png` → `logo-firma.svg`.
3. Opcional: en SVG usar `fill="currentColor"` para navbar/footer sin `brightness` — el footer podría usar `color: var(--marfil)` en el contenedor.

Archivos a actualizar al migrar:

- `index.html`
- `manifiesto.html`, `coleccion.html`, `personalizar.html`, `contacto.html`
- `assets/css/brand.css` (`.foot__logo`, `.banner-statement__mark`)
- `README.md`, `CLAUDE.md`

## No usar

- Logo con padding blanco alrededor del trazo.
- Escalado por encima de ~150px de ancho en PNG (pixelado).
- `filter` en navbar (salvo footer/statement según tabla). `multiply` solo en navbar marfil.
- Variantes boho, símbolos esotéricos o tipografía Cinzel como sustituto del trazo.
