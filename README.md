# Ofelia Vallejo — Leather House

Sitio editorial + catálogo + PDP dinámico + atelier de grabado + admin + pagos Stripe.  
Deploy en **Vercel** desde `ofelia-vallejo/ofelia-website`.

## Entrada al sitio

| URL | Página |
|-----|--------|
| `/` | Intro globo D3 (`index.html`) → casa |
| `/home.html` | Home editorial (Mujer / Hombre) |
| `/coleccion.html` | Catálogo |
| `/producto/:slug` | Ficha de producto (dinámica) |
| `/personalizar.html` | Estudio de grabado láser |
| `/manifiesto.html` | Historia de la casa |
| `/contacto.html` | Contacto |
| `/cuenta.html` | Registro / sesión |
| `/admin/` | Panel atelier (sin código) |

## Stack

- HTML/CSS/JS estático + APIs en `/api` (Vercel serverless)
- Catálogo: **PostgreSQL** → fallback Blob → `data/catalog.json`
- Pagos: **Stripe Checkout** (CHF)
- Guía operativa: [`SETUP-ATELIER.md`](SETUP-ATELIER.md)
- Checklist deploy: [`docs/VERCEL_CHECKLIST.md`](docs/VERCEL_CHECKLIST.md)

## Logos (inmutables)

Fuente: `06_Identidad_Marca/logos/` — ver [`06_Identidad_Marca/logos/README.md`](06_Identidad_Marca/logos/README.md)

| Archivo web | Uso |
|-------------|-----|
| `assets/img/logo_sello.png` | Navbar móvil, intro, footer |
| `assets/img/logo_firma_nav.png` | Navbar desktop |
| `assets/img/logo_firma_completa.png` | Watermark «Nacida de una firma» |

## Desarrollo local

```bash
cp .env.example .env.local
npm install
STORE_MODE=file npm run dev   # catálogo desde data/catalog.json
npm run db:migrate           # requiere DATABASE_URL
```

## Referencia de marca

Toda IA o diseñador debe leer [`CLAUDE.md`](CLAUDE.md) antes de producir deliverables.
