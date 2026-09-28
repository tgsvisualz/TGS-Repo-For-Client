/**
 * The canonical placeholder model, front view, in figure space (1000 units tall, centre x 500).
 * About nine heads: crown y≈60, shoulders y≈235, waist y≈420, hip y≈520, heel y≈990.
 * Contrapposto: the weight sits on the viewer's-left leg, so that hip rides higher and further
 * out while the same shoulder drops; the free knee bends in and its foot turns out.
 * The art mirrors this whole figure (never re-draws it) for variety.
 */
import { boxOf, boxOfC, ellipse, fold, ribbon, spline, type Box, type CPt, type Knot, type Pt, type Row } from './geom'

export const HEAD = { cx: 503, cy: 112, rx: 35.5, ry: 51, rot: 4 } as const

export const TORSO: readonly Knot[] = [
  [488, 140],
  [486, 178],
  [481, 204],
  [462, 216],
  [436, 228],
  [417, 240],
  [409, 258],
  [414, 282],
  [426, 300],
  [431, 334],
  [439, 374],
  [450, 420],
  [436, 466],
  [413, 512],
  [410, 556],
  [424, 604, 1],
  [576, 608, 1],
  [570, 564],
  [573, 526],
  [564, 480],
  [553, 424],
  [561, 374],
  [567, 334],
  [572, 298],
  [586, 276],
  [591, 252],
  [583, 234],
  [565, 222],
  [540, 211],
  [521, 202],
  [517, 176],
  [516, 138],
]

export type Side = 'L' | 'R'

export type ArmView = 'front' | 'back'

interface ArmContour {
  /** Edge away from the body, shoulder to wrist. */
  outer: readonly Pt[]
  /** Edge toward the body, armpit to wrist. */
  inner: readonly Pt[]
  /** Hidden closure over the shoulder, from the armpit back to the top of the outer edge. */
  cap: readonly Pt[]
}

/**
 * Arms as two contours: deltoid, a slim upper arm, the elbow, a small forearm swell and a
 * fine wrist. The key-side arm hangs straight with air between elbow and waist (it carries
 * the bag); the far arm bends softly so its hand rests in front of the thigh.
 */
const ARMS: Record<ArmView, Record<Side, ArmContour>> = {
  front: {
    L: {
      outer: [[414, 242], [404, 256], [399, 280], [398, 312], [397, 346], [395, 380], [393, 412], [393, 440], [395, 472], [398, 506], [401, 540], [403, 570]],
      inner: [[428, 300], [425, 332], [421, 366], [417, 400], [417, 430], [419, 456], [419, 486], [418, 516], [417, 546], [416, 572]],
      cap: [[432, 272], [426, 250]],
    },
    R: {
      outer: [[588, 232], [598, 246], [603, 272], [604, 306], [605, 342], [606, 376], [607, 406], [606, 436], [603, 468], [599, 502], [595, 536], [591, 562]],
      inner: [[573, 292], [576, 322], [580, 356], [583, 390], [585, 420], [584, 444], [583, 474], [581, 506], [579, 538], [578, 566]],
      cap: [[570, 262], [576, 240]],
    },
  },
  back: {
    L: {
      outer: [[414, 242], [404, 256], [399, 280], [398, 312], [397, 346], [396, 380], [398, 412], [403, 440], [412, 462], [424, 478], [438, 488]],
      inner: [[428, 300], [425, 332], [421, 366], [419, 398], [421, 420], [427, 438], [436, 452], [446, 462]],
      cap: [[432, 272], [426, 250]],
    },
    R: {
      outer: [[588, 232], [598, 246], [603, 272], [604, 306], [605, 342], [604, 376], [602, 408], [597, 436], [588, 458], [576, 474], [562, 484]],
      inner: [[573, 292], [576, 322], [580, 356], [582, 390], [580, 416], [574, 434], [566, 448], [556, 458]],
      cap: [[570, 262], [576, 240]],
    },
  },
}

const BENT: Record<Side, ArmContour> = {
  L: {
    outer: [[414, 242], [404, 256], [399, 280], [398, 312], [397, 346], [396, 378], [397, 406], [400, 430], [406, 456], [413, 482], [420, 508], [426, 532], [431, 554]],
    inner: [[428, 300], [425, 332], [421, 364], [418, 392], [418, 412], [422, 432], [428, 456], [435, 480], [441, 504], [445, 528], [447, 550]],
    cap: [[432, 272], [426, 250]],
  },
  R: {
    outer: [[588, 232], [598, 246], [603, 272], [604, 306], [605, 340], [606, 372], [605, 400], [602, 424], [596, 450], [589, 476], [582, 502], [576, 526], [571, 548]],
    inner: [[573, 292], [576, 322], [580, 354], [583, 384], [583, 404], [579, 424], [573, 448], [566, 472], [560, 496], [556, 520], [554, 544]],
    cap: [[570, 262], [576, 240]],
  },
}

/** Pose of the arms: which one (if any) bends. */
export type ArmPose = { bent: Side | null }

function contour(side: Side, view: ArmView, pose: ArmPose): ArmContour {
  return view === 'front' && pose.bent === side ? BENT[side] : ARMS[view][side]
}

/** Wrist position and hand direction for an arm in a pose (front view). */
export function wristOf(side: Side, pose: ArmPose): { at: Pt; dir: Pt } {
  if (pose.bent === side) return side === 'L' ? { at: [439, 553], dir: [0.24, 1] } : { at: [562.5, 547], dir: [-0.24, 1] }
  return side === 'L' ? { at: [409.5, 571], dir: [0.06, 1] } : { at: [584.5, 564], dir: [-0.1, 1] }
}

/**
 * An arm (skin) or a sleeve over it. `widen(t)` adds cloth width along the arm (t: 0 at the
 * shoulder, 1 at the wrist), split between both edges.
 */
export function armShape(
  side: Side,
  view: ArmView,
  pose: ArmPose,
  widen?: (t: number) => number,
  withHand?: 'relaxed' | 'grip',
): { d: string; box: Box; rows: Row[] } {
  const a = contour(side, view, pose)
  const out = side === 'L' ? -1 : 1
  const y0 = a.outer[0][1]
  const y1 = a.outer[a.outer.length - 1][1]
  const w = (y: number): number => (widen ? widen(Math.max(0, Math.min(1, (y - y0) / (y1 - y0)))) / 2 : 0)
  const outer: Knot[] = a.outer.map(([x, y]) => [x + out * w(y), y])
  const inner: Knot[] = a.inner.map(([x, y]) => [x - out * w(y), y])
  const cap: Knot[] = a.cap.map(([x, y]) => [x - out * (widen ? 4 : 0), y - (widen ? 4 : 0)])
  // With a hand, the contour runs on from the wrist round the fingers and back: one shape,
  // so edge light flows from arm to hand without a seam.
  const handPts = withHand && view === 'front' ? handPoints(side, pose, withHand === 'grip').pts.slice(1, -1) : []
  const pts: Knot[] = [...outer, ...handPts, ...inner.slice().reverse(), ...cap]
  // Rows (left edge, right edge) for folds along a sleeve.
  const rows: Row[] = []
  for (let i = 0; i < inner.length; i++) {
    const y = inner[i][1]
    let ox = outer[outer.length - 1][0]
    for (let j = 1; j < outer.length; j++) {
      if (outer[j][1] >= y) {
        const t = (y - outer[j - 1][1]) / (outer[j][1] - outer[j - 1][1] || 1)
        ox = outer[j - 1][0] + (outer[j][0] - outer[j - 1][0]) * t
        break
      }
    }
    rows.push(side === 'L' ? [y, ox, inner[i][0]] : [y, inner[i][0], ox])
  }
  return { d: spline(pts, true), box: boxOf(pts, 3), rows }
}

export const LEG: Record<Side, readonly CPt[]> = {
  L: [
    [447, 690, 58],
    [446, 740, 45],
    [447, 772, 43],
    [451, 822, 46],
    [457, 880, 37],
    [464, 946, 20],
    [465, 962, 19],
  ],
  R: [
    [527, 700, 55],
    [521, 758, 44],
    [523, 790, 43],
    [530, 836, 45],
    [540, 890, 35],
    [551, 948, 20],
    [553, 964, 19],
  ],
}

export const ANKLE: Record<Side, Pt> = { L: [464, 950], R: [551, 952] }
export const TOE: Record<Side, Pt> = { L: [458, 997], R: [569, 996] }

export function headPath(): string {
  return ellipse(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, HEAD.rot)
}

export function headBox(): Box {
  return { x: HEAD.cx - HEAD.rx - 2, y: HEAD.cy - HEAD.ry - 2, w: HEAD.rx * 2 + 4, h: HEAD.ry * 2 + 4 }
}

export function torsoBox(): Box {
  return boxOf(TORSO)
}

export function limb(c: readonly CPt[], capStart = 12, capEnd = 2): { d: string; box: Box } {
  return { d: ribbon(c, capStart, capEnd), box: boxOfC(c, 4) }
}

// Hands, drawn pointing down from the wrist with the thumb on the body side (+x for the
// left hand). One contour each (the thumb is a bump on the inner edge), so edge light never
// draws a seam through the hand.
const HAND: readonly Pt[] = [
  [-6.5, 0], [-7.8, 12], [-8.8, 25], [-8.8, 37], [-7.8, 49], [-5.8, 59], [-3.2, 67], [0, 72],
  [3, 69], [5, 61], [6.4, 51], [7, 43], [8.6, 38.5], [10.4, 34.5], [10.8, 26], [9.8, 17], [7.8, 9], [6.2, 0],
]
const GRIP: readonly Pt[] = [
  [-8, 0], [-10, 12], [-11.5, 24], [-11, 34], [-7, 42], [0, 45], [6, 43], [10, 36], [12, 28], [12, 20], [10, 11], [7.5, 0],
]

export interface HandShape {
  /** Contour from the outer wrist round the fingertips to the inner wrist. */
  pts: Knot[]
  /** Centre of the palm: where a handle or chain sits in a gripping hand. */
  palm: Pt
  /** A faint crease between the fingers (fold path). */
  crease: string
}

/**
 * A relaxed hand hanging from the wrist, or a loose grip around a handle: slim, long-fingered,
 * no fingers drawn individually. Light carries it.
 */
export function handPoints(side: Side, pose: ArmPose, grip = false): HandShape {
  const { at: wrist, dir } = wristOf(side, pose)
  const l = Math.hypot(dir[0], dir[1]) || 1
  const dx = dir[0] / l
  const dy = dir[1] / l
  const m = side === 'L' ? 1 : -1
  const k = 1.06
  // Local (x across, y along) → world: y runs along dir, x along its normal (mirrored for R).
  const T = ([x, y]: Pt): Knot => [wrist[0] + (x * m * dy + y * dx) * k, wrist[1] + (-x * m * dx + y * dy) * k]
  const pts = (grip ? GRIP : HAND).map(T)
  const palm = T(grip ? [0, 27] : [1, 40])
  const creasePts: readonly Pt[] = grip ? [[-3, 24], [-2.5, 33], [-1, 40]] : [[-1.5, 38], [-1, 52], [0, 64]]
  const crease = fold(creasePts.map((q) => [T(q)[0], T(q)[1]] as const), 1.6)
  return { pts, palm: [palm[0], palm[1]], crease }
}

/** A pointed black pump, seen from the front; the toe turns with the foot. */
export function shoe(side: Side): { d: string; box: Box; shine: string } {
  const [ax, ay] = ANKLE[side]
  const [tx, ty] = TOE[side]
  const w = 25
  const tY = ay + 13
  const pts: Knot[] = [
    [ax - w / 2, tY, 1],
    [ax - w * 0.2, tY + 5],
    [ax + w * 0.2, tY + 5],
    [ax + w / 2, tY - 1, 1],
    [(ax + w / 2 + tx) / 2 + 5, (tY + ty) / 2 + 2],
    [tx + (tx - ax) * 0.06 + 2, ty - 3],
    [tx, ty, 1],
    [tx - 5, ty - 4],
    [(ax - w / 2 + tx) / 2 - 5, (tY + ty) / 2 + 3],
  ]
  const shine = fold(
    [
      [ax - w * 0.22, tY + 9],
      [(ax + tx) / 2 - 2, (tY + ty) / 2 + 4],
      [tx - 1, ty - 5],
    ],
    5,
  )
  return { d: spline(pts, true), box: boxOf(pts, 3), shine }
}
