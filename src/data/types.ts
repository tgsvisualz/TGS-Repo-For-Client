/**
 * Shared data shapes for the Velato prototype.
 * Everything here is placeholder content for the stage-one pitch; no backend exists.
 */

// ── Art (placeholder imagery drawn in code) ─────────────────────────────────

/**
 * The three placeholder models. Faces are NEVER drawn; every figure wears a veil.
 * Identity reads only through skin tone on the hands/neck and the hair silhouette
 * visible beneath a sheer veil:
 *  - A: deep skin tone (Black model), close-coiled high bun.
 *  - B: warm golden skin tone (Asian model), sleek straight hair in a low bun.
 *  - C: light skin tone (white model), soft wavy chignon.
 */
export type ModelId = 'A' | 'B' | 'C'

/** Cloth and leather colours used across the art (all within the dark, warm palette). */
export type Fabric = 'noir' | 'bone' | 'garnet' | 'smoke' | 'ash' | 'champagne' | 'oxblood'

export type VeilTone = 'ivory' | 'tulle' | 'smoke'

export type DressCut = 'column' | 'slip' | 'wrap' | 'evening'
export type TopCut = 'blouse' | 'knit' | 'bodysuit' | 'draped'
export type TrouserCut = 'wide-leg' | 'tailored' | 'pleated' | 'satin'
export type BagShape = 'top-handle' | 'shoulder' | 'tote' | 'crossbody' | 'clutch' | 'mini' | 'evening' | 'pouch'

/** How the figure is framed inside the placeholder. */
export type Crop = 'full' | 'waist-up' | 'lower' | 'detail' | 'back'

/** Direction of the key light. */
export type Light = 'left' | 'right' | 'top'

export type Outfit =
  | { kind: 'dress'; cut: DressCut; fabric: Fabric }
  | { kind: 'separates'; top: TopCut; topFabric: Fabric; trouser: TrouserCut; trouserFabric: Fabric }

export interface FigureArtSpec {
  kind: 'figure'
  model: ModelId
  veil: VeilTone
  outfit: Outfit
  crop: Crop
  light?: Light
  /** A bag or purse held at the hand. */
  carry?: { shape: BagShape; fabric: Fabric }
}

export interface ProductArtSpec {
  kind: 'product'
  shape: BagShape
  fabric: Fabric
  light?: Light
}

/** The three hero figures together, as a group portrait (used for the Drop 014 card). */
export interface TrioArtSpec {
  kind: 'trio'
  light?: Light
}

export type ArtSpec = FigureArtSpec | ProductArtSpec | TrioArtSpec

// ── Asset registry ──────────────────────────────────────────────────────────

/** A placeholder slot. When the client's photo arrives, set `src` and the image replaces the art. */
export interface AssetEntry {
  id: string
  /** Describes the eventual photograph, not the placeholder. */
  alt: string
  art: ArtSpec
  /** Real image URL. Leave undefined to render the placeholder art. */
  src?: string
  /** Where it appears, for ASSETS.md. */
  usage: string
  /** What the replacement photograph should be (subject, crop, ratio, min size). */
  brief: string
}

// ── Catalogue ───────────────────────────────────────────────────────────────

export type CategoryId = 'bags' | 'purses' | 'tops' | 'pants' | 'dresses'
export type NavItemId = 'drop' | CategoryId | 'house'
export type NavLayout = 'cards' | 'list-preview' | 'list'

export interface SubCategory {
  id: string
  label: string
  /** One line, like the reference menu ("Dramatic sandstone landscapes..."). */
  description: string
  assetId: string
  href: string
}

export interface Category {
  id: CategoryId
  label: string
  /** Pieces released in this category since Drop 001 (placeholder figure). */
  released: number
  subcategories: SubCategory[]
  /** Asset for the Index hover preview. */
  indexAssetId: string
  href: string
}

export interface NavCard {
  title: string
  description: string
  assetId: string
  href: string
}

export interface NavLink {
  label: string
  description?: string
  href: string
}

export type NavItem =
  | { id: 'drop'; label: string; layout: 'cards'; cards: NavCard[] }
  | { id: CategoryId; label: string; layout: 'list-preview'; viewAll: NavLink }
  | { id: 'house'; label: string; layout: 'list'; links: NavLink[] }

export type DropStatus = 'live' | 'veiled' | 'archived'
export type PieceStatus = 'veiled' | 'live' | 'last-pieces' | 'sold-out' | 'archived'

export interface Piece {
  id: string
  /** Italian name, always shown with its gloss. */
  name: string
  gloss: string
  kind: string
  category: CategoryId
  subcategory: string
  price: number
  drop: number
  status: PieceStatus
  /** Units left for live pieces. */
  stockLeft?: number
  assetId: string
}

export interface Drop {
  number: number
  status: DropStatus
  /** Pieces in the drop and how many are still available. */
  pieces: number
  available: number
  unveil: Date
  /** When the drop leaves the store (live) or left it (archived). */
  leaves: Date
}
