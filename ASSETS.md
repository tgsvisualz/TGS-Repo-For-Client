# Velato: Asset Swap Manifest

Stage one uses **placeholder art drawn in code**, because no real images were available for the pitch. This file lists every slot that needs the client's real imagery before launch.

## How to swap an image
1. Find the slot's **ID** in the table below. You can also open the site with `#assets`, or press **Shift + A**, to see every ID printed on the page. `?view=art` shows every placeholder on one sheet.
2. Put the photograph in `public/assets/` (WebP or AVIF preferred, or JPEG).
3. In `src/data/catalog.ts`, add `src: './assets/<file>'` to the entry with that ID. The photo replaces the art everywhere the ID is used, and the entry's `alt` text already describes the intended photograph.

## Slots
_The full table is generated from the asset registry in `src/data/catalog.ts` and completed at the end of the build._

## 3D showroom
The hero's three veiled figures are built from placeholder geometry in `src/hero3d/`. They are listed here once the 3D layer lands.
