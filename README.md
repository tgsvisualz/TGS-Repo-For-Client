# Velato: stage-one landing prototype

A high-fidelity **static** landing prototype for **Velato** (Italian for "veiled"), an anonymous, luxury-adjacent womenswear label with weekly drops. It was built for the client pitch.

- **No backend, no payments, no real images.** Every image slot draws placeholder art in code, and `ASSETS.md` lists what to swap.
- **Polished 2D landing:**
  - a mega-dropdown nav modelled on the client's reference;
  - a custom cursor;
  - a weekly-drop teaser with a live countdown;
  - the drop rotation;
  - a typographic category index.
- **3D showroom hero:** a React Three Fiber runway with three veiled, masked figures and a cursor-driven 360° orbit. The veil of the figure under the cursor lifts to show her masked face (tap on touch screens; left alone, the veils lift one at a time). It is layered on top of a 2D still stage that unveils the same way, so it can always be switched off without breaking the page.

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
| `npm run build` | Production build into `dist/` (the 3D showroom is a separate lazy chunk) |
| `npm run preview` | Serve the production build on http://localhost:4173 |
| `npm run typecheck` | TypeScript check |
| `npm run assets` | Regenerate the slot table in `ASSETS.md` from `src/data/catalog.ts` |
| `npm run build:artifact` | Single-file build (`dist-artifact/velato.html`) used for the private claude.ai preview link |

**For the pitch:** run `npm run build && npm run preview` on the presenting laptop. Nothing is fetched from the network at runtime: fonts are self-hosted and the 3D lighting is procedural. That means it works offline.

## Deploy (optional)
`dist/` is a static site that works from any host or sub-path (`base: './'`).
- **Vercel:** import the repo, framework "Vite", build command `npm run build`, output `dist`.
- **Netlify:** build command `npm run build`, publish directory `dist`.

## The 3D layer and how to switch it off
The 2D still stage always renders underneath the 3D canvas, which fades in only once it is ready.

| Control | Effect |
|---|---|
| **3D / Still toggle** (bottom-right of the hero) | Switches for this visitor; the choice is remembered in the browser |
| `?3d=off` / `?3d=on` in the URL | Forces it off or on for one visit |
| `?3d=high` in the URL | Forces it on at full quality, even on weak or software graphics (for demos) |
| `FEATURES.hero3d` in `src/config.ts` | Turns the layer off for everyone |
| `VITE_HERO_3D=off npm run build` | Strips the 3D code from the bundle entirely |

**Automatic fallbacks:**
- no WebGL;
- "reduce motion" turned on in the OS (the default switches to Still, but the toggle can turn 3D back on);
- software-only graphics, such as virtual machines, some remote desktops and blocklisted GPUs (the default is Still; use the toggle or `?3d=on` / `?3d=high` to force 3D);
- data-saver mode;
- a WebGL error or context loss mid-session.

**Quality:**
- Desktops get the full showroom: mirrored stage, bloom, film grain and vignette.
- Phones, narrow windows and low-memory devices get a lighter version with no mirror and no post-processing.
- On desktop, if the frame rate drops, the scene lowers its resolution in steps and falls back to the lighter version if needed.

**The camera:** moving the cursor across the hero turns the camera a full 360° around the stage. The centre shows the fronts and the edges show the backs. On touch, drag sideways to turn.

**For the pitch:** open the site on a laptop with a real GPU and move the cursor slowly across the hero. If the laptop's GPU is blocklisted or you present from a VM, add `?3d=on`.

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
  lib/                 hooks: media queries, reduced motion, storage, WebGL, countdown
  art/                 parametric SVG placeholder art + the ?view=art sheet
  nav/                 header, mega-dropdown (scales from trigger, glides between), mobile menu
  cursor/              custom cursor
  sections/            hero (still stage + 3D mount), manifesto, drop teaser, rotation, index, footer
  hero3d/              React Three Fiber showroom (lazy chunk)
```

## Stage two (not in this repo)
The full store is a separate project that starts after the client accepts: Next.js plus Shopify, covering weekly drops, cart, checkout and inventory. The components here are plain React, so they port into Next.js client components.
