-- Script: Generar PDF de Ficha Producto
-- Abre el HTML en Safari y guarda como PDF en el Escritorio

set htmlPath to "/Users/evelynpatino/Documents/Claude/Projects/ofelia vallejo/docs/FICHA-PRODUCTO-CLIENTE.html"
set pdfPath to "/Users/evelynpatino/Desktop/FICHA-PRODUCTO-CLIENTE.pdf"

tell application "Safari"
	activate
	open POSIX file htmlPath
	delay 4
end tell

tell application "System Events"
	tell process "Safari"
		-- Cmd+P para abrir el diálogo de impresión
		keystroke "p" using {command down}
		delay 3

		-- Buscar el botón PDF en el diálogo de impresión
		set printSheet to sheet 1 of front window

		-- Clic en el menú PDF
		click button "PDF" of printSheet
		delay 1

		-- Seleccionar "Guardar como PDF"
		set pdfMenu to menu 1 of button "PDF" of printSheet
		click menu item 1 of pdfMenu
		delay 2

		-- En el diálogo de guardado: limpiar y escribir nombre
		set saveSheet to sheet 1 of sheet 1 of front window

		-- Limpiar el campo y escribir el nombre del archivo
		set focused of text field 1 of saveSheet to true
		delay 0.5
		keystroke "a" using {command down}
		delay 0.3
		keystroke "FICHA-PRODUCTO-CLIENTE"
		delay 0.5

		-- Ir al Escritorio
		keystroke "g" using {command down, shift down}
		delay 0.5
		set value of text field 1 of sheet 1 of saveSheet to "/Users/evelynpatino/Desktop/"
		keystroke return
		delay 1

		-- Guardar
		keystroke return
		delay 2
	end tell
end tell

display dialog "✅ PDF guardado en el Escritorio como FICHA-PRODUCTO-CLIENTE.pdf" buttons {"OK"} default button "OK"
