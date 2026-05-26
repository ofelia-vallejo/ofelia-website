#!/usr/bin/env python3
"""
Verifica que las rutas de imágenes del registry existan en disco.
No infiere color desde lifestyle (poco fiable); el color real vive en product-registry.json.

Uso: python3 scripts/audit-product-colors.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "data/product-registry.json"
CINTURON = ROOT / "data/cinturon-assets.json"


def check_path(rel: str) -> bool:
    p = rel.lstrip("/")
    return (ROOT / p).is_file()


def collect_files(registry: dict) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for pid, prod in (registry.get("products") or {}).items():
        if prod.get("useCinturonAssets"):
            continue
        for vk, var in (prod.get("variants") or {}).items():
            for key in ("images", "gallery"):
                for entry in var.get(key) or []:
                    out.append((f"{pid}/{vk}", entry["file"]))
    for path in (registry.get("imagePool") or {}):
        if path.startswith("_"):
            continue
        out.append(("pool", path))
    if CINTURON.is_file():
        assets = json.loads(CINTURON.read_text(encoding="utf-8"))
        for key, meta in assets.items():
            if key.startswith("_"):
                continue
            for img in meta.get("images") or []:
                rel = img.lstrip("/")
                out.append((f"cinturon/{key}", rel))
    return out


def main() -> int:
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    missing = []
    for label, rel in collect_files(registry):
        if not check_path(rel):
            missing.append((label, rel))
    if missing:
        print("Archivos faltantes:")
        for label, rel in missing:
            print(f"  [{label}] {rel}")
        return 1
    print("OK — todas las rutas del registry existen.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
