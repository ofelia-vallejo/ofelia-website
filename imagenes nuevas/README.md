# Imágenes nuevas — fuente en Git

Carpeta canónica de fotos para el sitio (como `imagenes base/` es el archivo viejo).

**El HTML enlaza solo rutas bajo `imagenes nuevas/`.**  
No usar `imagenes base/` ni las copias legacy en `assets/img/inicio|producto|lifestyle|cuero|nuevas/`.

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| `inicio/` | Heroes y lifestyle hombre (`mujer-nueva-*`, `hombre-nueva-*`) |
| `producto/mujer/` | Estudio `estudio-01` … `estudio-08` |
| `producto/hombre/` | Estudio `estudio-01` … `estudio-04` |
| `lifestyle/mujer/` | Editorial `lifestyle-01` … `lifestyle-06` |

## URL en producción

Base: `https://ofeliavallejo.com/imagenes%20nuevas/`

Ejemplo hero mujer:  
`https://ofeliavallejo.com/imagenes%20nuevas/inicio/mujer-nueva-02.jpg`

## Mapa sitio

| Uso | Archivo |
|-----|---------|
| Hero mujer | `inicio/mujer-nueva-02.jpg` |
| Hero hombre | `inicio/hombre-nueva-03.jpg` |
| Bolso / tote | `producto/mujer/estudio-01.jpg` |
| Travel Bag I | `producto/mujer/estudio-02.jpg` |
| Mochila / morral | `producto/mujer/estudio-03.jpg` |
| Maletín hombre | `producto/hombre/estudio-01.jpg` |
| Bandoleras | `inicio/hombre-nueva-04.jpg`, `hombre-nueva-02.jpg` |
| Banner cuero | `lifestyle/mujer/lifestyle-01.jpg` |
| Cinturón | `producto/mujer/estudio-05.jpg` |

Al subir fotos nuevas, añadirlas aquí y actualizar este mapa + `home.html` / `coleccion.html`.
