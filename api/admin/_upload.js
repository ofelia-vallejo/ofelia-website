const { corsJson, requireAdmin } = require('../../lib/auth');
const { loadCatalog, saveCatalog, findProduct } = require('../../lib/store');

const MAX_BYTES = 4 * 1024 * 1024;

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const {
    productId,
    filename,
    contentType,
    dataBase64,
    alt,
    kind,
  } = req.body || {};

  if (!productId || !dataBase64) {
    return res.status(400).json({ ok: false, error: 'productId y dataBase64 son requeridos.' });
  }

  try {
    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ ok: false, error: 'Imagen demasiado grande (máx. 4 MB).' });
    }

    const safeName = (filename || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const mime = contentType || 'image/jpeg';
    const pathname = `ofelia/products/${productId}/${Date.now()}-${safeName}`;

    let url;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = require('@vercel/blob');
      const blob = await put(pathname, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: mime,
      });
      url = blob.url;
    } else if (process.env.STORE_MODE === 'file' || process.env.NODE_ENV !== 'production') {
      const fs = require('fs');
      const path = require('path');
      const dir = path.join(process.cwd(), 'public', 'uploads', productId);
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, `${Date.now()}-${safeName}`);
      fs.writeFileSync(filePath, buffer);
      url = `/uploads/${productId}/${path.basename(filePath)}`;
    } else {
      return res.status(503).json({
        ok: false,
        error: 'Configura BLOB_READ_WRITE_TOKEN en Vercel para subir fotos.',
      });
    }

    const catalog = await loadCatalog();
    const product = findProduct(catalog, productId);
    if (!product) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
    }

    if (!product.images) product.images = [];
    const entry = {
      url,
      alt: alt || product.name,
      kind: kind || 'gallery',
      sort: product.images.length,
    };
    product.images.push(entry);
    await saveCatalog(catalog);

    return res.status(200).json({ ok: true, image: entry, url });
  } catch (err) {
    console.error('[admin/upload]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error al subir.' });
  }
};
