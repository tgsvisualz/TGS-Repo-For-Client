# Velato: Asset Swap Manifest

Stage one uses **placeholder art drawn in code** everywhere except the hero, which uses three masked model photographs (original, AI-generated for the pitch). This file lists every slot that needs the client's real imagery or files before launch.

## How to swap an image
1. **Find the slot's ID** in the tables below. There are two faster ways:
   - Open the site with `#assets` in the URL, or press **Shift + A**, and every placeholder shows its ID.
   - Open `?view=art` to see every placeholder on one sheet with its brief.
2. **Add the photograph** to `public/assets/`, as WebP or AVIF if possible (JPEG also works). Match the ratio in the brief.
3. **Point the slot at it.** In `src/data/catalog.ts`, add `src: './assets/<file>'` to the entry with that ID. The photo replaces the art everywhere that ID is used. The entry's `alt` text already describes the intended photograph, so update it if the shot differs.
4. **Refresh this manifest** by running `npm run assets`. The Status column then shows "Swapped".

**Faces:** the brand shows faces only behind a mask. Every photograph of a model must keep her masked.

## Image slots
<!-- slots:start -->
_43 slots, generated from `src/data/catalog.ts` by `npm run assets`._

### Hero cast (photographs)

| ID | Where | Placeholder now | Replace with | Status |
|---|---|---|---|---|
| `HERO-FIG-A` | Hero cast, centre model, look 02 Sera (src/sections/hero) | Model A, ivory veil, noir column dress (full crop) | Three-quarter length, masked, black gown, low-key studio on a dark mottled backdrop, 2:3, min 2560×3840 | Swapped |
| `HERO-FIG-B` | Hero cast, left model, look 01 Notturno (src/sections/hero) | Model B, tulle veil, noir draped top, bone wide-leg trousers (full crop) | Three-quarter length, masked, black gown, low-key studio on a dark mottled backdrop, 2:3, min 2560×3840 | Swapped |
| `HERO-FIG-C` | Hero cast, right model, look 03 Velluto (src/sections/hero) | Model C, smoke veil, garnet slip dress, carrying a noir top-handle bag (full crop) | Three-quarter length, masked, black gown, low-key studio on a dark mottled backdrop, 2:3, min 2560×3840 | Swapped |

### Navigation: The Drop cards

| ID | Where | Placeholder now | Replace with | Status |
|---|---|---|---|---|
| `NAV-DROP-014` | Nav › The Drop, card 1 (src/nav) | The three veiled models together, backlit | Group portrait of the three veiled models, low key, 4:5, min 1000×1250 | Placeholder |
| `NAV-DROP-013` | Nav › The Drop, card 2 (src/nav) | Model B, tulle veil, champagne slip dress (full crop) | Campaign still from the live drop, veiled model full length, 4:5, min 1000×1250 | Placeholder |

### Navigation: category previews

| ID | Where | Placeholder now | Replace with | Status |
|---|---|---|---|---|
| `NAV-BAGS-1` | Nav › Bags › Top handle (src/nav) | Still life: noir top-handle bag on a plinth | Still life, bag on dark plinth, 5:4, min 1260×1008 | Placeholder |
| `NAV-BAGS-2` | Nav › Bags › Shoulder (src/nav) | Model C, smoke veil, noir column dress, carrying an oxblood shoulder bag (detail crop) | Detail crop, bag worn at the shoulder, veil edge in frame, 5:4, min 1260×1008 | Placeholder |
| `NAV-BAGS-3` | Nav › Bags › Totes (src/nav) | Still life: bone tote bag on a plinth | Still life, tote on dark plinth, 5:4, min 1260×1008 | Placeholder |
| `NAV-BAGS-4` | Nav › Bags › Crossbody (src/nav) | Model B, tulle veil, noir bodysuit top, noir tailored trousers, carrying a noir crossbody bag (waist-up crop) | Waist-up crop, crossbody worn, 5:4, min 1260×1008 | Placeholder |
| `NAV-PURSES-1` | Nav › Purses › Clutches (src/nav) | Still life: garnet clutch bag on a plinth | Still life, clutch, 5:4, min 1260×1008 | Placeholder |
| `NAV-PURSES-2` | Nav › Purses › Mini bags (src/nav) | Still life: champagne mini bag on a plinth | Still life, mini bag, 5:4, min 1260×1008 | Placeholder |
| `NAV-PURSES-3` | Nav › Purses › Evening (src/nav) | Model A, ivory veil, noir evening dress, carrying a noir evening bag (detail crop) | Detail crop, evening bag in hand, 5:4, min 1260×1008 | Placeholder |
| `NAV-PURSES-4` | Nav › Purses › Pouches (src/nav) | Still life: smoke pouch bag on a plinth | Still life, pouch, 5:4, min 1260×1008 | Placeholder |
| `NAV-TOPS-1` | Nav › Tops › Blouses (src/nav) | Model A, ivory veil, bone blouse top, noir tailored trousers (waist-up crop) | Waist-up crop, blouse, 5:4, min 1260×1008 | Placeholder |
| `NAV-TOPS-2` | Nav › Tops › Knits (src/nav) | Model B, tulle veil, ash knit top, noir wide-leg trousers (waist-up crop) | Waist-up crop, knit, 5:4, min 1260×1008 | Placeholder |
| `NAV-TOPS-3` | Nav › Tops › Bodysuits (src/nav) | Model C, smoke veil, noir bodysuit top, noir tailored trousers (waist-up crop) | Waist-up crop, bodysuit, 5:4, min 1260×1008 | Placeholder |
| `NAV-TOPS-4` | Nav › Tops › Draped tops (src/nav) | Model A, ivory veil, garnet draped top, noir wide-leg trousers (waist-up crop) | Waist-up crop, draped top, 5:4, min 1260×1008 | Placeholder |
| `NAV-PANTS-1` | Nav › Pants › Wide-leg (src/nav) | Model B, tulle veil, noir draped top, bone wide-leg trousers (full crop) | Full-length, wide-leg trousers in motion, 5:4, min 1260×1008 | Placeholder |
| `NAV-PANTS-2` | Nav › Pants › Tailored (src/nav) | Model C, smoke veil, noir bodysuit top, noir tailored trousers (lower crop) | Lower-body crop, tailored trousers, 5:4, min 1260×1008 | Placeholder |
| `NAV-PANTS-3` | Nav › Pants › Pleated (src/nav) | Model A, ivory veil, smoke knit top, smoke pleated trousers (lower crop) | Lower-body crop, pleated trousers, 5:4, min 1260×1008 | Placeholder |
| `NAV-PANTS-4` | Nav › Pants › Satin (src/nav) | Model B, tulle veil, noir blouse top, champagne satin trousers (lower crop) | Lower-body crop, satin trousers, 5:4, min 1260×1008 | Placeholder |
| `NAV-DRESSES-1` | Nav › Dresses › Slip (src/nav) | Model C, smoke veil, garnet slip dress (full crop) | Full-length, slip dress, 5:4, min 1260×1008 | Placeholder |
| `NAV-DRESSES-2` | Nav › Dresses › Column (src/nav) | Model A, ivory veil, noir column dress (full crop) | Full-length, column dress, 5:4, min 1260×1008 | Placeholder |
| `NAV-DRESSES-3` | Nav › Dresses › Wrap (src/nav) | Model B, tulle veil, smoke wrap dress (full crop) | Full-length, wrap dress, 5:4, min 1260×1008 | Placeholder |
| `NAV-DRESSES-4` | Nav › Dresses › Evening (src/nav) | Model A, ivory veil, noir evening dress (back crop) | Back view, evening gown with veil, 5:4, min 1260×1008 | Placeholder |

### Pieces: Drop 014 teaser and This week

| ID | Where | Placeholder now | Replace with | Status |
|---|---|---|---|---|
| `PIECE-OMBRA` | Drop 014 teaser (src/sections/DropTeaser) | Still life: noir top-handle bag on a plinth | Product still life, 4:5, min 1280×1500 | Placeholder |
| `PIECE-SETA` | Drop 014 teaser (src/sections/DropTeaser) | Model B, tulle veil, bone draped top, noir tailored trousers (waist-up crop) | Veiled model, waist-up, 4:5, min 1280×1500 | Placeholder |
| `PIECE-NOTTE` | Drop 014 teaser, feature card (src/sections/DropTeaser) | Model A, ivory veil, noir bodysuit top, noir wide-leg trousers (full crop) | Veiled model, full length, 3:4, min 1280×1600 | Placeholder |
| `PIECE-SUSSURRO` | Drop 014 teaser (src/sections/DropTeaser) | Still life: garnet clutch bag on a plinth | Product still life, 4:5, min 1280×1500 | Placeholder |
| `PIECE-VELLUTO` | Drop 014 teaser (src/sections/DropTeaser) | Model C, smoke veil, garnet column dress (full crop) | Veiled model, full length, 4:5, min 1280×1500 | Placeholder |
| `PIECE-BRINA` | Drop 014 teaser (src/sections/DropTeaser) | Still life: bone mini bag on a plinth | Product still life, 4:5, min 1280×1500 | Placeholder |
| `PIECE-LUME` | This week, Drop 013 (src/sections/Rotation) | Model B, tulle veil, champagne slip dress (full crop) | Veiled model, full length, 4:5, min 1280×1500 | Placeholder |
| `PIECE-CENERE` | This week, Drop 013 (src/sections/Rotation) | Model C, smoke veil, ash knit top, ash pleated trousers (lower crop) | Lower-body crop, 4:5, min 1280×1500 | Placeholder |
| `PIECE-FUMO` | This week, Drop 013 (src/sections/Rotation) | Model A, ivory veil, smoke knit top, noir wide-leg trousers (waist-up crop) | Veiled model, waist-up, 4:5, min 1280×1500 | Placeholder |
| `PIECE-ONICE` | This week, Drop 013 (src/sections/Rotation) | Still life: noir tote bag on a plinth | Product still life, 4:5, min 1280×1500 | Placeholder |
| `PIECE-PERLA` | This week, Drop 013 (src/sections/Rotation) | Still life: bone pouch bag on a plinth | Product still life, 4:5, min 1280×1500 | Placeholder |
| `PIECE-NEBBIA` | This week, Drop 012 archive (src/sections/Rotation) | Model A, ivory veil, smoke wrap dress (full crop) | Veiled model, full length, 4:5, min 1280×1500 | Placeholder |
| `PIECE-AMBRA` | This week, Drop 012 archive (src/sections/Rotation) | Still life: oxblood crossbody bag on a plinth | Product still life, 4:5, min 1280×1500 | Placeholder |

### The Index

| ID | Where | Placeholder now | Replace with | Status |
|---|---|---|---|---|
| `IDX-BAGS` | The Index › Bags (src/sections/CategoryIndex) | Still life: noir shoulder bag on a plinth | Still life, 3:4, min 900×1280 | Placeholder |
| `IDX-PURSES` | The Index › Purses (src/sections/CategoryIndex) | Still life: garnet evening bag on a plinth | Still life, 3:4, min 900×1280 | Placeholder |
| `IDX-TOPS` | The Index › Tops (src/sections/CategoryIndex) | Model C, smoke veil, bone blouse top, noir tailored trousers (waist-up crop) | Veiled model, waist-up, 3:4, min 900×1280 | Placeholder |
| `IDX-PANTS` | The Index › Pants (src/sections/CategoryIndex) | Model B, tulle veil, noir bodysuit top, bone wide-leg trousers (full crop) | Veiled model, full length, 3:4, min 900×1280 | Placeholder |
| `IDX-DRESSES` | The Index › Dresses (src/sections/CategoryIndex) | Model A, ivory veil, noir evening dress (back crop) | Veiled model, back view, 3:4, min 900×1280 | Placeholder |

<!-- slots:end -->

## Hero photographs
The three hero models are photographs in `src/assets/models` (imported by `src/sections/hero/cast.ts`), each at 1280×1920 and 2560×3840 WebP. They are original AI-generated models made for the pitch. To replace them with the client's shoot: keep the 2:3 three-quarter framing on a dark backdrop, overwrite the six files, and re-aim the eye strip (`eyes: cx, cy, bw` in `cast.ts`).

## Brand files
| ID | Where | Placeholder now | Replace with |
|---|---|---|---|
| `BRAND-WORDMARK` | `src/components/Wordmark.tsx` (header, footer) | "VELATO" set in Cormorant Garamond with a CSS veil band | The client's final wordmark as SVG. Keep it as live text if the typeface is licensed for web. |
| `BRAND-FAVICON` | `public/favicon.svg` | A thin "V" under a veil band | The final mark as SVG plus a 180×180 PNG for Apple touch |
| `BRAND-OG` | `index.html` (`og:image`, not set yet) | None | A 1200×630 social card: veiled campaign image with the wordmark |

## Copy
All copy is draft pitch copy in `src/data/catalog.ts` (`COPY`, `CATEGORIES`, `PIECES`). It includes piece names and prices, the drop schedule (`src/config.ts`), and client-care lines such as returns, shipping and sizes. All of it needs the client's confirmation before launch. Social handles are deliberately not invented.
