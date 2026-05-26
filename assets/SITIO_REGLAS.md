# Reglas finales del sitio — Ofelia Vallejo

Referencia única para mantener consistencia.

## Logos

| Archivo | Dónde |
|---------|--------|
| `logo_firma_nav.png` | **Navbar** — solo cursiva «Ofelia Vallejo» (sin eslogan) |
| `logo_firma_completa.png` | **Nacida de una firma** — firma + tridente + «Cuero hecho para durar», estampado 18% |
| `logo_sello.png` | **Nacida de una firma** (debajo, 20%) + **footer** (sólido, centrado) + intro globo |

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

- Heroes `inicio/mujer.jpg` · `inicio/hombre.jpg` — lifestyle
- Productos `producto/` — estudio, `object-position: center` por pieza
- Hombre colección home: `travel-bag-negro.jpg` (Maletín Antioquia)
- **Colecciones:** sin estaciones (otoño, etc.). Nombres = frutos colombianos · ver `05_Copy_y_Voz/colecciones_frutos_antioquia.md` (Lulo madre, Guanábana mujer, Borojó hombre, Uchuva bandoleras, Chontaduro morrales, Curuba accesorios)

## Globo (`index.html`)

- Sin doble zoom a Antioquia: Colombia → Guatapé directo

## CSS compartido

- Páginas internas + home: `assets/css/brand.css`
- Home conserva estilos propios de gender / edit / banners en `<style>` local
