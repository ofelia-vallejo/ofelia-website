/* Checkout · resumen + envío + cotización + redirección Stripe Hosted Checkout */

(function () {
  const esc = window.OVUtil.esc;
  const fmt = window.OVUtil.formatCHF;

  const state = {
    country: 'CH',
    rateId: '',
    coupon: '',
    quote: null,
    quotePending: false,
  };

  let quoteTimer = null;

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

    return true;
  }

  function renderShippingRates(rates, selectedId) {
    const fieldset = document.getElementById('checkoutShippingRates');
    if (!fieldset) return;

    if (!rates || !rates.length) {
      fieldset.innerHTML = '<p class="checkout-shipping-hint">Tarifas no disponibles. Contacta al atelier.</p>';
      return;
    }

    fieldset.innerHTML = rates
      .map((rate) => {
        const id = esc(rate.id);
        const checked = rate.id === selectedId ? ' checked' : '';
        const priceLabel = rate.priceChf === 0
          ? (rate.freeApplied ? 'Gratis' : 'CHF 0')
          : fmt(rate.priceChf);
        let meta = '';
        if (rate.method === 'pickup') {
          meta = 'Atelier · Medellín';
        } else if (rate.estimatedDaysMin && rate.estimatedDaysMax) {
          meta = rate.estimatedDaysMin + '–' + rate.estimatedDaysMax + ' días';
        } else if (rate.freeApplied) {
          meta = 'Umbral alcanzado';
        }
        return (
          '<label class="checkout-shipping-rate">' +
            '<input type="radio" name="shippingRate" value="' + id + '"' + checked + '>' +
            '<span class="checkout-shipping-rate__box">' +
              '<span>' +
                '<p class="checkout-shipping-rate__name">' + esc(rate.name) + '</p>' +
                (meta ? '<p class="checkout-shipping-rate__meta">' + esc(meta) + '</p>' : '') +
              '</span>' +
              '<span class="checkout-shipping-rate__price">' + esc(priceLabel) + '</span>' +
            '</span>' +
          '</label>'
        );
      })
      .join('');

    fieldset.querySelectorAll('input[name="shippingRate"]').forEach((input) => {
      input.addEventListener('change', () => {
        state.rateId = input.value;
        scheduleQuote();
      });
    });
  }

  function renderTotals(quote) {
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const discountRow = document.getElementById('checkoutDiscountRow');
    const discountEl = document.getElementById('checkoutDiscount');
    const taxRow = document.getElementById('checkoutTaxRow');
    const taxLabel = document.getElementById('checkoutTaxLabel');
    const taxEl = document.getElementById('checkoutTax');
    const shippingEl = document.getElementById('checkoutShippingCost');
    const totalEl = document.getElementById('checkoutTotal');

    if (!quote) {
      const cart = OVCart.getCart();
      if (subtotalEl) subtotalEl.textContent = OVCart.formatCHF(cart.cost.subtotalAmount.amount);
      if (totalEl) totalEl.textContent = OVCart.formatCHF(cart.cost.subtotalAmount.amount);
      return;
    }

    if (subtotalEl) subtotalEl.textContent = fmt(quote.subtotalChf);
    if (discountRow && discountEl) {
      if (quote.discountChf > 0) {
        discountRow.hidden = false;
        discountEl.textContent = '− ' + fmt(quote.discountChf);
      } else {
        discountRow.hidden = true;
      }
    }
    if (taxRow && taxEl && taxLabel) {
      if (quote.taxChf > 0) {
        taxRow.hidden = false;
        taxLabel.textContent = quote.taxIncluded ? 'Impuesto (incl.)' : 'Impuesto';
        taxEl.textContent = fmt(quote.taxChf);
      } else {
        taxRow.hidden = true;
      }
    }
    if (shippingEl) {
      shippingEl.textContent = quote.shippingChf === 0 && quote.shippingRates && quote.shippingRates.length
        ? 'Gratis'
        : fmt(quote.shippingChf);
    }
    if (totalEl) totalEl.textContent = fmt(quote.totalChf);
  }

  function setNotice(msg, ok) {
    const n = document.getElementById('checkoutNotice');
    if (!n) return;
    n.textContent = msg || '';
    n.className = 'checkout-notice' + (ok ? ' is-ok' : msg ? '' : '');
  }

  function quotePayload() {
    return {
      items: OVCart.toCheckoutItems(),
      shippingCountry: state.country,
      shippingRateId: state.rateId || undefined,
      couponCode: state.coupon || undefined,
    };
  }

  async function fetchQuote() {
    if (!window.OVCart || OVCart.getCart().isEmpty) return;
    state.quotePending = true;
    try {
      const res = await window.OVUtil.fetchWithTimeout('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        body: JSON.stringify(quotePayload()),
      });
      const json = await res.json();
      if (!json.ok) {
        setNotice(json.error || 'No se pudo calcular el total.', false);
        return;
      }
      state.quote = json;
      state.rateId = json.selectedRateId || state.rateId;
      renderShippingRates(json.shippingRates, json.selectedRateId);
      renderTotals(json);
      setNotice('', false);
    } catch (e) {
      setNotice('No se pudo conectar con el servidor. Revisa tu conexión.', false);
    } finally {
      state.quotePending = false;
    }
  }

  function scheduleQuote() {
    clearTimeout(quoteTimer);
    quoteTimer = setTimeout(fetchQuote, 180);
  }

  async function init() {
    if (!window.OVCart) return;

    await OVCart.fetchStripeConfig();

    if (new URLSearchParams(location.search).get('canceled') === '1') {
      const box = document.getElementById('checkoutCanceled');
      if (box) box.hidden = false;
    }

    if (!renderSummary()) return;

    const countrySelect = document.getElementById('checkoutCountry');
    if (countrySelect) {
      state.country = countrySelect.value || 'CH';
      countrySelect.addEventListener('change', () => {
        state.country = countrySelect.value;
        state.rateId = '';
        scheduleQuote();
      });
    }

    const couponInput = document.getElementById('checkoutCoupon');
    const couponBtn = document.getElementById('checkoutCouponBtn');
    if (couponBtn) {
      couponBtn.addEventListener('click', () => {
        state.coupon = couponInput && couponInput.value.trim().toUpperCase();
        scheduleQuote();
      });
    }
    if (couponInput) {
      couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          state.coupon = couponInput.value.trim().toUpperCase();
          scheduleQuote();
        }
      });
    }

    await fetchQuote();

    if (window.OVAnalytics && state.quote) {
      window.OVAnalytics.ecommerce('begin_checkout', {
        value: state.quote.totalChf,
        items: OVCart.getCart().lines.map(function (l, i) { return window.OVAnalytics.itemFromLine(l, i); }),
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

      if (!state.rateId && state.quote && state.quote.shippingRates && state.quote.shippingRates.length) {
        state.rateId = state.quote.selectedRateId;
      }

      payBtn.disabled = true;
      payBtn.textContent = 'Redirigiendo…';
      setNotice('', false);

      const res = await OVCart.startCheckout({
        email,
        name: nameInput && nameInput.value.trim(),
        shippingCountry: state.country,
        shippingRateId: state.rateId,
        couponCode: state.coupon || undefined,
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
