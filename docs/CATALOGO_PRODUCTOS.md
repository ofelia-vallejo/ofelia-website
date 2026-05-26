# Catálogo · Códigos OV e inventario

Fuente de verdad para **código de producto**, **SKU por variante**, **color real** (cuentagotas / `CATALOGO.md`) y **fotos asignadas**:

| Archivo | Rol |
|---------|-----|
| `data/product-registry.json` | Bolsos, morrales, bandoleras |
| `data/cinturon-assets.json` | Cinturón (colorKey = color + textura) |
| `data/color-families.json` | Tokens `leather[]` y hex de marca |
| `data/catalog.json` | Catálogo web + Postgres (generado) |

## Sincronizar

```bash
python3 scripts/sync-product-registry.py
python3 scripts/audit-product-colors.py   # comprueba que existan los JPG
```

El cinturón se actualiza al final vía `sync-cinturon-catalog.py`.

## Códigos de producto (inventario / admin)

| id | Código OV | Colección | SKU ejemplo |
|----|-----------|-----------|-------------|
| travel-bag-i | OV-TB-I | GUANABANA | TB-I-COG, TB-I-ESP |
| travel-bag-ii | OV-TB-II | BOROJO | TB-II-NEG |
| travel-bag-iii | OV-TB-III | GUANABANA | TB-III-COG |
| bolso-dama | OV-BD | GUANABANA | BD-COG |
| morral-elite | OV-ME | CHONTADURO | ME-NEG |
| morral-clasico | OV-MC | CHONTADURO | MC-COG |
| bandolera-moderna | OV-BM | UCHUVA | BM-CAR |
| bandolera-elite | OV-BE | UCHUVA | BE-CAR |
| cinturon | OV-CIN | CURUBA | CIN-NL … CIN-CL |

Los códigos viven en `products.meta.productCode` (JSONB en Postgres).

## colorKey (cuero)

- **Bolsos / morrales:** `negro`, `cognac`, `espresso`, `carbon` — alineados con `color-families.json`.
- **Cinturón:** `negro-liso`, `navy-granulado`, etc. — ver `docs/CATALOGO_CINTURONES.md`.

**Regla:** el nombre del archivo JPG **no** define el color. Solo `colorKey` + mapa del registry.

## Variantes sin foto (placeholder en web)

| Producto | colorKey | Motivo |
|----------|----------|--------|
| travel-bag-i | espresso | Sin estudio TB espresso aún |
| bandolera-moderna / elite | carbon | Sin assets |

Fotos en `imagePool` del registry están clasificadas por color pero **sin** producto hasta nueva variante.

## Inventario

Tras sincronizar, subir a Postgres con el flujo habitual del admin (`/api/admin/products`) o `saveCatalogToPostgres`. En **Admin → Inventario** verás código OV + SKU + stock por variante.
