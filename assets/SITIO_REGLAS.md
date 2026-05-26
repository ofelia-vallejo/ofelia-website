# Reglas finales del sitio — Ofelia Vallejo

Referencia única para mantener consistencia.

## Logos

| Archivo | Dónde |
|---------|--------|
| `logo_firma_nav.png` | **Navbar** — solo firma cursiva «Ofelia Vallejo» (sin sello encima) |
| `logo_firma_completa.png` | **Nacida de una firma** — watermark / statement (no navbar) |
| `logo_sello.png` | **Intro globo** + **footer** (sello horizontal) |
| `logo_sello_badge.png` | **Solo favicon / Google / PWA** — monograma circular OV |

No duplicar sello entre sección y footer con banners extra.

## Navbar (todas las páginas)

- Firma nav centrada (`logo_firma_nav.png`), `max-height: 42px`, ancho hasta 88vw — sin recortar la «a»
- Sin links en barra — solo menú hamburguesa
- Menú: Inicio · Mujer · Hombre · Historia · Cuero · Personalizar · Contacto
- Estilos en `assets/css/brand.css` · JS en `assets/js/brand.js`

## Nacida de una firma (`home.html`)

1. Título
2. Emblema: firma completa (132px, opacity 0.18) + sello (48px, opacity 0.2)
3. Texto editorial

## Fotos

- **Fotos:** solo `imagenes nuevas/` en HTML (Git). No `imagenes base/` ni `assets/img/nuevas/` legacy.
- Heroes: `imagenes nuevas/inicio/mujer-nueva-02.jpg` · `hombre-nueva-03.jpg`
- `.vercelignore` excluye `imagenes base/` y copias viejas en `assets/img/`
- **Colecciones:** sin estaciones (otoño, etc.). Nombres = frutos colombianos · ver `05_Copy_y_Voz/colecciones_frutos_antioquia.md` (Lulo madre, Guanábana mujer, Borojó hombre, Uchuva bandoleras, Chontaduro morrales, Curuba accesorios)

## Globo (`index.html`)

- Globo: 4 clics — atlas → Colombia → Antioquia → Guatapé (una animación por etapa; tarjeta final en el 5.º)

## CSS compartido

- Páginas internas + home: `assets/css/brand.css`
- Home conserva estilos propios de gender / edit / banners en `<style>` local
