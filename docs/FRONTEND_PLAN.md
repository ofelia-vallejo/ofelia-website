# Plan maestro frontend · Ofelia Vallejo

> Objetivo: dejar el sitio listo para venta real, Google Ads y revisión editorial, sin perder la esencia de Leather House: producto, oficio, firma, Medellín, Europa y permanencia.

## Principios de ejecución

- Mantener `AGENTS.md`, `CLAUDE.md` y `memory/` como contexto obligatorio.
- No introducir frameworks en el sitio principal: HTML puro, CSS custom, Vanilla JS, GSAP.
- Trabajar por fases pequeñas, con commits separados y pruebas por fase.
- No mezclar cambios de frontend con cambios ajenos en admin/API/docs.
- Antes de cada entrega: `git diff --check`, smoke test local y revisión mobile/desktop.

## Métrica de "trabajo perfecto"

Una página queda lista cuando cumple:

- Diseño: editorial, no genérico, consistente con paleta/tipografía/logo.
- UX: navegación clara, CTA correcto, flujo natural hacia producto, personalizar o checkout.
- Ads: mensaje claro de producto/oficio, sin promesas vagas ni copy genérico.
- Técnica: sin errores console críticos, assets 200, sin CSS muerto evidente.
- Performance: imágenes lazy donde aplica, video sin preload pesado, primera pantalla rápida.
- Accesibilidad: headings coherentes, alt text útil, foco visible, contraste suficiente.
- Pruebas: unitarias para lógica JS relevante y smoke/e2e para páginas críticas.

## Fase 0 · Base de control

**Meta:** crear un piso técnico para poder mejorar sin romper.

**Estado:** en ejecución. Primer bloque completado con pruebas nativas `node:test` y smoke frontend sin dependencias externas.

- Congelar inventario de rutas desde `docs/MAPA_ENLACES.md`.
- Definir páginas críticas: `/`, `/home`, `/coleccion`, `/producto/{slug}`, `/producto/travel-bag`, `/personalizar`, `/checkout`, `/gracias`, `/cuenta`, `/contacto`, `/manifiesto`, `/cuero`.
- Crear checklist visual por página: desktop 1440, tablet 768, mobile 390.
- Confirmar que todos los enlaces visibles usan clean URLs sin `.html`.
- Identificar CSS/JS muerto por página.
- Documentar assets pesados: video firma, hero images, producto/lifestyle.

**Pruebas:**
- `git diff --check`
- script de enlaces internos rotos
- `npm run check:env` para separar bloqueos de producción

**Implementado:**
- `npm run test` — unitarias iniciales para pricing, descuentos, checkout context y Stripe lines.
- `npm run test:frontend` — smoke de rutas/assets/home/guardrails de marca.
- `npm run verify:frontend` — ejecución conjunta del bloque frontend.

## Fase 1 · Sistema visual compartido

**Meta:** que todo el sitio parezca una sola casa, no páginas sueltas.

- Auditar `assets/css/brand.css`, `assets/css/mobile.css` y estilos inline por página.
- Consolidar tokens: color, spacing, type scale, reglas, botones, links, badges, formularios.
- Normalizar navbar/footer en todas las rutas.
- Definir componentes base:
  - botones primarios/secundarios
  - CTA editorial
  - cards de producto
  - blocks de quote/statement
  - formularios
  - banners oscuros
  - sección de producto/oficio
- Eliminar patrones prohibidos: UI genérica, glassmorphism, radios innecesarios, copy explicativo dentro del UI.

**Criterio de aceptación:**
- Cada página usa la misma voz visual.
- No hay colores fuera de paleta salvo imágenes.
- El logo se usa sin modificaciones.

## Fase 2 · Home como página de Ads

**Meta:** convertir `/home` en la página que recibe tráfico frío sin sentirse landing genérica.

- Mantener primera pantalla Mujer/Hombre.
- Optimizar primera impresión:
  - producto visible
  - oficio/Medellín claro
  - CTA directo a colección
  - sin video pesado above the fold
- Refinar sección `Nacida de una firma`:
  - video de fondo con fallback
  - copy patrimonial
  - CTA hacia `/personalizar`
  - no mencionar "abuela" en esta sección si el objetivo emocional es más universal
- Revisar secciones posteriores para balance:
  - nuevos productos
  - colección Aurora
  - cuero/oficio
  - personalización láser

**Pruebas:**
- screenshot desktop/mobile
- revisar LCP visual
- confirmar que `.campaign-hero` no reaparece
- confirmar ausencia de preload para videos pesados

## Fase 3 · Colección y categoría

**Meta:** que `/coleccion` venda con claridad y lujo silencioso.

- Revisar grid, filtros, estados vacíos, loading y mobile.
- Mejorar jerarquía: categoría, material, color, precio CHF, CTA.
- Asegurar que cada tarjeta lleve a `/producto/{slug}`.
- Evitar estética marketplace genérica.
- Agregar microcopy útil: cuero pleno, hecho en Medellín, grabado disponible cuando aplique.

**Pruebas:**
- filtros por categoría
- enlaces de producto
- imágenes lazy y alt text
- estado sin productos

## Fase 4 · PDP dinámico

**Meta:** que cada producto tenga página lista para convertir.

- Auditar `producto/index.html`.
- Estructura mínima por PDP:
  - galería visual sólida
  - nombre del producto
  - precio CHF
  - color/material
  - descripción sobria
  - selector cantidad/color si aplica
  - CTA añadir al carrito
  - CTA personalizar
  - prueba de oficio: cuero pleno, hecho a mano, Medellín
  - política de envío/devolución breve
- Revisar `producto/travel-bag.html` como hub editorial.
- Normalizar errores si slug no existe.

**Pruebas unitarias:**
- render de datos del catálogo
- selección de variante
- cálculo de precio si cambia por color/personalización
- add-to-cart payload

## Fase 5 · Personalizar

**Meta:** que `/personalizar` sea el diferencial de marca y conversión.

- Revisar flujo "Tu nombre. En cuero."
- Mejorar formulario:
  - producto
  - color
  - texto a grabar
  - ubicación aproximada
  - datos de contacto
  - consentimiento
- Añadir estados: envío, éxito, error, validación.
- Mantener tono atelier, no formulario genérico.
- Enlazar desde home, PDPs y colección.

**Pruebas unitarias:**
- validación de campos
- sanitización de texto a grabar
- payload hacia `/api/personalizar`
- manejo de errores

## Fase 6 · Carrito y checkout

**Meta:** que el flujo de compra sea confiable antes de Ads.

- Auditar `checkout.html`, `assets/js/cart.js`, `assets/js/cart-ui.js`, `lib/compute-checkout.js`.
- Revisar:
  - carrito persistente
  - actualización de cantidades
  - eliminación de ítems
  - envío CH/EU
  - cupón
  - total en vivo
  - Stripe enabled/disabled
  - errores claros
- Diseñar checkout sobrio: denso, confiable, sin marketing extra.

**Pruebas unitarias obligatorias:**
- `compute-checkout`
- descuentos/cupones
- shipping CH/EU
- build Stripe lines
- persistencia del carrito
- edge cases: carrito vacío, cantidad 0, cupón inválido

## Fase 7 · Cuenta y post-compra

**Meta:** que `/cuenta` y `/gracias` no parezcan añadidos.

- Revisar feature flag `data-accounts="off"`.
- Si cuentas siguen off, ocultar/neutralizar UX rota.
- Diseñar `/gracias` como confirmación premium:
  - número de orden
  - resumen
  - próximos pasos
  - contacto atelier
- Revisar recuperación de estado tras pago.

**Pruebas:**
- ruta gracias con y sin session id
- cuenta off/on
- mensajes de error

## Fase 8 · Páginas editoriales

**Meta:** que `/manifiesto`, `/cuero`, `/contacto`, `/privacidad`, `/terminos` acompañen la venta.

- `manifiesto`: historia/firma sin saturar de explicación.
- `cuero`: prueba de material, cuidado, durabilidad, origen.
- `contacto`: confianza, reparación, atelier, WhatsApp/email.
- legales: legibles, sobrios, sin romper marca.

**Pruebas:**
- headings ordenados
- links internos correctos
- mobile sin overflow

## Fase 9 · Performance y assets

**Meta:** sitio rápido para Ads y móvil.

- Convertir videos grandes a MP4/WebM comprimido.
- Mantener poster/fallback para video de firma.
- Definir tamaños de imagen y `srcset` donde tenga impacto.
- Lazy-load debajo del fold.
- Preload solo para logo/nav y assets críticos reales.
- Revisar fuentes: Cinzel con preload controlado, Helvetica local/sistema.
- Medir:
  - LCP
  - CLS
  - INP
  - peso total inicial

**Objetivos:**
- Home inicial sin descargar video pesado antes de scroll.
- Imágenes hero optimizadas.
- Sin layout shift en cards/productos.

## Fase 10 · SEO, Ads y medición

**Meta:** tráfico de Google Ads con intención clara y medición correcta.

- Revisar titles/descriptions por página.
- JSON-LD:
  - Organization
  - WebSite
  - CollectionPage
  - Product en PDPs
  - BreadcrumbList
- Confirmar canonical limpio.
- Revisar OG/Twitter.
- Eventos analytics:
  - view_item
  - select_item
  - add_to_cart
  - begin_checkout
  - purchase
  - personalize_submit
  - lead/contact
- Consent mode/cookies: esencial vs marketing.

**Criterio Ads:**
- Landing clara para producto y personalización.
- Nada de claims falsos.
- Nada de copy genérico.
- Experiencia mobile impecable.

## Fase 11 · Accesibilidad

**Meta:** lujo también significa claridad y uso impecable.

- Revisar contraste en secciones navy/video.
- Foco visible en links, botones, menú, carrito, formularios.
- Alt text editorial pero útil.
- Labels en inputs.
- Menú mobile accesible.
- Evitar texto sobre imagen sin overlay suficiente.
- Respetar `prefers-reduced-motion`.

**Pruebas:**
- navegación con teclado
- lector básico de estructura headings
- axe/lighthouse cuando esté disponible

## Fase 12 · Pruebas automatizadas

**Meta:** introducir pruebas sin convertir el proyecto en framework pesado.

### Herramientas recomendadas

- Unitarias: `vitest`
- DOM/jsdom: `@testing-library/dom` si hace falta
- E2E/smoke: `playwright`
- Calidad: scripts npm explícitos

### Scripts propuestos

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:links": "node scripts/check-links.js",
  "test:a11y": "node scripts/check-a11y.js",
  "verify": "npm run check:env && npm run test && npm run test:e2e"
}
```

### Unit tests prioritarios

- `lib/compute-checkout.js`
- `lib/build-stripe-lines.js`
- `lib/pricing.js`
- `lib/discounts.js`
- `lib/catalog-utils.js`
- `assets/js/cart.js`
- `assets/js/cart-ui.js`
- validadores de formularios contacto/personalizar

### E2E smoke prioritarios

- `/home` carga y primer section es Mujer/Hombre.
- `/coleccion` muestra productos y filtros.
- `/producto/{slug}` renderiza producto, precio y CTA.
- añadir al carrito desde PDP.
- `/checkout` calcula total y quote.
- `/personalizar` valida y envía lead.
- navbar/footer presentes en rutas clave.
- mobile 390px sin overflow horizontal.

## Fase 13 · QA manual final

**Checklist visual por viewport:**

- 1440 x 1200 desktop
- 1024 x 1366 tablet
- 768 x 1024 tablet vertical
- 390 x 1100 mobile
- 360 x 800 mobile pequeño

**Checklist funcional:**

- navegación completa
- menú mobile
- carrito
- checkout quote
- formularios
- consent cookies
- analytics sin bloquear
- errores comprensibles

**Checklist marca:**

- logo intacto
- no copy prohibido
- no colores fuera de paleta
- no hero genérico
- producto y oficio siempre visibles

## Orden recomendado de implementación

1. Base de pruebas y scripts (`vitest`, `playwright`, links).
2. Auditoría de home + colección + PDP.
3. Checkout/cart unit tests.
4. Personalizar/contacto unit tests.
5. Performance assets: video e imágenes.
6. SEO/JSON-LD por página.
7. Accesibilidad y mobile polish.
8. QA final y deploy.

## Bloqueos conocidos

- `npm run check:env` falla si no existen variables de producción.
- El video `assets/video/firma-mandamiento-hero.mov` pesa ~40 MB; debe comprimirse para una fase de performance final.
- Hay cambios ajenos frecuentes en admin/API/docs; revisar antes de cada commit.

## Definición de listo para entrega

- `git diff --check` limpio.
- `npm run test` limpio.
- `npm run test:e2e` limpio.
- `npm run check:env` limpio en entorno con variables.
- Lighthouse/Ads mobile sin problemas críticos.
- Smoke test post-deploy en rutas de `docs/VERCEL_CHECKLIST.md`.
- Commit claro y push a `main`.
