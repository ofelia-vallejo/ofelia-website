/* Checkout · resumen + redirección Stripe Hosted Checkout */

(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function renderSummary() {
    const cart = window.OVCart.getCart();
    const wrap = document.getElementById('checkoutWrap');
    const empty = document.getElementById('checkoutEmpty');

    if (cart.isEmpty) {
      if (wrap) wrap.hidden = true;
      if (empty) empty.hidden = false;
      return false;
    }

    if (wrap) wrap.hidden = false;
    if (empty) empty.hidden = true;

    const summary = document.getElementById('checkoutSummary');
    const totalEl = document.getElementById('checkoutTotal');
    if (!summary) return true;

    summary.innerHTML = cart.lines
      .map(
        (line) =>
          '<div class="checkout-summary-line">' +
            '<div class="checkout-summary-line__thumb">' +
              (line.image ? '<img src="' + esc(line.image) + '" alt="">' : '') +
              '<span class="checkout-summary-line__qty">' + esc(line.quantity) + '</span>' +
            '</div>' +
            '<div>' +
              '<p class="checkout-summary-line__name">' + esc(line.productName) + '</p>' +
              (line.variantLabel ? '<p style="opacity:0.65;margin:0">' + esc(line.variantLabel) + '</p>' : '') +
              (line.engraveText ? '<p style="opacity:0.55;margin:4px 0 0;font-size:10px">Grabado · «' + esc(line.engraveText) + '»</p>' : '') +
            '</div>' +
            '<span>' + esc(OVCart.formatCHF(OVCart.lineTotal(line))) + '</span>' +
          '</div>'
      )
      .join('');

    if (totalEl) totalEl.textContent = OVCart.formatCHF(cart.cost.totalAmount.amount);
    return true;
  }

  function setNotice(msg, ok) {
    const n = document.getElementById('checkoutNotice');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'checkout-notice' + (ok ? ' is-ok' : msg ? '' : '');
  }

  async function init() {
    if (!window.OVCart) return;

    await OVCart.fetchStripeConfig();

    if (new URLSearchParams(location.search).get('canceled') === '1') {
      const box = document.getElementById('checkoutCanceled');
      if (box) box.hidden = false;
    }

    if (!renderSummary()) return;

    // GA4 · begin_checkout (al ver el checkout con artículos en la bolsa)
    if (window.OVAnalytics) {
      var c = OVCart.getCart();
      window.OVAnalytics.ecommerce('begin_checkout', {
        value: c.cost.totalAmount.amount,
        items: c.lines.map(function (l, i) { return window.OVAnalytics.itemFromLine(l, i); }),
      });
    }

    if (!OVCart.isStripeEnabled()) {
      setNotice('Pasarela en configuración. Mientras tanto, consulta por WhatsApp.', false);
      const btn = document.getElementById('checkoutPayBtn');
      if (btn) btn.disabled = true;
      return;
    }

    const form = document.getElementById('checkoutForm');
    const payBtn = document.getElementById('checkoutPayBtn');
    if (!payBtn) return;

    payBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('checkoutEmail');
      const nameInput = document.getElementById('checkoutName');
      const email = emailInput && emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setNotice('Escribe un correo válido.', false);
        if (emailInput) emailInput.focus();
        return;
      }

      payBtn.disabled = true;
      payBtn.textContent = 'Redirigiendo…';
      setNotice('', false);

      const res = await OVCart.startCheckout({
        email,
        name: nameInput && nameInput.value.trim(),
      });

      if (!res.ok) {
        setNotice(res.error || 'Error al iniciar el pago.', false);
        payBtn.disabled = false;
        payBtn.textContent = 'Pagar con tarjeta →';
      }
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        payBtn.click();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
