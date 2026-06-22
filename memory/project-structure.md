# Estructura del Proyecto · Ofelia Vallejo

**Última actualización:** 2026-06-22

## Stack tecnológico
- **Frontend:** HTML puro + Vanilla JS + CSS custom (sin frameworks)
- **Animaciones:** GSAP 3 + ScrollTrigger (CDN cdnjs) — instalado 2026-05-27
- **Backend:** Node.js · APIs en `/api/` · Vercel serverless
- **Base de datos:** PostgreSQL (ver SETUP-ATELIER.md)
- **Pagos:** Stripe (configuración pendiente)
- **Deploy:** Vercel · dominio: ofeliavallejo.com

## Archivos clave del sitio web
| Archivo | Función |
|---|---|
| `home.html` | Página principal de producción (EDITAR AQUÍ) |
| `AGENTS.md` | Contexto operativo para Codex |
| `index.html` | Intro con globo D3 → entrada al sitio |
| `assets/css/brand.css` | Estilos compartidos: navbar, footer, componentes UI |
| `assets/css/mobile.css` | Estilos responsive |
| `assets/js/brand.js` | JS compartido: cursor, reveal, navbar |
| `assets/js/gsap-animations.js` | Motor de animaciones GSAP (instalado 2026-05-27) |
| `assets/js/launch-popup.js` | Popup de lanzamiento |
| `assets/js/account.js` | Cuentas de usuario |
| `vercel.json` | Configuración deploy + redirects |
| `CLAUDE.md` | Referencia maestra de marca (LECTURA OBLIGATORIA) |
| `prompt_master.md` | Prompts optimizados para eficiencia (creado 2026-05-27) |
| `assets/video/firma-mandamiento-hero.mov` | Video de fondo de la sección firma `#historia` |
| `assets/video/oficio-legendario-home.webp` | Fallback visual de la sección firma |

## Carpetas del proyecto
| Carpeta | Contenido |
|---|---|
| `01_Contabilidad/` | Finanzas, ingresos, egresos, facturación |
| `02_Publicaciones/` | Calendario editorial, contenido RRSS |
| `03_Productos/` | Catálogo del ecosistema de cuero |
| `04_Prompts_Visuales/` | Biblioteca de prompts/JSONs para imágenes IA |
| `05_Copy_y_Voz/` | Plantillas de copy, emails, lanzamientos |
| `06_Identidad_Marca/` | brand_discovery.md, paleta_tipografia.md, avatar_prompts.md, logos/ |
| `imagenes base/` | 172 imágenes de referencia |
| `videos base/` | 5 videos de referencia |
| `memory/` | Este sistema de memoria (creado 2026-05-27) |

## Graphify · Knowledge Graph
- **Estado:** `graphify-out/` presente en el repo; usar para consultas amplias antes de rastrear manualmente
- **Script de instalación:** `scripts/graphify-setup.sh`
- **Comando útil:** `graphify query "<pregunta>" --budget 2500`

## Home de producción · Junio 2026

`home.html` debe mantener esta secuencia:

1. Navbar + announce bar.
2. `section.gender.shop-gate` — entrada principal Mujer/Hombre.
3. `section.nuevos` — nuevos productos/editorial.
4. `section#historia.banner-statement` — mandamiento de la firma con video/fallback.
5. `section#coleccion.edit` — colección Aurora.
6. `section.banner-cuero` — material/oficio.
7. `section#personalizar.banner-custom` — grabado láser.

El hero oscuro anterior `.campaign-hero` fue retirado por decisión de marca/UX. No reintroducirlo salvo instrucción explícita.

## Páginas del sitio
- `home.html` — home principal
- `coleccion.html` — catálogo completo
- `producto/` — PDPs dinámicos por producto
- `personalizar.html` — servicio de grabado láser
- `manifiesto.html` — historia de la marca
- `cuero.html` — filosofía del cuero
- `contacto.html` — contacto
- `cuenta.html` — área de cuentas (feature: data-accounts="off" → oculto por ahora)
- `checkout.html` — proceso de compra
