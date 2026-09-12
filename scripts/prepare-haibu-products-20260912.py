#!/usr/bin/env python3
"""Prepare the verified 2026-09-12 HAIBU product batch.

The script preserves the supplied source files, creates one normalized main
image plus two source-pixel detail crops per SKU, and writes the public batch
data and traceability manifest consumed by the existing HAIBU generators.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "assets/images/products/batch-2026-09-12"
BATCH_DATA_PATH = ROOT / "scripts/data/haibu-new-products-20260912.json"
MANIFEST_PATH = ROOT / "docs/tasks/haibu-new-products-20260912-manifest.json"
WORKBOOK_SHA256 = "360712d526778b96b3e2a4ae5bf4cf346d0c47eea4b499052a1396c9173746f2"


PRODUCTS = [
    {
        "sku": "RW26692", "source": "RW26692\u00a0.jpg", "sourceRow": 2,
        "sourceTitle": "Cute Bear Resin Embellishments with Heart and Flower Designs for Hair Clips Bows Scrapbooking Phone Case Decoration",
        "title": "Wholesale Cute Bear Resin Embellishments with Heart and Flower Designs for Hair Clips and DIY Crafts",
        "categorySlug": "resin-charms", "type": "Cute Animals", "material": "Resin",
        "productType": "cute bear decorative embellishments",
        "design": "three yellow bear designs with heart and flower details",
        "colors": "yellow with red, pink and white details", "packing": "100 pieces per bag",
        "applications": "hair accessories, phone-case decoration, scrapbooking and DIY craft projects",
        "imagePrefix": "rw26692-cute-bear-resin-embellishments",
        "imageAlt": "Three glossy yellow bear resin embellishments with heart and flower details, product code RW26692",
        "description": "Yellow bear resin embellishments shown in three designs with heart and flower details for hair accessories, phone-case decoration, scrapbooking and DIY craft projects.",
        "visual": "three glossy yellow bear figures, including heart and flower designs, with front and reverse views visible",
        "theme": "Cute Bear Resin Embellishments",
        "metaTitle": "Cute Bear Resin Embellishments Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale yellow bear resin embellishments with heart and flower designs for hair accessories, phone cases and DIY craft projects. Reference RW26692.",
        "seoKeywords": "cute bear resin embellishments wholesale, bear flatback charms, DIY hair accessory decorations, RW26692",
        "crops": [(0.08, 0.13, 0.78), (0.18, 0.25, 0.56)],
    },
    {
        "sku": "YX004", "source": "YX004.jpg", "sourceRow": 3,
        "sourceTitle": "Wholesale Mixed Candy Dessert Polymer Clay Cabochons for Hair Clips Phone Cases Nail Art and DIY Crafts",
        "title": "Wholesale Mixed Candy and Dessert Polymer Clay Slices for Slime, Nail Art and DIY Crafts",
        "categorySlug": "polymer-clay-slices", "type": "Food & Drink", "material": "Polymer clay",
        "productType": "mixed miniature clay slices",
        "design": "assorted candy, lollipop, ice cream and dessert motifs",
        "colors": "mixed bright and pastel colors", "packing": "500 g per bag",
        "applications": "slime, nail art, phone cases, hair accessories and DIY craft kits",
        "imagePrefix": "yx004-mixed-candy-dessert-clay-slices",
        "imageAlt": "Mixed candy and dessert polymer clay slices in a clear jar, product code YX004",
        "description": "A mixed polymer clay slice assortment with candy, lollipop, ice cream and dessert motifs for slime, nail art, phone cases and DIY craft kits.",
        "visual": "a clear jar filled with small candy and dessert motifs in bright pink, red, blue, green and cream colors",
        "theme": "Mixed Candy and Dessert Clay Slices",
        "metaTitle": "Mixed Candy Polymer Clay Slices Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale mixed candy and dessert polymer clay slices for slime, nail art, phone cases and DIY craft assortments. Reference YX004.",
        "seoKeywords": "mixed candy polymer clay slices wholesale, dessert clay sprinkles, slime nail art supplies, YX004",
        "crops": [(0.12, 0.12, 0.76), (0.25, 0.27, 0.54)],
    },
    {
        "sku": "YX002", "source": "YX002.jpg", "sourceRow": 4,
        "sourceTitle": "Wholesale Purple Berry Polymer Clay Cabochons for Hair Clips Phone Cases Scrapbooking and DIY Crafts",
        "title": "Wholesale Mixed Fruit Polymer Clay Slices with Berry, Citrus and Watermelon Designs for Slime and DIY Crafts",
        "categorySlug": "polymer-clay-slices", "type": "Fruit", "material": "Polymer clay",
        "productType": "mixed fruit-themed clay slices",
        "design": "assorted berry, citrus, watermelon, kiwi, flower and swirl motifs",
        "colors": "mixed pink, yellow, green, red and purple", "packing": "500 g per bag",
        "applications": "slime, scrapbooking, phone-case decoration and DIY craft mixes",
        "imagePrefix": "yx002-mixed-fruit-clay-slices",
        "imageAlt": "Mixed fruit polymer clay slices with berry, citrus, watermelon and kiwi motifs, product code YX002",
        "description": "A mixed fruit polymer clay slice assortment with berry, citrus, watermelon, kiwi, flower and swirl motifs for slime, scrapbooking and DIY craft mixes.",
        "visual": "a hand-held assortment of small berry, citrus, watermelon, kiwi, flower and swirl slices in multiple colors",
        "theme": "Mixed Fruit Polymer Clay Slices",
        "metaTitle": "Mixed Fruit Polymer Clay Slices Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale mixed fruit polymer clay slices with berry, citrus, watermelon and kiwi designs for slime, scrapbooking and DIY crafts. Reference YX002.",
        "seoKeywords": "mixed fruit polymer clay slices wholesale, fruit clay sprinkles, slime craft supplies, YX002",
        "contentNote": "The source title says purple berry; the supplied image shows a mixed fruit assortment, so the derived listing follows the image.",
        "crops": [(0.10, 0.12, 0.76), (0.27, 0.26, 0.54)],
    },
    {
        "sku": "YX051", "source": "YX051.jpg", "sourceRow": 5,
        "sourceTitle": "5mm Banana Slice Fruit Polymer Clay Sprinkles for Plastic Clay Mud Particles Card Making Tiny Cute DIY Sprinkles",
        "title": "Wholesale 5 mm Banana Polymer Clay Slices for Slime, Nail Art and DIY Craft Decoration",
        "categorySlug": "polymer-clay-slices", "type": "Fruit", "material": "Polymer clay",
        "productType": "banana fruit slices", "design": "round banana cross-section pattern",
        "colors": "pale yellow with brown detail", "size": "5 mm", "packing": "500 g per bag",
        "applications": "slime, nail art, card making, shaker crafts and DIY decoration",
        "imagePrefix": "yx051-banana-polymer-clay-slices",
        "imageAlt": "Pale yellow 5 mm banana-pattern polymer clay slices, product code YX051",
        "description": "Pale yellow 5 mm banana-pattern polymer clay slices for slime, nail art, card making, shaker crafts and DIY decoration.",
        "visual": "many pale yellow round slices with a printed banana cross-section pattern",
        "theme": "5 mm Banana Clay Slices",
        "metaTitle": "5 mm Banana Polymer Clay Slices Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale 5 mm banana polymer clay slices for slime, nail art, card making and DIY craft decoration. Reference YX051 for a quotation.",
        "seoKeywords": "5 mm banana polymer clay slices wholesale, banana clay sprinkles, slime nail art supplies, YX051",
        "crops": [(0.10, 0.12, 0.76), (0.26, 0.25, 0.55)],
    },
    {
        "sku": "RW927", "source": "RW927.jpg", "sourceRow": 6,
        "sourceTitle": "24mm Kawaii Flat Back Resin Sunflower Charms for DIY Decoration Bag Earring Key Chain Patch Jewelry Making DIY",
        "title": "Wholesale 24 mm Sunflower Resin Cabochons for Hair Accessories, Jewelry and DIY Decoration",
        "categorySlug": "resin-charms", "type": "Floral", "material": "Resin",
        "productType": "sunflower cabochons",
        "design": "sunflower with layered orange petals and a dark brown center",
        "colors": "orange and dark brown", "size": "24 mm", "packing": "100 pieces per bag",
        "applications": "hair accessories, jewelry, keychains, bags and DIY decoration",
        "imagePrefix": "rw927-sunflower-resin-cabochons",
        "imageAlt": "Orange 24 mm sunflower resin cabochons with dark brown centers, product code RW927",
        "description": "Orange 24 mm sunflower resin cabochons with layered petals and dark brown centers for hair accessories, jewelry, keychains, bags and DIY decoration.",
        "visual": "multiple orange sunflower cabochons with layered petals and dark brown textured centers",
        "theme": "24 mm Sunflower Resin Cabochons",
        "metaTitle": "24 mm Sunflower Resin Cabochons Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale 24 mm sunflower resin cabochons for hair accessories, jewelry, keychains, bags and DIY decoration. Reference RW927.",
        "seoKeywords": "sunflower resin cabochons wholesale, 24 mm flower charms, DIY jewelry supplies, RW927",
        "crops": [(0.12, 0.12, 0.76), (0.24, 0.24, 0.55)],
    },
    {
        "sku": "YX4138", "source": "YX4138.jpg", "sourceRow": 7,
        "sourceTitle": "Wholesale Strawberry Polymer Clay Sprinkles Custom Mini Fruit Pieces for Slime Phone Hair Scrapbook Decoration",
        "title": "Wholesale Strawberry Polymer Clay Sprinkle Mix for Slime, Shakers and DIY Craft Decoration",
        "categorySlug": "polymer-clay-slices", "type": "Fruit", "material": "Polymer clay",
        "productType": "strawberry-themed sprinkle mix",
        "design": "mini white strawberry slices with pink and clear decorative pieces",
        "colors": "pink, clear and white with red and green details", "packing": "500 g per bag",
        "applications": "slime, shakers, phone cases, hair accessories and scrapbook decoration",
        "imagePrefix": "yx4138-strawberry-clay-sprinkle-mix",
        "imageAlt": "Pink and clear sprinkle mix with small strawberry polymer clay slices, product code YX4138",
        "description": "A pink and clear decorative sprinkle mix with small strawberry polymer clay slices for slime, shakers, phone cases, hair accessories and scrapbook decoration.",
        "visual": "pink and clear decorative pieces mixed with small white strawberry slices in a hand-held product view",
        "theme": "Strawberry Clay Sprinkle Mix",
        "metaTitle": "Strawberry Clay Sprinkle Mix Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale strawberry polymer clay sprinkle mix for slime, shakers, phone cases, hair accessories and scrapbook decoration. Reference YX4138.",
        "seoKeywords": "strawberry polymer clay sprinkle mix wholesale, pink slime sprinkles, DIY shaker fillers, YX4138",
        "crops": [(0.10, 0.12, 0.76), (0.25, 0.24, 0.55)],
    },
    {
        "sku": "RW2445", "source": "RW2445.jpg", "sourceRow": 8,
        "sourceTitle": "Wholesale Chocolate Bar Cabochons Custom 3D Mini Dessert Decorations for Hair Accessories Phone Keychain Projects",
        "title": "Wholesale Chocolate Bar Resin Cabochons in Pink, Brown and Cream for Hair Accessories and DIY Crafts",
        "categorySlug": "resin-charms", "type": "Food & Drink", "material": "Resin",
        "productType": "mini chocolate bar cabochons", "design": "segmented chocolate bar shape",
        "colors": "pink, dark brown and cream", "packing": "100 pieces per bag",
        "applications": "hair accessories, phone cases, keychains, decoden and DIY crafts",
        "imagePrefix": "rw2445-chocolate-bar-resin-cabochons",
        "imageAlt": "Pink, dark brown and cream chocolate bar resin cabochons, product code RW2445",
        "description": "Segmented chocolate bar resin cabochons in pink, dark brown and cream for hair accessories, phone cases, keychains, decoden and DIY crafts.",
        "visual": "three glossy segmented chocolate bar cabochons in pink, dark brown and cream",
        "theme": "Chocolate Bar Resin Cabochons",
        "metaTitle": "Chocolate Bar Resin Cabochons Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale chocolate bar resin cabochons in pink, brown and cream for hair accessories, phone cases, keychains and DIY crafts. Reference RW2445.",
        "seoKeywords": "chocolate bar resin cabochons wholesale, mini dessert charms, decoden craft supplies, RW2445",
        "crops": [(0.08, 0.14, 0.78), (0.25, 0.24, 0.56)],
    },
    {
        "sku": "RW370", "source": "RW370.jpg", "sourceRow": 9,
        "sourceTitle": "100pcs Resin Creamy Candy Cabochons Flatback for Scrapbook Home Decoration Mini 3D Sweet Food Resin Ornament DIY Slime Charm",
        "title": "Wholesale Pastel Whipped Cream Resin Cabochons for Slime, Scrapbooking and DIY Decoration",
        "categorySlug": "resin-charms", "type": "Food & Drink", "material": "Resin",
        "productType": "whipped cream flatback cabochons", "design": "swirled cream shape",
        "colors": "assorted pastel colors, cream and brown", "packing": "100 pieces per bag",
        "applications": "slime, scrapbooking, phone-case decoden and miniature dessert crafts",
        "imagePrefix": "rw370-pastel-whipped-cream-resin-cabochons",
        "imageAlt": "Assorted pastel whipped cream resin cabochons in multiple colors, product code RW370",
        "description": "Swirled whipped cream resin cabochons in assorted pastel colors, cream and brown for slime, scrapbooking, phone-case decoden and miniature dessert crafts.",
        "visual": "an assortment of glossy swirled cream shapes in pink, blue, mint, yellow, purple, cream and brown",
        "theme": "Pastel Whipped Cream Cabochons",
        "metaTitle": "Pastel Whipped Cream Resin Cabochons | HAIBUCRAFT",
        "metaDescription": "Wholesale pastel whipped cream resin cabochons for slime, scrapbooking, phone-case decoden and miniature dessert craft projects. Reference RW370.",
        "seoKeywords": "whipped cream resin cabochons wholesale, pastel dessert flatbacks, slime decoden supplies, RW370",
        "crops": [(0.10, 0.10, 0.78), (0.25, 0.25, 0.56)],
    },
    {
        "sku": "RW22405", "source": "RW22405.jpg", "sourceRow": 10,
        "sourceTitle": "100Pcs Cartoon Animal Plate Flatback Resin Fox Banana Duck Bread Egg Charms for Jewelry Making Accessories Earring Keychain Deco",
        "title": "Wholesale Cartoon Animal and Food Resin Cabochon Mix for Jewelry, Keychains and DIY Accessories",
        "categorySlug": "resin-charms", "type": "Cute Animals", "material": "Resin",
        "productType": "mixed cartoon cabochons",
        "design": "fox, panda, banana, chick, bread and egg plate motifs",
        "colors": "mixed yellow, orange and white with multicolor details", "packing": "100 pieces per bag",
        "applications": "jewelry, earrings, keychains, phone-case decoration and DIY accessories",
        "imagePrefix": "rw22405-cartoon-animal-food-resin-mix",
        "imageAlt": "Cartoon animal and food resin cabochon assortment with fox, panda, banana, bread and egg designs, product code RW22405",
        "description": "A cartoon resin cabochon assortment with fox, panda, banana, chick, bread and egg plate motifs for jewelry, earrings, keychains, phone cases and DIY accessories.",
        "visual": "six cartoon animal and food designs arranged on grass, including fox, panda, banana, chick, bread and egg plates",
        "theme": "Cartoon Animal and Food Cabochon Mix",
        "metaTitle": "Cartoon Animal and Food Resin Cabochons | HAIBUCRAFT",
        "metaDescription": "Wholesale cartoon animal and food resin cabochons with fox, panda, banana, chick, bread and egg designs. Reference RW22405.",
        "seoKeywords": "cartoon animal resin cabochon mix wholesale, food flatback charms, DIY jewelry supplies, RW22405",
        "crops": [(0.10, 0.10, 0.78), (0.24, 0.23, 0.56)],
    },
    {
        "sku": "RW1394", "source": "RW1394.jpg", "sourceRow": 11,
        "sourceTitle": "100Pcs Mini Mushroom House Figurines Micro Fairy Garden Miniature Forest Terrarium Decor Resin Craft DIY Accessories",
        "title": "Wholesale Mini Mushroom House Resin Figurines for Fairy Gardens, Terrariums and DIY Crafts",
        "categorySlug": "resin-charms", "type": "Fantasy", "material": "Resin",
        "productType": "mini mushroom house figurines",
        "design": "assorted rounded mushroom houses with doors, windows and dotted roofs",
        "colors": "red, pink, yellow and green roofs with cream bases", "packing": "100 pieces per bag",
        "applications": "fairy gardens, terrariums, miniature displays and DIY craft accessories",
        "imagePrefix": "rw1394-mushroom-house-resin-figurines",
        "imageAlt": "Assorted mini mushroom house resin figurines with colorful roofs, product code RW1394",
        "description": "Mini mushroom house resin figurines with colorful dotted roofs, doors and windows for fairy gardens, terrariums, miniature displays and DIY craft accessories.",
        "visual": "assorted rounded mushroom houses with red, pink, yellow and green roofs, cream bases, doors and small windows",
        "theme": "Mini Mushroom House Figurines",
        "metaTitle": "Mini Mushroom House Resin Figurines | HAIBUCRAFT",
        "metaDescription": "Wholesale mini mushroom house resin figurines for fairy gardens, terrariums, miniature displays and DIY craft accessories. Reference RW1394.",
        "seoKeywords": "mini mushroom house resin figurines wholesale, fairy garden miniatures, terrarium craft supplies, RW1394",
        "crops": [(0.10, 0.10, 0.78), (0.24, 0.22, 0.56)],
    },
    {
        "sku": "RW001078", "source": "RW001078.jpg", "sourceRow": 12,
        "sourceTitle": "Cute Blue Flat Back Dolphin Resin Scrapbooking DIY Series Handmade Craft Decoration",
        "title": "Wholesale 28 x 20 mm Blue Dolphin Resin Cabochons for Scrapbooking and DIY Decoration",
        "categorySlug": "resin-charms", "type": "Ocean", "material": "Resin",
        "productType": "blue dolphin cabochons", "design": "curved dolphin with pink flower detail",
        "colors": "light blue with pink, white and black details", "size": "28 x 20 mm", "packing": "100 pieces per bag",
        "applications": "scrapbooking, phone cases, hair accessories and DIY decoration",
        "imagePrefix": "rw001078-blue-dolphin-resin-cabochons",
        "imageAlt": "Light blue 28 x 20 mm dolphin resin cabochons with pink flower details, product code RW001078",
        "description": "Light blue 28 x 20 mm dolphin resin cabochons with pink flower details for scrapbooking, phone cases, hair accessories and DIY decoration.",
        "visual": "six light blue curved dolphin cabochons with black eyes and pink flower details; the source image states 28 x 20 mm",
        "theme": "28 x 20 mm Dolphin Resin Cabochons",
        "metaTitle": "28 x 20 mm Dolphin Resin Cabochons | HAIBUCRAFT",
        "metaDescription": "Wholesale 28 x 20 mm blue dolphin resin cabochons with pink flower details for scrapbooking, phone cases and DIY decoration. Reference RW001078.",
        "seoKeywords": "blue dolphin resin cabochons wholesale, ocean flatback charms, scrapbooking supplies, RW001078",
        "contentNote": "The supplied source image contains a QULA CRAFT OEM/ODM badge; it is preserved unchanged for source fidelity and Preview review.",
        "crops": [(0.05, 0.12, 0.78), (0.22, 0.20, 0.58)],
    },
    {
        "sku": "RW26637", "source": "RW26637.jpg", "sourceRow": 13,
        "sourceTitle": "4Pcs Cute Mini Scuba Diver Figurines Cartoon Chibi Diving Dolls with Snorkel Mask Flippers for Kids Toy Cake Topper Party Favor",
        "title": "Wholesale Mini Scuba Diver Resin Figurines in Assorted Colors for Cake Toppers and DIY Decoration",
        "categorySlug": "resin-charms", "type": "Ocean", "material": "Resin",
        "productType": "mini scuba diver figurines",
        "design": "cartoon divers with snorkel masks and flippers",
        "colors": "assorted black, blue, white, pink, yellow and mint", "packing": "4 pieces per bag",
        "applications": "cake toppers, party favors, miniature displays and DIY decoration",
        "imagePrefix": "rw26637-mini-scuba-diver-resin-figurines",
        "imageAlt": "Four mini scuba diver resin figurines with snorkel masks and flippers, product code RW26637",
        "description": "Four mini scuba diver resin figurines in assorted black, blue, white and pink outfits with snorkel masks and flippers for cake toppers and DIY decoration.",
        "visual": "four cartoon scuba diver figures displayed on a hand with snorkel masks, breathing tubes and flippers in assorted colors",
        "theme": "Mini Scuba Diver Figurines",
        "metaTitle": "Mini Scuba Diver Resin Figurines Wholesale | HAIBUCRAFT",
        "metaDescription": "Wholesale mini scuba diver resin figurines in assorted colors for cake toppers, party favors, miniature displays and DIY decoration. Reference RW26637.",
        "seoKeywords": "mini scuba diver resin figurines wholesale, ocean cake toppers, DIY miniature decorations, RW26637",
        "crops": [(0.08, 0.08, 0.80), (0.22, 0.24, 0.58)],
    },
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def square_crop(image: Image.Image, left: float, top: float, size: float) -> Image.Image:
    edge = min(image.width, image.height)
    crop_size = max(1, round(edge * size))
    x = min(round(image.width * left), image.width - crop_size)
    y = min(round(image.height * top), image.height - crop_size)
    return image.crop((x, y, x + crop_size, y + crop_size))


def save_jpeg(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    prepared = image.convert("RGB")
    if max(prepared.size) > 1000:
        prepared.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
    prepared.save(destination, "JPEG", quality=85, optimize=True, progressive=True, dpi=(72, 72))


def public_record(product: dict) -> dict:
    size_line = [f"Reference size: {product['size']}"] if product.get("size") else []
    return {
        "sku": product["sku"],
        "title": product["title"],
        "originalTitle": product["sourceTitle"],
        "type": product["type"],
        "imagePrefix": product["imagePrefix"],
        "imageAlt": product["imageAlt"],
        "description": product["description"],
        "detailedDescription": (
            f"The supplied product photograph shows {product['visual']}. "
            f"The source sheet identifies the material as {product['material']} and lists {product['packing']} as the pack reference. "
            f"Buyers can reference product code {product['sku']} when requesting a quotation; final specifications, assortment details, MOQ and lead time are confirmed before ordering."
        ),
        "seasonalTheme": product["theme"],
        "keySellingPoints": [
            f"Visible design: {product['design']}",
            f"Colors shown: {product['colors']}",
            f"Material stated in the source sheet: {product['material']}",
            f"Source packing reference: {product['packing']}",
            f"Suitable for {product['applications']}",
        ],
        "specificationLines": [
            f"Product type: {product['productType']}",
            f"Design shown: {product['design']}",
            f"Colors shown: {product['colors']}",
            f"Material: {product['material']}",
            *size_line,
            f"Source packing reference: {product['packing']}",
            "Alternative pack quantities may be requested",
            "Final MOQ and lead time: confirmed in the written quotation",
        ],
        "material": product["material"],
        "customizationOptions": "The source sheet states that alternative pack quantities may be requested. Any change to color, design, dimensions or other specifications requires separate confirmation against an approved sample.",
        "recommendedApplications": product["applications"],
        "packagingMoq": f"The source sheet lists {product['packing']}. Alternative pack quantities may be requested; final MOQ and lead time are confirmed in the written quotation.",
        "seoKeywords": product["seoKeywords"],
        "metaTitle": product["metaTitle"],
        "metaDescription": product["metaDescription"],
        "publishingCheck": "Confirm final specifications, packing quantity, MOQ and lead time against the selected sample and written quotation.",
        "galleryLabels": ["full product view", "source-derived detail view", "source-derived close detail"],
        "relatedSkus": [],
        "categorySlug": product["categorySlug"],
        **({"dimensions": product["size"]} if product.get("size") else {}),
        "sourcePacking": product["packing"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path, help="Folder containing the original SKU image files")
    args = parser.parse_args()

    outputs = []
    source_hashes = set()
    for product in PRODUCTS:
        source = args.source_dir / product["source"]
        if not source.is_file():
            raise FileNotFoundError(source)
        source_hash = sha256(source)
        if source_hash in source_hashes:
            raise ValueError(f"Duplicate source image detected: {source}")
        source_hashes.add(source_hash)
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            output_dir = OUTPUT_ROOT / product["sku"].lower()
            destinations = [output_dir / f"{product['imagePrefix']}-01.jpg"]
            save_jpeg(image, destinations[0])
            for index, crop in enumerate(product["crops"], 2):
                destination = output_dir / f"{product['imagePrefix']}-{index:02d}.jpg"
                save_jpeg(square_crop(image, *crop), destination)
                destinations.append(destination)

        manifest_outputs = []
        for index, destination in enumerate(destinations, 1):
            with Image.open(destination) as prepared:
                pixels = list(prepared.size)
            manifest_outputs.append({
                "path": destination.relative_to(ROOT).as_posix(),
                "role": "main" if index == 1 else "detail",
                "bytes": destination.stat().st_size,
                "pixels": pixels,
                "sha256": sha256(destination),
            })
        outputs.append({
            "sku": product["sku"],
            "sourceRow": product["sourceRow"],
            "sourceTitle": product["sourceTitle"],
            "derivedTitle": product["title"],
            "category": "Resin Charms" if product["categorySlug"] == "resin-charms" else "Polymer Clay Slices",
            "sourceImage": {"name": product["source"], "sha256": source_hash},
            "outputs": manifest_outputs,
            "duplicateStatus": "new",
            "listingStatus": "generated",
            "validationStatus": "passed",
            "previewStatus": "pending",
            **({"contentNote": product["contentNote"]} if product.get("contentNote") else {}),
        })

    batch = {
        "batch": "haibu-new-products-20260912",
        "expectedSkuCount": len(PRODUCTS),
        "publicGalleryCount": 3,
        "assetDirectory": "batch-2026-09-12",
        "imageExtension": "jpg",
        "structuredDataImageMode": "gallery",
        "lastModified": "2026-09-12",
        "preserveApprovedContent": True,
        "galleryNote": "Three source-derived product views are shown: the full supplied image followed by two crops from the same source photograph.",
        "packingOptions": [],
        "products": [public_record(product) for product in PRODUCTS],
    }
    manifest = {
        "batchId": "haibu-20260912-rw-yx-12-skus",
        "target": "HAIBU",
        "repository": "Maxiaoyang57-AFK/haibucrafts-b2b-site",
        "baselineBranch": "main",
        "baselineCommit": "368b778f848446c3ec5a2b624e067873d2e7a6ee",
        "taskBranch": "pro/haibu-new-products-20260912",
        "mode": "preview",
        "productionAuthorized": False,
        "sourceWorkbook": {"name": "9.12\u4e0a\u54c1(1).xlsx", "sheet": "Sheet1", "sha256": WORKBOOK_SHA256},
        "deduplication": {
            "catalogCountBefore": 114,
            "batchSkuCount": len(PRODUCTS),
            "duplicateSkusInBatch": [],
            "duplicateSkusInCurrentCatalog": [],
            "newSkuCount": len(PRODUCTS),
            "exactDuplicateSourceImagesInBatch": [],
        },
        "products": outputs,
    }
    BATCH_DATA_PATH.write_text(json.dumps(batch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(PRODUCTS)} HAIBU products, {len(PRODUCTS) * 3} images, batch data and manifest.")


if __name__ == "__main__":
    main()
