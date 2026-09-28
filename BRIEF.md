# Velato: Brief (stage one)

## Brand
- **Velato** is Italian for "veiled". It is luxury-adjacent womenswear with veiled, anonymous branding.
- Weekly drops. Pieces rotate in and out.
- Affordable pricing on European luxury-style clothing, from non-mainstream vendors. The aesthetic lane is the great Italian and French houses, which the site never names.
- Catalogue: bags, purses, pants, tops, dresses.
- Tone: mysterious, seductive, secretive, exclusive, minimalist.
- The owner is anonymous. All models are veiled, and faces are never shown.

## Who uses it
- **Primary:** women who want the look of European luxury without the house premium. They follow drops closely and like being early.
- **Pitch audience:** the Velato owner. They need to feel the brand world immediately: secrecy, restraint, desire.

## Core jobs of the landing page
1. Make the brand world felt within five seconds, through the veiled showroom hero.
2. Explain the weekly-drop rhythm: Thursday in, Sunday out.
3. Build anticipation for the next drop with a live countdown and veiled pieces.
4. Let visitors find categories fast, through the mega-dropdown and the Index.
5. Capture interest by joining the list (email, validated inline, with no backend in stage one).

## Screen
This is a single landing page: header with mega-dropdown, hero, The Veil (manifesto), Drop 014 teaser plus list sign-up, This week (rotation), The Index, and footer.

**Hero screen (must impress):** a 3D showroom runway with three veiled figures (one Asian, one Black, one white). The camera orbits the showroom floor through 360° as the cursor moves. It is built with React Three Fiber on top of a 2D still stage that works on its own.

## Primary navigation
**Header layout:** wordmark · The Drop · Bags · Purses · Tops · Pants · Dresses · The House · "Join the list".

**Dropdowns:** these are modelled on the client's reference "Navigation Dropdown". Floating dark-glass panels scale open from their trigger and glide between triggers. Each item has its own layout:
- **The Drop:** captioned image cards.
- **Bags, Purses, Tops, Pants, Dresses:** a described list, plus a large preview that swaps as you hover each row.
- **The House:** a plain list.

## Stage one scope (this build)
- High-fidelity static landing prototype for the Tuesday pitch.
- No backend, no payments, no real images. Placeholder veiled-figure art is used throughout, and every slot is logged in `ASSETS.md`.
- Build order, for safety: the polished 2D landing comes first, then the 3D hero is layered on top. That way there is always a working fallback.

## Stage two (NOT this build)
The full store is a separate project that starts after the client accepts: Next.js plus Shopify, covering weekly drops, cart, checkout and inventory.
