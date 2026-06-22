# MEMORY.md · Ofelia Vallejo Project
> Índice de memoria del proyecto. Leer antes de empezar cualquier sesión nueva.
> Última consolidación: 2026-06-22

---

## Índice de archivos

- [brand-identity.md](brand-identity.md) — Marca, paleta, tipografía, logo (INMUTABLE), tono, producto hero
- [project-structure.md](project-structure.md) — Stack técnico, archivos clave, páginas del sitio, graphify status
- [tools-and-workflow.md](tools-and-workflow.md) — Graphify, GSAP, componentes UI, Vercel, flujos eficientes
- [user-preferences.md](user-preferences.md) — Preferencias de comunicación, diseño y código de la fundadora
- [../AGENTS.md](../AGENTS.md) — Contexto operativo para Codex: reglas, estado reciente, validación y git

---

## Orientación rápida (leer en 60 segundos)

**Quién:** Ofelia Vallejo — fundadora de Ofelia Vallejo Leather House. Medellín → Lausanne.
**Qué:** Sitio web de lujo + gestión de marca para marroquinería artesanal colombiana.
**Stack:** HTML puro + Vanilla JS + GSAP 3 + CSS custom. Deploy en Vercel.
**Idioma:** Español siempre.
**Créditos:** Usar `prompt_master.md` para contexto comprimido cuando la tarea sea repetitiva; para cambios de marca/diseño leer `CLAUDE.md`.
**Codex:** Leer `AGENTS.md` al iniciar. Mantener commits pequeños y no mezclar cambios ajenos.
**Graphify:** Hay contexto graphify en `graphify-out/`. Usar consultas graphify para preguntas amplias del repo.

---

## Estado actual del proyecto (2026-06-22)

| Componente | Estado |
|---|---|
| home.html | ✅ Producción — inicia en Mujer/Hombre; sección firma rediseñada con video/fallback |
| AGENTS.md | ✅ Creado — puente operativo para Codex |
| assets/video/firma-mandamiento-hero.mov | ✅ Conectado en `#historia` — video CapCut de firma; pesa ~40 MB |
| assets/video/oficio-legendario-home.webp | ✅ Fallback visual de la sección firma |
| assets/js/gsap-animations.js | ✅ Creado — 10 módulos de animación cinematic |
| assets/css/brand.css | ✅ Actualizado — componentes UI premium añadidos |
| prompt_master.md | ✅ Creado — contexto comprimido + plantillas |
| graphify-out/ | ✅ Presente — usar para auditorías amplias |
| scripts/graphify-setup.sh | ✅ Listo — ejecutar desde terminal para construir graph |
| CLAUDE.md | ✅ Referencia maestra de marca |
| Stripe / pagos | ⚠️ Pendiente de variables de entorno |
| Cuentas de usuario | ⏳ Off (data-accounts="off") |

---

## Reglas que no cambian

1. Logo = firma de la abuela → NUNCA modificar
2. Paleta: solo los 7 colores de marca
3. Tipografía: solo Cinzel + Helvetica Neue
4. Tono: sobrio, romano — NUNCA "premium/exclusivo/disfruta/ritual"
5. Consultar graph.json antes de hacer Glob/Grep (cuando esté construido)
6. Una tarea por mensaje para no quemar créditos
7. Para Google Ads: primera pantalla debe vender producto/oficio, no parecer landing genérica

---

*4 archivos de memoria + AGENTS.md · Creado 2026-05-27 · Consolidado para Codex 2026-06-22*
