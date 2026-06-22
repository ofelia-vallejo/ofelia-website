# Puesta en producción — paso a paso

Guía para activar la tienda completa de **Ofelia Vallejo Leather House** en Vercel: base de datos, variables de entorno, catálogo, pagos Stripe y panel de administración.

**Tiempo estimado:** 45–60 minutos la primera vez (base de datos 15–20 min, Stripe 15 min, verificación 10 min).

**Requisitos:** acceso al [dashboard de Vercel](https://vercel.com) del proyecto **web**, una terminal en tu Mac (Terminal o Cursor), y el repositorio clonado en tu equipo.

**Documentos relacionados:** [`HANDOFF_CLAUDE_MCP.md`](HANDOFF_CLAUDE_MCP.md) (delegar a Claude MCP) · [`DB_SETUP.md`](DB_SETUP.md) (detalle técnico local) · [`VERCEL_CHECKLIST.md`](VERCEL_CHECKLIST.md) (lista de casillas) · [`.env.example`](../.env.example) (plantilla de variables).

---

## Antes de empezar — qué ya está listo en el código

El repositorio `ofelia-vallejo/ofelia-website` (rama `main`, commit `97c0f6e`) incluye:

- Sitio editorial + tienda (HTML, carrito, checkout, cuentas de cliente).
- API serverless en `/api/*` (productos, checkout Stripe, admin, contacto).
- Esquema PostgreSQL en tres capas: `schema.sql` → migración `002` → migración `003`.
- Script de seed del catálogo desde `data/catalog.json` (~12 productos).
- Panel admin en `/admin` (productos, inventario, pedidos, cupones).
- Proyecto Vercel vinculado: **web** (`prj_9wsbmAXLTjuDqPB4KgsUdybOnmSx`).

**Lo que falta es infraestructura:** crear la base Postgres, pegar las variables en Vercel y configurar Stripe. Solo tú puedes hacer eso desde los dashboards.

---

## Parte A — Base de datos (15–20 min)

Necesitas una base **PostgreSQL** accesible desde internet (Vercel no puede conectar a una base solo local).

### Comparación rápida

| Opción | Ventajas | Consideraciones |
|--------|----------|-----------------|
| **[Neon](https://neon.tech)** *(recomendado)* | Gratis generoso, serverless, rápido de crear, pooler incluido | Cuenta aparte de Vercel |
| **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** | Integrado en el mismo dashboard; `DATABASE_URL` se inyecta sola | Menos flexible si cambias de hosting |
| **[Supabase](https://supabase.com)** | Panel visual + SQL; plan gratis | Usar el **pooler** (modo Transaction), no la conexión directa |

Cualquiera de las tres funciona. Si no tienes preferencia, elige **Neon**.

### Pasos con Neon (recomendado)

1. Entra en [neon.tech](https://neon.tech) → **Sign up** (puedes usar la misma cuenta de GitHub).
2. **New Project** → nombre sugerido: `ofelia-prod` → región: **Europe (Frankfurt)** (cerca de Suiza).
3. En el panel del proyecto, abre **Connection Details**.
4. Copia la cadena **Pooled connection** (termina en algo como `-pooler.eu-central-1.aws.neon.tech`).  
   Debe incluir usuario, contraseña, host y nombre de base. Ejemplo de formato (no uses estos valores):

   ```
   postgres://usuario:contraseña@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

5. **Guárdala en un gestor de contraseñas.** No la compartas por WhatsApp ni la subas a Git.

### Pasos con Vercel Postgres

1. Vercel → proyecto **web** → pestaña **Storage** → **Create Database** → **Postgres**.
2. Vercel crea automáticamente la variable `DATABASE_URL` en Production.
3. Verifica en **Settings → Environment Variables** que aparece para **Production** (y añádela también a Preview si quieres probar ramas).

### Pasos con Supabase

1. [supabase.com](https://supabase.com) → **New project** → región EU.
2. **Project Settings → Database → Connection string → URI** (modo **Transaction pooler**, puerto **6543**).
3. Añade `?sslmode=require` al final si no viene incluido.

### Dónde pegar la connection string en Vercel

1. [vercel.com](https://vercel.com) → equipo → proyecto **web**.
2. **Settings → Environment Variables**.
3. **Add New**:
   - **Key:** `DATABASE_URL`
   - **Value:** la connection string completa (con `?sslmode=require` si aplica).
   - **Environments:** marca **Production** y **Preview** (Development es opcional).
4. **Save**.

> **Importante:** después de añadir o cambiar variables, haz un **Redeploy** del último deployment en Production (Deployments → ⋮ → Redeploy) para que las funciones `/api/*` las lean.

---

## Parte B — Variables de entorno en Vercel

Ruta: **Vercel → proyecto web → Settings → Environment Variables**.

### Tabla completa

| Variable | Obligatoria | Entornos | Valor de ejemplo (sin secretos reales) |
|----------|-------------|----------|----------------------------------------|
| `DATABASE_URL` | ✅ Sí | Production, Preview | `postgres://user:pass@host/db?sslmode=require` |
| `ADMIN_PASSWORD` | ✅ Sí | Production, Preview | Contraseña fuerte que tú elijas para `/admin` |
| `ADMIN_SECRET` | ✅ Sí | Production, Preview | String aleatorio largo (ver abajo) |
| `SITE_URL` | ✅ Sí | Production | `https://ofeliavallejo.com` |
| `STRIPE_SECRET_KEY` | ✅ Sí (pagos) | Production, Preview | `sk_test_...` (pruebas) → luego `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | ✅ Sí (pagos) | Production, Preview | `pk_test_...` → luego `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ Sí (pagos) | Production | `whsec_...` (del webhook en Stripe) |
| `BLOB_READ_WRITE_TOKEN` | ○ Opcional | Production | Token de Vercel Blob (subida de fotos desde admin) |
| `SMTP_HOST` | ○ Opcional | Production | `smtp.gmail.com` |
| `SMTP_PORT` | ○ Opcional | Production | `587` |
| `SMTP_USER` | ○ Opcional | Production | `atelier@tudominio.com` |
| `SMTP_PASS` | ○ Opcional | Production | Contraseña de aplicación del correo |
| `EMAIL_TO` | ○ Opcional | Production | `atelierofelia.vallejo@gmail.com` |
| `CUSTOMER_SECRET` | ○ Opcional | Production | (vacío = usa `ADMIN_SECRET`) |
| `WHATSAPP_NUMBER` | ○ Opcional | Production | `573005526208` (solo dígitos, con código país) |
| `LAUNCH_COUPON_CODE` | ○ Opcional | Production | `OV-TEMPORADA` |
| `LAUNCH_DISCOUNT_LABEL` | ○ Opcional | Production | `10% en tu primera pieza · lanzamiento de temporada` |
| `STORE_MODE` | ✗ No en prod | — | Solo desarrollo local (`file`). **No** la pongas en Vercel. |

### Generar `ADMIN_SECRET` (una sola vez)

En la terminal de tu Mac, dentro de la carpeta del proyecto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado (64 caracteres hex) → pégalo como valor de `ADMIN_SECRET` en Vercel. Debe ser **distinto** de `ADMIN_PASSWORD`.

### Production vs Preview vs Development

| Entorno | Cuándo se usa | Recomendación |
|---------|---------------|---------------|
| **Production** | `ofeliavallejo.com` | Todas las obligatorias + Stripe **live** cuando abras ventas reales |
| **Preview** | Cada rama/PR en Vercel | Mismas claves **test** de Stripe; misma `DATABASE_URL` o una base de staging aparte |
| **Development** | `vercel dev` en tu Mac | Opcional; puedes usar `.env` local en su lugar |

### Validar desde tu Mac (opcional)

Con un archivo `.env` local que tenga las mismas variables:

```bash
cd "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"
export $(grep -v '^#' .env | xargs)   # carga .env (si existe)
npm run check:env
```

Debe mostrar ✓ en todas las REQUIRED. Si falta alguna, el script indica cuál.

---

## Parte C — Aplicar esquema y cargar catálogo

Ejecuta estos comandos **desde tu Mac**, en la carpeta del proyecto, con la `DATABASE_URL` de **producción** (la que pegaste en Vercel).

### 1. Preparar la terminal

```bash
cd "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"

# Pega aquí TU connection string real (Neon / Vercel Postgres / Supabase):
export DATABASE_URL="postgres://usuario:contraseña@host:5432/nombre_db?sslmode=require"
```

> Si no tienes `psql` instalado: `brew install libpq` y luego  
> `export PATH="/opt/homebrew/opt/libpq/bin:$PATH"`.

### 2. Aplicar esquema — EN ESTE ORDEN

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_full_commerce_model.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/003_functional_store.sql
```

Los tres archivos son **idempotentes** (se pueden re-ejecutar sin romper nada).  
**No** uses `db-migrate.js` para las migraciones 002 y 003 — ese script solo procesa `schema.sql`.

### 3. Cargar productos (seed)

```bash
npm run db:migrate
```

Esto reaplica `schema.sql` (seguro) e importa ~12 productos desde `data/catalog.json`.

### 4. Sincronizar inventario (recomendado)

```bash
psql "$DATABASE_URL" <<'SQL'
INSERT INTO inventory_levels (variant_id, location_id, available, reserved, on_hand)
SELECT v.id, 'loc-medellin', COALESCE(v.inventory,0), 0, COALESCE(v.inventory,0)
FROM product_variants v
ON CONFLICT (variant_id, location_id) DO UPDATE
  SET available = EXCLUDED.available, on_hand = EXCLUDED.on_hand, updated_at = NOW();
SQL
```

### 5. Verificar

```bash
# Debe listar muchas tablas (products, orders, inventory_levels, …)
psql "$DATABASE_URL" -c "\dt"

# Debe devolver un número > 0 (esperado: ~12)
psql "$DATABASE_URL" -tAc "SELECT count(*) FROM products;"

# Ubicación del taller (seed automático)
psql "$DATABASE_URL" -c "SELECT id,name FROM locations;"

# Cupón de lanzamiento (seed automático)
psql "$DATABASE_URL" -c "SELECT code,value FROM discounts;"
```

**Desde el navegador** (después del redeploy en Vercel):

```bash
curl -s https://ofeliavallejo.com/api/products | head -c 400
```

Debe devolver JSON con productos (nombres, precios en CHF, variantes). Si ves `[]` o error 500, revisa la Parte G.

---

## Parte D — Stripe (pagos)

Moneda de la tienda: **CHF** (francos suizos). Mercado: Suiza / Europa.

### 1. Crear cuenta y obtener claves

1. [dashboard.stripe.com](https://dashboard.stripe.com) → registro / inicio de sesión.
2. Activa el **modo Test** (interruptor arriba a la derecha) para las primeras pruebas.
3. **Developers → API keys**:
   - **Publishable key** → copia a `STRIPE_PUBLISHABLE_KEY` en Vercel (`pk_test_...`).
   - **Secret key** → **Reveal** → copia a `STRIPE_SECRET_KEY` (`sk_test_...`).

### 2. Configurar webhook

1. **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:**

   ```
   https://ofeliavallejo.com/api/checkout/webhook
   ```

3. **Events to send** — selecciona estos tres:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`

4. **Add endpoint** → en la página del endpoint, **Signing secret** → **Reveal** → copia a `STRIPE_WEBHOOK_SECRET` (`whsec_...`) en Vercel (solo **Production** al principio; repite en Preview si pruebas en URLs preview).

### 3. Pegar las 3 claves en Vercel

| Variable | Origen en Stripe |
|----------|------------------|
| `STRIPE_SECRET_KEY` | API keys → Secret key |
| `STRIPE_PUBLISHABLE_KEY` | API keys → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhooks → tu endpoint → Signing secret |

**Redeploy** en Vercel después de guardar.

### 4. Probar pago (modo test)

1. Abre un producto en el sitio → **Comprar** → checkout Stripe.
2. Tarjeta de prueba: `4242 4242 4242 4242` · fecha futura · CVC cualquiera · código postal cualquiera.
3. Tras pagar, debes llegar a `/gracias` y el pedido aparecer en `/admin` → Pedidos.

### 5. Pasar a pagos reales (cuando estés lista)

1. Completa la activación de cuenta en Stripe (datos del negocio, cuenta bancaria).
2. Cambia a **modo Live** en Stripe.
3. Sustituye en Vercel las tres claves `sk_test_` / `pk_test_` por `sk_live_` / `pk_live_`.
4. Crea un **nuevo webhook** en modo Live con la misma URL y actualiza `STRIPE_WEBHOOK_SECRET`.

---

## Parte E — Panel de administración

### Variables necesarias

| Variable | Uso |
|----------|-----|
| `ADMIN_PASSWORD` | Contraseña que escribes en la pantalla de login |
| `ADMIN_SECRET` | Firma interna de sesión (el usuario nunca la ve) |

### Acceder

1. Abre [https://ofeliavallejo.com/admin](https://ofeliavallejo.com/admin).
2. Introduce `ADMIN_PASSWORD`.
3. Tras login verás: Productos · Inventario · Pedidos · Cupones · Secciones.

### Qué puedes hacer sin código

- Editar precios, stock, fotos y textos de producto.
- Ajustar inventario por variante (con registro en libro mayor).
- Ver pedidos pagados y registrar reembolsos.
- Gestionar cupones (p. ej. `OV-TEMPORADA`, 10 %).

Documentación del panel: [`ADMIN_PANEL.md`](ADMIN_PANEL.md).

---

## Parte F — Verificación final (smoke test)

Marca cada ítem tras el redeploy con todas las variables:

### Sitio público

- [ ] **/** — Intro del globo carga; al continuar, navbar con firma visible.
- [ ] **/home** — Hero, colecciones y enlaces responden.
- [ ] **/coleccion** — Grid de productos con precios CHF.
- [ ] **/producto/travel-bag-ii** — PDP carga (no redirige a rutas antiguas).
- [ ] **/personalizar** — Estudio de grabado láser operativo.
- [ ] **/manifiesto** y **/cuero** — Páginas editoriales sin errores.

### Tienda

- [ ] Añadir producto al carrito (icono navbar).
- [ ] **/checkout** — Resumen con subtotal, envío e impuesto (TVA 8.1 % incluido).
- [ ] Botón de pago abre **Stripe Checkout** (no mensaje «pago no disponible»).
- [ ] Pago test `4242…` → redirección a **/gracias**.
- [ ] `GET /api/stripe/config` devuelve `"enabled": true`.

### API y datos

- [ ] `GET /api/products` — JSON con productos desde Postgres.
- [ ] Pedido de prueba visible en **/admin → Pedidos**.
- [ ] Stock descontado tras pago (Inventario en admin).

### Admin

- [ ] Login en **/admin** con `ADMIN_PASSWORD`.
- [ ] Listado de productos carga.
- [ ] (Opcional) Subir imagen si configuraste `BLOB_READ_WRITE_TOKEN`.

### Email (opcional)

- [ ] Formulario **/contacto** o **/personalizar** → correo recibido en `EMAIL_TO` (requiere SMTP).

---

## Parte G — Troubleshooting

### «El pago en línea no está disponible por ahora» (503 en checkout)

**Causa:** faltan `STRIPE_SECRET_KEY` y/o `STRIPE_PUBLISHABLE_KEY`, o no hubo redeploy tras añadirlas.

**Solución:** verifica las tres variables Stripe en Vercel → **Redeploy** → prueba `/api/stripe/config`.

---

### `FUNCTION_INVOCATION_FAILED` en rutas `/api/*`

**Causas frecuentes:**

1. **`DATABASE_URL` incorrecta** — usuario/contraseña mal copiados, o falta `?sslmode=require`.
2. **Variable con salto de línea** al pegar en Vercel — vuelve a pegar en una sola línea.
3. **Esquema no aplicado** — ejecuta Parte C (002 + 003).

**Diagnóstico:** Vercel → Deployments → tu deployment → **Functions** → logs del error concreto.

---

### Catálogo vacío o productos de `catalog.json` en lugar de la base

**Causa:** `DATABASE_URL` vacía en Vercel, o seed no ejecutado.

**Solución:**

1. Confirma `DATABASE_URL` en Production.
2. Ejecuta `npm run db:migrate` apuntando a prod.
3. Redeploy y prueba `curl https://ofeliavallejo.com/api/products`.

El sitio **degrada** a `data/catalog.json` si Postgres falla — la web se ve, pero pedidos e inventario no persisten bien.

---

### Webhook Stripe falla (400 / 500)

| Síntoma | Causa | Solución |
|---------|-------|----------|
| 400 «Webhook Error» | `STRIPE_WEBHOOK_SECRET` incorrecto | Copia de nuevo el Signing secret del endpoint exacto (test vs live) |
| 503 «Webhook no configurado» | Falta `STRIPE_WEBHOOK_SECRET` | Añadir variable + redeploy |
| 500 «Handler error» | Pedido o esquema incompleto | Aplicar migraciones 002+003; revisar logs en Vercel |

En Stripe → Webhooks → tu endpoint → **Recent deliveries** puedes reenviar eventos fallidos tras corregir.

---

### CORS o errores de red en checkout

**Causa:** `SITE_URL` distinta del dominio real (p. ej. `http://` en lugar de `https://`, o dominio preview).

**Solución:** `SITE_URL=https://ofeliavallejo.com` en Production. Stripe redirige a URLs derivadas de este valor.

---

### Admin: login rechazado o sesión expira al instante

- Verifica `ADMIN_PASSWORD` (la que escribes) y `ADMIN_SECRET` (distinto, aleatorio largo).
- Tras cambiar `ADMIN_SECRET`, cierra sesión y vuelve a entrar.

---

### Emails no llegan (contacto / personalización)

**Causa:** SMTP no configurado — el sistema **no falla**; solo registra en logs.

**Solución:** configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`. Con Gmail usa una [contraseña de aplicación](https://support.google.com/accounts/answer/185833).

---

## Orden recomendado (resumen)

1. Crear Postgres (Neon / Vercel Postgres / Supabase) → copiar connection string.
2. Pegar `DATABASE_URL` + `ADMIN_PASSWORD` + `ADMIN_SECRET` + `SITE_URL` en Vercel.
3. En tu Mac: `psql` schema → 002 → 003 → `npm run db:migrate` → INSERT inventario.
4. Redeploy Vercel → verificar `/api/products`.
5. Stripe: claves test + webhook → pegar en Vercel → redeploy.
6. Smoke test completo (Parte F).
7. Cuando abras ventas reales: claves Stripe **live** + webhook live.

---

*Última actualización: junio 2026 · Fase 7 (modelo 003 + tienda funcional)*
