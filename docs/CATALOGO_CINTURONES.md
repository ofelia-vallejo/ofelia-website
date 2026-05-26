# Catálogo · Cinturón / Correas

**Producto único:** `/producto/cinturon`  
**Fuente de verdad:** `data/cinturon-assets.json` (color real verificado con cuentagotas + revisión visual)  
**Sincronizar catálogo:** `python3 scripts/sync-cinturon-catalog.py`

> Los nombres de archivo en disco **no siempre coinciden** con el color del cuero. Usar siempre `colorKey` + mapa de assets, nunca confiar solo en el nombre del JPG.

## Tokens de color (marca)

| Familia | colorHex | Gradiente swatch (claro → medio → oscuro) |
|---------|----------|-------------------------------------------|
| Negro | `#141414` | `#2c3443` · `#141414` · `#0a0a0a` |
| Navy | `#0B1F3A` | `#152a45` · `#0B1F3A` · `#081628` |
| Espresso | `#3B2B26` | `#4a362e` · `#3B2B26` · `#2e211c` |
| Cognac | `#8B5E3C` | `#9a6b42` · `#8B5E3C` · `#6d4a2c` |

## Matriz colorKey → fotos reales

| colorKey | Color · Acabado | Archivos asignados (contenido real) |
|----------|-----------------|-------------------------------------|
| `negro-liso` | Negro · Liso | `cognac-liso-plano.jpg`, `cognac-liso-detalle.jpg` |
| `negro-granulado` | Negro · Granulado | *(sin foto — placeholder en colección)* |
| `navy-granulado` | Navy · Granulado | `navy-granulado-estudio.jpg`, `navy-granulado-detalle.jpg`, `espresso-granulado-detalle.jpg` |
| `espresso-liso` | Espresso · Liso | `negro-granulado-estudio.jpg`, `cognac-liso-estudio.jpg` |
| `espresso-granulado` | Espresso · Granulado | `espresso-granulado-estudio.jpg`, `espresso-liso-plano.jpg` |
| `cognac-liso` | Cognac · Liso | `negro-liso-detalle.jpg` |

## Archivos sin variante (pendiente)

| Archivo en disco | Color real | Nota |
|------------------|------------|------|
| `negro-liso-estudio.jpg` | Navy · Liso | Reservado para futura variante `navy-liso` |
| `espresso-liso-estudio.jpg` | Navy · Liso | Duplicado editorial navy liso |

## Colección

Sección `#cinturones` en `coleccion.html` — 6 tarjetas con hash al PDP (`#negro-liso`, etc.).

## Postgres

Tras actualizar fotos o mapa en repo:

```bash
python3 scripts/sync-cinturon-catalog.py
npm run db:migrate
```
