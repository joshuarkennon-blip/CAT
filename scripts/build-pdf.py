#!/usr/bin/env python3
"""Render print.html to a single combined PDF."""
import pathlib
import sys

try:
    from weasyprint import HTML
except ImportError:
    sys.stderr.write("weasyprint is required: pip install weasyprint\n")
    sys.exit(1)

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "print.html"
OUT = ROOT / "previews" / "cat-design-system.pdf"
OUT.parent.mkdir(exist_ok=True)

HTML(filename=str(SRC)).write_pdf(str(OUT))
print(OUT)
