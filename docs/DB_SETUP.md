# Configuración de Base de Datos — Ofelia Vallejo

Guía para levantar PostgreSQL en **local** (desarrollo) y dejar lista la **producción**
(Neon / Vercel Postgres / Supabase). El modelo de datos se aplica en dos capas:

1. `database/schema.sql` — esquema base (baseline 001).
2. `database/migrations/002_full_commerce_model.sql` — modelo de comercio completo (aditivo, **idempotente**).

> Documentación del modelo: [`MODELO_ER.md`](MODELO_ER.md). Checklist de despliegue: [`VERCEL_CHECKLIST.md`](VERCEL_CHECKLIST.md).

---

## 1 · Desarrollo local (macOS + Homebrew)

### 1.1 Instalar y arrancar PostgreSQL 16

```bash
brew install postgresql@16
brew services start postgresql@16          # arranca y reinicia al hacer login
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"   # psql en el PATH
psql --version                              # PostgreSQL 16.x
```

### 1.2 Crear la base de datos

```bash
createdb ofelia                             # usuario = tu usuario macOS, sin contraseña
psql -l | grep ofelia                       # verificar
```

La cadena de conexión local queda:
`postgres://<usuario_macos>@localhost:5432/ofelia` (en este equipo: `evelynpatino`).
`lib/postgres.js` desactiva SSL automáticamente cuando la URL contiene `localhost`.

### 1.3 Aplicar esquema + migración (EN ORDEN)

```bash
export DATABASE_URL="postgres://<usuario_macos>@localhost:5432/ofelia"

# a) Esquema base
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql

# b) Modelo completo (idempotente, re-ejecutable)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_full_commerce_model.sql
```

> ⚠️ **No** uses el splitter de `scripts/db-migrate.js` para la 002: ese script sólo
> procesa `schema.sql`. La 002 se aplica **directamente con `psql -f`**.

Verificar tablas (deben aparecer 27, incl. `order_line_items`, `inventory_levels`,
`locations`, `payments`, `discounts`, `carts`, `customer_addresses`, …):

```bash
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "SELECT id,name FROM locations;"      # → loc-medellin (seed)
psql "$DATABASE_URL" -c "SELECT code,value FROM discounts;"   # → OV-TEMPORADA 10%
```

### 1.4 Seedear el catálogo en la DB

`scripts/db-migrate.js` reaplica `schema.sql` (idempotente) y siembra el catálogo
desde `data/catalog.json` mediante `saveCatalogToPostgres()`:

```bash
DATABASE_URL="postgres://<usuario_macos>@localhost:5432/ofelia" node scripts/db-migrate.js
```

> El proceso `node` puede no auto-terminar (el pool de `postgres` queda abierto);
> el seed **sí** se confirma. Corta con `Ctrl-C` o `node --eval` con `process.exit`.
> Verifica el resultado con: `psql "$DATABASE_URL" -tAc "SELECT count(*) FROM products;"`.

**Orden importante (inventario normalizado):** `saveCatalogToPostgres()` hace
`DELETE`+`INSERT` de variantes; con `ON DELETE CASCADE` eso vaciaría
`inventory_levels`. Por eso se **siembra el catálogo primero** y luego se pueblan los
niveles de inventario:

```bash
psql "$DATABASE_URL" <<'SQL'
INSERT INTO inventory_levels (variant_id, location_id, available, reserved, on_hand)
SELECT v.id, 'loc-medellin', COALESCE(v.inventory,0), 0, COALESCE(v.inventory,0)
FROM product_variants v
ON CONFLICT (variant_id, location_id) DO UPDATE
  SET available = EXCLUDED.available, on_hand = EXCLUDED.on_hand, updated_at = NOW();
SQL
```

### 1.5 Variables locales (`.env`)

Copia de `.env.example` y completa para desarrollo (NUNCA commitear — está en `.gitignore`):

```
ADMIN_PASSWORD=ofelia-dev-local
ADMIN_SECRET=<secret aleatorio: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
DATABASE_URL=postgres://<usuario_macos>@localhost:5432/ofelia
STORE_MODE=postgres          # lee catálogo y pedidos DESDE Postgres (no "file")
STRIPE_SECRET_KEY=           # VACÍO en local → checkout degrada con 503 controlado
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
SITE_URL=http://localhost:3000
```

> **STORE_MODE:** con `DATABASE_URL` presente, `lib/store.loadCatalog()` lee de
> Postgres aunque `STORE_MODE` no sea `file`. El script `npm run dev` fuerza
> `STORE_MODE=file`; para probar la DB real usa `npm run dev:local` (ver abajo) o
> `vercel dev` con `STORE_MODE=postgres`.

### 1.6 Levantar el sitio en local

- **Opción A — Vercel CLI:** `npm run dev` (usa `vercel dev`; requiere `vercel login`).
- **Opción B — servidor local sin Vercel:** `npm run dev:local`
  (`scripts/dev-server.js`, monta `api/*.js` + estáticos en `http://localhost:3000`,
  carga `.env`, no requiere login). Útil para validar DB/carrito.

Verificación rápida:

```bash
node scripts/check-env.js                                  # REQUIRED/OPTIONAL
curl -s http://localhost:3000/api/products | head -c 300   # productos desde la DB
curl -s http://localhost:3000/api/stripe/config            # {"enabled":false} sin claves
```

---

## 2 · Producción (Vercel + Postgres gestionado)

> Sólo documentación. **No** ejecutar deploy desde aquí.

### 2.1 Crear la base de datos

- **Neon** (recomendado, serverless) o **Vercel Postgres** o **Supabase**.
- Copia la **connection string** con SSL. En Vercel/Neon suele requerir `?sslmode=require`;
  `lib/postgres.js` aplica `ssl: 'require'` automáticamente para hosts que **no** son `localhost`.

### 2.2 Variables de entorno en Vercel

`Project → Settings → Environment Variables` (Production y Preview):

| Variable | Requerida | Valor |
|---|---|---|
| `DATABASE_URL` | ✅ | connection string de la DB de producción (SSL) |
| `ADMIN_PASSWORD` | ✅ | contraseña fuerte del panel `/admin/` |
| `ADMIN_SECRET` | ✅ | string aleatorio largo (firma de sesión) |
| `SITE_URL` | ✅ | `https://ofeliavallejo.com` |
| `STRIPE_SECRET_KEY` | ✅ (al activar pagos) | `sk_live_...` / `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | ✅ (al activar pagos) | `pk_live_...` / `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ (al activar pagos) | `whsec_...` |
| `BLOB_READ_WRITE_TOKEN` | opcional | subida de imágenes (Vercel Blob) |
| `CUSTOMER_SECRET` | opcional | firma sesiones de cliente (default = `ADMIN_SECRET`) |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_TO` | opcional | correo de contacto/personalización |
| `WHATSAPP_NUMBER`, `LAUNCH_*` | opcional | features de marca |

> **Sin Stripe:** el sitio arranca igual. `lib/config.validate()` sólo registra los
> faltantes (no lanza), y el checkout responde `503` controlado
> («El pago en línea no está disponible por ahora…»). Añade las 3 claves Stripe
> cuando se active el pago real.

### 2.3 Aplicar esquema + migración a la DB de producción (EN ORDEN)

Desde tu máquina, apuntando `DATABASE_URL` a la DB de prod:

```bash
export DATABASE_URL="postgres://...@host/db?sslmode=require"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_full_commerce_model.sql
```

Ambos son idempotentes (incluyen `customer_id` en `orders` + `idx_orders_customer`,
y los seeds `loc-medellin` / `OV-TEMPORADA`). Luego seedea el catálogo:

```bash
DATABASE_URL="$DATABASE_URL" node scripts/db-migrate.js     # productos desde data/catalog.json
# (opcional) poblar inventory_levels con el INSERT…SELECT de la sección 1.4
```

### 2.4 Verificación post-deploy

```bash
node scripts/check-env.js                       # todas las REQUIRED en ✓
curl -s https://tu-dominio.com/api/products      # JSON con productos desde la DB
curl -s https://tu-dominio.com/api/stripe/config # enabled:true cuando Stripe esté configurado
psql "$DATABASE_URL" -c "\dt"                     # 27 tablas
```

Ver también el checklist completo de despliegue en [`VERCEL_CHECKLIST.md`](VERCEL_CHECKLIST.md).

---

## 3 · Notas del modelo (migración 002)

- **Coexistencia de inventario:** hoy el stock real vive en `product_variants.inventory`
  y el webhook lo descuenta ahí (`lib/postgres.decrementInventory`). `inventory_levels`
  es la capa normalizada destino; el corte completo está documentado como «Próximos
  pasos» en [`MODELO_ER.md`](MODELO_ER.md) §7.
- **IDs de variante:** `data/catalog.json` reutiliza color-keys (`v-cognac`, `v-negro`…)
  entre productos, pero `product_variants.id` es PK global. `lib/postgres.js`
  **namespacea** el PK por producto (`<product_id>::<variant_id>`) al guardar y
  reconstruye el id original al leer, de modo que el catálogo servido es idéntico al
  modo archivo y el frontend no cambia.
- **Helpers de sólo lectura** ya disponibles en `lib/postgres.js`:
  `getProductVariants`, `getVariantById`, `listLocations`, `getInventoryLevels`,
  `findDiscountByCode`.
