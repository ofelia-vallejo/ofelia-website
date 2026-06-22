# Handoff · Claude MCP · Ofelia Vallejo — Completar producción

> Documento autocontenido para pegar o referenciar en una sesión **Claude + MCP** (terminal, Vercel CLI, browser).  
> Guía para la dueña (sin MCP): [`PRODUCCION_PASO_A_PASO.md`](PRODUCCION_PASO_A_PASO.md).

---

## Objetivo

Terminar la **puesta en producción** de la tienda Ofelia Vallejo Leather House:

1. PostgreSQL de producción (Neon recomendado)
2. Migraciones SQL en orden (001 → 002 → 003)
3. Seed del catálogo
4. Variables de entorno en Vercel
5. Stripe (claves + webhook)
6. Redeploy + smoke test end-to-end

**No reimplementar código** — el checkout, admin, impuestos, envíos, cupones e inventario ya están cableados en `main`.

---

## Estado del código (YA HECHO — no reimplementar)

| Campo | Valor |
|---|---|
| Repo | https://github.com/ofelia-vallejo/ofelia-website.git |
| Rama | `main` |
| Commit actual | `b6574f8208d4ff6e1ffed23a6f1fc14364550111` |
| Mensaje | `feat(checkout): selector envío, cotización en vivo y cupón en UI` |

### Fases completadas en código

- **Migración 001** — `database/schema.sql` (baseline: categorías, productos, pedidos, clientes)
- **Migración 002** — `database/migrations/002_full_commerce_model.sql` (~19 tablas: inventario, carrito, líneas de pedido, pagos, descuentos…)
- **Migración 003** — `database/migrations/003_functional_store.sql` (~30 tablas: impuestos TVA CH, envíos, reembolsos, devoluciones, gift cards, audit log…)
- **Total ~56 tablas** tras aplicar las tres capas
- **Checkout cableado** — `api/checkout/create.js`, `quote.js`, `webhook.js` + `lib/compute-checkout.js`
- **Impuestos** — TVA Suiza 8.1% incluida en precio (`tax-ch-vat` seed en 003)
- **Envíos** — CH estándar 15 CHF (gratis ≥500), EU 25 CHF (gratis ≥700), pickup atelier 0 CHF
- **Cupones** — `lib/discounts.js`, condiciones avanzadas, cupón seed `OV-TEMPORADA` 10%
- **Inventario operativo** — `inventory_levels` + `inventory_adjustments` (libro mayor)
- **Panel admin** — `/admin` con productos, inventario, pedidos, cupones, secciones
- **Checkout UI (Fase 7)** — `checkout.html` + `assets/js/checkout-page.js`: país, tarifas, cupón, quote en vivo

### Archivos clave (referencia rápida)

```
database/schema.sql
database/migrations/002_full_commerce_model.sql
database/migrations/003_functional_store.sql
data/catalog.json
scripts/db-migrate.js          # SOLO schema.sql + seed catálogo (NO aplica 002/003)
scripts/check-env.js           # Valida env vars antes de deploy
.env.example

lib/postgres.js                # Capa DB (~56 tablas, helpers checkout/inventario/refunds)
lib/compute-checkout.js        # Lógica compartida quote + create
lib/discounts.js               # Evaluación cupones + condiciones
lib/build-stripe-lines.js      # Líneas Stripe (CHF → céntimos)
lib/auth.js                    # JWT admin

api/products.js                # GET catálogo público
api/checkout/quote.js          # POST cotización en vivo
api/checkout/create.js         # POST crear sesión Stripe
api/checkout/webhook.js        # POST eventos Stripe
api/stripe/config.js           # GET { enabled: bool }
api/admin/[action].js          # Router admin (_login, _products, _inventory, _orders, _discounts, _categories, _upload)

admin/index.html               # Panel dueña
admin/admin.js
checkout.html                  # Checkout con envío + cupón
assets/js/checkout-page.js
assets/js/cart.js

vercel.json                    # cleanUrls, rewrites, headers
```

Documentación de apoyo: `docs/DB_SETUP.md`, `docs/ADMIN_PANEL.md`, `docs/MODELO_ER.md` (§7–§8), `docs/VERCEL_CHECKLIST.md`.

---

## Vercel

| Campo | Valor |
|---|---|
| Proyecto | `web` |
| Project ID | `prj_9wsbmAXLTjuDqPB4KgsUdybOnmSx` |
| Dominio producción | `ofeliavallejo.com` |
| `SITE_URL` | `https://ofeliavallejo.com` |
| Framework | **Other** (HTML estático + serverless `/api`) |
| Install command | `npm install --omit=dev` (en `vercel.json`) |

### Estado env vars (verificar con MCP)

```bash
cd "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"
vercel login          # si no autenticado
vercel link           # vincular prj_9wsbmAXLTjuDqPB4KgsUdybOnmSx si hace falta
vercel env ls
```

> En la sesión que generó este handoff, `vercel env ls` no pudo ejecutarse (auth CLI). **Primera tarea del agente MCP:** listar qué variables ya existen vs. faltantes.

---

## Tareas pendientes (EJECUTAR EN ORDEN)

### 1. Crear Postgres producción → `DATABASE_URL`

- **Neon** (recomendado): https://neon.tech → proyecto EU → copiar connection string con `?sslmode=require`
- Alternativas: Vercel Postgres, Supabase
- Guardar URL segura (no commitear)

### 2. Variables Vercel (Production + Preview)

Ver tabla completa en sección [Variables de entorno](#variables-de-entorno--plantilla).  
Añadir con CLI:

```bash
vercel env add DATABASE_URL production
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_SECRET production
vercel env add SITE_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
# Repetir para preview si aplica
```

### 3. Aplicar migraciones + seed

```bash
export DATABASE_URL="postgres://...@host/db?sslmode=require"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_full_commerce_model.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/003_functional_store.sql

cd "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"
npm install
DATABASE_URL="$DATABASE_URL" npm run db:migrate

psql "$DATABASE_URL" <<'SQL'
INSERT INTO inventory_levels (variant_id, location_id, available, reserved, on_hand)
SELECT v.id, 'loc-medellin', COALESCE(v.inventory,0), 0, COALESCE(v.inventory,0)
FROM product_variants v
ON CONFLICT (variant_id, location_id) DO UPDATE
  SET available = EXCLUDED.available, on_hand = EXCLUDED.on_hand, updated_at = NOW();
SQL
```

### 4. Stripe

- Dashboard → API keys → `sk_test_...` / `pk_test_...` (o live)
- Webhook endpoint: `https://ofeliavallejo.com/api/checkout/webhook`
- Eventos: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
- Copiar `whsec_...` → `STRIPE_WEBHOOK_SECRET`

### 5. Admin

```bash
# Generar ADMIN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `ADMIN_PASSWORD` — contraseña fuerte elegida por la dueña
- `ADMIN_SECRET` — output del comando anterior (distinto del password)

### 6. Redeploy Vercel

```bash
vercel --prod
# o: Vercel Dashboard → Deployments → Redeploy
```

### 7. Smoke test

Ejecutar checklist de [Endpoints a probar](#endpoints-a-probar) + navegación browser.

---

## Comandos exactos (copiar/pegar)

### Clonar / actualizar repo

```bash
git clone https://github.com/ofelia-vallejo/ofelia-website.git
cd ofelia-website
git checkout main
git pull origin main
```

### Verificar tablas post-migración

```bash
psql "$DATABASE_URL" -c "\dt" | wc -l          # ~56 tablas + header
psql "$DATABASE_URL" -c "SELECT count(*) FROM products;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM product_variants;"
psql "$DATABASE_URL" -c "SELECT id, name FROM locations;"
psql "$DATABASE_URL" -c "SELECT code, type, value FROM discounts;"
psql "$DATABASE_URL" -c "SELECT id, title, price_chf FROM shipping_rates;"
psql "$DATABASE_URL" -c "SELECT id, rate, included_in_price FROM tax_rates;"
```

### Validar env (local con vars exportadas o `vercel env pull`)

```bash
# Opción A: pull de Vercel
vercel env pull .env.production.local
set -a && source .env.production.local && set +a
node scripts/check-env.js

# Opción B: export manual
export DATABASE_URL=... ADMIN_PASSWORD=... ADMIN_SECRET=... \
  STRIPE_SECRET_KEY=... STRIPE_PUBLISHABLE_KEY=... STRIPE_WEBHOOK_SECRET=... \
  SITE_URL=https://ofeliavallejo.com
node scripts/check-env.js
```

### curl — API smoke tests

```bash
BASE=https://ofeliavallejo.com

# Catálogo
curl -sS "$BASE/api/products" | head -c 500

# Stripe config
curl -sS "$BASE/api/stripe/config"

# Quote checkout (ejemplo mínimo — ajustar variantId real del catálogo)
curl -sS -X POST "$BASE/api/checkout/quote" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"travel-bag-ii","variantId":"v-cognac","quantity":1}],"shippingCountry":"CH","couponCode":"OV-TEMPORADA"}'

# Admin login (sustituir PASSWORD)
curl -sS -X POST "$BASE/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"PASSWORD"}'
```

### Stripe CLI (opcional, local webhook test)

```bash
stripe listen --forward-to localhost:3000/api/checkout/webhook
stripe trigger checkout.session.completed
```

---

## Variables de entorno — plantilla

> Copiar de `.env.example`. **Nunca** commitear valores reales.

| Variable | Requerida | Descripción |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ | Contraseña panel `/admin` |
| `ADMIN_SECRET` | ✅ | JWT firma sesiones admin |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (SSL en prod) |
| `STRIPE_SECRET_KEY` | ✅ | `sk_test_...` o `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | `pk_test_...` o `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_...` del endpoint webhook |
| `SITE_URL` | ✅ | `https://ofeliavallejo.com` |
| `BLOB_READ_WRITE_TOKEN` | ○ | Vercel Blob — uploads admin |
| `SMTP_HOST` | ○ | Servidor correo |
| `SMTP_PORT` | ○ | Default `587` |
| `SMTP_USER` | ○ | Usuario SMTP |
| `SMTP_PASS` | ○ | Contraseña SMTP |
| `EMAIL_TO` | ○ | Destino contacto/personalización (`atelierofelia.vallejo@gmail.com`) |
| `CUSTOMER_SECRET` | ○ | JWT clientes (default = `ADMIN_SECRET`) |
| `WHATSAPP_NUMBER` | ○ | Dígitos con código país (`573005526208`) |
| `LAUNCH_COUPON_CODE` | ○ | Default `OV-TEMPORADA` |
| `LAUNCH_DISCOUNT_LABEL` | ○ | Texto popup lanzamiento |
| `STORE_MODE` | — | **Solo dev.** `file` = lee `data/catalog.json`. En prod **no** setear (usa Postgres). |

Validación automática: `node scripts/check-env.js` (7 required + 6 optional).

---

## Migraciones — orden e idempotencia

| Orden | Archivo | Qué hace | Idempotente | Cómo aplicar |
|---|---|---|---|---|
| 1 | `database/schema.sql` | 9 tablas baseline | ✅ (`IF NOT EXISTS`) | `psql -f` **o** `npm run db:migrate` (parcial) |
| 2 | `database/migrations/002_full_commerce_model.sql` | +19 tablas comercio | ✅ | **`psql -f` obligatorio** |
| 3 | `database/migrations/003_functional_store.sql` | +30 tablas tienda funcional + seeds impuestos/envíos | ✅ | **`psql -f` obligatorio** |
| 4 | Seed catálogo | Productos desde `data/catalog.json` | Re-ejecutable | `npm run db:migrate` |
| 5 | Inventario normalizado | Poblar `inventory_levels` | UPSERT | SQL INSERT…SELECT (arriba) |

### ⚠️ `db-migrate.js` NO aplica 002 ni 003

El script `scripts/db-migrate.js`:
- Lee **solo** `database/schema.sql` (split por `;`)
- Siembra catálogo vía `saveCatalogToPostgres()`
- **Ignora** migraciones 002 y 003

Si solo corres `npm run db:migrate` sin los `psql -f` previos, faltan impuestos, envíos, descuentos avanzados y ~47 tablas.

### Seeds incluidos en migraciones

| Migración | Seed |
|---|---|
| 002 | `loc-medellin` (atelier), cupón `OV-TEMPORADA` 10% |
| 003 | `tax-ch-vat` (8.1%), zonas `sz-ch`/`sz-eu`, tarifas envío, `pl-public`, canales `ch-web`/`ch-atelier` |

---

## Endpoints a probar

| Método | Ruta | Esperado |
|---|---|---|
| GET | `/api/products` | JSON `{ products: [...] }` desde Postgres |
| GET | `/api/stripe/config` | `{ enabled: true }` con Stripe configurado |
| POST | `/api/checkout/quote` | Totales + `shippingRates[]` + descuento |
| POST | `/api/checkout/create` | `{ url: "https://checkout.stripe.com/..." }` |
| POST | `/api/checkout/webhook` | 200 (solo Stripe; firmado con secret) |
| POST | `/api/admin/login` | `{ token: "..." }` con password correcta |
| GET | `/api/admin/products` | Lista productos (Bearer token) |
| GET | `/admin` | Panel HTML — login funcional |
| GET | `/checkout` | UI envío + cupón + totales en vivo |
| GET | `/producto/travel-bag-ii` | PDP dinámico |
| GET | `/coleccion` | Catálogo renderizado |

### Browser smoke test

1. `/` → globo intro → entrar al sitio
2. `/home` → navegar a producto
3. Añadir al carrito → `/checkout`
4. Seleccionar país CH → ver tarifas (pickup 0 / estándar 15)
5. Cupón `OV-TEMPORADA` → descuento 10%
6. Pagar con tarjeta test Stripe → `/gracias`
7. `/admin` → ver pedido, inventario descontado

---

## Errores comunes y fixes

| Error | Diagnóstico | Fix |
|---|---|---|
| `GET /api/products` → 500 | `DATABASE_URL` ausente o DB vacía | Env var + migraciones + seed |
| `relation "tax_rates" does not exist` | Migración 003 no aplicada | `psql -f database/migrations/003_functional_store.sql` |
| `relation "order_line_items" does not exist` | Migración 002 no aplicada | `psql -f database/migrations/002_full_commerce_model.sql` |
| Checkout 503 «pago no disponible» | Stripe keys faltantes | Añadir 3 vars Stripe + redeploy |
| Webhook 400 signature | `STRIPE_WEBHOOK_SECRET` incorrecto | Regenerar secret en Stripe Dashboard |
| Admin 401 | Token expirado o password wrong | Re-login; verificar `ADMIN_PASSWORD` |
| Cupón ignorado | 003 sin seed o código inactivo | Verificar `SELECT * FROM discounts;` |
| Inventario no descuenta | `inventory_levels` vacío | Ejecutar INSERT…SELECT de inventario |
| SSL error en psql | Neon requiere SSL | Añadir `?sslmode=require` a URL |
| `db:migrate` cuelga al final | Pool postgres abierto | Normal — seed ya corrió; Ctrl-C o esperar `sql.end()` |

---

## Prompt sugerido para pegar en Claude MCP

Copia el bloque siguiente en una **nueva sesión Claude con MCP** (terminal + Vercel + browser):

---

```
Proyecto: Ofelia Vallejo Leather House — completar puesta en producción.

Lee primero: docs/HANDOFF_CLAUDE_MCP.md (en el repo).
Repo: https://github.com/ofelia-vallejo/ofelia-website.git
Rama: main · Commit: b6574f8
Vercel projectId: prj_9wsbmAXLTjuDqPB4KgsUdybOnmSx · Dominio: ofeliavallejo.com

El código YA ESTÁ LISTO (checkout, admin, impuestos, envíos, cupones, inventario).
NO reimplementes — solo infraestructura y configuración.

EJECUTA EN ORDEN:

1. Clona/actualiza repo. vercel login + vercel link + vercel env ls → reporta qué vars faltan.

2. Crea Postgres en Neon (EU). Guarda DATABASE_URL con sslmode=require.

3. Migraciones (orden estricto):
   psql -f database/schema.sql
   psql -f database/migrations/002_full_commerce_model.sql
   psql -f database/migrations/003_functional_store.sql
   npm run db:migrate
   INSERT inventory_levels (SQL en HANDOFF)

4. Configura TODAS las env vars en Vercel (Production + Preview):
   DATABASE_URL, ADMIN_PASSWORD, ADMIN_SECRET, SITE_URL=https://ofeliavallejo.com,
   STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET.
   Genera ADMIN_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   Pide a la usuaria ADMIN_PASSWORD si no la tienes.

5. Stripe Dashboard:
   Webhook https://ofeliavallejo.com/api/checkout/webhook
   Eventos: checkout.session.completed, checkout.session.expired, charge.refunded

6. vercel --prod (redeploy)

7. Smoke test:
   curl /api/products, /api/stripe/config, POST /api/checkout/quote
   Browser: /home → producto → checkout → pago test 4242… → /gracias
   /admin login → productos + inventario

Reporta: vars configuradas, conteo tablas/productos, resultados curl, capturas browser si hay error.
Si algo falla, consulta docs/DB_SETUP.md y docs/MODELO_ER.md §7.
```

---

*Generado: 2026-06-22 · Sesión handoff pre-producción*
