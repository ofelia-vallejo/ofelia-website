# Checklist Vercel — Ofelia Vallejo

Marca cada ítem en **Vercel → Project → Settings → Environment Variables** (Production + Preview).

## 1. Base

- [ ] Repo conectado: `ofelia-vallejo/ofelia-website`, rama `main`
- [ ] Framework: **Other** (sitio estático + serverless en `/api`)
- [ ] `SITE_URL` = `https://ofeliavallejo.com` (o dominio final)

## 2. PostgreSQL

- [ ] Crear base (Neon / Vercel Postgres / Supabase)
- [ ] `DATABASE_URL` = connection string completa
- [ ] Local: `cp .env.example .env.local` → pegar URL → `npm run db:migrate`
- [ ] Verificar: `GET https://tu-dominio.com/api/products` devuelve JSON con productos

## 3. Admin

- [ ] `ADMIN_PASSWORD` = contraseña fuerte (panel `/admin/`)
- [ ] `ADMIN_SECRET` = string aleatorio largo (sesión firmada)
- [ ] Probar login en `/admin/` en producción

## 4. Fotos (opcional si URLs son externas)

- [ ] `BLOB_READ_WRITE_TOKEN` = token Vercel Blob
- [ ] Subir imagen de prueba desde admin → Inventario / producto

## 5. Stripe

- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (luego `sk_live_...`)
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- [ ] Webhook en Stripe Dashboard:
  - URL: `https://tu-dominio.com/api/checkout/webhook`
  - Eventos: `checkout.session.completed`, `checkout.session.expired`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] Probar PDP → **Comprar** → pago test → `/gracias.html`

## 6. Email (personalizar)

- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] `EMAIL_TO` = bandeja del atelier
- [ ] Enviar solicitud desde `/personalizar.html` y confirmar recepción

## 7. Smoke test post-deploy

- [ ] `/` — intro globo sin rectángulo gris; navbar visible tras step 0
- [ ] `/home.html` — enlaces producto y personalizar
- [ ] `/producto/travel-bag-ii` — PDP carga (no redirige a `maletin`)
- [ ] `/personalizar.html` — estudio grabado
- [ ] `/admin/` — login y listado productos

## Referencia

Detalle técnico: [`SETUP-ATELIER.md`](../SETUP-ATELIER.md)  
Mapa de enlaces: [`MAPA_ENLACES.md`](MAPA_ENLACES.md)
