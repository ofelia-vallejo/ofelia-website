#!/bin/bash
# Genera PDF usando Chrome headless (no requiere instalar nada extra)

HTML_FILE="file:///Users/evelynpatino/Documents/Claude/Projects/ofelia%20vallejo/docs/FICHA-PRODUCTO-CLIENTE.html"
PDF_OUTPUT="/Users/evelynpatino/Desktop/FICHA-PRODUCTO-CLIENTE.pdf"

echo "Generando PDF..."

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --no-sandbox \
  --print-to-pdf="$PDF_OUTPUT" \
  --print-to-pdf-no-header \
  "$HTML_FILE"

if [ -f "$PDF_OUTPUT" ]; then
  echo "✅ PDF guardado en: $PDF_OUTPUT"
  open "$PDF_OUTPUT"
else
  echo "❌ Error generando el PDF"
fi
