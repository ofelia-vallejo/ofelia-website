# Atelier — Catálogo, inventario y panel admin

Sistema para gestionar **productos, fotos, precios, grabado adicional e inventario** sin editar código.

---

## Arquitectura

| Capa | Qué hace |
|------|----------|
| `data/catalog.json` | Catálogo base (siempre en el repo, lectura por defecto) |
| **Vercel Blob** | Catálogo activo + fotos subidas desde el admin (producción) |
| `/api/products` | API pública — web y configurador |
| `/api/admin/*` | API privada — panel admin |
| `/admin/` | Interfaz visual (login, productos, inventario, fotos) |
| **Estudio** | `personalizar.html` — tipografía, tamaño, diseño, precios |

---

## 1. Variables en Vercel

En el proyecto Vercel → **Settings → Environment Variables**:

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `ADMIN_PASSWORD` | Sí | Contraseña del panel `/admin/` |
| `ADMIN_SECRET` | Recomendado | Firma de sesión (string largo aleatorio) |
| `BLOB_READ_WRITE_TOKEN` | Sí (prod) | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — guardar catálogo y fotos |
| `SMTP_*` / `EMAIL_TO` | Opcional | Emails de solicitudes (ya existente) |

**Desarrollo local** (guardar en archivo sin subir a git):

```bash
# .env.local
ADMIN_PASSWORD=tu-clave-segura
ADMIN_SECRET=string-aleatorio-largo
STORE_MODE=file
```

Con `STORE_MODE=file` los cambios del admin se escriben en `data/catalog.json` en tu máquina.

---

## 2. Crear Blob en Vercel

1. Dashboard del proyecto → **Storage** → **Create Database** → **Blob**
2. Conectar al proyecto → se crea `BLOB_READ_WRITE_TOKEN` automáticamente
3. Redeploy

La primera vez que guardes un producto en producción, el catálogo se copia a `ofelia/catalog.json` en Blob.

---

## 3. Panel admin

URL: **`https://tu-dominio.com/admin/`**

- **Productos** — nombre, descripciones, precios CHF, grabado adicional, categoría, activo/inactivo
- **Fotos** — arrastrar JPG/PNG/WebP (máx. 4 MB) por producto
- **Variantes** — color, SKU, stock por color
- **Inventario** — vista rápida y ajuste de unidades

Contraseña: la de `ADMIN_PASSWORD`.

---

## 4. Precios y grabado

Cada producto en el catálogo tiene:

- `basePrice` — precio de la pieza (CHF)
- `engravePrice` — **suplemento** por grabado láser (CHF), según tipo de producto

El **configurador** en Personalizar suma ambos cuando hay texto de grabado.

Edita estos valores en el admin; la web los lee desde `/api/products`.

---

## 5. Inventario

- **Stock total** — campo `inventory` si no hay variantes
- **Por color** — variantes con `inventory` cada una
- Alerta **stock bajo** cuando unidades ≤ `lowStockAt` (por defecto 2)

El admin muestra badges: OK · Bajo · Agotado.

---

## 6. API pública (referencia)

```http
GET /api/products
GET /api/products?slug=travel-bag-i
```

Respuesta incluye `products[]` con imágenes, variantes, `engrave`, precios.

---

## 7. Próximo paso (opcional)

- Migrar a **Supabase/Postgres** si necesitáis pedidos, usuarios y stock en tiempo real multi-usuario
- Colección 100 % generada desde API (hoy las tarjetas son HTML estático; precios y stock se hidratan desde `/api/products` vía `coleccion-live.js`)
- Pasarela de pago (Stripe) con total pieza + grabado

---

*Ofelia Vallejo · Leather House · Medellín → Lausanne*
