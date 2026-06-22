# Herramientas y Flujo de Trabajo

**Última actualización:** 2026-06-22

## Herramientas activas en el proyecto

### Codex
- **Archivo operativo:** `AGENTS.md`
- **Regla de sesión:** leer `AGENTS.md`, `CLAUDE.md` y la memoria relevante antes de cambios de marca/diseño.
- **Git:** trabajar con commits pequeños. El usuario suele pedir push a `main` cuando un bloque queda listo.
- **Cuidado:** hay cambios ajenos frecuentes en admin/API/docs. Revisar `git status --short` y no mezclar esos cambios en commits de diseño.
- **Validación base:** `git diff --check`; revisar que `home.html` mantenga `section.gender.shop-gate` como primer bloque visual.

### Claude / Cowork
- **Entorno:** Cowork mode / Codex desktop app
- **Carpeta conectada:** `/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo`
- **Proyecto:** ofelia vallejo (única cuenta activa)
- **Para reducir créditos:** usar `prompt_master.md` — contexto comprimido de marca

### Graphify (instalado 2026-05-27)
- **PyPI:** `graphifyy` (doble y)
- **GitHub:** github.com/safishamsi/graphify
- **Contexto actual:** `graphify-out/` existe en el repo
- **Hook:** puede existir en configuración local; no depender únicamente del hook
- **Instalación inicial:** `bash scripts/graphify-setup.sh` (desde terminal del usuario)
- **Uso en sesión:** `/graphify query "<pregunta>"` antes de buscar archivos
- **Update incremental:** `graphify . --update` (solo archivos cambiados)

### GSAP Animations (instalado 2026-05-27)
- **Archivo:** `assets/js/gsap-animations.js`
- **CDN:** cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/
- **Módulos:** hero entrance, parallax, banner-statement, edit section, banner-cuero, banner-custom, cursor magnético, marquee, generic reveals, navbar scroll
- **Activar prefers-reduced-motion:** automático, sin animaciones si usuario lo prefiere

### Componentes UI Premium (instalado 2026-05-27)
- **Archivo:** `assets/css/brand.css` (sección COMPONENTES UI PREMIUM)
- **Clases disponibles:** `.link-draw`, `.btn-ov`, `.btn-ov--dark`, `.product-card-premium`, `.img-skeleton`, `[data-tooltip]`, `.field-ov`, `.badge-pill`, `.visually-hidden`
- **Ticker/Marquee:** `.ov-marquee-section` > `.ov-marquee` > `.ov-marquee__inner` > `.ov-marquee__item`

### Vercel (deploy)
- **Dominio:** ofeliavallejo.com
- **Checklist:** `docs/VERCEL_CHECKLIST.md`
- **Config:** `vercel.json` (redirects legacy de logos)

### Stripe (pagos)
- **Estado:** configuración pendiente — ver SETUP-ATELIER.md
- **Check actual:** `npm run check:env` falla si faltan `ADMIN_PASSWORD`, `ADMIN_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`.

### Video de firma
- **Activo:** `assets/video/firma-mandamiento-hero.mov`
- **Uso:** fondo de `home.html#historia`
- **Fallback:** `assets/video/oficio-legendario-home.webp`
- **Regla Ads/performance:** no hacer preload del `.mov`; pesa ~40 MB. Convertir a MP4/WebM comprimido antes de optimización final.

## Flujos de trabajo eficientes

### Para tareas de código
1. Leer `AGENTS.md`.
2. Leer `CLAUDE.md` si toca marca/diseño/copy.
3. Revisar `git status --short`.
4. Editar solo el alcance pedido.
5. Ejecutar `git diff --check`.
6. Una tarea por mensaje — no mezclar código + copy si no es necesario.

### Para tareas de copy/voz
1. Usar plantilla de `prompt_master.md` sección 🖊️ COPY
2. Referencia de frases aprobadas en `prompt_master.md` tabla final

### Para imágenes / prompts IA
1. Usar plantilla de `prompt_master.md` sección 🖼️ PROMPT DE IMAGEN
2. Biblioteca de prompts ya validados en `04_Prompts_Visuales/`
3. Para la sección firma/oficio, revisar `04_Prompts_Visuales/hero_video_nacida_firma.md` y `04_Prompts_Visuales/oficio_legendario_google_labs.json` si existen.

### Para explorar el código (después de construir graph)
1. `graphify query "<pregunta>"` desde terminal
2. `/graphify query "<pregunta>"` desde Claude Code
3. Solo hacer Glob/Grep si graphify no tiene la respuesta

## Restricciones de red del sandbox
- PyPI bloqueado en sandbox de Cowork (proxy 403)
- `pip install` debe ejecutarse desde la terminal del usuario, no desde Claude
- Fetch de GitHub raw URLs bloqueado (solo URLs en mensajes del usuario)
