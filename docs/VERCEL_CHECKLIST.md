# Checklist Vercel — Ofelia Vallejo

Marca cada ítem en **Vercel → Project web → Settings → Environment Variables** (Production + Preview).

**Guía detallada paso a paso:** [`PRODUCCION_PASO_A_PASO.md`](PRODUCCION_PASO_A_PASO.md)

---

## Estado del código (ya en `main`)

Estos ítems **no requieren acción en Vercel** — ya están implementados en el repositorio:

- [x] Repo conectado: `ofelia-vallejo/ofelia-website`, rama `main` (Fase 7 · `97c0f6e`)
- [x] Framework: **Other** (estático + serverless `/api`)
- [x] `vercel.json`: cleanUrls, rewrites PDP, redirects legacy
- [x] Esquema DB: `database/schema.sql` + migraciones `002` + `003`
- [x] Seed catálogo: `npm run db:migrate` → `data/catalog.json`
- [x] Checkout Stripe + webhook (`checkout.session.completed`, `expired`, `charge.refunded`)
- [x] Panel admin `/admin` (productos, inventario, pedidos, cupones)
- [x] Script validación: `npm run check:env`
- [x] Dominio configurado en proyecto: `ofeliavallejo.com`

---

## 1. Base — pendiente en infra

- [ ] `SITE_URL` = `https://ofeliavallejo.com` (Production)
- [ ] Redeploy tras cualquier cambio de variables

## 2. PostgreSQL — pendiente

- [ ] Crear base (**Neon** recomendado / Vercel Postgres / Supabase)
- [ ] `DATABASE_URL` = connection string pooled + `?sslmode=require`
- [ ] Aplicar esquema **en orden:** `schema.sql` → `002` → `003` (ver guía)
- [ ] Seed: `DATABASE_URL=... npm run db:migrate`
- [ ] (Recomendado) INSERT `inventory_levels` (comando en guía)
- [ ] Verificar: `GET https://ofeliavallejo.com/api/products` → JSON con productos

## 3. Admin — pendiente

- [ ] `ADMIN_PASSWORD` = contraseña fuerte (login `/admin`)
- [ ] `ADMIN_SECRET` = string aleatorio largo (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Probar login en `/admin` en producción

## 4. Fotos (opcional)

- [ ] `BLOB_READ_WRITE_TOKEN` = token Vercel Blob (Storage → Blob)
- [ ] Subir imagen de prueba desde admin → producto

## 5. Stripe — pendiente

- [ ] Cuenta Stripe activa (modo **test** primero)
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (luego `sk_live_...`)
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- [ ] Webhook en Stripe Dashboard:
  - URL: `https://ofeliavallejo.com/api/checkout/webhook`
  - Eventos: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] Verificar: `GET /api/stripe/config` → `"enabled": true`
- [ ] Probar PDP → **Comprar** → tarjeta `4242 4242 4242 4242` → `/gracias`

## 6. Email (opcional — contacto / personalización)

- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] `EMAIL_TO` = bandeja del atelier (`atelierofelia.vallejo@gmail.com`)
- [ ] Enviar solicitud desde `/personalizar` y confirmar recepción

## 7. Opcionales de marca

- [ ] `WHATSAPP_NUMBER` = `573005526208` (o tu número)
- [ ] `LAUNCH_COUPON_CODE` / `LAUNCH_DISCOUNT_LABEL` (defaults en código si vacíos)
- [ ] `CUSTOMER_SECRET` (solo si quieres JWT de clientes distinto de admin)

## 8. Smoke test post-deploy

- [ ] `/` — intro globo; navbar tras step 0
- [ ] `/home` — enlaces producto y personalizar
- [ ] `/coleccion` — grid con precios CHF
- [ ] `/producto/travel-bag-ii` — PDP (no redirige a `maletin`)
- [ ] `/personalizar` — estudio grabado
- [ ] Carrito → `/checkout` → quote impuesto/envío
- [ ] Pago test Stripe → `/gracias` → pedido en admin
- [ ] `/admin` — login y listado productos

---

## Referencia

| Documento | Contenido |
|-----------|-----------|
| [`PRODUCCION_PASO_A_PASO.md`](PRODUCCION_PASO_A_PASO.md) | Guía completa DB + Stripe + verificación |
| [`DB_SETUP.md`](DB_SETUP.md) | Detalle técnico local y producción |
| [`ADMIN_PANEL.md`](ADMIN_PANEL.md) | Uso del panel `/admin` |
| [`MAPA_ENLACES.md`](MAPA_ENLACES.md) | Rutas del sitio |
| [`.env.example`](../.env.example) | Plantilla de variables |

---

*Actualizado: junio 2026 · incluye migración 003 y guía de producción*
