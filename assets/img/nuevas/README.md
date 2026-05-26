# Fotos nuevas — única fuente para el sitio

**Regla:** el sitio web solo enlaza fotos desde esta carpeta. No usar copias en `inicio/`, `producto/`, `lifestyle/` ni archivos de `imagenes base/`.

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| `inicio/` | Hero Mujer / Hombre (`mujer-nueva-*.jpg`, `hombre-nueva-*.jpg`) |
| `producto/mujer/` | Estudio · `estudio-01` … `estudio-08` |
| `producto/hombre/` | Estudio · `estudio-01` … `estudio-04` |
| `lifestyle/mujer/` | Editorial lifestyle |

## Mapa en producción (HTML)

| Uso en sitio | Archivo en `nuevas/` |
|--------------|----------------------|
| Hero mujer | `inicio/mujer-nueva-02.jpg` |
| Hero hombre | `inicio/hombre-nueva-03.jpg` |
| Bolso Estación / Bolso Dama | `producto/mujer/estudio-01.jpg` |
| Travel Bag I | `producto/mujer/estudio-02.jpg` |
| Travel Bag III / Morral | `producto/mujer/estudio-03.jpg` |
| Maletín / Travel Bag II hombre | `producto/hombre/estudio-01.jpg` |
| Bandoleras lifestyle | `inicio/hombre-nueva-04.jpg`, `hombre-nueva-02.jpg` |
| Banner cuero (home) | `lifestyle/mujer/lifestyle-01.jpg` |
| Detalle cinturón | `producto/mujer/estudio-05.jpg` |
| Globo intro (card) | `producto/mujer/estudio-02.jpg` |

Redirects legacy: `vercel.json` → mismas rutas bajo `/assets/img/nuevas/`.
