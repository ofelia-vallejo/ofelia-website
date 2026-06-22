# Modelo Entidad-Relación · Ofelia Vallejo Leather House

> Diseño del modelo de datos completo del e-commerce (catálogo → carrito → checkout → pedido → inventario → cliente), inspirado en el modelo de comercio canónico de **Shopify** y adaptado al tamaño real de esta Leather House: **mono-moneda CHF**, un atelier en **Medellín**, sin multi-tienda.
>
> - **Baseline (migración 001):** `database/schema.sql`
> - **Evolución (migración 002):** `database/migrations/002_full_commerce_model.sql` — aditiva, idempotente, NO destructiva.
> - **Tienda funcional (migración 003):** `database/migrations/003_functional_store.sql` — modelo operativo completo (impuestos, envíos, devoluciones, inventario operativo, gift cards, descuentos avanzados, canales). Aditiva, idempotente. **Ver §8 «v2 · Tienda funcional».**
> - **Capa de acceso:** `lib/postgres.js`
>
> **Convención de dinero:** `INTEGER` en **CHF enteros** (francos), igual que el código actual (`base_price_chf`, `total_chf`, `price_chf`). Stripe recibe céntimos (`× 100`) en `lib/build-stripe-lines.js`. Solo los **porcentajes** de descuento usan `NUMERIC`.

---

## 1 · Modelo actual (antes de la migración 002)

Tablas existentes en `database/schema.sql`:

| Tabla | Propósito | Notas |
|---|---|---|
| `categories` | Taxonomía primaria (Mujer/Guanábana, Hombre/Borojó…) | PK `id TEXT` |
| `products` | Producto del catálogo | PK `id TEXT`, `slug` único, precios CHF en `INT`, `inventory INT`, mucho JSONB (`engrave`, `color_data`, `accordion`, `specs`, `meta`) |
| `product_variants` | Variante = **color de cuero** | PK `id TEXT`, FK `product_id`, `sku`, `inventory INT`, `price_chf INT` opcional |
| `product_images` | Galería por producto/variante | PK `SERIAL`, `kind` (hero/gallery) |
| `orders` | Pedido | PK `id TEXT`, `stripe_session_id` único, `status`, `customer_id`, `total_chf INT`, **`line_items JSONB`**, `engrave_config JSONB` |
| `order_events` | Log crudo de eventos (Stripe) | idempotencia vía `payload->>'stripe_event_id'` |
| `customers` | Cuenta de cliente (JWT) | `email` único, `password_hash` |
| `personalization_requests` | Solicitudes de grabado (canal email) | `ref` único |
| `newsletter_subscribers` | Lista de correo + cupón lanzamiento | `coupon_code` default `OV-TEMPORADA` |

**Flujo actual:** el carrito es **client-side** (`assets/js/cart.js` + `localStorage`). `api/checkout/create.js` arma las líneas con `lib/build-stripe-lines.js`, crea la sesión Stripe y persiste el pedido con `createOrder()` (líneas en JSONB). El webhook (`api/checkout/webhook.js`) marca `paid`, descuenta inventario con `decrementInventory()` (sobre `product_variants.inventory` / `products.inventory`) y registra el evento. El historial del cliente sale de `getOrdersByCustomer()`.

**Limitaciones que resuelve la 002:** sin líneas de pedido normalizadas (solo JSONB), sin direcciones (cliente ni snapshot de pedido), sin transacciones de pago como entidad, sin ubicaciones/niveles de inventario, sin opciones de variante normalizadas, sin colecciones editoriales como entidad, sin cupones como entidad, sin carrito persistente, sin historial de estado ni envíos.

---

## 2 · Modelo nuevo (tras la migración 002)

### Entidades añadidas

| Bloque | Tablas nuevas | Extensiones a tablas existentes |
|---|---|---|
| Catálogo | `collections`, `product_collections`, `product_options`, `product_option_values`, `variant_option_values` | `product_variants` (+`barcode`, `weight_grams`, `compare_at_price_chf`, `requires_shipping`, `active`, `created_at`, `updated_at`) |
| Inventario | `locations`, `inventory_levels` | — |
| Clientes | `customer_addresses` | `customers` (+`accepts_marketing`, `default_address_id`, `last_login_at`, `orders_count`, `total_spent_chf`) |
| Carrito | `carts`, `cart_items` | — |
| Ventas | `order_line_items`, `order_addresses`, `order_status_history` | `orders` (+`subtotal_chf`, `discount_chf`, `shipping_chf`, `tax_chf`, `financial_status`, `fulfillment_status`, `coupon_code`, `cart_id`) |
| Pagos | `payments` | — |
| Logística | `fulfillments`, `fulfillment_line_items` | — |
| Descuentos | `discounts`, `order_discounts` | — |

---

## 3 · Diagrama ER (Mermaid)

```mermaid
erDiagram
    categories ||--o{ products : clasifica
    collections ||--o{ product_collections : agrupa
    products ||--o{ product_collections : pertenece
    products ||--o{ product_variants : tiene
    products ||--o{ product_images : muestra
    products ||--o{ product_options : define
    product_options ||--o{ product_option_values : ofrece
    product_variants ||--o{ variant_option_values : combina
    product_option_values ||--o{ variant_option_values : valor

    locations ||--o{ inventory_levels : almacena
    product_variants ||--o{ inventory_levels : stock

    customers ||--o{ customer_addresses : guarda
    customers ||--o{ carts : posee
    customers ||--o{ orders : realiza

    carts ||--o{ cart_items : contiene
    products ||--o{ cart_items : referencia
    product_variants ||--o{ cart_items : referencia
    carts ||--o| orders : convierte

    orders ||--o{ order_line_items : detalla
    orders ||--o{ order_addresses : envia
    orders ||--o{ payments : cobra
    orders ||--o{ order_status_history : registra
    orders ||--o{ fulfillments : despacha
    orders ||--o{ order_discounts : aplica

    products ||--o{ order_line_items : snapshot
    product_variants ||--o{ order_line_items : snapshot

    fulfillments ||--o{ fulfillment_line_items : incluye
    order_line_items ||--o{ fulfillment_line_items : envia
    locations ||--o{ fulfillments : origen

    discounts ||--o{ order_discounts : redime

    categories {
        text id PK
        text label
        int sort_order
    }
    collections {
        text id PK
        text slug UK
        text name
        int sort_order
        bool active
    }
    products {
        text id PK
        text slug UK
        text name
        text category_id FK
        int base_price_chf
        int engrave_price_chf
        int inventory
        bool active
        bool personalizable
    }
    product_collections {
        text product_id PK
        text collection_id PK
        int sort_order
    }
    product_variants {
        text id PK
        text product_id FK
        text sku
        text color_name
        int price_chf
        int inventory
        int weight_grams
        int compare_at_price_chf
        bool requires_shipping
    }
    product_options {
        text id PK
        text product_id FK
        text name
        int position
    }
    product_option_values {
        text id PK
        text option_id FK
        text value
        int position
    }
    variant_option_values {
        text variant_id PK
        text option_value_id PK
    }
    product_images {
        serial id PK
        text product_id FK
        text variant_id FK
        text url
        text kind
    }
    locations {
        text id PK
        text name
        text type
        text city
        bool is_default
    }
    inventory_levels {
        bigserial id PK
        text variant_id FK
        text location_id FK
        int available
        int reserved
        int on_hand
    }
    customers {
        text id PK
        text email UK
        text password_hash
        bool accepts_marketing
        int orders_count
        int total_spent_chf
    }
    customer_addresses {
        text id PK
        text customer_id FK
        text type
        bool is_default
        text line1
        text city
        text country
    }
    carts {
        text id PK
        text token UK
        text customer_id FK
        text status
        int subtotal_chf
        text coupon_code
        text converted_order_id FK
    }
    cart_items {
        text id PK
        text cart_id FK
        text product_id FK
        text variant_id FK
        int quantity
        int unit_price_chf
        bool engrave_enabled
    }
    orders {
        text id PK
        text stripe_session_id UK
        text stripe_payment_intent
        text status
        text customer_id
        int total_chf
        int subtotal_chf
        int discount_chf
        text financial_status
        text fulfillment_status
        jsonb line_items
    }
    order_line_items {
        bigserial id PK
        text order_id FK
        text product_id FK
        text variant_id FK
        text product_name
        text sku
        int quantity
        int unit_price_chf
        bool engrave_enabled
        text engrave_text
        int line_total_chf
    }
    order_addresses {
        bigserial id PK
        text order_id FK
        text type
        text line1
        text city
        text country
        text email
    }
    payments {
        text id PK
        text order_id FK
        text kind
        text status
        int amount_chf
        text stripe_payment_intent
        text stripe_event_id UK
    }
    order_status_history {
        bigserial id PK
        text order_id FK
        text from_status
        text to_status
    }
    fulfillments {
        text id PK
        text order_id FK
        text location_id FK
        text status
        text carrier
        text tracking_number
    }
    fulfillment_line_items {
        bigserial id PK
        text fulfillment_id FK
        bigint order_line_item_id FK
        int quantity
    }
    discounts {
        text id PK
        text code UK
        text type
        numeric value
        int min_subtotal_chf
        bool active
    }
    order_discounts {
        bigserial id PK
        text order_id FK
        text discount_id FK
        text code
        int amount_chf
    }
```

---

## 4 · Tabla por entidad (campos clave y propósito)

### Catálogo

**`collections`** — Colecciones editoriales de marca (Guanábana, Borojó, Uchuva, Chontaduro, Curuba). `slug` único para rutas; `sort_order`, `active`. Many-to-many con productos vía `product_collections` (un producto puede figurar en varias colecciones). `categories` sigue siendo la taxonomía primaria 1-a-muchos.

**`product_options` / `product_option_values`** — Ejes de variación normalizados. Hoy implícitos: **Color** (Negro, Rústico, Café Oscuro, Espresso, Vino, Verde), **Tamaño** (`v-standard`/`v-grande`), **Línea** (`v-mod`/`v-clasica`/`v-elite`). `position` ordena la presentación.

**`variant_option_values`** — Puente que mapea cada `product_variants` a su combinación de valores de opción (p.ej. variante `v-negro` ↔ valor «Negro» de la opción «Color»). PK compuesta.

**`product_variants` (extendida)** — Se añaden `barcode`, `weight_grams` (peso para envío), `compare_at_price_chf` (precio tachado), `requires_shipping`, `active`, `created_at/updated_at`. No se toca `inventory`/`price_chf` existentes.

### Inventario

**`locations`** — Ubicaciones físicas. Semilla: `loc-medellin` (Atelier Medellín, `is_default = true`). Tipos: atelier/warehouse/retail.

**`inventory_levels`** — Stock por **variante × ubicación**: `available`, `reserved`, `on_hand` (todos `CHECK >= 0`), `UNIQUE(variant_id, location_id)`. Es la capa normalizada destino del inventario. **Coexistencia:** hoy el stock real vive en `product_variants.inventory` y el webhook descuenta ahí; `inventory_levels` queda lista para el corte (ver §7 Próximos pasos).

### Clientes

**`customers` (extendida)** — Se añaden `accepts_marketing`, `default_address_id`, `last_login_at`, `orders_count`, `total_spent_chf` (métricas tipo Shopify Customer).

**`customer_addresses`** — Libreta de direcciones del cliente (`type` = shipping/billing, `is_default`). País por defecto `CH` (mercado europeo).

### Carrito

**`carts` / `cart_items`** — Carrito **persistente opcional** para abandono/recuperación/multi-dispositivo. `token` sincronizable con el id de `localStorage`; `status` = active/converted/abandoned; `converted_order_id` enlaza al pedido resultante. **No reemplaza** el carrito client-side actual.

### Ventas / Pedidos

**`orders` (extendida)** — Desgloses `subtotal_chf`, `discount_chf`, `shipping_chf`, `tax_chf`; estados separados estilo Shopify: `financial_status` (pending/paid/refunded/voided) y `fulfillment_status` (unfulfilled/partial/fulfilled); `coupon_code`, `cart_id`. La columna `line_items JSONB` y `status` originales se conservan intactas (el webhook sigue funcionando).

**`order_line_items`** — Líneas normalizadas. FKs `product_id`/`variant_id` con `ON DELETE SET NULL` + **columnas snapshot** (`slug`, `product_name`, `variant_label`, `sku`, `unit_price_chf`) para que el historial sobreviva al borrado de catálogo. **Grabado a nivel de línea**: `engrave_enabled`, `engrave_text`, `engrave_font`, `engrave_size`, `engrave_layout`, `engrave_price_chf`. `line_total_chf` = `(unit_price + engrave_price) × quantity`.

**`order_addresses`** — Snapshot inmutable de la dirección de envío/facturación al momento de compra. `UNIQUE(order_id, type)`.

**`order_status_history`** — Transiciones de estado de negocio (`from_status` → `to_status`, `note`). Complementa el log crudo `order_events`.

### Pagos

**`payments`** — Transacciones Stripe (`kind` = charge/refund/authorization, `status`, `amount_chf`, `stripe_session_id`, `stripe_payment_intent`). `stripe_event_id UNIQUE` formaliza la **idempotencia** del webhook (hoy en `order_events.payload`).

### Logística

**`fulfillments` / `fulfillment_line_items`** — Envíos: `location_id` de origen, `carrier`, `tracking_number`, `tracking_url`, `shipped_at`, `delivered_at`. Cada cumplimiento detalla qué líneas y cantidades despacha.

### Descuentos

**`discounts`** — Cupones: `code` único, `type` (percentage/fixed_amount), `value NUMERIC`, `min_subtotal_chf`, vigencia (`starts_at`/`ends_at`), `usage_limit`/`used_count`, `once_per_customer`. Semilla: `OV-TEMPORADA` (10%). **`order_discounts`** — Aplicación por pedido con snapshot de `code` e `amount_chf`.

---

## 5 · Flujo de datos de punta a punta

```
CATÁLOGO            categories / collections → products → product_variants (+options) → product_images
   │                                              │
   │ navegación PDP                               │ stock: inventory_levels (variante × location)
   ▼                                              ▼
CARRITO          assets/js/cart.js (localStorage)  ──opcional──▶  carts / cart_items
   │                                                                     │
   │ POST /api/checkout/create                                           │
   ▼                                                                     │
CHECKOUT (Stripe)  build-stripe-lines.js arma líneas + total CHF ◀───────┘
   │               crea Checkout Session · createOrder() persiste el pedido (line_items JSONB)
   │               [nuevo] order_line_items + order_addresses + payments(pending) + order_discounts
   ▼
WEBHOOK            POST /api/checkout/webhook  (idempotente por stripe_event_id)
   │               financial_status = paid · payments(paid) · order_status_history(pending→paid)
   ▼
INVENTARIO         decrementInventory() por cada línea (variante/cantidad)
   │               [destino] inventory_levels.available -= qty en loc-medellin
   ▼
CUMPLIMIENTO       fulfillments + fulfillment_line_items · fulfillment_status
   ▼
CLIENTE            getOrdersByCustomer() · orders.customer_id · orders_count / total_spent_chf
```

---

## 6 · Inspiración Shopify → equivalente en este proyecto

| Concepto Shopify | Equivalente aquí | Notas de adaptación |
|---|---|---|
| `Product` | `products` | Igual. Mantiene JSONB de copy/ficha. |
| `ProductVariant` | `product_variants` | Variante = color de cuero (+ opciones normalizadas). |
| `ProductOption` / `OptionValue` | `product_options` / `product_option_values` / `variant_option_values` | Color, Tamaño, Línea. |
| `Collection` | `collections` + `product_collections` | Colecciones editoriales paisas (Guanábana…). `categories` queda como taxonomía primaria. |
| `Media` / `Image` | `product_images` | Igual (baseline). |
| `InventoryItem` | `product_variants` (rol implícito) | Pragmático: no se crea tabla aparte; la variante es el item. |
| `InventoryLevel` | `inventory_levels` | available/reserved/on_hand por ubicación. |
| `Location` | `locations` | Un atelier (Medellín). Sin multi-tienda. |
| `Customer` | `customers` | + métricas (orders_count, total_spent). |
| `MailingAddress` | `customer_addresses` + `order_addresses` | Libreta del cliente + snapshot por pedido. |
| `Cart` / `Checkout` | `carts` / `cart_items` | Opcional server-side; el carrito real sigue en localStorage. |
| `Order` | `orders` | + financial/fulfillment status, desgloses. |
| `LineItem` | `order_line_items` | Con snapshots + grabado a nivel de línea. |
| `Transaction` / `OrderTransaction` | `payments` | Stripe charge/refund, idempotencia por event_id. |
| `Fulfillment` | `fulfillments` / `fulfillment_line_items` | Carrier, tracking. |
| `DiscountCode` / `PriceRule` | `discounts` / `order_discounts` | Modela `OV-TEMPORADA`. |
| `Order events / timeline` | `order_status_history` (+ `order_events` baseline) | Negocio vs. log crudo. |
| `Metafields` / `Metaobjects` | columnas `JSONB` (`engrave`, `color_data`, `accordion`, `specs`, `meta`) | El proyecto ya usa JSONB para datos flexibles; no se necesita el sistema de metafields de Shopify. |

> **Por qué NO se clonó todo Shopify:** sin multi-moneda (solo CHF), sin multi-tienda, sin tablas de `Shop`/`Market`/`PriceList`, sin `InventoryItem` separado de la variante, sin `DraftOrder`. El objetivo es un modelo limpio, normalizado y a la medida de la marca.

---

## 8 · v2 · Tienda funcional (migración 003)

> La 002 fue deliberadamente **pragmática** (no un clon de Shopify). La **003** completa las áreas operativas que faltaban para operar una tienda real, manteniéndolo como **Postgres propio** (Shopify es solo la referencia del modelo relacional). Sigue siendo **aditiva, idempotente y mono-moneda CHF**, y respeta el namespacing de PK de variante `<product_id>::<variant_id>`.

### 8.1 · Entidades nuevas por área

| Área | Tablas nuevas | Extensiones a tablas existentes |
|---|---|---|
| **Productos** | `product_tags`, `product_media`, `metafields` | `products` (+`vendor`, `product_type`, `status`, `seo_title`, `seo_description`, `published_at`) |
| **Precios** | `price_lists`, `price_list_prices` | — (`compare_at_price_chf` ya existía en `product_variants` desde 002) |
| **Impuestos** | `tax_zones`, `tax_rates`, `order_tax_lines` | — |
| **Envíos** | `shipping_zones`, `shipping_rates`, `order_shipping_lines` | — (pickup vía `shipping_rates.location_id` → `locations`) |
| **Inventario** | `inventory_adjustments` (libro mayor) | `inventory_levels` (+`incoming`) |
| **Pedidos** | `draft_orders`, `draft_order_line_items`, `refunds`, `refund_line_items`, `returns`, `return_line_items`, `order_risks`, `order_tags` | `orders` (+`note`, `channel_id`, `refunded_chf`, `cancelled_at`, `cancel_reason`) |
| **Clientes** | `customer_tags`, `customer_segments`, `customer_segment_members`, `gift_cards`, `gift_card_transactions` | `customers` (+`email_marketing_consent_at`) |
| **Descuentos** | `discount_conditions` | `discounts` (+`method`, `target_type`, `priority`) |
| **Operación** | `sales_channels`, `staff_users`, `audit_log` | — |

**Seeds incluidos (idempotentes):** `tax-ch-vat` (TVA Suiza 8.1%, incluida en precio), zonas de envío `sz-ch`/`sz-eu`, tarifas `rate-ch-standard` (15 CHF, gratis ≥500), `rate-eu-standard` (25 CHF, gratis ≥700) y `rate-pickup-atelier` (retiro en `loc-medellin`, 0 CHF), lista de precio `pl-public`, canales `ch-web` y `ch-atelier`.

### 8.2 · Tabla por entidad nueva

#### Productos
- **`product_tags`** — Etiquetas libres (Shopify `Product.tags`) como puente normalizado `(product_id, tag)` para filtrado/búsqueda.
- **`product_media`** — Media enriquecida: `media_type` = image/video/external_video/model_3d. Coexiste con `product_images` (galería baseline), no la reemplaza.
- **`metafields`** — Datos personalizados tipados clave/valor por entidad (`owner_type` = product/variant/customer/order/collection, `namespace`, `key`, `value`, `value_type`). `UNIQUE(owner_type, owner_id, namespace, key)`. Patrón canónico de Shopify Metafield (el proyecto ya usa JSONB para fichas; esto añade extensión tipada por entidad).

#### Precios
- **`price_lists` / `price_list_prices`** — Precios por contexto (mayorista/staff/campaña) sin tocar el precio base de la variante. CHF como única moneda; `currency` queda por extensibilidad. `price_chf` y `compare_at_price_chf` por variante.

#### Impuestos
- **`tax_zones`** — Agrupación de países (`countries TEXT[]`). Semilla `tz-ch` (CH, LI).
- **`tax_rates`** — `rate NUMERIC(6,3)` (8.1 ⇒ 8.1%), `country` para lookup directo, `included_in_price` (B2C europeo IVA incluido). Semilla TVA Suiza.
- **`order_tax_lines`** — Snapshot del impuesto aplicado por pedido/línea (Shopify `TaxLine`): `title`, `rate`, `amount_chf`.

#### Envíos
- **`shipping_zones`** — Países por zona. Semillas `sz-ch`, `sz-eu`.
- **`shipping_rates`** — Método de entrega: `method` = shipping/pickup, `location_id` (pickup en atelier), `price_chf`, `free_over_chf` (umbral de envío gratis), días estimados.
- **`order_shipping_lines`** — Tarifa materializada en el pedido (`title`, `carrier`, `method`, `price_chf`).

#### Inventario operativo
- **`inventory_levels` (+`incoming`)** — Suma stock entrante a los `available`/`reserved`/`on_hand` ya existentes.
- **`inventory_adjustments`** — **Libro mayor inmutable** (Shopify `InventoryAdjustmentGroup`): cada variación de stock con `delta`, `reason` (sale/restock/manual/return/reservation/release/correction), `quantity_after`, y referencia al documento origen (`reference_type`/`reference_id`).

#### Pedidos (ciclo completo)
- **`draft_orders` / `draft_order_line_items`** — Pedidos/cotizaciones manuales del atelier (Shopify `DraftOrder`). `converted_order_id` enlaza al pedido real al confirmarse.
- **`refunds` / `refund_line_items`** — Reembolsos (Shopify `Refund`). Reutiliza `payments` (kind=`refund`); `restock` por línea controla reposición.
- **`returns` / `return_line_items`** — Devoluciones físicas / RMA (Shopify `Return`): `status` (requested→…→closed), `rma`, condición de cada ítem; `refund_id` enlaza el reembolso resultante.
- **`order_risks`** — Evaluación de fraude opcional (Shopify `OrderRisk`).
- **`order_tags`** — Etiquetas de pedido.
- **`orders` (extendida)** — `note`, `channel_id` (ref. suelta a `sales_channels`, igual que `customer_id`), `refunded_chf`, `cancelled_at`, `cancel_reason`.

#### Clientes
- **`customer_tags`** — Etiquetas de cliente.
- **`customer_segments` / `customer_segment_members`** — Segmentos para campañas (Shopify `Segment`).
- **`gift_cards` / `gift_card_transactions`** — Tarjetas regalo con saldo CHF y libro mayor (negativo = redime, positivo = emite/recarga/reembolsa).
- **`customers` (+`email_marketing_consent_at`)** — Fecha de consentimiento de marketing (complementa `accepts_marketing` de 002).

#### Descuentos
- **`discounts` (extendida)** — `method` (code/automatic), `target_type` (order/shipping = envío gratis), `priority`. El tipo `free_shipping` se modela con `target_type='shipping'` (no se fuerza CHECK nuevo sobre la columna heredada).
- **`discount_conditions`** — Restricciones: `condition_type` = collection/product/variant/min_quantity/min_subtotal, con `ref_id`/`int_value`.

#### Operación
- **`sales_channels`** — Web vs. atelier (POS). Semillas `ch-web`, `ch-atelier`.
- **`staff_users`** — Equipo del panel admin (owner/admin/staff).
- **`audit_log`** — Bitácora de acciones del admin (`action`, `entity_type`, `entity_id`, `detail JSONB`).

### 8.3 · Diagrama ER actualizado (v2 · solo entidades nuevas y sus enlaces)

> Para no duplicar el diagrama de §3 (catálogo↔carrito↔pedido↔pago↔inventario), este muestra las **entidades nuevas de la 003** y cómo se conectan a las existentes.

```mermaid
erDiagram
    products ||--o{ product_tags : etiqueta
    products ||--o{ product_media : muestra
    products ||--o{ metafields : extiende
    product_variants ||--o{ price_list_prices : precio
    price_lists ||--o{ price_list_prices : define

    tax_zones ||--o{ tax_rates : agrupa
    orders ||--o{ order_tax_lines : grava
    order_line_items ||--o{ order_tax_lines : grava

    shipping_zones ||--o{ shipping_rates : ofrece
    locations ||--o{ shipping_rates : pickup
    orders ||--o{ order_shipping_lines : envia
    shipping_rates ||--o{ order_shipping_lines : aplica

    product_variants ||--o{ inventory_adjustments : ajusta
    locations ||--o{ inventory_adjustments : en

    orders ||--o{ refunds : reembolsa
    payments ||--o{ refunds : via
    refunds ||--o{ refund_line_items : detalla
    order_line_items ||--o{ refund_line_items : reembolsa
    orders ||--o{ returns : devuelve
    returns ||--o| refunds : genera
    returns ||--o{ return_line_items : detalla
    order_line_items ||--o{ return_line_items : devuelve
    orders ||--o{ order_risks : evalua
    orders ||--o{ order_tags : etiqueta
    draft_orders ||--o{ draft_order_line_items : detalla
    draft_orders ||--o| orders : convierte

    customers ||--o{ customer_tags : etiqueta
    customers ||--o{ customer_segment_members : pertenece
    customer_segments ||--o{ customer_segment_members : agrupa
    customers ||--o{ gift_cards : posee
    gift_cards ||--o{ gift_card_transactions : registra

    discounts ||--o{ discount_conditions : condiciona

    sales_channels ||--o{ orders : origina
    staff_users ||--o{ audit_log : registra

    product_tags {
        text product_id PK
        text tag PK
    }
    product_media {
        bigserial id PK
        text product_id FK
        text variant_id FK
        text media_type
        text url
    }
    metafields {
        bigserial id PK
        text owner_type
        text owner_id
        text namespace
        text key
        text value
        text value_type
    }
    price_lists {
        text id PK
        text name
        text currency
        bool active
    }
    price_list_prices {
        bigserial id PK
        text price_list_id FK
        text variant_id FK
        int price_chf
    }
    tax_zones {
        text id PK
        text name
        text_array countries
    }
    tax_rates {
        text id PK
        text zone_id FK
        text country
        numeric rate
        bool included_in_price
    }
    order_tax_lines {
        bigserial id PK
        text order_id FK
        bigint order_line_item_id FK
        numeric rate
        int amount_chf
    }
    shipping_zones {
        text id PK
        text name
        text_array countries
    }
    shipping_rates {
        text id PK
        text zone_id FK
        text method
        text location_id FK
        int price_chf
        int free_over_chf
    }
    order_shipping_lines {
        bigserial id PK
        text order_id FK
        text shipping_rate_id FK
        text method
        int price_chf
    }
    inventory_adjustments {
        bigserial id PK
        text variant_id FK
        text location_id FK
        int delta
        text reason
        text reference_type
        text reference_id
    }
    draft_orders {
        text id PK
        text customer_id FK
        text status
        int total_chf
        text converted_order_id FK
    }
    draft_order_line_items {
        bigserial id PK
        text draft_order_id FK
        text variant_id FK
        int quantity
        int line_total_chf
    }
    refunds {
        text id PK
        text order_id FK
        text payment_id FK
        int amount_chf
        text reason
        bool restock
    }
    refund_line_items {
        bigserial id PK
        text refund_id FK
        bigint order_line_item_id FK
        int quantity
        int amount_chf
    }
    returns {
        text id PK
        text order_id FK
        text rma UK
        text status
        text refund_id FK
    }
    return_line_items {
        bigserial id PK
        text return_id FK
        bigint order_line_item_id FK
        int quantity
        text condition
    }
    order_risks {
        bigserial id PK
        text order_id FK
        text level
        numeric score
    }
    order_tags {
        text order_id PK
        text tag PK
    }
    customer_tags {
        text customer_id PK
        text tag PK
    }
    customer_segments {
        text id PK
        text name
    }
    customer_segment_members {
        text segment_id PK
        text customer_id PK
    }
    gift_cards {
        text id PK
        text code UK
        int balance_chf
        text status
    }
    gift_card_transactions {
        bigserial id PK
        text gift_card_id FK
        int amount_chf
    }
    discount_conditions {
        bigserial id PK
        text discount_id FK
        text condition_type
        text ref_id
        int int_value
    }
    sales_channels {
        text id PK
        text name
        text type
    }
    staff_users {
        text id PK
        text email UK
        text role
    }
    audit_log {
        bigserial id PK
        text staff_user_id FK
        text action
        text entity_type
    }
```

### 8.4 · Flujo operativo completo (catálogo → … → devolución)

```
CATÁLOGO        products (status/vendor/SEO/tags/metafields) → variants → product_media / product_images
   │            colecciones (002) · price_lists (precio por contexto)
   ▼
PRECIO+IMPUESTO precio variante (CHF) → calculateTax(subtotal, país) → tax_rates (TVA CH 8.1%) → order_tax_lines
   ▼
CARRITO         assets/js/cart.js (localStorage) ──opcional──▶ carts / cart_items
   │            [reserva] inventory_levels.reserved (committed) + inventory_adjustments(reason=reservation)
   ▼
CHECKOUT        build-stripe-lines.js + evaluateDiscount (discounts/discount_conditions) →
   │            listShippingRates(país, subtotal) → order_shipping_lines · createOrderWithDetails()
   ▼
PAGO            Stripe → webhook confirmOrderPaid(): orders→paid · payments(paid) · order_status_history
   ▼
PEDIDO          orders (+note/tags/channel_id) · order_line_items · order_addresses · order_tax_lines
   ▼
FULFILLMENT     fulfillments / fulfillment_line_items (002) · order_shipping_lines (envío o pickup atelier)
   ▼
INVENTARIO      decrementInventoryLevel() (002) + inventory_adjustments(reason=sale, ref=order)
   ▼
DEVOLUCIÓN      returns / return_line_items (RMA) → createRefund(): refunds + refund_line_items +
   │            payments(kind=refund) + inventory_adjustments(reason=return) + orders.refunded_chf/financial_status
   ▼
CLIENTE         customers (tags/segmentos/orders_count/total_spent) · gift_cards (saldo CHF)
```

### 8.5 · Mapeo «Objeto Shopify → tabla aquí» (v2)

| Objeto Shopify Admin | Equivalente aquí | Notas |
|---|---|---|
| `Product` (status/vendor/productType/SEO) | `products` (campos 003) | `slug` = `handle`. |
| `Product.tags` | `product_tags` | Puente normalizado. |
| `Media` (Video/Model3d) | `product_media` | `product_images` queda como galería. |
| `Metafield` / `Metaobject` | `metafields` | Clave/valor tipado por entidad. JSONB sigue para fichas grandes. |
| `PriceList` | `price_lists` / `price_list_prices` | Mono-moneda CHF, extensible. |
| `TaxLine` / tax settings | `tax_zones` / `tax_rates` / `order_tax_lines` | TVA Suiza 8.1% incluida en precio. |
| `DeliveryProfile` / `ShippingRate` / `DeliveryMethod` | `shipping_zones` / `shipping_rates` / `order_shipping_lines` | Pickup = `method='pickup'` + `location_id`. |
| `InventoryLevel` (incoming) | `inventory_levels.incoming` | available/reserved/on_hand/incoming. |
| `InventoryAdjustmentGroup` / changes | `inventory_adjustments` | Libro mayor con motivo y referencia. |
| `DraftOrder` | `draft_orders` / `draft_order_line_items` | Venta manual / cotización. |
| `Refund` | `refunds` / `refund_line_items` | Reutiliza `payments` (kind=refund). |
| `Return` (RMA) | `returns` / `return_line_items` | Estado y condición por ítem. |
| `OrderRisk` | `order_risks` | Opcional. |
| `Order.note` / `Order.tags` / cancel | `orders` (003) + `order_tags` | — |
| `Customer.tags` / `Segment` | `customer_tags` / `customer_segments` (+members) | — |
| `GiftCard` | `gift_cards` / `gift_card_transactions` | Saldo CHF + ledger. |
| `DiscountAutomatic` / `DiscountCode` | `discounts.method` + `discount_conditions` | code vs. automatic; free shipping = `target_type='shipping'`. |
| `Channel` / `Publication` | `sales_channels` | web / atelier. |
| `StaffMember` | `staff_users` | — |
| `Events` (admin) | `audit_log` | Bitácora del panel. |

### 8.6 · Helpers añadidos en `lib/postgres.js` (003 · aditivos)

| Helper | Propósito |
|---|---|
| `getTaxRate(country)` | Fila `tax_rates` por país (ISO-2). |
| `calculateTax(subtotalChf, country)` | Impuesto en CHF enteros (extrae IVA si `included_in_price`, si no lo añade). |
| `listShippingRates(country, subtotalChf)` | Tarifas aplicables (incluye pickup); aplica `free_over_chf`. |
| `recordInventoryMovement(m, exec)` | Escribe en `inventory_adjustments` y ajusta `inventory_levels` + espejo en variante. Componible en tx. |
| `createRefund(refund)` | Transaccional: `refunds` + `refund_line_items` + `payments(refund)` + reposición de stock + `orders.refunded_chf`/`financial_status` + historial. |
| `setMetafield` / `getMetafields` | Upsert/lectura de metafields por entidad. |

> Ninguno reescribe funciones existentes. Todos degradan suave (devuelven valor seguro / no lanzan) si la tabla aún no existe o falta `DATABASE_URL`.

---

## 7 · Próximos pasos

### A) Aplicar a la base de datos
```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/002_full_commerce_model.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/003_functional_store.sql
```
> Ambas idempotentes y re-ejecutables; aplicar **002 antes de 003**. **No** usar el splitter de `scripts/db-migrate.js` para estos archivos (solo lee `schema.sql` y filtra sentencias que empiezan por `--`).

### B) Helpers ya añadidos en `lib/postgres.js` (solo lectura, aditivos)
- `getProductVariants(productId)` · `getVariantById(variantId)`
- `listLocations()` · `getInventoryLevels(variantId)`
- `findDiscountByCode(code)`

### C) Helpers / cambios pendientes (mayor riesgo — no implementados aún)
1. **Escritura de `order_line_items` / `order_addresses` / `payments`** en `api/checkout/create.js` y `webhook.js`, en paralelo al `line_items JSONB` actual (doble escritura hasta cortar). 
2. **Corte de inventario a `inventory_levels`:** primero migrar `lib/postgres.saveCatalogToPostgres()` de *DELETE+INSERT* de variantes a **UPSERT** (`ON CONFLICT (id) DO UPDATE`), porque hoy borra y recrea las variantes en cada guardado — lo que con `ON DELETE CASCADE` vaciaría `inventory_levels`. Tras eso, `decrementInventory()` puede operar sobre `inventory_levels.available` en `loc-medellin`.
3. **Validación de cupones server-side:** endpoint que use `findDiscountByCode()` + reglas (`min_subtotal_chf`, vigencia, `usage_limit`) y escriba `order_discounts`. Hoy `OV-TEMPORADA` solo se entrega por `lib/newsletter.js` y no se valida en el checkout.
4. **Backfill:** poblar `order_line_items` desde `orders.line_items` (JSONB) y `inventory_levels` desde `product_variants.inventory` para datos históricos.
5. **Sincronizar `customers.orders_count` / `total_spent_chf`** al marcar `paid` (trigger o en el webhook).

### D) Cableado pendiente de la tienda funcional (migración 003)
1. **Impuestos en checkout:** llamar `calculateTax(subtotal, país)` en `api/checkout/create.js` y persistir `order_tax_lines` (hoy Stripe Tax/manual no está cableado; el total persistido aún no incluye IVA desglosado).
2. **Envío en checkout:** exponer `listShippingRates(país, subtotal)` en el frontend/checkout, persistir `order_shipping_lines` y reflejar el coste en la sesión de Stripe (`shipping_options`). Soportar selección de **pickup en atelier** (`rate-pickup-atelier`).
3. **Devoluciones/reembolsos:** conectar `createRefund()` a un endpoint admin y al evento Stripe `charge.refunded` en `webhook.js` (hoy el helper existe pero no hay ruta que lo invoque).
4. **Inventario operativo:** invocar `recordInventoryMovement()` desde `confirmOrderPaid()` (motivo `sale`) y desde restock/manual del admin, para poblar el libro mayor `inventory_adjustments` (hoy solo se descuenta `inventory_levels` sin asentar el movimiento).
5. **Descuentos avanzados:** evaluar `discount_conditions` y descuentos `automatic` en `lib/discounts.js` (hoy `evaluateDiscount` solo cubre código + mínimo de subtotal).
6. **Draft orders / gift cards / segmentos:** UI de admin para crear cotizaciones, emitir/redimir gift cards y armar segmentos (tablas listas, sin endpoints aún).
7. **Backfill opcional:** poblar `inventory_adjustments` con un asiento inicial (`reason=restock`) por el stock vigente, y `product_media` desde `product_images`.

---

*Diseño: migración 002 · aditiva e idempotente sobre `database/schema.sql`. No elimina ni reescribe nada existente.*
