# Cursor Prompt — Home v1 (copy update)

> Pega este prompt en Cursor (o Claude Code) con el archivo `index.html` abierto.
> El prompt está escrito para que se limite a reemplazar textos y NO toque estructura, CSS ni JS.

---

```
Actualiza ÚNICAMENTE los textos visibles del archivo `index.html` en la raíz del proyecto.
NO modifiques HTML estructural, CSS, JS, ni atributos. Solo el contenido de texto entre etiquetas.

Aplica EXACTAMENTE los siguientes reemplazos (busca el string actual entre comillas, reemplaza por el nuevo):

NAVBAR
- No cambies los links (Colección, Historia, Personalizar, Contacto).

HERO
1. Cambia `Leather House · Medellín, Colombia` por `Leather House · Medellín → Lausanne`
2. Mantén `Elegancia que permanece.`
3. Mantén `Ver colección →`
4. Cambia el caption `Travel Bag` por `Travel Bag · N° I`

STATEMENT
5. Mantén el título `Nacida de una firma.`
6. Reemplaza el bloque del párrafo statement__body:
   - Texto actual:
     `La firma de la abuela Ofelia Vallejo no es un logo.<br>
     Es patrimonio. Es herencia. Es el alma de cada pieza.`
   - Texto nuevo:
     `La firma de mi abuela Ofelia no es un logo.<br>
     Es la herencia que cruzó el océano con nosotras —<br>
     el alma paisa de cada pieza que hoy nace en el atelier.`

PRODUCTOS
7. En el header, cambia el `productos__header-l` de `Colección` por `Colección 01 — Travel`.
8. En las cards, mantén los nombres `Travel Bag I`, `Travel Bag II`, `Travel Bag III`.
9. Reemplaza los detalles:
   - Card 1: `Cuero colombiano` → `Cuero pleno · Espresso`
   - Card 2: `Cuero colombiano` → `Cuero pleno · Noche`
   - Card 3: `Cuero colombiano` → `Cuero pleno · Bosque`

SPLIT
10. Cambia el `split__label` de `Artesanía` por `Atelier · Medellín`
11. Mantén el título `Hecho para durar.`
12. Reemplaza el `split__copy`:
    - Texto actual:
      `Cada pieza de Ofelia Vallejo está diseñada para acompañar
      tu vida. No una temporada. Una vida.`
    - Texto nuevo:
      `Cuero pleno colombiano. Hilo encerado. Herrajes macizos.
      Cada pieza se corta, se cose y se sella a mano en Medellín —
      pensada para una vida. No una temporada.`
13. Cambia el `split__cta` de `Conocer más` por `Conocer el atelier`
14. Cambia el `split__caption` de `Cuero colombiano` por `Cuero pleno · Medellín`

CUSTOM
15. Cambia el `custom__label` de `Servicio exclusivo` por `Bespoke · Bajo pedido`
16. Mantén el título `Tu nombre. En cuero.`
17. Reemplaza el `custom__sub`:
    - Texto actual: `Grabado láser personalizado en cada pieza.`
    - Texto nuevo: `Iniciales, nombre o fecha. Grabados a láser sobre el cuero — para que la pieza sea tuya antes de salir del atelier.`
18. Mantén el CTA `Solicitar pieza`.

FOOTER
19. Cambia el `footer__tag` de `Leather House · Medellín, Colombia` por `Leather House · Medellín → Lausanne`
20. Cambia el `footer__bottom` de `© 2025 Ofelia Vallejo` por `© 2026 Ofelia Vallejo · Hecho a mano en Medellín`

Reglas estrictas:
- NO modifiques ninguna clase CSS ni nombre de variable.
- NO toques `<script>` ni `<style>`.
- Mantén los `<br>` y la indentación tal cual cuando reemplaces bloques multilínea.
- No agregues comentarios ni nuevas etiquetas.
- Al terminar, muéstrame el diff de los cambios.
```

---

## Cómo usarlo

1. Abre el repo en Cursor.
2. Abre `index.html`.
3. Pega el prompt en el chat de Cursor (Cmd+L) con el archivo seleccionado como contexto.
4. Acepta cada cambio uno por uno (recomendado) o todos si confías 100%.
5. Verifica visualmente abriendo `index.html` en el navegador.

## Verificación posterior

Después de aplicar, abre el sitio y revisa:
- [ ] Hero: label nueva con "→ Lausanne" y caption "Travel Bag · N° I"
- [ ] Statement: párrafo de tres líneas con "cruzó el océano con nosotras"
- [ ] Productos: header dice "Colección 01 — Travel", cada card tiene su color
- [ ] Split: label "Atelier · Medellín", cuerpo nuevo con materiales, CTA "Conocer el atelier"
- [ ] Custom: label "Bespoke · Bajo pedido", subtítulo largo nuevo
- [ ] Footer: tag con "→ Lausanne", copyright 2026 + "Hecho a mano en Medellín"

Si algo no quedó bien, dime cuál sección y lo iteramos.

---

*v1 · 2026-05-22*
