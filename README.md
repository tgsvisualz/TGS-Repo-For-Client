# Velato: stage-one landing prototype

A high-fidelity **static** landing prototype for **Velato** (Italian for "veiled"), a masked, luxury-adjacent womenswear label with weekly drops. It was built for the client pitch.

- **No backend and no payments.** The hero uses photographs; every other image slot draws placeholder art in code, and `ASSETS.md` lists what to swap.
- **Polished 2D landing:**
  - a mega-dropdown nav modelled on the client's reference;
  - a custom cursor;
  - a weekly-drop teaser with a live countdown;
  - the drop rotation;
  - a typographic category index.
- **Masked hero:** three masked models (original, AI-generated, upscaled to 4K) in one dark room. The model nearest the cursor steps into the light, with parallax, a lantern and an eye strip that follows her.

The brief is in `BRIEF.md`, the design system in `DESIGN.md`, and the image swap list in `ASSETS.md`.

## Run it
Requires Node 20.19+ (22 recommended).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build on http://localhost:4173 |
| `npm run typecheck` | TypeScript check |
| `npm run assets` | Regenerate the slot table in `ASSETS.md` from `src/data/catalog.ts` |
| `npm run build:artifact` | Single-file build (`dist-artifact/velato.html`) used for the private claude.ai preview link |

**For the pitch:** run `npm run build && npm run preview` on the presenting laptop. Nothing is fetched from the network at runtime: fonts and photographs are bundled. That means it works offline.

## Deploy (optional)
`dist/` is a static site that works from any host or sub-path (`base: './'`).
- **Vercel:** import the repo, framework "Vite", build command `npm run build`, output `dist`.
- **Netlify:** build command `npm run build`, publish directory `dist`.

## The hero cast
The hero is three masked models standing in one dark room: look 01 *Notturno* (platinum bob, opera gloves) on the left, look 02 *Sera* (brunette, lace mask on a stick) in front, and look 03 *Velluto* (honey blonde, velvet off-the-shoulder) on the right. Each photograph is feathered into the page ground, so the three backdrops read as one wall.

- **The light:** one model stands in the light at a time; the others fall back into shadow. On a mouse or trackpad the model nearest the cursor takes the light, the room drifts with a little parallax and a soft lantern follows the pointer. The look index (bottom right) does the same on hover, focus or press. Left alone for six seconds, the light walks from model to model by itself, which is also how it moves on phones.
- **The eye strip:** above the headline, a 5.24:1 letterbox frames the masked eyes of whoever is in the light, captioned like a contact sheet (`VLT·014 — Look 02 / 03`). It shows only where there is height to spare (780px and up) and not on phones.
- **Click anywhere on the room** to jump to the Drop 014 preview; the cursor shows "View".
- **Reduced motion:** no parallax, drift or idle walk; the entrance is a plain fade.

**The photographs** are original AI-generated models (made in Canva for the pitch, not real people or real campaigns), upscaled 4× with Real-ESRGAN, lightly blended with a plain resize so skin keeps its texture, and given fine film grain. The site uses 2560×3840 WebP on retina screens and 1280×1920 elsewhere (`src/assets/models`). The 4096×6144 JPEG masters are delivered separately for print and the pitch deck. To replace them with the client's own shoot, keep the 2:3 three-quarter framing on a dark backdrop, swap the files, and re-aim the eye strip in `src/sections/hero/cast.ts` (`eyes: cx, cy, bw`).

**For the pitch:** open the site on the presenting laptop, rest for a few seconds to let the light walk across the three models, then move the cursor slowly across the room.

The earlier 3D showroom (React Three Fiber, veiled figures, 360° orbit) is retired from this build. It lives in the git history at commit `44d6117` if it is ever wanted back.

## Swapping in the client's imagery
1. Open the site with `#assets` in the URL, or press **Shift + A**, to see every placeholder's ID. `?view=art` shows them all on one sheet with briefs.
2. Put the photo in `public/assets/`.
3. Set `src: './assets/<file>'` on that ID in `src/data/catalog.ts`.
4. Run `npm run assets` to update the manifest.

Details, ratios and minimum sizes are in `ASSETS.md`.

## Project map
```
src/
  config.ts            feature flags, drop schedule, currency, breakpoints
  data/                typed placeholder catalogue, copy and asset registry
  styles/              tokens.css (design tokens), fonts.css, base.css
  components/          Wordmark, Button, Placeholder, Countdown, StatusChip, Reveal…
  lib/                 hooks: media queries, reduced motion, storage, countdown
  art/                 parametric SVG placeholder art + the ?view=art sheet
  nav/                 header, mega-dropdown (scales from trigger, glides between), mobile menu
  cursor/              custom cursor
  sections/            hero (masked cast, eye strip, look index), manifesto, drop teaser, rotation, index, footer
  assets/models/       the hero photographs (1280 and 2560 wide WebP)
```

## Stage two (not in this repo)
The full store is a separate project that starts after the client accepts: Next.js plus Shopify, covering weekly drops, cart, checkout and inventory. The components here are plain React, so they port into Next.js client components.
