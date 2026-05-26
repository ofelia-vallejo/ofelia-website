/* Hidrata tarjetas de coleccion.html con precio e inventario desde /api/products */

(function () {
  if (!window.OVCatalog) return;

  function stockLabel(n, low) {
    if (n <= 0) return { text: 'Agotado', cls: 'card__stock--out' };
    if (n <= low) return { text: 'Últimas unidades', cls: 'card__stock--low' };
    return null;
  }

  async function hydrate() {
    try {
      const data = await window.OVCatalog.fetchCatalog();
      data.products.forEach((p) => {
        if (!p.active) return;
        const card = document.getElementById(p.slug) || document.getElementById(p.id);
        if (!card) return;

        const detail = card.querySelector('.card__detail');
        if (!detail) return;

        const stock = window.OVCatalog.totalStock(p);
        const low = p.lowStockAt || 2;
        const badge = stockLabel(stock, low);

        let priceEl = card.querySelector('.card__price');
        if (!priceEl) {
          priceEl = document.createElement('p');
          priceEl.className = 'card__price';
          detail.after(priceEl);
        }
        priceEl.textContent =
          window.OVCatalog.formatCHF(p.basePrice) +
          (p.engravePrice ? ' · Grabado desde +' + window.OVCatalog.formatCHF(p.engravePrice) : '');

        let stockEl = card.querySelector('.card__stock');
        if (badge) {
          if (!stockEl) {
            stockEl = document.createElement('p');
            stockEl.className = 'card__stock';
            priceEl.after(stockEl);
          }
          stockEl.textContent = badge.text;
          stockEl.className = 'card__stock ' + badge.cls;
        } else if (stockEl) {
          stockEl.remove();
        }
      });
    } catch (err) {
      console.warn('[coleccion-live]', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
