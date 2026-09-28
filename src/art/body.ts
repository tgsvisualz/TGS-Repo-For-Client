/**
 * The canonical placeholder model, front view, in figure space (1000 units tall, centre x 500).
 * About nine heads: crown y≈60, shoulders y≈235, waist y≈420, hip y≈520, heel y≈990.
 * Contrapposto: the weight sits on the viewer's-left leg, so that hip rides higher and further
 * out while the same shoulder drops; the free knee bends in and its foot turns out.
 * The art mirrors this whole figure (never re-draws it) for variety.
 */
import { boxOf, boxOfC, ellipse, fold, ribbon, spline, type Box, type CPt, type Knot, type Pt } from './geom'

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
  [424, 604],
  [576, 608],
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

/** Arms hang with a little air between elbow and waist: the negative space shows the waist. */
export const ARM: Record<Side, readonly CPt[]> = {
  L: [
    [425, 254, 38],
    [416, 296, 33],
    [410, 340, 29],
    [405, 384, 25],
    [403, 420, 23],
    [403, 458, 25],
    [405, 510, 22],
    [408, 568, 15.5],
  ],
  R: [
    [577, 246, 38],
    [586, 290, 33],
    [592, 336, 29],
    [597, 380, 25],
    [599, 414, 23],
    [599, 452, 24],
    [597, 506, 21],
    [593, 562, 15.5],
  ],
}

/** Seen from behind the forearms swing forward, out of sight behind the body. */
export const ARM_BACK: Record<Side, readonly CPt[]> = {
  L: [
    [425, 254, 38],
    [416, 296, 33],
    [410, 340, 29],
    [408, 384, 25],
    [412, 420, 23],
    [424, 452, 22],
    [444, 478, 18],
  ],
  R: [
    [577, 246, 38],
    [586, 290, 33],
    [592, 336, 29],
    [594, 380, 25],
    [590, 414, 23],
    [578, 448, 22],
    [558, 474, 18],
  ],
}

export const LEG: Record<Side, readonly CPt[]> = {
  L: [
    [452, 556, 80],
    [449, 612, 72],
    [447, 672, 60],
    [446, 740, 45],
    [447, 772, 43],
    [451, 822, 46],
    [457, 880, 37],
    [464, 946, 20],
    [465, 962, 19],
  ],
  R: [
    [541, 562, 80],
    [536, 622, 70],
    [529, 690, 57],
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

/** Where the hands hang. */
export const WRIST: Record<Side, Pt> = { L: [408, 568], R: [593, 562] }
export const HAND_DIR: Record<Side, Pt> = { L: [0.07, 1], R: [-0.07, 1] }

export const FLOOR_Y = 996

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

const norm = (v: Pt): Pt => {
  const l = Math.hypot(v[0], v[1]) || 1
  return [v[0] / l, v[1] / l]
}

export interface HandShape {
  d: string
  box: Box
  /** Centre of the palm: where a handle or chain sits in a gripping hand. */
  palm: Pt
}

/**
 * A relaxed hand hanging from the wrist, or a loose grip around a handle. One path (hand +
 * thumb as two subpaths with the same winding), no fingers drawn individually: light carries it.
 */
export function hand(side: Side, grip = false, wrist: Pt = WRIST[side], dir: Pt = HAND_DIR[side]): HandShape {
  const [dx, dy] = norm(dir)
  const s = side === 'L' ? -1 : 1
  // Unit vector pointing toward the body.
  const ix = -dy * s
  const iy = dx * s
  const len = grip ? 46 : 72
  const prof: readonly (readonly [number, number])[] = grip
    ? [
        [0, 15],
        [0.25, 20.5],
        [0.55, 24],
        [0.82, 22],
        [1, 15],
      ]
    : [
        [0, 14.5],
        [0.2, 20],
        [0.44, 22],
        [0.66, 19],
        [0.85, 14],
        [1, 7],
      ]
  const main: CPt[] = prof.map(([t, w]) => {
    const curl = grip ? t * 3 : t * t * 6
    return [wrist[0] + dx * len * t + ix * curl, wrist[1] + dy * len * t + iy * curl, w]
  })
  // Thumb: on the body side, angled in.
  const a = 0.36 * (side === 'L' ? 1 : -1)
  const tdx = dx * Math.cos(a) - dy * Math.sin(a)
  const tdy = dx * Math.sin(a) + dy * Math.cos(a)
  const tb: Pt = [wrist[0] + dx * 10 + ix * 6, wrist[1] + dy * 10 + iy * 6]
  const tl = grip ? 24 : 30
  const thumb: CPt[] = [
    [tb[0], tb[1], 10],
    [tb[0] + tdx * tl * 0.5, tb[1] + tdy * tl * 0.5, 9],
    [tb[0] + tdx * tl, tb[1] + tdy * tl, 6],
  ]
  const d = ribbon(main, 0, grip ? 7 : 3) + ribbon(thumb, 0, 3)
  const palm: Pt = [wrist[0] + dx * len * 0.58, wrist[1] + dy * len * 0.58]
  return { d, box: boxOfC([...main, ...thumb], 6), palm }
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
