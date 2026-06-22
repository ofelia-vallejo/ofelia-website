#!/usr/bin/env python3
import sys

tools = []
try:
    import weasyprint
    tools.append('weasyprint')
except ImportError:
    pass

try:
    import pdfkit
    tools.append('pdfkit')
except ImportError:
    pass

try:
    import reportlab
    tools.append('reportlab')
except ImportError:
    pass

try:
    from xhtml2pdf import pisa
    tools.append('xhtml2pdf')
except ImportError:
    pass

print(','.join(tools) if tools else 'NONE')
