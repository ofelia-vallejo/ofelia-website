# Panel de administración · Ofelia Vallejo Leather House

> Panel interno para que la dueña gestione el catálogo, el inventario, los pedidos
> y los cupones **sin tocar código y sin poder dejar la base en un estado inválido**.
> Respeta la paleta y tipografía de marca (Cinzel + Helvetica light, navy/marfil).

## Arquitectura

```
admin/ (UI Vanilla JS)
  ↓  Authorization: Bearer <JWT>
api/admin/[action].js  →  _login | _status | _products | _inventory | _orders | _discounts | _categories | _upload
  ↓  requireAdmin + requireDatabase + zod (lib/validation.js)
lib/postgres.js  →  queries parametrizadas
  ↓
PostgreSQL
```

La dueña **nunca ejecuta SQL** ni modifica el esquema: solo formularios validados server-side.

- **Front:** `admin/index.html` · `admin/admin.js` · `admin/admin.css` (HTML + Vanilla JS, sin frameworks).
- **API:** `api/admin/[action].js` (router de una sola Serverless Function) → sub-handlers.
- **Acceso:** `/admin`. Login con contraseña (`ADMIN_PASSWORD`) → token JWT firmado (`lib/auth.js`, **7 días** en `localStorage`). **Todas** las rutas admin exigen `Authorization: Bearer <token>` (`requireAdmin`).

---

## Secciones

| Sección | Qué puede hacer la dueña | Endpoint |
|---|---|---|
| **Inicio (dashboard)** | Resumen: pedidos recientes, stock bajo (&lt; 3 uds.), accesos rápidos. | `/api/admin/status` |
| **Productos** | Crear / editar / archivar piezas; variantes (color, SKU, precio CHF, stock); estado (borrador/activo/archivado); SEO; fotos. Slug sugerido al crear. | `/api/admin/products` |
| **Inventario** | Ver y ajustar stock por variante en **Atelier Medellín** (+/− o número), capa real `inventory_levels`. | `/api/admin/inventory` |
| **Pedidos** | Ver pedidos, detalle (líneas, envío, impuesto, total CHF) y **registrar reembolsos** (con reposición de stock). | `/api/admin/orders` |
| **Cupones** | Crear / editar / eliminar descuentos (porcentaje o monto fijo; mínimo de subtotal). | `/api/admin/discounts` |
| **Secciones** | Orden, título, columnas y visibilidad de las categorías en `/coleccion`. | `/api/admin/categories` |

---

## Login y sesión

- URL: **`https://ofeliavallejo.com/admin`** (o `/admin` en local con `npm run dev:local`).
- Contraseña: variable **`ADMIN_PASSWORD`** en Vercel (Environment Variables). También **`ADMIN_SECRET`** para firmar el JWT (si falta, usa `ADMIN_PASSWORD`).
- Token guardado en `localStorage` (`ov_admin_token`), expira a los **7 días**.
- Errores en español: «Contraseña incorrecta», «Sesión expirada», «Acceso no disponible» (prod sin `ADMIN_PASSWORD`).
- Cerrar sesión: botón visible en la barra lateral.

---

## Base de datos obligatoria

El panel admin **solo opera contra PostgreSQL** (`DATABASE_URL`). Si falta la variable, la API responde **503** con «Base de datos no configurada» y el panel muestra un aviso superior — no cae silenciosamente a `catalog.json`.

El checkout valida stock contra **`inventory_levels`** vía `getVariantAvailable()` antes de crear la sesión Stripe (rechaza con «sin stock suficiente»).

---

## Cómo se impide "romper la estructura"

Toda mutación pasa por **validación server-side con `zod`** (`lib/validation.js`) antes de
tocar la base. Los errores se devuelven en español y legibles (campo + mensaje) para una
usuaria no técnica. Reglas clave:

- **Dinero como INT CHF** y **nunca negativo** (`basePrice`, `engravePrice`, `priceCHF`, valores de cupón).
- **Slug/handle** limpio (`^[a-z0-9]+(-[a-z0-9]+)*$`) y **único** entre productos.
- **Categoría (FK) válida**: no se permite asignar una categoría inexistente.
- **SKU único** dentro de un mismo producto (no se rompe la identidad de variante).
- **Stock nunca negativo**: en modo "fijar" se rechaza un valor negativo; en modo "delta" se acota a 0.
- **Estado válido**: `draft | active | archived` (status manda; `active` se deriva, controla la visibilidad pública).
- **Color hex** válido; porcentajes de descuento ≤ 100; fechas de cupón coherentes.
- **Reembolso** acotado: no se puede reembolsar más de lo cobrado.
- **Namespacing de variante** `<product_id>::<variant_id>` respetado en todo momento.
- El panel **nunca ejecuta SQL arbitrario**: solo helpers parametrizados de `lib/postgres.js`.

### Integridad JSONB (corrección incluida)

Las columnas JSONB de producto (`engrave`, `color_data`, `accordion`, `specs`, `meta`,
`description_paragraphs`) se guardaban con doble codificación y **cada guardado añadía otra
capa de string** (corrupción acumulativa). Ahora se escriben con `db.json()` (objeto/array
real) y se **sanan al leer** (`parseJsonbDeep`), de modo que cualquier edición desde el panel
deja el dato limpio en lugar de corromperlo.

### Inventario con libro mayor

Los ajustes de stock del panel operan sobre `inventory_levels` (la capa real que usa el
corte de stock en checkout), mantienen el espejo `product_variants.inventory` y dejan un
asiento en `inventory_adjustments` (motivo `manual`/`correction`). El pago asienta `sale`
y el reembolso con reposición asienta `return`.

---

## Pruebas realizadas (DB local)

Contra `postgres://…/ofelia` con `npm run dev:local`:

- Login admin y rechazo sin token (401).
- Crear producto con variante+precio+stock; **rechazos**: precio negativo, slug duplicado, categoría inexistente, SKU duplicado, stock negativo.
- Editar producto preservando campos ocultos (engrave, etc.) y sanando el JSONB.
- Ajuste de inventario (set/delta) sobre `inventory_levels` + libro mayor; sin negativos; baseline coherente (108 unidades).
- Cupones CRUD + condición `min_subtotal`; el catálogo público refleja borradores ocultos.
- **Checkout (capa de datos):** impuesto TVA 8.1% incluido (75 CHF sobre 1000), envío (pickup 0 / estándar 15 / gratis ≥500), persistencia de `order_tax_lines` y `order_shipping_lines`.
- **Pago → inventario:** `confirmOrderPaid` descuenta exactamente 1 (sin duplicar) y asienta `sale`.
- **Reembolso:** restock repone el stock (2→1→2), `orders.refunded_chf`/`financial_status` correctos, asiento `return`; rechazo de sobre-reembolso.

> Stripe no está configurado en local (checkout HTTP responde 503 por diseño); la lógica de
> impuestos/envío/descuento/reembolso se validó a nivel de capa de datos y endpoints admin.
