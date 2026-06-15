# Mapa de enlaces — Ofelia Vallejo

Rutas internas siempre **absolutas** desde la raíz (`/…`). Vercel usa **cleanUrls** — no incluir `.html` en enlaces visibles.

| Intención | Destino |
|-----------|---------|
| Inicio / Mujer / Hombre | `/home`, `/home#mujer`, `/home#hombre` |
| Colección / cuero / productos | `/coleccion` (+ `?cat=mujer`, `?cat=hombre`, anclas `#bandoleras`, `#morrales`, `#accesorios`) |
| Historia / manifiesto / firma | `/manifiesto` |
| Personalizar / grabado / bespoke / «Tu nombre. En cuero.» | `/personalizar` (opcional `?producto=` + `?color=`) |
| Ficha de producto (catálogo) | `/producto/{slug}` |
| Línea Travel Bag (hub) | `/producto/travel-bag` |
| Legacy `maletin` / `maletin.html` | Redirige 301 → `/producto/travel-bag-ii` |
| Cuenta | `/cuenta` |
| Contacto / reparación | `/contacto` |
| Privacidad / cookies | `/privacidad` |
| Términos | `/terminos` |
| Checkout | `/checkout` |
| Checkout confirmado | `/gracias` |

## Reglas editoriales

1. Si el copy habla de **grabado, láser o personalización** → enlace a `/personalizar`.
2. Si se nombra un **producto del catálogo** → enlace a `/producto/{slug}` (no a `.html` archivados).
3. Accesorios sin ficha visual (Billetera, Correa) → `/personalizar?producto=…`.
4. Footer unificado: Casa + Atelier (Personalizar, Colección, Cuenta, Contacto) + Redes + Legal (Privacidad, Términos).

## Mantenimiento

```bash
python3 scripts/fix-site-links.py
```

Partial de referencia: `assets/partials/navbar.html`, `assets/partials/footer.html`.

Brief de assets para diseñadora: `data/designer-assets-brief.json`.
