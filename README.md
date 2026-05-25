# Ofelia Vallejo — Leather House

**Versión:** `inicial-mock` (Home v4 — placeholders, sin fotos reales)

Sitio estático v4. Abrir `index.html` en el navegador o desplegar en Vercel.

## Estructura

```
ofelia-vallejo/
├── index.html              ← Home deploy (fuente activa)
├── banner-intro.html       ← intro globo D3 (5 etapas → index.html)
├── Home v6.html            ← ground truth / referencia del mockup
├── assets/img/logo_firma.png   ← firma oficial (única)
├── assets/img/logo_sello.png   ← sello OV oficial (única)
└── assets/
    └── img/
        ├── inicio/         ← hero Mujer / Hombre (home.html)
        └── …               ← logos, producto, lifestyle (futuro)
```

## Archivos

- `index.html` — Home (única versión activa en producción)
- `banner-intro.html` — Intro cartográfica D3 + TopoJSON; Saltar / Entrar → `index.html`
- `assets/img/logo_firma.png` — Firma completa · `assets/img/logo_sello.png` — Sello OV. Ver `06_Identidad_Marca/logos/README.md`
- `assets/img/` — Fotos de producto y lifestyle (añadir aquí: `hero.jpg`, `bag-01.jpg`, etc.)

## Deploy (Vercel)

Proyecto estático en la raíz. Conectar repo `ofelia-vallejo/ofelia-website` y desplegar **sin framework** (solo archivos estáticos).