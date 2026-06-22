# OFELIA VALLEJO · PROMPT MASTER
> Copia este bloque al inicio de cualquier sesión con Claude para reducir el consumo de créditos. En vez de que Claude lea el CLAUDE.md completo cada vez, este archivo ya contiene el contexto comprimido + los prompts listos para usar.

---

## CONTEXTO RÁPIDO DE MARCA (copiar al inicio de sesión)

```
Marca: Ofelia Vallejo · Leather House. Marroquinería colombiana artesanal, producida en Medellín, vendida en Europa (Lausanne). La firma de la abuela Ofelia Vallejo es el logo — patrimonio inmutable.

Posicionamiento: Heritage paisa × estándar editorial europeo. Referencia visual: Hermès, Loewe, Bottega Veneta.

Paleta: Marfil #F3EEE6 | Navy #0B1F3A | Espresso #3B2B26 | Vino #5B1E24 | Verde #1F3527
Tipografía: Cinzel 400 (títulos) + Helvetica Neue 300 (body)
Tagline: "Elegancia que permanece."

Tono: sobrio · romano · patrimonial. NUNCA: premium / exclusivo / disfruta / vive la experiencia / ritual.
Logo: NUNCA modificar. Usar archivos tal cual: logo_sello.png / logo_firma_nav.png / logo_firma_completa.png.

Sitio: home.html (producción) + index.html (intro globo). Stack: HTML puro + Vanilla JS + GSAP. CSS en brand.css + mobile.css. JS en assets/js/brand.js + gsap-animations.js.

Producción / deploy: docs/HANDOFF_CLAUDE_MCP.md (handoff Claude MCP) · docs/PRODUCCION_PASO_A_PASO.md (guía dueña) · docs/VERCEL_CHECKLIST.md
```

---

## PLANTILLAS DE PROMPT POR TAREA

### 🖊️ COPY / VOZ DE MARCA
```
Contexto: Ofelia Vallejo Leather House. Tono romano, sobrio, sin adjetivos de marketing. Paleta verbal: elegancia, herencia, permanencia, artesanía, cuero pleno, Medellín, atelier.
Tarea: [DESCRIBIR QUÉ COPY NECESITAS]
Formato: [IG caption / email / producto / web copy / WhatsApp]
Extensión: [máx X palabras]
Restricciones: sin "premium/exclusivo/disfruta/ritual/vibe"
```

### 🌐 CÓDIGO WEB (home.html / CSS / JS)
```
Contexto sitio: HTML puro, CSS custom con variables --marfil --navy --espresso, Cinzel+Helvetica, GSAP 3 + ScrollTrigger disponible, brand.js + gsap-animations.js cargados.
Archivo a modificar: [home.html / brand.css / gsap-animations.js / otro]
Tarea específica: [DESCRIBIR EL CAMBIO EXACTO]
Restricción visual: paleta marca, sin bordes radius, sin glassmorphism, sin gradientes saturados.
```

### 🖼️ PROMPT DE IMAGEN (para Midjourney / Gemini / IA generativa)
```
Usa el template de /04_Prompts_Visuales/ o este base:
"Editorial fashion-house photograph, [modelo latino/a 25-45 editorial presence], [producto de cuero con láser-grabado visible], [locación: lobby europeo / atelier paisa / estación de tren], natural side light 3200K golden hour, [paleta: espresso/ivory/navy], crop editorial [tres-cuartos / de espaldas / cropped], Hasselblad H6D cinematic still, Kodak Portra 400 emulation, fine grain, --ar 4:5 --style raw"
Restricciones: sin smile-to-camera, sin sombrero vueltiao/Wayuu/ruana, sin logo aplicado en post.
```

### 📱 PUBLICACIÓN RRSS
```
Red: [Instagram / WhatsApp Status / Stories]
Formato: [carousel / single / reel caption]
Contexto publicación: [temporada / producto / campaña / fecha especial]
Tono OV: sobrio, máx 3 hashtags de nicho, sin emojis excesivos.
Referencia visual adjunta: [sí/no — adjuntar foto si es necesario]
```

### 📊 CONTABILIDAD / FINANZAS
```
Tarea financiera: [factura / registro ingreso / registro egreso / reporte mensual]
Moneda: [COP / CHF / EUR]
Periodo: [fecha inicio - fecha fin]
Archivos relevantes en: /01_Contabilidad/
```

### 🛍️ PRODUCTO / CATÁLOGO
```
Producto: [nombre exacto del producto]
Tarea: [nueva descripción / precio / variante / ficha técnica]
Colores disponibles: Negro / Rústico (cognac) / Café Oscuro / Espresso / Vino / Verde
Servicio láser: sí (siempre mencionar disponibilidad de grabado)
Archivo destino: /03_Productos/
```

---

## REGLAS DE EFICIENCIA (para reducir tokens / créditos)

1. **No adjuntes CLAUDE.md completo** si ya pegaste el contexto rápido de arriba.
2. **Especifica el archivo exacto** que quieres que Claude modifique — no digas "el sitio", di "home.html línea X".
3. **Una tarea por mensaje** — no mezcles código + copy + imagen en el mismo prompt.
4. **Para código:** pide siempre el cambio mínimo necesario (no reescribir archivos completos).
5. **Para imágenes:** no pidas que Claude genere prompts largos — usa las plantillas de arriba directamente.
6. **Para iteraciones:** di exactamente qué cambiar del resultado anterior, no "hazlo mejor".

---

## ARCHIVOS CLAVE DEL PROYECTO

| Archivo | Para qué |
|---|---|
| `home.html` | Página principal (editar aquí) |
| `assets/css/brand.css` | Estilos compartidos navbar/footer |
| `assets/js/brand.js` | JS compartido (cursor, reveal, navbar) |
| `assets/js/gsap-animations.js` | Animaciones GSAP ScrollTrigger |
| `06_Identidad_Marca/brand_discovery.md` | Contexto de marca extendido |
| `02_Publicaciones/` | Calendario y contenido RRSS |
| `04_Prompts_Visuales/` | Prompts de imagen ya validados |

---

## FRASES APROBADAS DE MARCA

| Español | Francés | Inglés |
|---|---|---|
| Elegancia que permanece. | Une élégance qui dure. | Elegance that endures. |
| Nacida de una firma. | Née d'une signature. | Born from a signature. |
| Cuero hecho para durar. | Cuir fait pour durer. | Leather made to last. |
| Tu nombre. En cuero. | Votre nom. En cuir. | Your name. In leather. |
| Leather House · Medellín, Colombia. | — | — |

---

*Actualizado: 2026-05-27 · Versión comprimida del CLAUDE.md para uso eficiente en sesiones de Claude.*

---

## 🔍 GRAPHIFY · Todas las funciones

> Instalar una vez: `bash scripts/graphify-setup.sh` desde tu terminal.
> Luego el knowledge graph vive en `graph.json` y se consulta sin releer archivos.

### Consulta del graph (lo más usado)

```bash
# Desde terminal:
graphify query "¿qué archivos manejan el carrito?"
graphify query "¿qué CSS controla el navbar?"
graphify query "¿cómo se conecta home.html con brand.js?"
graphify query "¿qué funciones manejan las animaciones?"
graphify query "¿qué páginas usan el componente product-card?"

# Desde Claude Code:
/graphify query "¿qué archivos debo editar para cambiar el footer?"
/graphify query "¿dónde está el código del cursor custom?"
```

### Construcción del graph

```bash
graphify .                        # Primera vez — construye todo (~2-5 min)
graphify . --update               # Incremental — solo archivos cambiados (rápido)
graphify . --watch                # Modo watch — reconstruye al detectar cambios
graphify . --exclude node_modules # Excluir carpetas específicas
```

### Agregar fuentes externas al graph

```bash
# Agregar página web (documentación, referencia):
graphify add https://ofeliavallejo.com
graphify add https://docs.stripe.com/api

# Agregar paper / artículo académico:
graphify add https://arxiv.org/abs/1706.03762

# Agregar video de YouTube (transcripción automática con Whisper):
graphify add https://youtu.be/VIDEO_ID

# Agregar issue o documentación de GitHub:
# graphify add https://github.com/repo/issues/123
```

### Outputs del graph

| Archivo | Qué es |
|---|---|
| `graph.json` | Graph completo — fuente de verdad, persistente entre sesiones |
| `graph.html` | Visualización interactiva — abrir con `open graph.html` |
| `GRAPH_REPORT.md` | Reporte: nodos god, conexiones sorprendentes, comunidades detectadas |

```bash
open graph.html          # Ver visualización en browser
cat GRAPH_REPORT.md      # Ver reporte de estructura
```

### Exportaciones especiales

```bash
graphify . --obsidian    # Exporta vault de Obsidian (miles de archivos — opt-in)
graphify . --neo4j       # Exporta a Neo4j (base de datos de grafos)
graphify . --wiki        # Genera artículos Wikipedia por comunidad (para agentes)
graphify . --mcp         # Inicia servidor MCP stdio (integración externa)
```

### Git hooks (auto-rebuild automático)

```bash
graphify hook install    # Instala: post-commit + post-checkout
                         # → graph se reconstruye en cada commit y cambio de branch
```

### Tipos de nodos en el graph (entender el GRAPH_REPORT)

| Tipo edge | Confianza | Significado |
|---|---|---|
| EXTRACTED | 1.0 | Relación explícita en el código |
| INFERRED | 0.4–0.9 | Relación inferida por el modelo |
| AMBIGUOUS | 0.1–0.3 | Posible relación, incierta |
| semantically_similar_to | varía | Funciones/conceptos relacionados conceptualmente |
| rationale_for | — | Comentarios `# WHY:` `# RATIONALE:` como nodos de conocimiento |
| hyperedge | — | Grupo de 3+ nodos con relación compartida (ej: flujo completo de auth) |

### Prompt para usar graphify en sesión de Claude

```
Antes de buscar archivos manualmente, consulta el knowledge graph:
graphify query "<tu pregunta específica sobre el código>"

Si graph.json existe en la raíz, úsalo — es 71x más eficiente en tokens
que hacer Glob/Grep manual por todos los archivos.
```

### Instalación completa (referencia)

```bash
# Una vez, desde tu terminal:
cd "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"
pip install graphifyy          # PyPI: graphifyy (doble y)
graphify install               # Integra con Claude Code
graphify .                     # Construye graph primera vez
graphify hook install          # Auto-rebuild en commits
open graph.html                # Visualizar
```
