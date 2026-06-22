'use strict';

// Validación y cálculo de cupones en el servidor (no confiar en el cliente).
// Recibe la fila de `discounts` (lib/postgres.findDiscountByCode) y el subtotal en
// CHF enteros; devuelve { valid, amountChf } o { valid:false, error }.
// Dinero SIEMPRE en INT CHF (consistente con el resto del backend).

// Evalúa las reglas BASE de un descuento (vigencia, límite de uso, mínimo) sin
// mirar todavía las `discount_conditions`. Devuelve { valid } o { valid:false, error }.
function evaluateBaseRules(row, subtotalChf) {
  const subtotal = Number(subtotalChf) || 0;

  if (!row) return { valid: false, error: 'Cupón no válido o expirado.' };
  if (row.active === false) return { valid: false, error: 'Cupón inactivo.' };

  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    return { valid: false, error: 'El cupón aún no está vigente.' };
  }
  if (row.ends_at && new Date(row.ends_at).getTime() < now) {
    return { valid: false, error: 'El cupón ha expirado.' };
  }

  if (row.usage_limit != null && Number(row.used_count) >= Number(row.usage_limit)) {
    return { valid: false, error: 'El cupón ha alcanzado su límite de uso.' };
  }

  const min = Number(row.min_subtotal_chf) || 0;
  if (subtotal < min) {
    return { valid: false, error: `El cupón requiere un subtotal mínimo de ${min} CHF.` };
  }

  return { valid: true };
}

// Calcula el monto del descuento en CHF enteros según type (percentage|fixed_amount),
// acotado a [0, subtotal]. El "envío gratis" (target_type='shipping') no descuenta del
// subtotal aquí; el llamador aplica el coste de envío a 0 por separado.
function computeAmount(row, subtotalChf) {
  const subtotal = Number(subtotalChf) || 0;
  if (row.target_type === 'shipping') {
    // Free shipping: no reduce el subtotal; señaliza al checkout.
    return { amountChf: 0, freeShipping: true };
  }
  const value = Number(row.value) || 0;
  let amount = row.type === 'fixed_amount'
    ? Math.round(value)
    : Math.round((subtotal * value) / 100);
  amount = Math.max(0, Math.min(amount, subtotal));
  return { amountChf: amount, freeShipping: false };
}

// Evalúa `discount_conditions` (migración 003) contra el contexto del carrito.
// ctx = { subtotalChf, totalQuantity, productIds:Set, variantIds:Set, collectionIds:Set }
// Tipos soportados: min_subtotal, min_quantity, product, variant, collection.
// Semántica: TODAS las condiciones del MISMO tipo se evalúan como OR (basta una);
// entre tipos distintos se exige AND (deben cumplirse todos los grupos presentes).
function evaluateConditions(conditions, ctx) {
  if (!Array.isArray(conditions) || !conditions.length) return { valid: true };

  const groups = {};
  for (const c of conditions) {
    const t = c.condition_type;
    if (!groups[t]) groups[t] = [];
    groups[t].push(c);
  }

  const subtotal = Number(ctx.subtotalChf) || 0;
  const totalQty = Number(ctx.totalQuantity) || 0;
  const productIds = ctx.productIds || new Set();
  const variantIds = ctx.variantIds || new Set();
  const collectionIds = ctx.collectionIds || new Set();

  for (const [type, list] of Object.entries(groups)) {
    let ok = false;
    if (type === 'min_subtotal') {
      ok = list.some((c) => subtotal >= (Number(c.int_value) || 0));
      if (!ok) return { valid: false, error: 'El pedido no alcanza el mínimo del cupón.' };
    } else if (type === 'min_quantity') {
      ok = list.some((c) => totalQty >= (Number(c.int_value) || 0));
      if (!ok) return { valid: false, error: 'El cupón requiere más unidades en el carrito.' };
    } else if (type === 'product') {
      ok = list.some((c) => productIds.has(c.ref_id));
      if (!ok) return { valid: false, error: 'El cupón no aplica a los productos del carrito.' };
    } else if (type === 'variant') {
      ok = list.some((c) => variantIds.has(c.ref_id));
      if (!ok) return { valid: false, error: 'El cupón no aplica a las variantes del carrito.' };
    } else if (type === 'collection') {
      ok = list.some((c) => collectionIds.has(c.ref_id));
      if (!ok) return { valid: false, error: 'El cupón no aplica a las colecciones del carrito.' };
    }
    // Tipos desconocidos se ignoran (degradación suave).
  }

  return { valid: true };
}

// Evaluación COMPLETA: reglas base + condiciones + cálculo. `conditions` y `ctx`
// son opcionales (compatibilidad con la firma simple evaluateDiscount(row, subtotal)).
function evaluateDiscount(row, subtotalChf, conditions, ctx) {
  const base = evaluateBaseRules(row, subtotalChf);
  if (!base.valid) return base;

  if (conditions && conditions.length) {
    const cond = evaluateConditions(conditions, ctx || { subtotalChf });
    if (!cond.valid) return cond;
  }

  const { amountChf, freeShipping } = computeAmount(row, subtotalChf);
  if (!freeShipping && amountChf <= 0) {
    return { valid: false, error: 'El cupón no aplica a este pedido.' };
  }

  return {
    valid: true,
    amountChf,
    freeShipping,
    targetType: row.target_type || 'order',
    code: row.code,
    discountId: row.id,
  };
}

module.exports = { evaluateDiscount, evaluateBaseRules, evaluateConditions, computeAmount };
