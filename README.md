# Ofelia Vallejo — Leather House

**Versión:** `inicial-mock` (Home v4 — placeholders, sin fotos reales)

Sitio estático v4. Abrir `index.html` en el navegador o desplegar en Vercel.

## Estructura

```
ofelia-vallejo/
├── index.html              ← Home deploy (fuente activa)
├── banner-intro.html       ← intro globo D3 (5 etapas → index.html)
├── Home v6.html            ← ground truth / referencia del mockup
├── logo-firma.png          ← firma OV caligráfica 200×80, fondo transparente (→ SVG pendiente)
└── assets/
    └── img/
        ├── inicio/         ← hero Mujer / Hombre (home.html)
        └── …               ← logos, producto, lifestyle (futuro)
```

## Archivos

- `index.html` — Home (única versión activa en producción)
- `banner-intro.html` — Intro cartográfica D3 + TopoJSON; Saltar / Entrar → `index.html`
- `logo-firma.png` — Firma OV (navbar 96px · footer 112px + brightness · statement 132px @ 18% opacidad). Guía: `04_Prompts_Visuales/logo_firma_ov.md`
- `assets/img/` — Fotos de producto y lifestyle (añadir aquí: `hero.jpg`, `bag-01.jpg`, etc.)

## Deploy (Vercel)

Proyecto estático en la raíz. Conectar repo `ofelia-vallejo/ofelia-website` y desplegar **sin framework** (solo archivos estáticos).