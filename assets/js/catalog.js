/* Catálogo dinámico — API /api/products */

(function () {
  const API = '/api/products';

  const fetchJSON = window.OVUtil.fetchWithTimeout;

  async function fetchCatalog() {
    const res = await fetchJSON(API);
    if (!res.ok) throw new Error('Catálogo no disponible (HTTP ' + res.status + ')');
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Catálogo no disponible');
    return json;
  }

  async function fetchProduct(slugOrId) {
    const res = await fetchJSON(API + '?slug=' + encodeURIComponent(slugOrId));
    if (!res.ok) throw new Error('Producto no encontrado (HTTP ' + res.status + ')');
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Producto no encontrado');
    return json.product;
  }

  function totalStock(product) {
    if (product.variants && product.variants.length) {
      return product.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
    }
    return Number(product.inventory) || 0;
  }

  function heroImage(product) {
    if (!product.images || !product.images.length) return null;
    const hero = product.images.find((i) => i.kind === 'hero');
    return (hero || product.images[0]).url;
  }

  const formatCHF = window.OVUtil.formatCHF;

  window.OVCatalog = {
    fetchCatalog,
    fetchProduct,
    totalStock,
    heroImage,
    formatCHF,
  };
})();
