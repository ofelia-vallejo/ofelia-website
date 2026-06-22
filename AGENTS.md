# Codex · Ofelia Vallejo

Este repo pertenece a **Ofelia Vallejo Leather House**. Antes de tocar diseño, copy, prompts, imágenes o código, leer este archivo y luego `CLAUDE.md`.

## Prioridad de contexto

1. `CLAUDE.md` — referencia maestra de marca, logo, tono, web y fotografía.
2. `memory/MEMORY.md` — índice vivo del proyecto.
3. `memory/brand-identity.md` — reglas de identidad resumidas.
4. `memory/project-structure.md` — stack, páginas y archivos clave.
5. `memory/tools-and-workflow.md` — flujo Codex/Graphify/deploy.
6. `assets/SITIO_REGLAS.md` y `GUIA-FOTOGRAFICA.md` cuando el cambio toque diseño visual o fotografía.

## Reglas absolutas

- La firma/logo de Ofelia Vallejo es patrimonio familiar. Nunca redibujar, vectorizar, recolorear, animar, reinterpretar ni generar variantes.
- Usar solo los assets oficiales en `assets/img/` y `06_Identidad_Marca/logos/`.
- Mantener paleta de marca: marfil, beige medio, navy, espresso, vino, verde profundo, carbón.
- Tono sobrio, editorial y patrimonial. Evitar: `premium`, `exclusivo`, `vive la experiencia`, `disfruta`, `ritual`, `sanación`, `energía`, `vibra`.
- Nada genérico de plantilla, nada wellness, nada kitsch colombiano, nada glassmorphism, nada morado/neón.
- Responder en español salvo que se pida otro idioma.

## Estado reciente conectado a Codex

- Home de producción: `home.html`.
- La página ahora inicia con el split `Mujer / Hombre`; el hero oscuro anterior fue retirado.
- Sección firma: `#historia` / `Nacida de una firma.` usa el video `assets/video/firma-mandamiento-hero.mov` como fondo.
- La misma sección tiene fallback visual `assets/video/oficio-legendario-home.webp` y poster `assets/video/oficio-legendario-poster.jpg`.
- El video `.mov` pesa ~40 MB. No debe ir en `preload`; para producción ideal convertir a MP4/WebM comprimido.
- Último commit de diseño conectado: `4f74f9f Refine signature home section`, pusheado a `main`.

## Validación antes de entregar

- Ejecutar `git diff --check` para cambios de HTML/CSS/JS.
- Verificar que `home.html` siga empezando con `<section class="gender shop-gate"`.
- Confirmar que no vuelva a existir `.campaign-hero` si el usuario pidió iniciar en Mujer/Hombre.
- Validar copy contra marca y Google Ads: producto, oficio, Medellín, cuero pleno, grabado láser, Europa/CHF; nada de landing genérica.
- Si se prueba local con `python3 -m http.server`, las APIs serverless pueden dar 404. Para checkout/admin/API usar `npm run dev` o entorno Vercel.
- `npm run check:env` debe pasar antes de producción real. A junio 2026 faltaban variables requeridas de Stripe, DB, admin y `SITE_URL`.

## Graphify

Si el usuario escribe `/graphify`, usar el skill `graphify` antes de cualquier otra acción.

Para consultas amplias del repo, preferir:

```bash
graphify query "pregunta del proyecto" --budget 2500
```

## Git

- El usuario suele querer push a `main` cuando un bloque queda listo.
- Antes de commit/push, revisar `git status --short`.
- Hay cambios ajenos frecuentes en admin/API/docs. No revertirlos ni meterlos al commit si no son parte de la tarea.
- Commits deben ser pequeños y con alcance claro.
