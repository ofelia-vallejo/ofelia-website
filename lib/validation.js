'use strict';

// Validación server-side del panel admin con zod.
// Objetivo: que la dueña NO pueda dejar la base en un estado inválido desde el panel.
// Reglas: dinero como INT CHF (no negativos), slugs/handles limpios, hex de color
// válido, estados permitidos, stock no negativo. Errores en español, legibles.
//
// Convención: cada parse* devuelve { ok:true, data } o { ok:false, error, issues }.
// `error` es un mensaje único legible (1ª incidencia) para usuarias no técnicas;
// `issues` lista todas las incidencias por campo (para resaltar en el formulario).

const { z } = require('zod');

// — Tipos base reutilizables ------------------------------------------------
const intChf = z.coerce
  .number({ invalid_type_error: 'Debe ser un número.' })
  .int('Debe ser un número entero (CHF).')
  .min(0, 'No puede ser negativo.');

const intStock = z.coerce
  .number({ invalid_type_error: 'Debe ser un número.' })
  .int('Debe ser un número entero.')
  .min(0, 'El stock no puede ser negativo.');

const slugString = z
  .string()
  .trim()
  .min(1, 'El slug es obligatorio.')
  .max(120, 'El slug es demasiado largo.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo admite minúsculas, números y guiones (ej. travel-bag-i).');

const colorHex = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/, 'Color hex inválido (ej. #3B2B26).')
  .optional()
  .or(z.literal(''));

const PRODUCT_STATUS = ['draft', 'active', 'archived'];

// — Variante ----------------------------------------------------------------
const variantSchema = z.object({
  id: z.string().trim().optional(),
  sku: z.string().trim().max(64, 'SKU demasiado largo.').optional().default(''),
  colorKey: z.string().trim().max(64).optional().default(''),
  colorName: z.string().trim().max(80).optional().default(''),
  colorHex,
  inventory: intStock.optional().default(0),
  priceCHF: z.union([intChf, z.literal(''), z.null()]).optional(),
  weightGrams: z.coerce.number().int().min(0).optional().nullable(),
  sort: z.coerce.number().int().min(0).optional().default(0),
});

// — Imagen ------------------------------------------------------------------
const imageSchema = z.object({
  url: z.string().trim().min(1, 'La imagen necesita URL.'),
  alt: z.string().trim().optional().default(''),
  kind: z.enum(['hero', 'gallery']).optional().default('gallery'),
  sort: z.coerce.number().int().min(0).optional().default(0),
  variantId: z.string().trim().optional(),
});

// — Producto (crear/editar) -------------------------------------------------
// Casi todos los campos opcionales para soportar PATCH parcial; name/slug se
// validan con más fuerza en el handler según sea POST (crear) o PUT (editar).
const productSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(160, 'Nombre demasiado largo.'),
  slug: slugString.optional(),
  category: z.string().trim().min(1, 'La categoría es obligatoria.'),
  line: z.string().trim().max(80).optional().default(''),
  numeral: z.string().trim().max(16).optional().default(''),
  status: z.enum(PRODUCT_STATUS, { errorMap: () => ({ message: 'Estado inválido (draft, active o archived).' }) }).optional(),
  active: z.coerce.boolean().optional(),
  personalizable: z.coerce.boolean().optional(),
  basePrice: intChf,
  engravePrice: intChf.optional().default(0),
  inventory: intStock.optional().default(0),
  lowStockAt: z.coerce.number().int().min(0).optional().default(2),
  pdpPath: z.string().trim().max(300).optional().default(''),
  shortDescription: z.string().trim().max(300).optional().default(''),
  description: z.string().trim().max(8000).optional().default(''),
  seoTitle: z.string().trim().max(200).optional().default(''),
  seoDescription: z.string().trim().max(400).optional().default(''),
  sort: z.coerce.number().int().min(0).optional().default(10),
  collectionDisplay: z.enum(['product', 'variants']).optional().default('product'),
  collectionWide: z.coerce.boolean().optional().default(false),
  variants: z.array(variantSchema).max(40, 'Demasiadas variantes.').optional().default([]),
  images: z.array(imageSchema).max(60, 'Demasiadas imágenes.').optional().default([]),
  metafields: z.array(z.object({
    namespace: z.string().trim().max(64).optional().default('custom'),
    key: z.string().trim().min(1, 'El metafield necesita clave.').max(64),
    value: z.string().max(2000).optional().default(''),
    valueType: z.string().trim().max(64).optional().default('single_line_text_field'),
  })).max(50).optional(),
})
  .superRefine((data, ctx) => {
    // SKUs duplicados dentro del mismo producto romperían la identidad de variante.
    const skus = (data.variants || []).map((v) => (v.sku || '').trim().toLowerCase()).filter(Boolean);
    const dupSku = skus.find((s, i) => skus.indexOf(s) !== i);
    if (dupSku) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variants'], message: `SKU duplicado en variantes: "${dupSku}".` });
    }
  });

// — Ajuste de inventario (admin) -------------------------------------------
const inventoryAdjustSchema = z.object({
  productId: z.string().trim().min(1, 'productId es obligatorio.'),
  variantId: z.string().trim().optional(),
  locationId: z.string().trim().optional().default('loc-medellin'),
  mode: z.enum(['set', 'delta'], { errorMap: () => ({ message: 'mode debe ser "set" o "delta".' }) }),
  value: z.coerce.number({ invalid_type_error: 'value debe ser numérico.' }).int('value debe ser entero.'),
  reason: z.string().trim().max(40).optional().default('manual'),
  note: z.string().trim().max(300).optional().default(''),
})
  .superRefine((data, ctx) => {
    if (data.mode === 'set' && data.value < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'El stock no puede quedar negativo.' });
    }
  });

// — Descuento (admin) -------------------------------------------------------
const discountConditionSchema = z.object({
  conditionType: z.enum(['collection', 'product', 'variant', 'min_quantity', 'min_subtotal']),
  refId: z.string().trim().optional().default(''),
  intValue: z.coerce.number().int().min(0).optional().nullable(),
});

const discountSchema = z.object({
  id: z.string().trim().optional(),
  code: z.string().trim().min(2, 'El código es obligatorio.').max(40)
    .regex(/^[A-Za-z0-9_-]+$/, 'El código solo admite letras, números, guion y guion bajo.'),
  description: z.string().trim().max(200).optional().default(''),
  type: z.enum(['percentage', 'fixed_amount'], { errorMap: () => ({ message: 'Tipo: percentage o fixed_amount.' }) }),
  value: z.coerce.number({ invalid_type_error: 'El valor debe ser numérico.' }).min(0, 'El valor no puede ser negativo.'),
  minSubtotalChf: intChf.optional().default(0),
  startsAt: z.string().trim().optional().nullable(),
  endsAt: z.string().trim().optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  oncePerCustomer: z.coerce.boolean().optional().default(false),
  active: z.coerce.boolean().optional().default(true),
  method: z.enum(['code', 'automatic']).optional().default('code'),
  targetType: z.enum(['order', 'shipping']).optional().default('order'),
  priority: z.coerce.number().int().min(0).optional().default(0),
  conditions: z.array(discountConditionSchema).max(20).optional().default([]),
})
  .superRefine((data, ctx) => {
    if (data.type === 'percentage' && data.value > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'Un porcentaje no puede superar 100.' });
    }
    if (data.startsAt && data.endsAt) {
      const s = new Date(data.startsAt).getTime();
      const e = new Date(data.endsAt).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endsAt'], message: 'La fecha de fin es anterior al inicio.' });
      }
    }
  });

// — Refund (admin) ----------------------------------------------------------
const refundSchema = z.object({
  orderId: z.string().trim().min(1, 'orderId es obligatorio.'),
  amountChf: intChf,
  reason: z.string().trim().max(40).optional().default('customer'),
  note: z.string().trim().max(300).optional().default(''),
  restock: z.coerce.boolean().optional().default(true),
  lines: z.array(z.object({
    orderLineItemId: z.coerce.number().int().optional().nullable(),
    productId: z.string().trim().optional(),
    variantId: z.string().trim().optional(),
    quantity: z.coerce.number().int().min(1).optional().default(1),
    amountChf: intChf.optional().default(0),
    restock: z.coerce.boolean().optional().default(true),
  })).optional().default([]),
});

// Convierte un ZodError en { error, issues } legible (campo: mensaje).
function formatError(err) {
  const issues = (err.issues || []).map((i) => ({
    field: (i.path || []).join('.') || '(general)',
    message: i.message,
  }));
  const first = issues[0];
  const error = first
    ? (first.field === '(general)' ? first.message : `${first.field}: ${first.message}`)
    : 'Datos inválidos.';
  return { error, issues };
}

// Helper genérico: parse seguro que nunca lanza.
function parseWith(schema, payload) {
  const result = schema.safeParse(payload || {});
  if (result.success) return { ok: true, data: result.data };
  return Object.assign({ ok: false }, formatError(result.error));
}

module.exports = {
  PRODUCT_STATUS,
  productSchema,
  variantSchema,
  inventoryAdjustSchema,
  discountSchema,
  refundSchema,
  parseProduct: (p) => parseWith(productSchema, p),
  parseInventoryAdjust: (p) => parseWith(inventoryAdjustSchema, p),
  parseDiscount: (p) => parseWith(discountSchema, p),
  parseRefund: (p) => parseWith(refundSchema, p),
  formatError,
  parseWith,
};
