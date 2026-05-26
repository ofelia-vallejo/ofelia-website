#!/usr/bin/env python3
"""
Sincroniza data/catalog.json desde:
  - data/product-registry.json  (códigos OV, fotos, colorKey por variante)
  - data/color-families.json    (cuentagotas / paleta marca)
  - data/cinturon-assets.json   (cinturón · colorKey compuesto)

Uso: python3 scripts/sync-product-registry.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "data/product-registry.json"
FAMILIES_PATH = ROOT / "data/color-families.json"
CATALOG_PATH = ROOT / "data/catalog.json"
CINTURON_SCRIPT = ROOT / "scripts/sync-cinturon-catalog.py"


def to_url(path: str) -> str:
    p = path.strip()
    if p.startswith("/"):
        return p
    return "/" + p.replace("\\", "/")


def build_images_and_color_data(
    variants_cfg: dict,
    families: dict,
) -> tuple[list[dict], dict]:
    """Imágenes del producto + colorData para PDP (una entrada por colorKey)."""
    color_data: dict = {}
    product_images: list[dict] = []
    sort = 0

    for color_key, vcfg in variants_cfg.items():
        fam_key = vcfg.get("colorFamily") or color_key
        fam = families.get(fam_key, families.get(color_key, {}))
        label = fam.get("label", color_key.replace("-", " ").title())
        leather = fam.get("leather", [])

        imgs: list[str] = []
        alts: list[str] = []
        for entry in vcfg.get("images") or []:
            url = to_url(entry["file"])
            imgs.append(url)
            alts.append(entry.get("alt") or label)
        for entry in vcfg.get("gallery") or []:
            url = to_url(entry["file"])
            imgs.append(url)
            alts.append(entry.get("alt") or label)

        color_data[color_key] = {
            "label": label,
            "leather": leather,
            "images": imgs,
            "alts": alts,
        }

        variant_id = vcfg.get("variantId")
        for i, url in enumerate(imgs):
            kind = "hero" if sort == 0 and i == 0 else "gallery"
            product_images.append(
                {
                    "url": url,
                    "alt": alts[i] if i < len(alts) else label,
                    "kind": kind,
                    "sort": sort,
                    "variantId": variant_id,
                }
            )
            sort += 1

    return product_images, color_data


def apply_registry_product(
    product: dict,
    reg: dict,
    families: dict,
) -> None:
    if reg.get("useCinturonAssets"):
        return

    product.setdefault("meta", {})
    product["meta"]["productCode"] = reg["productCode"]
    if reg.get("collectionCode"):
        product["meta"]["collectionCode"] = reg["collectionCode"]

    variants_cfg: dict = reg.get("variants") or {}
    existing_by_id = {v["id"]: v for v in product.get("variants") or []}

    new_variants = []
    for sort_i, (color_key, vcfg) in enumerate(variants_cfg.items()):
        vid = vcfg["variantId"]
        fam_key = vcfg.get("colorFamily") or color_key
        fam = families.get(fam_key, {})

        base = existing_by_id.get(vid, {})
        variant = {
            **base,
            "id": vid,
            "sku": vcfg.get("sku") or base.get("sku", ""),
            "colorKey": vcfg.get("colorKey") or color_key,
            "colorName": fam.get("label", base.get("colorName", color_key)),
            "colorHex": fam.get("brandHex", base.get("colorHex", "#141414")),
            "inventory": vcfg.get("inventory", base.get("inventory", 0)),
            "sort": sort_i,
        }
        new_variants.append(variant)

    product["variants"] = new_variants

    images, color_data = build_images_and_color_data(variants_cfg, families)
    product["images"] = images
    if len(variants_cfg) > 1 or any(v.get("images") or v.get("gallery") for v in variants_cfg.values()):
        product["colorData"] = color_data
    elif len(variants_cfg) == 1:
        product["colorData"] = color_data

    total = sum(int(v.get("inventory") or 0) for v in new_variants)
    product["inventory"] = total


def sync_cinturon_meta(catalog: dict, reg_entry: dict) -> None:
    product = next(p for p in catalog["products"] if p["id"] == "cinturon")
    product.setdefault("meta", {})
    product["meta"]["productCode"] = reg_entry["productCode"]
    if reg_entry.get("collectionCode"):
        product["meta"]["collectionCode"] = reg_entry["collectionCode"]


def main() -> int:
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    families = json.loads(FAMILIES_PATH.read_text(encoding="utf-8"))
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    products_by_id = {p["id"]: p for p in catalog["products"]}
    reg_products = registry.get("products") or {}

    for pid, reg in reg_products.items():
        if pid not in products_by_id:
            print(f"warn: producto {pid} en registry pero no en catalog.json", file=sys.stderr)
            continue
        if reg.get("useCinturonAssets"):
            sync_cinturon_meta(catalog, reg)
            continue
        apply_registry_product(products_by_id[pid], reg, families)

    from datetime import datetime, timezone

    catalog["updatedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    CATALOG_PATH.write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("Updated", CATALOG_PATH.relative_to(ROOT))

    if CINTURON_SCRIPT.is_file():
        subprocess.run([sys.executable, str(CINTURON_SCRIPT)], check=True)
        print("Ran", CINTURON_SCRIPT.name)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
