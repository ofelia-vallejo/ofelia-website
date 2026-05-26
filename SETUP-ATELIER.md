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

### Gestión para el cliente (sin código)

| Pestaña | Qué controla |
|---------|----------------|
| **Productos** | Nombre, precio, grabado, fotos, colores/variantes, categoría, orden en sección |
| **Secciones** | Títulos y orden de bloques en `/coleccion` (Mujer, Hombre, Morrales…) y columnas 2 o 3 |
| **Inventario** | Unidades por color/SKU |

La página **Colección** se genera sola desde el catálogo: al guardar en admin, la web refleja precios, stock y piezas activas.

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
POST /api/account/register
POST /api/account/login
GET  /api/account/me
POST /api/personalizar
```

---

## 8. Cuentas de clientes

Tablas: `customers`, `personalization_requests` (en `database/schema.sql`).

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Obligatorio para registro en servidor |
| `CUSTOMER_SECRET` | Firma de tokens de sesión (recomendado en prod) |

Tras actualizar schema:

```bash
npm run db:migrate
```

- **Registro / login:** `/cuenta.html` o modal en `personalizar.html`
- Si no hay Postgres, el sitio usa **modo local** (localStorage) como respaldo
- Las solicitudes de personalización quedan en `personalization_requests` con referencia `OV-…`

---

## 9. WhatsApp · personalización

| Variable | Uso |
|----------|-----|
| `WHATSAPP_NUMBER` | Número del atelier **solo dígitos** con código país (ej. `573001234567`, `41791234567`) |

En `/personalizar.html` → **Enviar por WhatsApp**:
1. Guarda la solicitud en Postgres (si hay `DATABASE_URL`)
2. Abre WhatsApp con mensaje ya redactado:

```
Hola equipo Ofelia Vallejo,

Quiero personalizar la siguiente pieza:
Pieza: …
Texto a grabar: «…»
…
Referencia: OV-…
```

Configura `WHATSAPP_NUMBER` en Vercel y vuelve a desplegar.

---

*Ofelia Vallejo · Leather House · Medellín → Lausanne*
