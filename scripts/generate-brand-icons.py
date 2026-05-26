#!/usr/bin/env python3
"""Genera favicons / PWA: sello OV circular (logo_sello_badge). No toca logo_firma_nav (navbar)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SELLO = ROOT / "assets/img/logo_sello.png"
OUT_BADGE = ROOT / "assets/img/logo_sello_badge.png"
ICONS = ROOT / "assets/icons"
FAVICON = ROOT / "favicon.ico"

MARFIL = (243, 238, 230, 255)
INK_SOFT = (11, 31, 58, 28)


def make_badge(size: int, padding: float = 0.16) -> Image.Image:
    sello = Image.open(SELLO).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    margin = max(1, size // 64)
    draw.ellipse(
        [margin, margin, size - margin - 1, size - margin - 1],
        fill=MARFIL,
        outline=INK_SOFT,
        width=max(1, size // 128),
    )

    inner = int(size * (1 - padding * 2))
    sello_fit = sello.resize((inner, inner), Image.Resampling.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(sello_fit, (offset, offset), sello_fit)
    return canvas


def main() -> None:
    if not SELLO.exists():
        raise SystemExit(f"Missing sello: {SELLO}")

    ICONS.mkdir(parents=True, exist_ok=True)

    badge_128 = make_badge(128)
    badge_128.save(OUT_BADGE, optimize=True)

    sizes = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }

    ico_frames = []
    for name, px in sizes.items():
        img = make_badge(px, padding=0.17 if px <= 32 else 0.16)
        img.save(ICONS / name, optimize=True)
        if px in (16, 32, 48):
            ico_frames.append(img.convert("RGBA"))

    for px in (48,):
        if px not in [16, 32]:
            ico_frames.append(make_badge(48).convert("RGBA"))

    ico_frames = [
        make_badge(16).convert("RGBA"),
        make_badge(32).convert("RGBA"),
        make_badge(48).convert("RGBA"),
    ]
    ico_frames[0].save(
        FAVICON,
        format="ICO",
        sizes=[(s.width, s.height) for s in ico_frames],
        append_images=ico_frames[1:],
    )

    print("Generated:", OUT_BADGE.relative_to(ROOT))
    for name in sizes:
        print("Generated:", (ICONS / name).relative_to(ROOT))
    print("Generated:", FAVICON.relative_to(ROOT))


if __name__ == "__main__":
    main()
