'use strict';

// Validación y cálculo de cupones en el servidor (no confiar en el cliente).
// Recibe la fila de `discounts` (lib/postgres.findDiscountByCode) y el subtotal en
// CHF enteros; devuelve { valid, amountChf } o { valid:false, error }.
// Dinero SIEMPRE en INT CHF (consistente con el resto del backend).

function evaluateDiscount(row, subtotalChf) {
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

  const value = Number(row.value) || 0;
  let amount = row.type === 'fixed_amount'
    ? Math.round(value)
    : Math.round((subtotal * value) / 100);
  amount = Math.max(0, Math.min(amount, subtotal));

  if (amount <= 0) return { valid: false, error: 'El cupón no aplica a este pedido.' };

  return { valid: true, amountChf: amount, code: row.code, discountId: row.id };
}

module.exports = { evaluateDiscount };
