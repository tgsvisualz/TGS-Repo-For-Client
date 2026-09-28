/**
 * Velato placeholder catalogue: categories, nav, pieces, drops, copy and the asset registry.
 * All content is fictional pitch copy. Real houses are never named.
 *
 * To swap in client photography: set `src` on the matching entry in ASSETS below
 * (see ASSETS.md for every slot and the brief for its replacement).
 */
import { CURRENCY, DATE_LOCALE, DROP_SCHEDULE } from '../config'
import type {
  ArtSpec,
  AssetEntry,
  BagShape,
  Category,
  CategoryId,
  Crop,
  DressCut,
  Drop,
  DropStatus,
  Fabric,
  FigureArtSpec,
  Light,
  ModelId,
  NavItem,
  Outfit,
  Piece,
  TopCut,
  TrouserCut,
  VeilTone,
} from './types'

// ── Art helpers ─────────────────────────────────────────────────────────────

const dress = (cut: DressCut, fabric: Fabric): Outfit => ({ kind: 'dress', cut, fabric })
const separates = (top: TopCut, topFabric: Fabric, trouser: TrouserCut, trouserFabric: Fabric): Outfit => ({
  kind: 'separates',
  top,
  topFabric,
  trouser,
  trouserFabric,
})
const figure = (
  model: ModelId,
  veil: VeilTone,
  outfit: Outfit,
  crop: Crop,
  extra: Pick<FigureArtSpec, 'light' | 'carry'> = {},
): ArtSpec => ({ kind: 'figure', model, veil, outfit, crop, ...extra })
const product = (shape: BagShape, fabric: Fabric, light?: Light): ArtSpec => ({ kind: 'product', shape, fabric, light })

// ── Asset registry (every placeholder slot on the page) ────────────────────

const entries: AssetEntry[] = [
  // Hero still stage (2D fallback under the 3D showroom)
  {
    id: 'HERO-FIG-A',
    art: figure('A', 'ivory', dress('column', 'noir'), 'full', { light: 'top' }),
    alt: 'Veiled model in a black silk column gown under an ivory veil',
    usage: 'Hero still stage, centre figure (src/sections/hero)',
    brief: 'Full-length studio cut-out, model veiled, black column gown, transparent PNG or WebP, min 1200×3000',
  },
  {
    id: 'HERO-FIG-B',
    art: figure('B', 'tulle', separates('draped', 'noir', 'wide-leg', 'bone'), 'full', { light: 'left' }),
    alt: 'Veiled model in bone wide-leg trousers and a black draped top under a black tulle veil',
    usage: 'Hero still stage, left figure (src/sections/hero)',
    brief: 'Full-length studio cut-out, model veiled, wide-leg trousers, transparent PNG or WebP, min 1200×3000',
  },
  {
    id: 'HERO-FIG-C',
    art: figure('C', 'smoke', dress('slip', 'garnet'), 'full', { light: 'right', carry: { shape: 'top-handle', fabric: 'noir' } }),
    alt: 'Veiled model in a garnet slip dress carrying a black top-handle bag under a smoke veil',
    usage: 'Hero still stage, right figure (src/sections/hero)',
    brief: 'Full-length studio cut-out, model veiled, slip dress with top-handle bag, transparent PNG or WebP, min 1200×3000',
  },

  // Nav: The Drop cards
  {
    id: 'NAV-DROP-014',
    art: { kind: 'trio', light: 'top' },
    alt: 'The three veiled models together in shadow, pieces hidden until the unveil',
    usage: 'Nav › The Drop, card 1 (src/nav)',
    brief: 'Group portrait of the three veiled models, low key, 4:5, min 1000×1250',
  },
  {
    id: 'NAV-DROP-013',
    art: figure('B', 'tulle', dress('slip', 'champagne'), 'full', { light: 'left' }),
    alt: 'Veiled model in the champagne Lume slip dress from Drop 013',
    usage: 'Nav › The Drop, card 2 (src/nav)',
    brief: 'Campaign still from the live drop, veiled model full length, 4:5, min 1000×1250',
  },

  // Nav: category previews (4 per category, landscape 5:4)
  { id: 'NAV-BAGS-1', art: product('top-handle', 'noir', 'left'), alt: 'Black top-handle bag on a plinth under a single spotlight', usage: 'Nav › Bags › Top handle (src/nav)', brief: 'Still life, bag on dark plinth, 5:4, min 1260×1008' },
  { id: 'NAV-BAGS-2', art: figure('C', 'smoke', dress('column', 'noir'), 'detail', { light: 'right', carry: { shape: 'shoulder', fabric: 'oxblood' } }), alt: 'Oxblood shoulder bag worn close to the body by a veiled model', usage: 'Nav › Bags › Shoulder (src/nav)', brief: 'Detail crop, bag worn at the shoulder, veil edge in frame, 5:4, min 1260×1008' },
  { id: 'NAV-BAGS-3', art: product('tote', 'bone', 'top'), alt: 'Bone leather tote standing upright in a dark room', usage: 'Nav › Bags › Totes (src/nav)', brief: 'Still life, tote on dark plinth, 5:4, min 1260×1008' },
  { id: 'NAV-BAGS-4', art: figure('B', 'tulle', separates('bodysuit', 'noir', 'tailored', 'noir'), 'waist-up', { light: 'left', carry: { shape: 'crossbody', fabric: 'noir' } }), alt: 'Veiled model wearing a black crossbody bag', usage: 'Nav › Bags › Crossbody (src/nav)', brief: 'Waist-up crop, crossbody worn, 5:4, min 1260×1008' },

  { id: 'NAV-PURSES-1', art: product('clutch', 'garnet', 'top'), alt: 'Garnet velvet clutch lit from above', usage: 'Nav › Purses › Clutches (src/nav)', brief: 'Still life, clutch, 5:4, min 1260×1008' },
  { id: 'NAV-PURSES-2', art: product('mini', 'champagne', 'right'), alt: 'Champagne satin mini bag with a short strap', usage: 'Nav › Purses › Mini bags (src/nav)', brief: 'Still life, mini bag, 5:4, min 1260×1008' },
  { id: 'NAV-PURSES-3', art: figure('A', 'ivory', dress('evening', 'noir'), 'detail', { light: 'left', carry: { shape: 'evening', fabric: 'noir' } }), alt: 'Chain-strap evening bag held by a veiled model in a black gown', usage: 'Nav › Purses › Evening (src/nav)', brief: 'Detail crop, evening bag in hand, 5:4, min 1260×1008' },
  { id: 'NAV-PURSES-4', art: product('pouch', 'smoke', 'left'), alt: 'Smoke suede gathered pouch', usage: 'Nav › Purses › Pouches (src/nav)', brief: 'Still life, pouch, 5:4, min 1260×1008' },

  { id: 'NAV-TOPS-1', art: figure('A', 'ivory', separates('blouse', 'bone', 'tailored', 'noir'), 'waist-up', { light: 'right' }), alt: 'Veiled model in a high-neck bone silk blouse', usage: 'Nav › Tops › Blouses (src/nav)', brief: 'Waist-up crop, blouse, 5:4, min 1260×1008' },
  { id: 'NAV-TOPS-2', art: figure('B', 'tulle', separates('knit', 'ash', 'wide-leg', 'noir'), 'waist-up', { light: 'left' }), alt: 'Veiled model in a fine ash knit', usage: 'Nav › Tops › Knits (src/nav)', brief: 'Waist-up crop, knit, 5:4, min 1260×1008' },
  { id: 'NAV-TOPS-3', art: figure('C', 'smoke', separates('bodysuit', 'noir', 'tailored', 'noir'), 'waist-up', { light: 'top' }), alt: 'Veiled model in a black bodysuit', usage: 'Nav › Tops › Bodysuits (src/nav)', brief: 'Waist-up crop, bodysuit, 5:4, min 1260×1008' },
  { id: 'NAV-TOPS-4', art: figure('A', 'ivory', separates('draped', 'garnet', 'wide-leg', 'noir'), 'waist-up', { light: 'left' }), alt: 'Veiled model in a garnet bias-cut draped top', usage: 'Nav › Tops › Draped tops (src/nav)', brief: 'Waist-up crop, draped top, 5:4, min 1260×1008' },

  { id: 'NAV-PANTS-1', art: figure('B', 'tulle', separates('draped', 'noir', 'wide-leg', 'bone'), 'full', { light: 'left' }), alt: 'Veiled model in floor-length bone wide-leg trousers', usage: 'Nav › Pants › Wide-leg (src/nav)', brief: 'Full-length, wide-leg trousers in motion, 5:4, min 1260×1008' },
  { id: 'NAV-PANTS-2', art: figure('C', 'smoke', separates('bodysuit', 'noir', 'tailored', 'noir'), 'lower', { light: 'right' }), alt: 'Tailored black trousers with a pressed crease', usage: 'Nav › Pants › Tailored (src/nav)', brief: 'Lower-body crop, tailored trousers, 5:4, min 1260×1008' },
  { id: 'NAV-PANTS-3', art: figure('A', 'ivory', separates('knit', 'smoke', 'pleated', 'smoke'), 'lower', { light: 'left' }), alt: 'High-rise smoke trousers with deep pleats', usage: 'Nav › Pants › Pleated (src/nav)', brief: 'Lower-body crop, pleated trousers, 5:4, min 1260×1008' },
  { id: 'NAV-PANTS-4', art: figure('B', 'tulle', separates('blouse', 'noir', 'satin', 'champagne'), 'lower', { light: 'top' }), alt: 'Liquid champagne satin trousers', usage: 'Nav › Pants › Satin (src/nav)', brief: 'Lower-body crop, satin trousers, 5:4, min 1260×1008' },

  { id: 'NAV-DRESSES-1', art: figure('C', 'smoke', dress('slip', 'garnet'), 'full', { light: 'right' }), alt: 'Veiled model in a bias-cut garnet slip dress', usage: 'Nav › Dresses › Slip (src/nav)', brief: 'Full-length, slip dress, 5:4, min 1260×1008' },
  { id: 'NAV-DRESSES-2', art: figure('A', 'ivory', dress('column', 'noir'), 'full', { light: 'top' }), alt: 'Veiled model in a straight black column dress', usage: 'Nav › Dresses › Column (src/nav)', brief: 'Full-length, column dress, 5:4, min 1260×1008' },
  { id: 'NAV-DRESSES-3', art: figure('B', 'tulle', dress('wrap', 'smoke'), 'full', { light: 'left' }), alt: 'Veiled model in a smoke wrap dress tied at the waist', usage: 'Nav › Dresses › Wrap (src/nav)', brief: 'Full-length, wrap dress, 5:4, min 1260×1008' },
  { id: 'NAV-DRESSES-4', art: figure('A', 'ivory', dress('evening', 'noir'), 'back', { light: 'right' }), alt: 'Back view of a floor-length black evening gown, veil trailing', usage: 'Nav › Dresses › Evening (src/nav)', brief: 'Back view, evening gown with veil, 5:4, min 1260×1008' },

  // Pieces (drop teaser, rotation, archive)
  { id: 'PIECE-OMBRA', art: product('top-handle', 'noir', 'left'), alt: 'Ombra top-handle bag in black leather', usage: 'Drop 014 teaser (src/sections/DropTeaser)', brief: 'Product still life, 4:5, min 1200×1500' },
  { id: 'PIECE-SETA', art: figure('B', 'tulle', separates('draped', 'bone', 'tailored', 'noir'), 'waist-up', { light: 'right' }), alt: 'Seta draped silk top in bone', usage: 'Drop 014 teaser (src/sections/DropTeaser)', brief: 'Veiled model, waist-up, 4:5, min 1200×1500' },
  { id: 'PIECE-NOTTE', art: figure('A', 'ivory', separates('bodysuit', 'noir', 'wide-leg', 'noir'), 'full', { light: 'left' }), alt: 'Notte wide-leg trousers in black', usage: 'Drop 014 teaser, feature card (src/sections/DropTeaser)', brief: 'Veiled model, full length, 3:4, min 1200×1600' },
  { id: 'PIECE-SUSSURRO', art: product('clutch', 'garnet', 'top'), alt: 'Sussurro evening clutch in garnet velvet', usage: 'Drop 014 teaser (src/sections/DropTeaser)', brief: 'Product still life, 4:5, min 1200×1500' },
  { id: 'PIECE-VELLUTO', art: figure('C', 'smoke', dress('column', 'garnet'), 'full', { light: 'right' }), alt: 'Velluto column dress in garnet velvet', usage: 'Drop 014 teaser (src/sections/DropTeaser)', brief: 'Veiled model, full length, 4:5, min 1200×1500' },
  { id: 'PIECE-BRINA', art: product('mini', 'bone', 'right'), alt: 'Brina mini bag in bone leather', usage: 'Drop 014 teaser (src/sections/DropTeaser)', brief: 'Product still life, 4:5, min 1200×1500' },
  { id: 'PIECE-LUME', art: figure('B', 'tulle', dress('slip', 'champagne'), 'full', { light: 'left' }), alt: 'Lume slip dress in champagne satin', usage: 'This week, Drop 013 (src/sections/Rotation)', brief: 'Veiled model, full length, 4:5, min 1200×1500' },
  { id: 'PIECE-CENERE', art: figure('C', 'smoke', separates('knit', 'ash', 'pleated', 'ash'), 'lower', { light: 'top' }), alt: 'Cenere pleated trousers in ash', usage: 'This week, Drop 013 (src/sections/Rotation)', brief: 'Lower-body crop, 4:5, min 1200×1500' },
  { id: 'PIECE-FUMO', art: figure('A', 'ivory', separates('knit', 'smoke', 'wide-leg', 'noir'), 'waist-up', { light: 'right' }), alt: 'Fumo fine-knit top in smoke', usage: 'This week, Drop 013 (src/sections/Rotation)', brief: 'Veiled model, waist-up, 4:5, min 1200×1500' },
  { id: 'PIECE-ONICE', art: product('tote', 'noir', 'left'), alt: 'Onice tote in black leather', usage: 'This week, Drop 013 (src/sections/Rotation)', brief: 'Product still life, 4:5, min 1200×1500' },
  { id: 'PIECE-PERLA', art: product('pouch', 'bone', 'top'), alt: 'Perla gathered pouch in bone leather', usage: 'This week, Drop 013 (src/sections/Rotation)', brief: 'Product still life, 4:5, min 1200×1500' },
  { id: 'PIECE-NEBBIA', art: figure('A', 'ivory', dress('wrap', 'smoke'), 'full', { light: 'left' }), alt: 'Nebbia wrap dress in smoke', usage: 'This week, Drop 012 archive (src/sections/Rotation)', brief: 'Veiled model, full length, 4:5, min 1200×1500' },
  { id: 'PIECE-AMBRA', art: product('crossbody', 'oxblood', 'right'), alt: 'Ambra crossbody bag in oxblood leather', usage: 'This week, Drop 012 archive (src/sections/Rotation)', brief: 'Product still life, 4:5, min 1200×1500' },

  // The Index (cursor-follow previews, 3:4)
  { id: 'IDX-BAGS', art: product('shoulder', 'noir', 'left'), alt: 'Black shoulder bag in a pool of light', usage: 'The Index › Bags (src/sections/CategoryIndex)', brief: 'Still life, 3:4, min 900×1200' },
  { id: 'IDX-PURSES', art: product('evening', 'garnet', 'top'), alt: 'Garnet chain-strap evening purse', usage: 'The Index › Purses (src/sections/CategoryIndex)', brief: 'Still life, 3:4, min 900×1200' },
  { id: 'IDX-TOPS', art: figure('C', 'smoke', separates('blouse', 'bone', 'tailored', 'noir'), 'waist-up', { light: 'right' }), alt: 'Veiled model in a bone blouse', usage: 'The Index › Tops (src/sections/CategoryIndex)', brief: 'Veiled model, waist-up, 3:4, min 900×1200' },
  { id: 'IDX-PANTS', art: figure('B', 'tulle', separates('bodysuit', 'noir', 'wide-leg', 'bone'), 'full', { light: 'left' }), alt: 'Veiled model in bone wide-leg trousers', usage: 'The Index › Pants (src/sections/CategoryIndex)', brief: 'Veiled model, full length, 3:4, min 900×1200' },
  { id: 'IDX-DRESSES', art: figure('A', 'ivory', dress('evening', 'noir'), 'back', { light: 'top' }), alt: 'Back of a black evening gown under a trailing ivory veil', usage: 'The Index › Dresses (src/sections/CategoryIndex)', brief: 'Veiled model, back view, 3:4, min 900×1200' },
]

export const ASSETS: Record<string, AssetEntry> = Object.fromEntries(entries.map((entry) => [entry.id, entry]))

export function getAsset(id: string): AssetEntry {
  const entry = ASSETS[id]
  if (!entry) throw new Error(`Unknown asset id: ${id}`)
  return entry
}

// ── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  {
    id: 'bags',
    label: 'Bags',
    released: 12,
    indexAssetId: 'IDX-BAGS',
    href: '#index',
    subcategories: [
      { id: 'top-handle', label: 'Top handle', description: 'Structured shapes with a quiet clasp.', assetId: 'NAV-BAGS-1', href: '#index' },
      { id: 'shoulder', label: 'Shoulder', description: 'Soft leather that sits close to the body.', assetId: 'NAV-BAGS-2', href: '#index' },
      { id: 'totes', label: 'Totes', description: 'Room for the whole day, nothing on the outside.', assetId: 'NAV-BAGS-3', href: '#index' },
      { id: 'crossbody', label: 'Crossbody', description: 'Hands free, still discreet.', assetId: 'NAV-BAGS-4', href: '#index' },
    ],
  },
  {
    id: 'purses',
    label: 'Purses',
    released: 8,
    indexAssetId: 'IDX-PURSES',
    href: '#index',
    subcategories: [
      { id: 'clutches', label: 'Clutches', description: 'Held in the hand, never on display.', assetId: 'NAV-PURSES-1', href: '#index' },
      { id: 'mini', label: 'Mini bags', description: 'Small enough to keep a secret.', assetId: 'NAV-PURSES-2', href: '#index' },
      { id: 'evening', label: 'Evening', description: 'Chain-strap frames for after dark.', assetId: 'NAV-PURSES-3', href: '#index' },
      { id: 'pouches', label: 'Pouches', description: 'Gathered leather, soft at the wrist.', assetId: 'NAV-PURSES-4', href: '#index' },
    ],
  },
  {
    id: 'tops',
    label: 'Tops',
    released: 15,
    indexAssetId: 'IDX-TOPS',
    href: '#index',
    subcategories: [
      { id: 'blouses', label: 'Blouses', description: 'Fluid silk with a high, closed neck.', assetId: 'NAV-TOPS-1', href: '#index' },
      { id: 'knits', label: 'Knits', description: 'Fine-gauge and close to the skin.', assetId: 'NAV-TOPS-2', href: '#index' },
      { id: 'bodysuits', label: 'Bodysuits', description: 'One clean line from shoulder to hip.', assetId: 'NAV-TOPS-3', href: '#index' },
      { id: 'draped', label: 'Draped tops', description: 'Cut on the bias, tied at the side.', assetId: 'NAV-TOPS-4', href: '#index' },
    ],
  },
  {
    id: 'pants',
    label: 'Pants',
    released: 9,
    indexAssetId: 'IDX-PANTS',
    href: '#index',
    subcategories: [
      { id: 'wide-leg', label: 'Wide-leg', description: 'Full to the floor, moving as you do.', assetId: 'NAV-PANTS-1', href: '#index' },
      { id: 'tailored', label: 'Tailored', description: 'A pressed crease and a narrow waist.', assetId: 'NAV-PANTS-2', href: '#index' },
      { id: 'pleated', label: 'Pleated', description: 'Deep pleats and a high rise.', assetId: 'NAV-PANTS-3', href: '#index' },
      { id: 'satin', label: 'Satin', description: 'Liquid satin for evenings out.', assetId: 'NAV-PANTS-4', href: '#index' },
    ],
  },
  {
    id: 'dresses',
    label: 'Dresses',
    released: 11,
    indexAssetId: 'IDX-DRESSES',
    href: '#index',
    subcategories: [
      { id: 'slip', label: 'Slip', description: 'Bias-cut, thin straps, nothing else.', assetId: 'NAV-DRESSES-1', href: '#index' },
      { id: 'column', label: 'Column', description: 'One straight line to the floor.', assetId: 'NAV-DRESSES-2', href: '#index' },
      { id: 'wrap', label: 'Wrap', description: 'Tied at the waist, open at the collar.', assetId: 'NAV-DRESSES-3', href: '#index' },
      { id: 'evening', label: 'Evening', description: 'Floor-length, cut for a room at night.', assetId: 'NAV-DRESSES-4', href: '#index' },
    ],
  },
]

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id)
  if (!category) throw new Error(`Unknown category: ${id}`)
  return category
}

// ── Navigation (mirrors the reference "Navigation Dropdown") ───────────────

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'drop',
    label: 'The Drop',
    layout: 'cards',
    cards: [
      { title: 'Drop 014', description: 'Veiled until Thursday, 20:00.', assetId: 'NAV-DROP-014', href: '#drop' },
      { title: 'Drop 013', description: 'Live now. Leaves on Sunday.', assetId: 'NAV-DROP-013', href: '#rotation' },
    ],
  },
  ...CATEGORIES.map(
    (c): NavItem => ({
      id: c.id,
      label: c.label,
      layout: 'list-preview',
      viewAll: { label: `All ${c.label.toLowerCase()}`, description: `${c.released} pieces so far`, href: c.href },
    }),
  ),
  {
    id: 'house',
    label: 'The House',
    layout: 'list',
    links: [
      { label: 'The Veil', description: 'Why we show no faces', href: '#the-veil' },
      { label: 'How drops work', description: 'Thursday in, Sunday out', href: '#rotation' },
      { label: 'The Index', description: 'Every category at a glance', href: '#index' },
      { label: 'Join the list', description: 'Hear about each drop first', href: '#list' },
    ],
  },
]

// ── Pieces ──────────────────────────────────────────────────────────────────

export const PIECES: Piece[] = [
  // Drop 014: veiled until Thursday
  { id: 'ombra', name: 'Ombra', gloss: 'shadow', kind: 'Top-handle bag', category: 'bags', subcategory: 'top-handle', price: 245, drop: 14, status: 'veiled', assetId: 'PIECE-OMBRA' },
  { id: 'notte', name: 'Notte', gloss: 'night', kind: 'Wide-leg trouser', category: 'pants', subcategory: 'wide-leg', price: 156, drop: 14, status: 'veiled', assetId: 'PIECE-NOTTE' },
  { id: 'seta', name: 'Seta', gloss: 'silk', kind: 'Draped silk top', category: 'tops', subcategory: 'draped', price: 118, drop: 14, status: 'veiled', assetId: 'PIECE-SETA' },
  { id: 'sussurro', name: 'Sussurro', gloss: 'whisper', kind: 'Evening clutch', category: 'purses', subcategory: 'clutches', price: 132, drop: 14, status: 'veiled', assetId: 'PIECE-SUSSURRO' },
  { id: 'velluto', name: 'Velluto', gloss: 'velvet', kind: 'Column dress', category: 'dresses', subcategory: 'column', price: 228, drop: 14, status: 'veiled', assetId: 'PIECE-VELLUTO' },
  { id: 'brina', name: 'Brina', gloss: 'frost', kind: 'Mini bag', category: 'purses', subcategory: 'mini', price: 176, drop: 14, status: 'veiled', assetId: 'PIECE-BRINA' },
  // Drop 013: live, leaving Sunday
  { id: 'lume', name: 'Lume', gloss: 'glow', kind: 'Slip dress', category: 'dresses', subcategory: 'slip', price: 189, drop: 13, status: 'last-pieces', stockLeft: 3, assetId: 'PIECE-LUME' },
  { id: 'onice', name: 'Onice', gloss: 'onyx', kind: 'Tote', category: 'bags', subcategory: 'totes', price: 265, drop: 13, status: 'last-pieces', stockLeft: 1, assetId: 'PIECE-ONICE' },
  { id: 'fumo', name: 'Fumo', gloss: 'smoke', kind: 'Fine-knit top', category: 'tops', subcategory: 'knits', price: 98, drop: 13, status: 'live', stockLeft: 7, assetId: 'PIECE-FUMO' },
  { id: 'perla', name: 'Perla', gloss: 'pearl', kind: 'Gathered pouch', category: 'purses', subcategory: 'pouches', price: 95, drop: 13, status: 'live', stockLeft: 9, assetId: 'PIECE-PERLA' },
  { id: 'cenere', name: 'Cenere', gloss: 'ash', kind: 'Pleated trouser', category: 'pants', subcategory: 'pleated', price: 142, drop: 13, status: 'sold-out', stockLeft: 0, assetId: 'PIECE-CENERE' },
  // Drop 012: archived
  { id: 'nebbia', name: 'Nebbia', gloss: 'fog', kind: 'Wrap dress', category: 'dresses', subcategory: 'wrap', price: 198, drop: 12, status: 'archived', assetId: 'PIECE-NEBBIA' },
  { id: 'ambra', name: 'Ambra', gloss: 'amber', kind: 'Crossbody bag', category: 'bags', subcategory: 'crossbody', price: 210, drop: 12, status: 'archived', assetId: 'PIECE-AMBRA' },
]

export const piecesInDrop = (drop: number): Piece[] => PIECES.filter((p) => p.drop === drop)

/** Lowest listed price in a category, for "from $…" labels. */
export function fromPrice(category?: CategoryId): number {
  const prices = PIECES.filter((p) => !category || p.category === category).map((p) => p.price)
  return Math.min(...prices)
}

/** Short stock label for live pieces: "3 left", "Last one", "Sold out". */
export function stockLabel(piece: Piece): string {
  switch (piece.status) {
    case 'veiled':
      return 'Veiled'
    case 'archived':
      return 'Archived'
    case 'sold-out':
      return 'Sold out'
    default:
      if (piece.stockLeft === 1) return 'Last one'
      return `${piece.stockLeft ?? 0} left`
  }
}

// ── Drops (dates are always relative to "now", so the countdown works on any day) ──

const DAY = 24 * 60 * 60 * 1000

function atTime(base: Date, dayOffset: number, hours: number, minutes: number): Date {
  const d = new Date(base.getTime() + dayOffset * DAY)
  d.setHours(hours, minutes, 0, 0)
  return d
}

/** The next unveil: Thursday 20:00 local time (today, if it is Thursday before 20:00). */
export function getNextDropDate(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setHours(DROP_SCHEDULE.unveilHour, DROP_SCHEDULE.unveilMinute, 0, 0)
  const days = (DROP_SCHEDULE.unveilWeekday - d.getDay() + 7) % 7
  d.setDate(d.getDate() + days)
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7)
  return d
}

function statusAt(now: Date, unveil: Date, leaves: Date): DropStatus {
  if (now < unveil) return 'veiled'
  if (now <= leaves) return 'live'
  return 'archived'
}

/** Drops 014 (next), 013 (current) and 012 (previous), newest first. */
export function getDrops(now: Date = new Date()): Drop[] {
  const next = getNextDropDate(now)
  const specs = [
    { number: 14, weeksAgo: 0, pieces: 6, available: 6 },
    { number: 13, weeksAgo: 1, pieces: 12, available: 7 },
    { number: 12, weeksAgo: 2, pieces: 10, available: 0 },
  ]
  return specs.map(({ number, weeksAgo, pieces, available }) => {
    const unveil = atTime(next, -7 * weeksAgo, DROP_SCHEDULE.unveilHour, DROP_SCHEDULE.unveilMinute)
    const leaves = atTime(unveil, DROP_SCHEDULE.liveDays, DROP_SCHEDULE.leaveHour, DROP_SCHEDULE.leaveMinute)
    const status = statusAt(now, unveil, leaves)
    return { number, status, pieces, available: status === 'archived' ? 0 : available, unveil, leaves }
  })
}

export const NEXT_DROP_NUMBER = 14

// ── Formatting ──────────────────────────────────────────────────────────────

const priceFormat = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  maximumFractionDigits: 0,
})
export const formatPrice = (value: number): string => priceFormat.format(value)

/** "014" */
export const dropCode = (n: number): string => String(n).padStart(3, '0')

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Thursday 1 Oct" (three-letter months; some ICU versions print "Sept"). */
export const formatDay = (d: Date): string =>
  `${new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' }).format(d)} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`

/** "Thu" */
export const formatWeekdayShort = (d: Date): string => new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'short' }).format(d)

/** "20:00" */
export const formatTime = (d: Date): string =>
  new Intl.DateTimeFormat(DATE_LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)

// ── Copy ────────────────────────────────────────────────────────────────────

export const COPY = {
  brand: 'Velato',
  hero: {
    titleLead: 'Luxury,',
    titleAccent: 'unnamed.',
    lede: 'European-cut womenswear in small weekly drops. No faces, no logos, no house markup.',
    primaryCta: 'Preview Drop 014',
    secondaryCta: 'Join the list',
    scroll: 'scroll',
    orbitHint: 'Move to orbit',
    orbitHintTouch: 'Drag to orbit',
  },
  veil: {
    word: 'velato',
    syllables: 've·là·to',
    meaning: 'veiled',
    body: 'Velato is a house without a face. The models wear veils. The owner keeps no name. The pieces carry no logo. What is left is the cut, the cloth and a price that makes sense.',
  },
  drop: {
    eyebrow: 'The next drop',
    lede: 'Six pieces, unveiled on Thursday at 20:00. When they are gone, they are gone.',
    veiledLabel: 'Veiled until Thursday',
  },
  list: {
    title: 'Hear it first.',
    body: 'The list sees each drop an hour before everyone else. One letter a week, nothing more.',
    label: 'Email address',
    placeholder: 'you@example.com',
    submit: 'Notify me',
    error: 'Enter a full email address, like name@example.com.',
    success: 'You are on the list. Your first letter arrives on Thursday at 19:00.',
  },
  rotation: {
    eyebrow: 'This week',
    title: 'Pieces arrive on Thursday. Some leave on Sunday.',
  },
  index: {
    eyebrow: 'The Index',
  },
  footer: {
    line: 'A house without a face.',
    care: ['Returns within 14 days', 'Ships in 2 to 4 working days', 'Sizes IT 36 to 48', 'Concierge by email, answered within a day'],
    socials: ['Instagram', 'TikTok', 'Pinterest'],
    socialsNote: 'Handles announced at launch.',
    legal: '© 2026 Velato. Owner unnamed.',
    prototype: 'Stage-one prototype · placeholder imagery',
  },
} as const
