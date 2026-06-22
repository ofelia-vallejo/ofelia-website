# Checklist Vercel — Ofelia Vallejo

> Marca cada ítem en **Vercel → Project → Settings → Environment Variables** (Production + Preview).  
> **Handoff para agente MCP:** [`HANDOFF_CLAUDE_MCP.md`](HANDOFF_CLAUDE_MCP.md)  
> **Guía paso a paso (dueña):** [`PRODUCCION_PASO_A_PASO.md`](PRODUCCION_PASO_A_PASO.md)

**Proyecto Vercel:** `web` · `prj_9wsbmAXLTjuDqPB4KgsUdybOnmSx`  
**Dominio:** `ofeliavallejo.com` · `SITE_URL=https://ofeliavallejo.com`  
**Repo:** `ofelia-vallejo/ofelia-website` · rama `main`  
**Commit referencia:** `97c0f6e` (checkout UI + quote + cupón)

---

## Estado actual (2026-06-22)

| Área | Código | Infra producción |
|---|---|---|
| Catálogo API | ✅ `api/products.js` | ⬜ DB + seed pendiente |
| Checkout (impuestos/envío/cupón) | ✅ cableado | ⬜ Stripe + DB pendiente |
| Panel admin `/admin` | ✅ completo | ⬜ `ADMIN_*` + DB pendiente |
| Migraciones SQL 001–003 | ✅ en repo | ⬜ aplicar con `psql` |
| Env vars Vercel | — | ⬜ verificar con `vercel env ls` |

---

## 1. Base

- [ ] Repo conectado: `ofelia-vallejo/ofelia-website`, rama `main`
- [ ] Framework: **Other** (sitio estático + serverless en `/api`)
- [ ] `SITE_URL` = `https://ofeliavallejo.com`

## 2. PostgreSQL

- [ ] Crear base (**Neon** recomendado, región EU)
- [ ] `DATABASE_URL` = connection string con `?sslmode=require`
- [ ] Aplicar en orden:
  - [ ] `psql -f database/schema.sql`
  - [ ] `psql -f database/migrations/002_full_commerce_model.sql`
  - [ ] `psql -f database/migrations/003_functional_store.sql`
  - [ ] `npm run db:migrate` (seed catálogo)
  - [ ] INSERT `inventory_levels` (ver `DB_SETUP.md` §1.4)
- [ ] Verificar: `GET https://ofeliavallejo.com/api/products` devuelve JSON con productos
- [ ] Verificar: `psql -c "SELECT count(*) FROM products;"` > 0

## 3. Admin

- [ ] `ADMIN_PASSWORD` = contraseña fuerte (panel `/admin`)
- [ ] `ADMIN_SECRET` = string aleatorio largo (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Probar login en `/admin` en producción
- [ ] Probar CRUD producto + ajuste inventario

## 4. Fotos (opcional si URLs son externas)

- [ ] `BLOB_READ_WRITE_TOKEN` = token Vercel Blob
- [ ] Subir imagen de prueba desde admin → producto

## 5. Stripe

- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (luego `sk_live_...`)
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- [ ] Webhook en Stripe Dashboard:
  - URL: `https://ofeliavallejo.com/api/checkout/webhook`
  - Eventos: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] `GET /api/stripe/config` → `{ "enabled": true }`
- [ ] Probar PDP → carrito → `/checkout` → pago test `4242…` → `/gracias`

## 6. Email (personalizar)

- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] `EMAIL_TO` = bandeja del atelier
- [ ] Enviar solicitud desde `/personalizar` y confirmar recepción

## 7. Opcionales

- [ ] `WHATSAPP_NUMBER` = `573005526208`
- [ ] `LAUNCH_COUPON_CODE` = `OV-TEMPORADA`
- [ ] `CUSTOMER_SECRET` (si distinto de `ADMIN_SECRET`)

## 8. Validación pre-deploy

```bash
node scripts/check-env.js    # todas las REQUIRED en ✓
```

## 9. Smoke test post-deploy

- [ ] `/` — intro globo sin rectángulo gris; navbar visible tras step 0
- [ ] `/home` — enlaces producto y personalizar
- [ ] `/coleccion` — productos desde DB
- [ ] `/producto/travel-bag-ii` — PDP carga (no redirige a `maletin`)
- [ ] `/personalizar` — estudio grabado
- [ ] `/checkout` — selector envío CH/EU, cupón, total en vivo (`POST /api/checkout/quote`)
- [ ] `/admin` — login, productos, inventario, pedidos, cupones
- [ ] Compra test completa → inventario descontado en admin

---

## Referencia

| Doc | Contenido |
|---|---|
| [`HANDOFF_CLAUDE_MCP.md`](HANDOFF_CLAUDE_MCP.md) | Handoff completo para Claude MCP |
| [`PRODUCCION_PASO_A_PASO.md`](PRODUCCION_PASO_A_PASO.md) | Guía dueña, español |
| [`DB_SETUP.md`](DB_SETUP.md) | Postgres local + producción |
| [`ADMIN_PANEL.md`](ADMIN_PANEL.md) | Panel de administración |
| [`MODELO_ER.md`](MODELO_ER.md) | Modelo de datos (56 tablas) |
| [`MAPA_ENLACES.md`](MAPA_ENLACES.md) | Rutas web |
