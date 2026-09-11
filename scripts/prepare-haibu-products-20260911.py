#!/usr/bin/env python3
"""Prepare source-faithful HAIBU product images for the 2026-09-11 batch."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "assets/images/products/batch-2026-09-11"

PRODUCTS = {
    "RW26746": {
        "source": "RW26746.jpg",
        "prefix": "rw26746-christmas-gingerbread-box-miniatures",
        "crops": [(0.41, 0.34, 0.55), (0.02, 0.39, 0.60)],
    },
    "RW26768": {
        "source": "RW26768.jpg",
        "prefix": "rw26768-christmas-gingerbread-cabochons",
        "crops": [(0.12, 0.16, 0.58), (0.39, 0.31, 0.58)],
    },
}


def square_crop(image: Image.Image, left: float, top: float, size: float) -> Image.Image:
    edge = min(image.width, image.height)
    crop_size = round(edge * size)
    x = min(round(image.width * left), image.width - crop_size)
    y = min(round(image.height * top), image.height - crop_size)
    return image.crop((x, y, x + crop_size, y + crop_size))


def save_jpeg(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    prepared = ImageOps.fit(image.convert("RGB"), (1000, 1000), Image.Resampling.LANCZOS)
    prepared.save(
        destination,
        "JPEG",
        quality=85,
        optimize=True,
        progressive=True,
        dpi=(72, 72),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path, help="Folder containing the original SKU JPG files")
    args = parser.parse_args()

    for sku, config in PRODUCTS.items():
        source = args.source_dir / config["source"]
        if not source.is_file():
            raise FileNotFoundError(source)
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            output_dir = OUTPUT_ROOT / sku.lower()
            save_jpeg(image, output_dir / f'{config["prefix"]}-01.jpg')
            for index, crop in enumerate(config["crops"], 2):
                save_jpeg(square_crop(image, *crop), output_dir / f'{config["prefix"]}-{index:02d}.jpg')


if __name__ == "__main__":
    main()
