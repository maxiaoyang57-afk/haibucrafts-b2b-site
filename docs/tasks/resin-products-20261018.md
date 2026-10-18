# October 18 resin batch

Source: owner-supplied `10.11(10).xlsx`, Sheet1 rows 122–132, plus 11 SKU-named PNG files. Only the nine missing SKUs are added. RW26800 and RW26796 retain their existing pages and images.

Added: RW26808, RW25560, RW26804, RW26803, RW26801, RW26798, RW26797, RW26795, RW26794. Catalog: 200 → 209. All belong to Resin Charms. Raw source fields, dimensions, image checksums and the prior catalog are retained in the batch manifest.

Each gallery contains one product styling reference, one exact source-specification graphic and one packing/order graphic. The last two are information graphics, not additional product photographs. Pack quantity is 100 pieces/bag, separate from MOQ; no price or dispatch date is inferred. Product images are proportionally resized, uncropped, sRGB JPEG, 72 PPI, with no EXIF/GPS. Image 1 does not exceed the supplied reference width.

Eight HAIBU images use the built-in image editing tool to remove the QULA badge. RW25560 reuses the unbranded supplied photo. Prompt set: “Remove only the gold QULA CRAFT OEM/ODM badge in the top-right corner; reconstruct the obscured background naturally. Preserve the SKU-specific product shapes, colors, texture, details, composition, application inset and transparent rounded corners. Add no text, logo, objects or products.” Each prompt used the corresponding SKU PNG as its sole edit target. JPEG files in `assets/images/products/batch-2026-10-18/` are the project assets; the manifest records their exact paths and checksums.

The new acorn SKU RW26808 has its own acorn URL. Historical pig/cabbage RW26808 redirects remain mapped to the corrected RW20809 product.

Validation: 219 Node tests; full SEO release, content, catalog, materialization and custom-404 audits. Mobile gallery/inquiry checks run in the PR workflow. No live inquiry is submitted during verification. Production publishing is separate from this preview branch.
