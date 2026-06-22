#!/bin/bash
# ============================================================
# Ofelia Vallejo · Graphify Setup Script v2
# Compatible con Mac (Homebrew, system Python, uv, pipx)
#
# Uso:
#   cd "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"
#   bash scripts/graphify-setup.sh
# ============================================================

set -e

PROJECT_DIR="/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo"
cd "$PROJECT_DIR"

echo ""
echo "⚡ Ofelia Vallejo · Graphify Setup v2"
echo "======================================"
echo ""

# ── DETECTAR INSTALADOR DE PYTHON DISPONIBLE ─────────────
echo "→ Detectando instalador Python disponible..."

INSTALLER=""
PYTHON_BIN=""

# Orden de preferencia: uv > pipx > Homebrew pip3 > pip3 > python3 -m pip
if command -v uv &>/dev/null; then
  INSTALLER="uv"
  echo "   ✓ Encontrado: uv (recomendado)"
elif command -v pipx &>/dev/null; then
  INSTALLER="pipx"
  echo "   ✓ Encontrado: pipx"
elif [ -f "/opt/homebrew/bin/pip3" ]; then
  INSTALLER="homebrew-pip3"
  PYTHON_BIN="/opt/homebrew/bin"
  echo "   ✓ Encontrado: Homebrew pip3 (Apple Silicon)"
elif [ -f "/usr/local/bin/pip3" ]; then
  INSTALLER="homebrew-pip3-intel"
  PYTHON_BIN="/usr/local/bin"
  echo "   ✓ Encontrado: Homebrew pip3 (Intel)"
elif command -v pip3 &>/dev/null; then
  INSTALLER="pip3"
  echo "   ✓ Encontrado: pip3"
elif command -v python3 &>/dev/null; then
  INSTALLER="python3-m-pip"
  echo "   ✓ Encontrado: python3 -m pip"
else
  echo "❌ No se encontró Python. Instala Python con: brew install python"
  echo "   O instala Homebrew primero: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
  exit 1
fi

# ── PASO 1: INSTALAR GRAPHIFYY ────────────────────────────
echo ""
echo "→ [1/5] Instalando graphifyy..."

case "$INSTALLER" in
  uv)
    uv tool install graphifyy
    ;;
  pipx)
    pipx install graphifyy
    ;;
  homebrew-pip3)
    /opt/homebrew/bin/pip3 install graphifyy --upgrade
    ;;
  homebrew-pip3-intel)
    /usr/local/bin/pip3 install graphifyy --upgrade
    ;;
  pip3)
    pip3 install graphifyy --upgrade
    ;;
  python3-m-pip)
    python3 -m pip install graphifyy --upgrade --user
    ;;
esac

echo "   ✓ graphifyy instalado"

# ── DETECTAR GRAPHIFY CLI ─────────────────────────────────
GRAPHIFY=""
for bin in graphify \
           "$HOME/.local/bin/graphify" \
           "/opt/homebrew/bin/graphify" \
           "/usr/local/bin/graphify" \
           "$HOME/Library/Python/3.12/bin/graphify" \
           "$HOME/Library/Python/3.11/bin/graphify" \
           "$HOME/Library/Python/3.10/bin/graphify" \
           "$HOME/Library/Python/3.9/bin/graphify"; do
  if command -v "$bin" &>/dev/null 2>&1 || [ -f "$bin" ]; then
    GRAPHIFY="$bin"
    break
  fi
done

if [ -z "$GRAPHIFY" ]; then
  # Fallback: python3 -m graphify
  if python3 -m graphify --version &>/dev/null 2>&1; then
    GRAPHIFY="python3 -m graphify"
  else
    echo "❌ graphify CLI no encontrado en PATH después de instalar."
    echo "   Agrega el directorio de scripts Python a tu PATH:"
    echo "   echo 'export PATH=\"\$HOME/Library/Python/3.x/bin:\$PATH\"' >> ~/.zshrc"
    echo "   Luego cierra y abre tu terminal y vuelve a ejecutar este script."
    exit 1
  fi
fi

echo "   ✓ CLI encontrado: $GRAPHIFY"

# ── PASO 2: INSTALAR INTEGRACIÓN CLAUDE CODE ─────────────
echo ""
echo "→ [2/5] Configurando integración Claude Code..."
$GRAPHIFY install 2>/dev/null || true
echo "   ✓ Hook PreToolUse configurado"

# ── PASO 3: CONSTRUIR KNOWLEDGE GRAPH ────────────────────
echo ""
echo "→ [3/5] Construyendo knowledge graph del proyecto..."
echo "   (primera vez: 2-5 minutos)"
echo ""

$GRAPHIFY . \
  --exclude "node_modules" \
  --exclude ".git" \
  --exclude "imagenes base" \
  --exclude "videos base" \
  --exclude "imagenes nuevas" \
  2>&1 | grep -E "(Building|Extracting|Done|Error|✓|⚡|→|Nodes|Edges|Community)" || true

echo ""
echo "   ✓ Knowledge graph construido"

# ── PASO 4: GIT HOOK ─────────────────────────────────────
echo ""
echo "→ [4/5] Instalando git hook..."
if [ -d ".git" ]; then
  $GRAPHIFY hook install 2>/dev/null || true
  echo "   ✓ post-commit + post-checkout instalados"
else
  echo "   ↷ No hay .git — hook omitido"
fi

# ── PASO 5: VERIFICAR ─────────────────────────────────────
echo ""
echo "→ [5/5] Verificando outputs..."
[ -f "graph.json" ]       && echo "   ✓ graph.json" || echo "   ✗ graph.json no encontrado"
[ -f "graph.html" ]       && echo "   ✓ graph.html" || echo "   ✗ graph.html no encontrado"
[ -f "GRAPH_REPORT.md" ]  && echo "   ✓ GRAPH_REPORT.md" || echo "   ✗ GRAPH_REPORT.md no encontrado"

echo ""
echo "================================================"
echo "✅ Graphify configurado para Ofelia Vallejo"
echo ""
echo "Comandos disponibles:"
echo "  $GRAPHIFY query 'qué archivos manejan el checkout'"
echo "  $GRAPHIFY . --update     → actualizar graph"
echo "  $GRAPHIFY . --watch      → modo automático"
echo "  open graph.html          → visualización"
echo "  cat GRAPH_REPORT.md      → reporte"
echo "================================================"
echo ""
