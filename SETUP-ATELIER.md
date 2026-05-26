# Atelier — Catálogo, PDP, pagos e inventario

Sistema completo: **PostgreSQL**, panel admin, **PDP dinámico**, **Stripe**, inventario.

**Checklist paso a paso en Vercel:** [`docs/VERCEL_CHECKLIST.md`](docs/VERCEL_CHECKLIST.md)

---

## Arquitectura

| Capa | URL / ruta | Función |
|------|------------|---------|
| **PostgreSQL** | `DATABASE_URL` | Fuente de verdad: productos, stock, pedidos |
| **Vercel Blob** | fallback | Fotos + catálogo si no hay Postgres |
| `data/catalog.json` | repo | Seed inicial + fallback lectura |
| `/api/products` | API | Catálogo público |
| `/api/admin/*` | API | Panel admin |
| `/api/checkout/create` | API | Sesión Stripe Checkout |
| `/api/checkout/webhook` | API | Pago confirmado → stock |
| `/producto/:slug` | Web | PDP dinámico (`producto/index.html`) |
| `/admin/` | Web | Gestión sin código |
| `/gracias` | Web | Post-pago |

**Prioridad de lectura del catálogo:** Postgres → Blob → `data/catalog.json`

---

## 1. PostgreSQL (Neon / Vercel Postgres / Supabase)

1. Crear base Postgres y copiar `DATABASE_URL`
2. En Vercel → Environment Variables → `DATABASE_URL`
3. Migrar y sembrar desde tu máquina:

```bash
cp .env.example .env.local
# Editar DATABASE_URL
npm install
npm run db:migrate
```

Esto aplica `database/schema.sql` e importa `data/catalog.json` + datos PDP (galería por color).

---

## 2. Stripe

1. [dashboard.stripe.com](https://dashboard.stripe.com) → claves de prueba
2. Variables en Vercel:

| Variable | Uso |
|----------|-----|
| `STRIPE_SECRET_KEY` | `sk_test_...` / `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (futuro Elements) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del endpoint webhook |
| `SITE_URL` | `https://ofeliavallejo.com` |

3. Webhook en Stripe → URL: `https://tu-dominio.com/api/checkout/webhook`  
   Eventos: `checkout.session.completed`, `checkout.session.expired`

4. En el PDP, **Comprar** crea sesión Checkout (CHF) con pieza + grabado opcional.

---

## 3. Admin (`/admin/`)

| Variable | Obligatorio |
|----------|-------------|
| `ADMIN_PASSWORD` | Sí |
| `ADMIN_SECRET` | Recomendado |
| `DATABASE_URL` | Recomendado (prod) |
| `BLOB_READ_WRITE_TOKEN` | Fotos si no están en URLs externas |

Local: `STORE_MODE=file npm run dev`

---

## 4. PDP dinámico

- URL: `/producto/travel-bag-i` (y cualquier `slug` del catálogo)
- Los HTML estáticos antiguos están en `producto/_archive/`
- Redirecciones 301 desde `*.html` antiguos

Datos por producto en Postgres / catálogo:
- `basePrice`, `engravePrice`, `images`, `variants`, `colorData`, `accordion`

---

## 5. Precios

- **Pieza** → `basePrice` (CHF)
- **Grabado** → `engravePrice` adicional si el cliente escribe texto en PDP o estudio
- Total en Checkout = suma automática

---

## 6. Inventario

- Stock en producto o por variante (color)
- Al pagar (webhook Stripe) se decrementa 1 unidad
- Admin → pestaña **Inventario**

---

## 7. APIs

```http
GET  /api/products
GET  /api/products?slug=travel-bag-i
POST /api/checkout/create
POST /api/checkout/webhook
GET  /api/stripe/config
```

---

*Ofelia Vallejo · Leather House · Medellín → Lausanne*
