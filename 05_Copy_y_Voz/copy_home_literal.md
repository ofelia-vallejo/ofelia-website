# Copy literal — Home (`index.html`)

**Regla:** todo el texto del home debe salir de esta lista. No inventar variantes.

## Navbar

- **Izquierda:** Mujer · Hombre · Historia
- **Derecha:** Cuero · Personalizar · Contacto

## Sección 1 — Gender hero

| Elemento | Copy |
|----------|------|
| Index | — 01 / Casa |
| Big roman | I (Mujer) · II (Hombre) |
| Label Mujer | Maison · Colección Guanábana |
| Label Hombre | Maison · Colección Borojó |
| Títulos | Mujer · Hombre |
| Sub mujer | Carteras, bolsos y travel pieces en cuero colombiano. |
| Sub hombre | Maletines, billeteras y travel bags en cuero colombiano. |
| CTA | Entrar a la colección → |
| Captions | Bolso Estación / Maletín Antioquia |

## Sección 2 — Statement

- **Título:** Nacida de una firma.
- **Body:** La firma de la abuela Ofelia Vallejo no es un logo. Es patrimonio. Es herencia. Es el alma de cada pieza.

## Sección 3 — Edit

| Elemento | Copy |
|----------|------|
| Header L | Frutos de Antioquia · Lulo |
| Header R | Ver toda la colección → |
| Roman | I (Mujer) · II (Hombre) |
| Badge | Mujer / Hombre |
| Featured Mujer | Bolso Estación — Cuero vino · Guanábana |
| Featured Hombre | Maletín Antioquia — Cuero navy · Borojó |
| Strip Mujer | Cartera Carrera 70 / Cuero vino · Bolso Antioquia / Cuero espresso · Cartera Páramo / Cuero verde |
| Strip Hombre | Travel · Comuna / Cuero navy · Portafolio Ofelia / Cuero espresso · Billetera Carrera / Cuero carbón |

## Sección 4 — Cuero

| Elemento | Copy |
|----------|------|
| Caption | Cuero colombiano |
| Label | Artesanía |
| Título | Hecho para durar. |
| Body | Cada pieza de Ofelia Vallejo está diseñada para acompañar tu vida. No una temporada. Una vida. |
| CTA | Conocer más |

## Sección 5 — Personalización

| Elemento | Copy |
|----------|------|
| Label | Servicio exclusivo |
| Título | Tu nombre. En cuero. |
| Sub | Grabado láser personalizado en cada pieza. |
| CTA | Solicitar pieza |

## Footer

- **Brand:** logo + Leather House · Medellín, Colombia
- **Casa:** Mujer / Hombre / Cuero / Historia
- **Atelier:** Personalizar / Cuidado / Reparación
- **Contacto:** Instagram / Escribir
- **Bottom:** © 2025 Ofelia Vallejo · Medellín, Colombia · Privacidad · Términos

---

## Validación final (pre-push)

### Estructura

- [ ] Navbar fixed con 3 zonas (left links, logo centro, right links)
- [ ] Hero split Mujer | Hombre con divisor central de 1px
- [ ] Banner statement centrado con watermark del logo
- [ ] Edit grid con featured grande + strip de 3 mini-products por lado
- [ ] Banner cuero split 55/45 horizontal
- [ ] Banner personalización (única sección con fondo navy en scroll)
- [ ] Footer 4 columnas

### Color

- [ ] Marfil + navy dominan el 95% del sitio
- [ ] Beige-medio aparece en el panel der del split Cuero
- [ ] Vino/verde/espresso/carbón solo en mini-cromos de productos
- [ ] CERO secundarios como background de sección

### Tipografía

- [ ] Todos los títulos en Cinzel 400 (nunca bold)
- [ ] Cuerpo en Helvetica Neue 300
- [ ] Labels uppercase en Helvetica Neue 400
- [ ] Letter-spacing negativo (-0.01em) solo en hero gender title

### Interacciones

- [ ] Cursor 6px navy → 18px outline al hover sobre links
- [ ] Cursor invierte a marfil sobre zonas data-dark
- [ ] Reveal on scroll en `.reveal` con threshold 0.08
- [ ] Hover en featured/strip products: scale 1.02–1.04 con ease lento
- [ ] Hover en CTAs: gap crece, border-bottom se intensifica

### Responsive

- [ ] Tablet (901–1100): navbar reduce gap y font-size
- [ ] Mobile (≤900): hero apila vertical, nav oculta, botón Menú
- [ ] Mobile: split Cuero apila, edit grid 1 columna

### Accesibilidad

- [ ] Imágenes con alt apropiado (o aria-hidden si decorativas)
- [ ] `role="banner"` en navbar
- [ ] `aria-label` en link del logo
- [ ] `data-dark` no bloquea contenido (metadata cursor)

### Reglas absolutas

- [ ] Cero border-radius en contenedores
- [ ] Cero box-shadow decorativo
- [ ] Cero colores hex fuera de paleta tokenizada
- [ ] Transiciones con `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- [ ] Sin frameworks; home en `index.html` único (CSS/JS inline)
