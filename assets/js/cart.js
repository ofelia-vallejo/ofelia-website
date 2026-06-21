/**
 * OVCart — bolsa de compra (patrón Shopify Cart: lines, quantity, cost)
 * Persistencia: localStorage · checkout vía Stripe Hosted Checkout (api/checkout/create)
 */

(function (global) {
  const STORAGE_KEY = 'ov_cart_v1';
  const MAX_QTY = 10;

  let stripeEnabled = null;
  let stripeConfigPromise = null;

  function uid() {
    return 'line_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function readRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { id: cartId(), lines: [], updatedAt: null };
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.lines)) return { id: cartId(), lines: [], updatedAt: null };
      return data;
    } catch {
      return { id: cartId(), lines: [], updatedAt: null };
    }
  }

  function cartId() {
    return 'cart_' + Math.random().toString(36).slice(2, 12);
  }

  function writeRaw(data) {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dispatchChange();
  }

  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('ov:cart:change', { detail: getCart() }));
  }

  function lineKey(line) {
    return [line.slug, line.variantId || '', (line.engraveText || '').trim()].join('::');
  }

  const formatCHF = window.OVUtil.formatCHF;

  function lineTotal(line) {
    const qty = Number(line.quantity) || 1;
    const base = Number(line.basePrice) || 0;
    const engrave =
      line.engraveText && String(line.engraveText).trim()
        ? Number(line.engravePrice) || 0
        : 0;
    return (base + engrave) * qty;
  }

  function getCart() {
    const data = readRaw();
    const lines = data.lines.map((l) => Object.assign({}, l));
    const totalQuantity = lines.reduce((s, l) => s + (Number(l.quantity) || 1), 0);
    const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
    return {
      id: data.id,
      lines,
      totalQuantity,
      cost: {
        subtotalAmount: { amount: subtotal, currencyCode: 'CHF' },
        totalAmount: { amount: subtotal, currencyCode: 'CHF' },
      },
      isEmpty: lines.length === 0,
    };
  }

  function addLine(payload) {
    const data = readRaw();
    const line = {
      id: uid(),
      slug: payload.slug,
      variantId: payload.variantId || '',
      variantLabel: payload.variantLabel || '',
      productName: payload.productName || '',
      image: payload.image || '',
      sku: payload.sku || '',
      quantity: Math.max(1, Math.min(MAX_QTY, Number(payload.quantity) || 1)),
      basePrice: Number(payload.basePrice) || 0,
      engravePrice: Number(payload.engravePrice) || 0,
      engraveText: (payload.engraveText || '').trim().slice(0, 60),
    };

    const key = lineKey(line);
    const existing = data.lines.find((l) => lineKey(l) === key);
    if (existing) {
      existing.quantity = Math.min(MAX_QTY, (Number(existing.quantity) || 1) + line.quantity);
      if (line.engraveText) existing.engraveText = line.engraveText;
    } else {
      data.lines.push(line);
    }
    writeRaw(data);

    // GA4 · add_to_cart
    if (global.OVAnalytics) {
      const it = global.OVAnalytics.itemFromLine(line);
      global.OVAnalytics.ecommerce('add_to_cart', {
        value: lineTotal(line),
        items: [it],
      });
    }

    return getCart();
  }

  function updateLine(lineId, patch) {
    const data = readRaw();
    const line = data.lines.find((l) => l.id === lineId);
    if (!line) return getCart();
    if (patch.quantity != null) {
      const q = Number(patch.quantity);
      if (q <= 0) {
        data.lines = data.lines.filter((l) => l.id !== lineId);
      } else {
        line.quantity = Math.min(MAX_QTY, Math.max(1, q));
      }
    }
    if (patch.engraveText != null) {
      line.engraveText = String(patch.engraveText).trim().slice(0, 60);
    }
    writeRaw(data);
    return getCart();
  }

  function removeLine(lineId) {
    const data = readRaw();
    data.lines = data.lines.filter((l) => l.id !== lineId);
    writeRaw(data);
    return getCart();
  }

  function clearCart() {
    writeRaw({ id: cartId(), lines: [], updatedAt: null });
    return getCart();
  }

  function toCheckoutItems() {
    return getCart().lines.map((l) => ({
      slug: l.slug,
      variantId: l.variantId,
      quantity: l.quantity,
      engraveText: l.engraveText,
      engraveEnabled: Boolean(l.engraveText && l.engraveText.trim()),
    }));
  }

  function fetchStripeConfig() {
    if (stripeConfigPromise) return stripeConfigPromise;
    stripeConfigPromise = fetch('/api/stripe/config')
      .then((r) => r.json())
      .then((json) => {
        stripeEnabled = Boolean(json && json.enabled);
        return json;
      })
      .catch(() => {
        stripeEnabled = false;
        return { enabled: false };
      });
    return stripeConfigPromise;
  }

  function isStripeEnabled() {
    return stripeEnabled === true;
  }

  async function startCheckout(opts) {
    const cart = getCart();
    if (cart.isEmpty) {
      return { ok: false, error: 'Tu bolsa está vacía.' };
    }
    const items = toCheckoutItems();
    const headers = { 'Content-Type': 'application/json' };
    // Attach the customer session token if logged in, so the order links to the account.
    try {
      const token = localStorage.getItem('ov_token');
      if (token) headers.Authorization = 'Bearer ' + token;
    } catch (e) {}
    const res = await fetch('/api/checkout/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items,
        customerEmail: opts && opts.email ? opts.email : undefined,
        customerName: opts && opts.name ? opts.name : undefined,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      return { ok: false, error: json.error || 'No se pudo iniciar el pago.' };
    }
    if (json.url) {
      // Guardar snapshot del pedido para el evento purchase en /gracias
      // (el carrito se limpia antes de redirigir a Stripe).
      try {
        localStorage.setItem(
          'ov_last_order',
          JSON.stringify({
            value: cart.cost.totalAmount.amount,
            currency: cart.cost.totalAmount.currencyCode || 'CHF',
            lines: cart.lines,
            ts: Date.now(),
          })
        );
      } catch (e) {}
      clearCart();
      global.location.href = json.url;
    }
    return json;
  }

  global.OVCart = {
    getCart,
    addLine,
    updateLine,
    removeLine,
    clearCart,
    toCheckoutItems,
    formatCHF,
    lineTotal,
    fetchStripeConfig,
    isStripeEnabled,
    startCheckout,
  };

  fetchStripeConfig();
})(window);
