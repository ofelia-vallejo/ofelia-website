# Mapa de enlaces — Ofelia Vallejo

Rutas internas siempre **absolutas** desde la raíz (`/…`).

| Intención | Destino |
|-----------|---------|
| Inicio / Mujer / Hombre | `/home.html`, `/home.html#mujer`, `/home.html#hombre` |
| Colección / cuero / productos | `/coleccion.html` (+ anclas `#mujer`, `#hombre`) |
| Historia / manifiesto / firma | `/manifiesto.html` |
| Personalizar / grabado / bespoke / «Tu nombre. En cuero.» | `/personalizar.html` (opcional `?producto=` + `?color=`) |
| Ficha de producto (catálogo) | `/producto/{slug}` |
| Línea Travel Bag (hub) | `/producto/travel-bag.html` |
| Cuenta | `/cuenta.html` |
| Contacto / reparación / privacidad | `/contacto.html` |
| Checkout confirmado | `/gracias.html` |

## Reglas editoriales

1. Si el copy habla de **grabado, láser o personalización** → enlace a `/personalizar.html`.
2. Si se nombra un **producto del catálogo** → enlace a `/producto/{slug}` (no a `.html` archivados).
3. Accesorios sin ficha visual (Billetera, Correa) → `/personalizar.html?producto=…`.
4. Footer unificado: Casa + Atelier (Personalizar, Colección, Cuenta, Contacto) + Redes.

## Mantenimiento

```bash
python3 scripts/fix-site-links.py
```

Partial de referencia: `assets/partials/navbar.html`, `assets/partials/footer.html`.
