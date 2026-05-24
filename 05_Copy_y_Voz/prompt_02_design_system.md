# Prompt 2 — Design System + Navbar (HTML)

> Referencia para `index.html` y páginas con `.navbar`.  
> Navbar intro (`banner-intro.html`) usa prefijo `.b-nav__` — ver sección al final.

---

## `:root` y reset

Ver tokens en `index.html` / `assets/css/brand.css`: `--marfil`, `--navy`, `--beige-medio`, secundarios, `--ease`, `--pad-x`.

---

## Navbar HTML (3 zonas · sitio principal)

```html
<header class="navbar" role="banner">
  <nav class="nav-section" aria-label="Navegación principal izquierda">
    <a href="#" class="nav-link" data-active="true">Mujer</a>
    <a href="#" class="nav-link" data-active="true">Hombre</a>
    <a href="manifiesto.html" class="nav-link">Historia</a>
  </nav>
  <a href="index.html" class="navbar__logo-img" aria-label="Ofelia Vallejo — Inicio">
    <img src="logo-firma.png" alt="Ofelia Vallejo" class="navbar__firma">
  </a>
  <nav class="util" aria-label="Navegación principal derecha">
    <a href="coleccion.html" class="nav-link">Cuero</a>
    <a href="personalizar.html" class="nav-link">Personalizar</a>
    <a href="#contacto" class="nav-link">Contacto</a>
  </nav>
  <button type="button" class="menu-btn" aria-expanded="false" aria-controls="nav-drawer" aria-label="Abrir menú de navegación">Menú</button>
</header>
```

### Logo imagen (reemplaza texto `O  V` o `<img width="96">` suelto)

```html
<a href="index.html" class="navbar__logo-img" aria-label="Ofelia Vallejo — Inicio">
  <img src="logo-firma.png" alt="Ofelia Vallejo" class="navbar__firma">
</a>
```

```css
.navbar__logo-img {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.navbar__firma {
  height: 34px;
  width: auto;
  display: block;
  mix-blend-mode: multiply;
}

@media (max-width: 900px) {
  .navbar__logo-img {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .navbar__firma { height: 26px; }
}
```

**Nota:** `mix-blend-mode: multiply` hace invisible el blanco del PNG sobre navbar marfil `#F3EEE6`; solo se ven los trazos navy. Si el navbar pasa a fondo navy, quitar `multiply` y usar PNG con fondo transparente real (o `filter: brightness(10)`).

---

## Navbar intro (`banner-intro.html` · logo a la izquierda)

```html
<nav class="b-nav">
  <a href="index.html" class="b-nav__logo-img">
    <img src="logo-firma.png" alt="Ofelia Vallejo" class="b-nav__firma">
  </a>
  <div class="b-nav__main-links">…</div>
  <button class="b-nav__burger" id="b-burger">…</button>
</nav>
```

```css
.b-nav__logo-img {
  display: flex;
  align-items: center;
  margin-right: auto;
  flex-shrink: 0;
}

.b-nav__firma {
  height: 34px;
  width: auto;
  display: block;
  mix-blend-mode: multiply;
}

@media (max-width: 768px) {
  .b-nav__firma { height: 26px; }
}
```
