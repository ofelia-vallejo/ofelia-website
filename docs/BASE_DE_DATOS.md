# Base de datos · productos, precios e inventario

## Dónde vive todo hoy

| Capa | Archivo / servicio | Para qué sirve |
|------|-------------------|----------------|
| **PostgreSQL** (recomendado en producción) | `DATABASE_URL` en Vercel | Fuente de verdad: precios, stock, textos, fotos |
| **Panel web** | [ofeliavallejo.com/admin/](https://ofeliavallejo.com/admin/) | Editar sin código (productos, inventario, secciones) |
| **Hoja de inventario** | `data/inventory-sheet.json` | Tus cantidades y precios CHF (como la tabla de WhatsApp) |
| **Catálogo web** | `data/catalog.json` | Lo que lee la web; se genera desde la hoja o desde Postgres |
| **Diseño / fotos** | `imagenes nuevas/…` + URLs en `product_images` | No van en la DB como archivo; solo la ruta URL |

**Orden de lectura en el sitio en vivo:**  
`PostgreSQL` → (si falla) `Vercel Blob` → `data/catalog.json`

---

## Tablas PostgreSQL (editar directo)

Esquema: [`database/schema.sql`](../database/schema.sql)

| Tabla | Qué editas |
|-------|------------|
| `products` | Nombre, descripción, `base_price_chf`, `engrave_price_chf`, stock total, activo |
| `product_variants` | Color/talla, `inventory`, **`price_chf`** (precio por variante), SKU |
| `product_images` | URL de imagen, alt, orden, variante |
| `categories` | Mujer, Hombre, Morrales, Bandoleras, Accesorios |

### Herramientas para editar la base

1. **[Neon](https://neon.tech)** / **Vercel Postgres** / **Supabase** → pestaña SQL o Table Editor  
2. **TablePlus**, **DBeaver**, **pgAdmin** → conectar con `DATABASE_URL`  
3. **Admin del sitio** → `/admin/` con `ADMIN_PASSWORD`

---

## Flujo recomendado (tu tabla de precios)

1. Actualiza **`data/inventory-sheet.json`** (mismas filas que tu Excel: MORRAL MOD, MALETA VIAJERA, etc.).
2. En la terminal del proyecto:

```bash
npm run inventory:apply   # → actualiza data/catalog.json
npm run db:push           # → sube todo a PostgreSQL (necesita DATABASE_URL)
```

3. La web y Stripe usan los nuevos precios y cantidades al instante (tras el deploy si solo cambiaste JSON en Git).

### Equivalencia hoja → web

| Tu hoja | Producto web (`productId`) |
|---------|---------------------------|
| MORRAL MOD | `travel-bag-iii` · variante `v-standard` |
| MORRAL GR MOD | `travel-bag-iii` · `v-grande` |
| MORRAL CLAS | `morral-clasico` · `v-standard` |
| MORRAL GR CLAS | `morral-clasico` · `v-grande` |
| MORRAL ELITE | `morral-elite` · `v-standard` |
| MORRAL GR ELITE | `morral-elite` · `v-grande` |
| MALETA VIAJERA | `travel-bag-i` |
| MALETA ELITE | `travel-bag-ii` |
| NECESER ELITE | `neceser` |
| RIÑONERA MOD / CLASICA / ELITE | `rinonera` · `v-mod` / `v-clasica` / `v-elite` |
| BANDOLERA ELITE | `bandolera-elite` |
| BANDOLERA ELITE (mod) | `bandolera-moderna` (línea moderna) |
| BOLSO DAMA | `bolso-dama` |

Si un nombre no coincide, cambia `productId` / `variantId` en la hoja JSON.

---

## Primera vez: conectar Postgres

1. Crear proyecto Postgres (Neon o Vercel Storage).
2. Copiar `DATABASE_URL` en Vercel → Environment Variables.
3. Local: `.env.local` con la misma URL.
4. Migrar y cargar catálogo:

```bash
npm install
npm run db:migrate
```

5. En producción, cada `npm run db:push` sincroniza `catalog.json` → tablas.

**Columna nueva:** `product_variants.price_chf` — precio distinto por talla (ej. Morral Grande 500 CHF vs 400 CHF).

Si la base ya existía, ejecuta una vez en SQL:

```sql
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS price_chf INT;
```

---

## Qué NO está solo en la base de datos

| Elemento | Dónde |
|----------|--------|
| Layout home, globo, CSS | `home.html`, `index.html`, `assets/css/` |
| Logos (patrimonio) | `06_Identidad_Marca/logos/` — no editar con IA |
| Fotos originales | Carpeta `imagenes nuevas/` en el repo |
| Copy legal / marca | `CLAUDE.md`, `05_Copy_y_Voz/` |

El **diseño** y las **imágenes** se versionan en Git; **precio, stock y textos de producto** van en Postgres (o en `inventory-sheet.json` + apply).

---

## Resumen

- **Sí** puedes editar precios y cantidades **directo en PostgreSQL** o en **`/admin/`**.
- **`data/inventory-sheet.json`** es tu copia local de la tabla CHF; `npm run inventory:apply` la vuelca al catálogo.
- **`npm run db:push`** conecta catálogo ↔ base de datos en la nube.

Si aún no tienes `DATABASE_URL` en Vercel, el sitio usa solo `data/catalog.json` hasta que lo configures.
