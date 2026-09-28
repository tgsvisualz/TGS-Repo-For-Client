import { knots, type ProfilePoint } from './geometry'

/**
 * The three placeholder models and their styling, in metres (y up, +z the figure's front,
 * +x the figure's left). The figures differ only in skin tone (hands, neck, arms), the hair
 * silhouette under the veil and what they wear: never in facial features, which are not
 * modelled at all. The head is a smooth ellipsoid, always fully under the veil.
 */

export type ModelId = 'A' | 'B' | 'C'
export type Outfit = 'column' | 'trousers' | 'slip'
export type HairStyle = 'bun' | 'chignon' | 'low'

export interface VeilSpec {
  color: string
  sheen: string
  /** Opacity where the fabric is seen edge-on (folds, silhouette). */
  opacity: number
  /** Fraction of that opacity left where the fabric faces the camera (how sheer it is). */
  face: number
  /** The same over the head, where the fabric is gathered and doubled (near opaque). */
  head: number
  /** Strength of the sheen glow on folds and edges. */
  glow: number
}

export interface FigureSpec {
  id: ModelId
  position: readonly [number, number, number]
  /** Turn toward the centre of the runway, radians. */
  rotationY: number
  skin: string
  hair: { style: HairStyle; color: string; sheen: string }
  outfit: Outfit
  veil: VeilSpec
  /** Height of the veil's crown (over the hair). */
  crown: number
  /** Phase for the veil folds and sway, so no two veils move or fall alike. */
  phase: number
  /** Carries the top-handle bag (outer hand). */
  bag: boolean
}

const INWARD = (8 * Math.PI) / 180

/** A runway finale in a staggered V: A centre front, B and C behind, turned slightly inward. */
export const FIGURES: readonly FigureSpec[] = [
  {
    id: 'B',
    position: [-1.1, 0, -0.3],
    rotationY: INWARD,
    skin: '#C99A6E',
    hair: { style: 'chignon', color: '#0E0C0B', sheen: '#6A625A' },
    outfit: 'trousers',
    veil: { color: '#0E0D0C', sheen: '#B3A696', opacity: 0.92, face: 0.5, head: 0.9, glow: 0.62 },
    crown: 1.775,
    phase: 1.9,
    bag: false,
  },
  {
    id: 'A',
    position: [0, 0, 0.5],
    rotationY: 0,
    skin: '#5B3A29',
    hair: { style: 'bun', color: '#0F0B09', sheen: '#4A372B' },
    outfit: 'column',
    veil: { color: '#E8E0D4', sheen: '#FAF5EC', opacity: 0.86, face: 0.34, head: 0.78, glow: 0.3 },
    crown: 1.79,
    phase: 0,
    bag: false,
  },
  {
    id: 'C',
    position: [1.1, 0, -0.3],
    rotationY: -INWARD,
    skin: '#E6C3A8',
    hair: { style: 'low', color: '#2A1D14', sheen: '#7C5C42' },
    outfit: 'slip',
    veil: { color: '#6E6862', sheen: '#D6CDC2', opacity: 0.88, face: 0.44, head: 0.9, glow: 0.5 },
    crown: 1.775,
    phase: 3.7,
    bag: true,
  },
]

/** The body from the waist to the neck (skin under every garment). */
export const TORSO: readonly ProfilePoint[] = [
  [0.13, 0.95],
  [0.125, 1.05],
  [0.15, 1.22],
  [0.175, 1.36],
  [0.135, 1.4],
  [0.062, 1.44],
  [0.05, 1.475],
  [0.047, 1.535],
]

/** Depth ÷ width of the body's cross-section by height: flat at the shoulders, round at the neck. */
export const DEPTH = knots([
  [0.0, 0.76],
  [0.92, 0.72],
  [1.05, 0.72],
  [1.2, 0.76],
  [1.3, 0.62],
  [1.36, 0.47],
  [1.41, 0.58],
  [1.45, 0.92],
  [1.6, 0.95],
])

/** A: black silk column, a whisper of a trumpet at the hem and a short train. */
export const COLUMN: readonly ProfilePoint[] = [
  [0.265, 0.0],
  [0.214, 0.1],
  [0.198, 0.3],
  [0.19, 0.6],
  [0.178, 0.92],
  [0.131, 1.05],
  [0.156, 1.22],
  [0.181, 1.36],
  [0.141, 1.4],
  [0.067, 1.44],
]

/** C: bias-cut garnet slip, slimmer, a slight flare at a mid-ankle hem. */
export const SLIP: readonly ProfilePoint[] = [
  [0.245, 0.13],
  [0.222, 0.22],
  [0.204, 0.45],
  [0.194, 0.65],
  [0.177, 0.92],
  [0.13, 1.05],
  [0.155, 1.22],
  [0.162, 1.27],
]

/** B: one wide trouser leg (hem to hip), centred on its own axis. */
export const LEG: readonly ProfilePoint[] = [
  [0.132, 0.0],
  [0.126, 0.25],
  [0.114, 0.55],
  [0.103, 0.8],
  [0.096, 0.97],
]

/** B: the trousers' seat and waistband. */
export const SEAT: readonly ProfilePoint[] = [
  [0.186, 0.75],
  [0.197, 0.86],
  [0.183, 0.95],
  [0.14, 1.03],
  [0.133, 1.07],
]

/** B: the black draped top, a soft peplum over the waistband, a cowl at the neck. */
export const TOP: readonly ProfilePoint[] = [
  [0.214, 0.88],
  [0.19, 0.95],
  [0.148, 1.02],
  [0.132, 1.06],
  [0.157, 1.22],
  [0.183, 1.36],
  [0.143, 1.4],
  [0.068, 1.44],
]

/**
 * The veil, crown to hem, at the back (its longest fall, to mid-back). The front falls to
 * the chest; the sides in between. Fold depth grows toward the hem.
 */
export const VEIL: readonly ProfilePoint[] = [
  [0.004, 1.775],
  [0.07, 1.762],
  [0.108, 1.722],
  [0.128, 1.66],
  [0.136, 1.6],
  [0.142, 1.545],
  [0.19, 1.45],
  [0.25, 1.34],
  [0.29, 1.14],
  [0.312, 0.88],
]

type Pt = readonly [number, number, number]

/** The figure's left arm (+x), relaxed: shoulder, elbow a touch behind, hand by the thigh. */
export const ARM_REST: readonly Pt[] = [
  [0.158, 1.352, -0.012],
  [0.19, 1.215, -0.02],
  [0.21, 1.06, -0.024],
  [0.222, 0.93, 0.0],
  [0.231, 0.8, 0.027],
  [0.233, 0.728, 0.04],
  [0.229, 0.652, 0.046],
]

/** The left arm carrying a top-handle bag: straighter, the hand closed around the handle. */
export const ARM_CARRY: readonly Pt[] = [
  [0.158, 1.352, -0.012],
  [0.196, 1.21, -0.014],
  [0.222, 1.06, -0.008],
  [0.242, 0.93, 0.004],
  [0.254, 0.815, 0.012],
  [0.258, 0.768, 0.014],
  [0.258, 0.736, 0.014],
]

/** Arm radius along the arm (u 0 shoulder … 1 fingertips). */
export const ARM_RADIUS = knots([
  [0.0, 0.05],
  [0.08, 0.046],
  [0.22, 0.04],
  [0.4, 0.032],
  [0.5, 0.035],
  [0.71, 0.023],
  [0.8, 0.028],
  [0.9, 0.023],
  [0.965, 0.013],
  [1.0, 0.004],
])

/** A closed hand is shorter and rounder. */
export const FIST_RADIUS = knots([
  [0.0, 0.05],
  [0.08, 0.046],
  [0.22, 0.04],
  [0.4, 0.032],
  [0.5, 0.035],
  [0.74, 0.023],
  [0.84, 0.03],
  [0.95, 0.026],
  [1.0, 0.008],
])

/** Hands are flat: the cross-section thins across the palm (the side axis faces the thigh). */
export const HAND_SQUASH = (u: number): readonly [number, number] => {
  const k = u < 0.68 ? 0 : Math.min(1, (u - 0.68) / 0.1)
  return [1 - 0.5 * k, 1]
}

export const FIST_SQUASH = (u: number): readonly [number, number] => {
  const k = u < 0.7 ? 0 : Math.min(1, (u - 0.7) / 0.1)
  return [1 - 0.25 * k, 1]
}
