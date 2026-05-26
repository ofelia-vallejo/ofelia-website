#!/usr/bin/env python3
"""Normaliza hipervínculos internos en HTML activos."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FILES = [
    "home.html",
    "coleccion.html",
    "manifiesto.html",
    "contacto.html",
    "personalizar.html",
    "cuenta.html",
    "producto/index.html",
    "gracias.html",
    "index.html",
    "producto/travel-bag.html",
    "producto/index.html",
]

REPLACEMENTS = [
    # Productos → PDP dinámico
    (r'href="producto/travel-bag-i\.html"', 'href="/producto/travel-bag-i"'),
    (r'href="producto/travel-bag-ii\.html"', 'href="/producto/travel-bag-ii"'),
    (r'href="producto/travel-bag-iii\.html"', 'href="/producto/travel-bag-iii"'),
    (r'href="producto/bolso-dama\.html"', 'href="/producto/bolso-dama"'),
    (r'href="producto/morral-elite\.html"', 'href="/producto/morral-elite"'),
    (r'href="producto/maletin\.html"', 'href="/producto/travel-bag-ii"'),
    (r'href="travel-bag-i\.html"', 'href="/producto/travel-bag-i"'),
    (r'href="travel-bag-iii\.html"', 'href="/producto/travel-bag-iii"'),
    (r'href="maletin\.html"', 'href="/producto/travel-bag-ii"'),
    (r'href="bolso-dama\.html"', 'href="/producto/bolso-dama"'),
    # Rutas relativas → absolutas (páginas raíz)
    (r'href="home\.html', 'href="/home.html'),
    (r'href="coleccion\.html', 'href="/coleccion.html'),
    (r'href="manifiesto\.html', 'href="/manifiesto.html'),
    (r'href="personalizar\.html', 'href="/personalizar.html'),
    (r'href="contacto\.html', 'href="/contacto.html'),
    (r'href="cuenta\.html', 'href="/cuenta.html'),
    (r'href="producto/travel-bag\.html"', 'href="/producto/travel-bag.html'),
    # Colección · productos sin .html
    (r'href="personalizar\.html\?producto=Bandolera\+Moderna"', 'href="/producto/bandolera-moderna"'),
    (r'href="personalizar\.html\?producto=Bandolera\+Elite"', 'href="/producto/bandolera-elite"'),
    (r'href="personalizar\.html\?producto=Morral\+Cl%C3%A1sico"', 'href="/producto/morral-clasico"'),
    (r'href="personalizar\.html\?producto=Morral\+Clásico"', 'href="/producto/morral-clasico"'),
    (r'href="personalizar\.html\?producto=Cintur%C3%B3n"', 'href="/producto/cinturon"'),
    (r'href="personalizar\.html\?producto=Cinturón"', 'href="/producto/cinturon"'),
    (r'href="personalizar\.html\?producto=Billetera"', 'href="/personalizar.html?producto=Billetera"'),
    (r'href="personalizar\.html\?producto=Correa"', 'href="/personalizar.html?producto=Correa"'),
    (r'href="coleccion\.html#bandolera-elite"', 'href="/producto/bandolera-elite"'),
    (r'href="coleccion\.html#morral-elite"', 'href="/producto/morral-elite"'),
    (r'href="coleccion\.html#travel-bag-iii"', 'href="/producto/travel-bag-iii"'),
    # Footer rotos
    (r'href="#">Privacidad</a>', 'href="/contacto.html">Privacidad</a>'),
    (r'href="#">Términos</a>', 'href="/contacto.html">Términos</a>'),
]

NAV_SNIPPET = """    <p class="nav-panel__group">Atelier</p>
    <a href="/personalizar.html" class="nav-panel__link">Personalizar</a>
    <a href="/cuenta.html" class="nav-panel__link">Cuenta</a>
    <a href="/contacto.html" class="nav-panel__link">Contacto</a>"""

NAV_OLD = re.compile(
    r'<p class="nav-panel__group">Atelier</p>\s*'
    r'<a href="/personalizar\.html" class="nav-panel__link">Personalizar</a>\s*'
    r'<a href="/contacto\.html" class="nav-panel__link">Contacto</a>',
    re.MULTILINE,
)


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    orig = text
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    text = NAV_OLD.sub(NAV_SNIPPET, text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    changed = []
    for rel in FILES:
        p = ROOT / rel
        if p.exists() and fix_file(p):
            changed.append(rel)
    print("Actualizados:", ", ".join(changed) or "(ninguno)")


if __name__ == "__main__":
    main()
