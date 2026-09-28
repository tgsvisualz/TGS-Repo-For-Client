# Velato: Design System

**Mood:** mysterious, seductive, minimalist. A candlelit room where nothing is fully shown. Every choice below has to serve that line. When in doubt, show less, light it better, and slow it down.

Tokens live in `src/styles/tokens.css`. Components use the **role** tokens (`--bg`, `--fg`, `--line`, `--accent`…), never raw hex values.

## 1. Principles
1. **Veil, then reveal.** Content arrives through a veil: fog lifting, blur easing, light finding the subject. This is the signature motion, and it is used once per component, not everywhere.
2. **Light is the hierarchy.** Dark ground, one pool of light per composition. Emphasis comes from brightness, size and weight, not from boxes.
3. **Restraint.** One accent (garnet), used rarely. No decoration that does not carry meaning.
4. **Editorial, not template.** The layout is asymmetric. Imagery has sharp corners. Rhythm comes from generous space, with no identical card grids.
5. **Anonymous by design.** No faces, no logos, no names of real houses. Italian piece names carry the mystery, always shown with their gloss (*ombra: shadow*).

## 2. Colour
| Role | Token | Value | Use |
|---|---|---|---|
| Page | `--bg` | `#0B0A09` | Page ground (warm near-black, never pure black) |
| Raised | `--bg-raised` | `#121110` | Sections that need separation |
| Panel | `--bg-panel` | `#1B1917` | Solid panels, inputs |
| Hover | `--bg-hover` | `#26221F` | Hover fills on solid surfaces |
| Text | `--fg` | `#EDE6DC` | Primary text (bone) |
| Text 2 | `--fg-2` | `#B9B0A4` | Secondary text, descriptions |
| Text 3 | `--fg-3` | `#8A8278` | Tertiary text, meta. Dimmest allowed for text (5.2:1) |
| Line | `--line` | bone @ 12% | Hairlines |
| Accent | `--accent` | `#7E1F2B` garnet | Fills and dots only |
| Accent text | `--accent-text` | `#C95A66` | Accent text on `--bg`/`--bg-raised` only (4.8:1) |
| Glass | `--glass-bg` + `--glass-blur` | ink @ 72% + 20px blur | Floating chrome: nav panels, scrolled header, toggles |

- **The garnet accent** appears only on the live-status dot, the countdown separators, the open-state chevron, and the focus of the email field. Nowhere else.
- **Status is encoded in form**, not colour alone:
  - live is a solid garnet dot plus a label;
  - veiled is a hollow ring;
  - last pieces is a garnet dot plus a count;
  - sold out is struck-through meta text;
  - archived is dimmed text.
- **Light set:** `.theme-bone` re-skins a section in light "bone". It is reserved and not used on the landing page.

## 3. Typography
- **Display:** *Cormorant Garamond*, weights 300, 400 and 500, with italic 300 and 400.
  - Use it for headlines, big numerals (N° 014), manifesto text, category names in the Index and the mobile menu, and piece names.
  - Italic carries the seductive accent ("Luxury, *unnamed.*"), at most once per heading.
- **Text/UI:** *Jost* (variable), for navigation, body, labels, buttons and meta.
- **Tracking scales with size:**
  - display `-0.02em`;
  - titles `-0.01em`;
  - body `0`;
  - uppercase labels `+0.16em`;
  - the wordmark `+0.42em`.
- **Line height:** display 1.04, titles 1.25, body 1.55.
- **Scale:**

  | Token | Use |
  |---|---|
  | `--fs-display-xl` (hero) | Hero headline |
  | `--fs-display-l` | Section statements |
  | `--fs-display-m` | Section titles, Index rows |
  | `--fs-display-s` | Card titles, piece names |
  | `--fs-title` | Card and panel titles |
  | `--fs-body-l` | Lede paragraphs |
  | `--fs-body` | Body |
  | `--fs-small` | Nav, buttons |
  | `--fs-caption` | Descriptions |
  | `--fs-label` | Uppercase eyebrow labels |
- **Nav triggers** use 14px sentence case, following the reference. Inactive triggers are `--fg-2`; hovered or open triggers are `--fg`.
- **Numbers:** countdowns and prices use `font-variant-numeric: tabular-nums lining-nums`. Countdown digits also sit in fixed-width boxes, so nothing shifts as seconds tick.
- Headings use `text-wrap: balance`. Running text is capped at `--measure` (62ch).
- Italian words are wrapped in `<i lang="it">` or `<span lang="it">`.

## 4. Space, layout, shape
- **Spacing** uses rem steps `--space-1`…`--space-11` (0.25rem to 12rem).
  - Sections use `padding-block: var(--section-pad)`.
  - Page gutters use `var(--gutter)` (16px on phones, up to 48px).
  - Content is capped at `--content-max` (1440px).
- **Grid:** 12 columns on desktop, collapsing to 4 on phones. Compositions stay asymmetric, e.g. the text starts at column 2 while the image bleeds right.
- **Shape:**
  - Imagery and cards have sharp corners (`--r-0`), like a printed lookbook.
  - Floating glass panels use `--r-panel` (12px, as in the nav reference), with inner rows and previews at `--r-2` (8px).
  - Pills use `--r-pill`.
- **Depth:**
  - Bigger surfaces get deeper shadows: `--shadow-panel` for nav panels, `--shadow-chip` for chips.
  - Where floating chrome overlaps content, use a soft fade edge (a gradient mask) instead of a hard 1px divider.
  - Never stack glass on glass.
- **Grain:** a single static film-grain overlay sits at about 5% opacity above everything except the cursor (`--z-grain`).

## 5. Motion
The frequency test comes first:
- used 100+ times a day: no animation;
- tens of times a day: minimal;
- occasional: standard;
- rare (the hero entrance): room for delight.

| Kind | Curve | Duration |
|---|---|---|
| Enter / exit | `--ease-out` | menu 220ms in, 150ms out (exits are faster) |
| Movement on screen (panel glide) | `--ease-in-out` | 240ms |
| Hover / colour | `--ease` | 200ms |
| Press | `--ease-out` | 140ms, `:active { transform: scale(.97) }` |
| Preview swap | `--ease-out` | 180ms cross-fade, scale 1.02 → 1 |
| Drawer (mobile menu) | `--ease-drawer` | 380ms in, 280ms out |
| Scroll reveal | `--ease-out` | 700ms, stagger 60ms |
| Hero entrance | `--ease-out` | 1200ms (the one orchestrated moment) |

**Rules:**
- **Curves:** never ease-in for UI.
- **What animates:**
  - Animate only `transform` and `opacity`. Never use `transition: all`; list properties explicitly.
  - The one documented exception is the nav viewport's `width`/`height` glide. It runs on a single absolutely-positioned element that does not reflow the page.
- **Entering and origin:**
  - Things enter from `scale(.95–.96)` plus opacity 0, never `scale(0)`.
  - Popovers and menus scale from their trigger (set `transform-origin`); modals stay centred.
- **Interruptibility:**
  - Use transitions, not keyframes, for anything triggered rapidly (hover swaps, toggles), so they can be interrupted.
  - Staggers never block input.
- **Input type:**
  - Never animate keyboard-initiated actions: opening a panel from the keyboard is instant.
  - Gate hover effects behind `@media (hover: hover) and (pointer: fine)`.
- **Reduced motion:**
  - `prefers-reduced-motion: reduce` swaps movement for short cross-fades.
  - The tokens already shorten durations under reduced motion. Components also drop transforms and parallax, and turn off idle 3D drift and sway.

## 6. Signature interactions
- **Custom cursor:** a bone dot plus a lagging ring with `mix-blend-mode: difference`.
  - `data-cursor="view|peek|orbit"` turns it into an 84px disc with a label.
  - It only shows on fine pointers. Native carets return on text inputs.
- **Nav:**
  - Floating glass panels scale open from the hovered trigger and glide or resize between triggers. See the plan for the full spec.
  - Rows highlight with `--fill-hover` at `--r-2`, exactly like the reference's hovered "Forests" row.
- **Veil reveal:** placeholders in the Drop teaser sit under a veil layer that lifts partly on hover ("Peek"), using opacity and translate only.
- **Lantern:** in the hero, a soft light follows the cursor and lifts the dark.

## 7. Placeholder art direction
- Every image slot renders parametric SVG art (`src/art`) until the client's photography arrives. Each slot has an asset ID (see `ASSETS.md`), and a real image replaces the art by setting `src` in `src/data/catalog.ts`.
- **Look:** abstract, lit, low-key.
  - Figures are silhouettes shaped by light: one key light, a rim, and deep shadow. Gradients and grain carry the detail; there are no outlines and no cartoon edges.
  - Veils are long and sheer (a teardrop from the crown to mid-back), with a soft sheen.
  - **Faces are never drawn.** The three placeholder models (A, B, C) read through skin tone on the hands and neck plus the hair silhouette under the veil, never through facial features.
  - Products sit on dark plinths under a single spotlight, with a soft floor reflection.

## 8. Quality rules (from the premium-app-build skill)
**Avoid the AI look:**
- No Inter-for-everything by default. No purple-to-blue gradients.
- No cards nested in cards. No grey text on coloured backgrounds.
- No rounded icon tile above every heading, no emoji as icons, and no identical card grids.
- One accent colour, used sparingly. Hierarchy comes from weight, size and spacing, not boxes.
- Specific labels ("Veiled until Thursday", "Last one") beat generic ones ("Overview", "Status").

**Feedback and wayfinding:**
- There are four feedback kinds: status, completion, warning and error. Validate inline, not on submit.
- Every screen answers three questions: where am I, where can I go, how do I get out. There are no dead links; stage-one links go to in-page anchors.

**Mobile:**
- 16px side gutters and no horizontal page scroll.
- Tap targets of at least 44px, with safe-area padding.
- Inputs use a font size of 16px or more so iOS doesn't zoom.

**Accessibility:**
- Use semantic landmarks and a skip link.
- Show a visible `:focus-visible` ring (1px `--focus-ring` with a 3px offset).
- Keep AA contrast.
- Decorative art is `aria-hidden`; real image slots carry the `alt` from the asset registry.

## 9. Don'ts
- Don't name real fashion houses anywhere.
- Don't use pure black (`#000`) or pure white (`#FFF`).
- Don't use more than one italic accent per heading.
- Don't show a face, even in placeholder art.
- Don't key themes off `[data-theme]` on `<html>`, because the claude.ai preview frame sets it.
- Don't use `localStorage` without try/catch; the helper is in `src/lib/storage.ts`.
