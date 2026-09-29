/**
 * The hero cast: three masked models, their looks and how each is framed.
 * Photographs live in src/assets/models (2560×3840 web masters, a 4× AI upscale of the 1024×1536 originals,
 * plus 1280×1920 for 1× screens). Positions are in HeroCast.module.css (slotA/B/C).
 */
import notturno1280 from '../../assets/models/look-01-notturno-1280.webp'
import notturno2560 from '../../assets/models/look-01-notturno-2560.webp'
import sera1280 from '../../assets/models/look-02-sera-1280.webp'
import sera2560 from '../../assets/models/look-02-sera-2560.webp'
import velluto1280 from '../../assets/models/look-03-velluto-1280.webp'
import velluto2560 from '../../assets/models/look-03-velluto-2560.webp'

export type Slot = 'a' | 'b' | 'c'

export interface Look {
  /** Stage slot: A stands in front (centre), B behind left, C behind right. */
  slot: Slot
  /** Asset registry ID (src/data/catalog.ts), so ASSETS.md tracks the photograph. */
  assetId: 'HERO-FIG-A' | 'HERO-FIG-B' | 'HERO-FIG-C'
  /** 01–03, left to right on the stage. */
  number: string
  /** Italian look name, always shown with its gloss. */
  name: string
  gloss: string
  /** What the mask is, for the eye-strip caption. */
  mask: string
  src1x: string
  src2x: string
  /**
   * The eye strip's framing, as fractions of the photograph: the centre of the eyes (cx, cy)
   * and how much of the image width the strip spans (bw).
   */
  eyes: { cx: number; cy: number; bw: number }
  /** Parallax depth: 1 at the front. */
  depth: number
}

/** Left to right on the stage. The default focus is the centre look (A). */
export const LOOKS: readonly Look[] = [
  {
    slot: 'b',
    assetId: 'HERO-FIG-B',
    number: '01',
    name: 'Notturno',
    gloss: 'nocturne',
    mask: 'Filigree mask, opera gloves',
    src1x: notturno1280,
    src2x: notturno2560,
    eyes: { cx: 0.51, cy: 0.131, bw: 0.32 },
    depth: 0.55,
  },
  {
    slot: 'a',
    assetId: 'HERO-FIG-A',
    number: '02',
    name: 'Sera',
    gloss: 'evening',
    mask: 'Lace mask on a stick',
    src1x: sera1280,
    src2x: sera2560,
    eyes: { cx: 0.485, cy: 0.233, bw: 0.4 },
    depth: 1,
  },
  {
    slot: 'c',
    assetId: 'HERO-FIG-C',
    number: '03',
    name: 'Velluto',
    gloss: 'velvet',
    mask: 'Jewelled lace mask',
    src1x: velluto1280,
    src2x: velluto2560,
    eyes: { cx: 0.525, cy: 0.213, bw: 0.3 },
    depth: 0.7,
  },
] as const

export const DEFAULT_FOCUS = 1

export const srcSet = (look: Look) => `${look.src1x} 1280w, ${look.src2x} 2560w`
