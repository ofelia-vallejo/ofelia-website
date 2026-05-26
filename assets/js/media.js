/* Rutas de medios · codifica espacios y normaliza raíz */

(function () {
  function mediaUrl(url) {
    if (!url || !String(url).trim()) return '';
    const s = String(url).trim();
    if (/^https?:\/\//i.test(s)) return s;
    const path = s.startsWith('/') ? s : '/' + s;
    return path
      .split('/')
      .map(function (part, i) {
        if (i === 0 || part === '') return part;
        try {
          return encodeURIComponent(decodeURIComponent(part));
        } catch {
          return encodeURIComponent(part);
        }
      })
      .join('/');
  }

  function filterImages(urls) {
    return (urls || []).filter(function (u) {
      return u && String(u).trim();
    });
  }

  window.OVMedia = {
    url: mediaUrl,
    filterImages: filterImages,
  };
})();
