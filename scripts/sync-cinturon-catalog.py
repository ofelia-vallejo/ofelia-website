#!/usr/bin/env python3
"""Sincroniza colorData del cinturón en catalog.json desde data/cinturon-assets.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "data/cinturon-assets.json"
CATALOG = ROOT / "data/catalog.json"


def main() -> None:
    assets = json.loads(ASSETS.read_text(encoding="utf-8"))
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))

    product = next(p for p in catalog["products"] if p["id"] == "cinturon")
    color_data = {}
    for key, meta in assets.items():
        if key.startswith("_"):
            continue
        color_data[key] = {
            "label": meta["label"],
            "leather": meta["leather"],
            "images": meta["images"],
            "alts": meta["alts"],
        }
        for v in product["variants"]:
            if v.get("colorKey") == key:
                v["colorHex"] = meta["brand_hex"]
                v["colorName"] = meta["label"]

    product["colorData"] = color_data
    hero = next((m for m in assets.values() if isinstance(m, dict) and m.get("images")), None)
    first_key = "negro-liso"
    first = assets[first_key]
    if first["images"]:
        product["images"] = [
            {
                "url": first["images"][0],
                "alt": first["alts"][0] if first["alts"] else first["label"],
                "kind": "hero",
                "sort": 0,
            }
        ]
    else:
        product["images"] = []

    product["editorialImage"] = assets["cognac-liso"]["images"][0] if assets["cognac-liso"]["images"] else ""
    product["editorialCaption"] = "Seis acabados. Una firma en cuero."

    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Updated", CATALOG.relative_to(ROOT))


if __name__ == "__main__":
    main()
