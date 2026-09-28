/**
 * Outfit builders. Each cut is a few procedural outlines on the canonical pose (see body.ts)
 * plus the folds that sell the cloth: silk gets narrow bright sheen bands, velvet broad soft
 * falloff, wool a pressed crease, knit faint rib lines, satin liquid bands.
 */
import type { DressCut, Fabric, Outfit, TopCut, TrouserCut } from '../data/types'
import { armShape, type ArmPose, type Side } from './body'
import { across, boxOf, clamp, fmt, fold, foldOn, ribbon, rowsOutline, spline, boxOfC, type Box, type CPt, type Knot, type Pt, type Row } from './geom'
import { FABRIC, type Tone } from './palette'
import type { Fold, Mat, Piece } from './paint'

export type View = 'front' | 'back'

export interface Dressed {
  /** Bodice or top, over the torso skin. */
  upper: Piece[]
  /** Trousers, over the (tucked) top. */
  lower: Piece[]
  /** Waistbands, straps, collars, ties. */
  over: Piece[]
  /** Long sleeves (each side drawn in order over the arm). */
  sleeves: Partial<Record<Side, Piece[]>>
  bareArms: boolean
  /** Highest hem point above the floor: skin shows below it. */
  hem: number
}

export function matFor(fabric: Fabric, cut: string): Mat {
  if (cut === 'knit') return 'knit'
  if (cut === 'tailored' || cut === 'pleated') return 'wool'
  if (cut === 'satin') return 'satin'
  if (fabric === 'garnet' && (cut === 'column' || cut === 'evening')) return 'velvet'
  if (fabric === 'champagne') return 'satin'
  return 'silk'
}

const uOf = (b: Box, pts: readonly Pt[]): number => clamp((pts.reduce((s, p) => s + p[0], 0) / pts.length - b.x) / (b.w || 1), 0, 1)
const H = (b: Box, pts: readonly Pt[], w: number, a = 1, shape: 'spindle' | 'flare' = 'spindle'): Fold => ({ d: fold(pts, w, shape), u: uOf(b, pts), hi: true, a })
const Lo = (b: Box, pts: readonly Pt[], w: number, a = 1, shape: 'spindle' | 'flare' = 'spindle'): Fold => ({ d: fold(pts, w, shape), u: uOf(b, pts), hi: false, a })
const R = (rows: readonly Row[], u0: number, u1: number, y0: number, y1: number, w: number, hi: boolean, a = 1, shape: 'spindle' | 'flare' = 'flare'): Fold => ({
  d: foldOn(rows, u0, u1, y0, y1, w, { shape, wig: 2 }),
  u: (u0 + u1) / 2,
  hi,
  a,
})

function make(knots: readonly Knot[], tone: Tone, mat: Mat, folds: (b: Box) => Fold[], extra: Partial<Piece> = {}): Piece {
  const box = boxOf(knots)
  return { d: spline(knots, true), box, tone, mat, folds: folds(box), ...extra }
}

function band(c: readonly CPt[], tone: Tone, mat: Mat, extra: Partial<Piece> = {}): Piece {
  return { d: ribbon(c, 2, 2), box: boxOfC(c, 2), tone, mat, rim: 0.6, ...extra }
}

/** A sleeve over an arm: the arm's contours widened by a profile (t: 0 shoulder → 1 wrist). */
function sleeve(side: Side, view: View, pose: ArmPose, widen: (t: number) => number, tone: Tone, mat: Mat, folds: number): Piece {
  const a = armShape(side, view, pose, widen)
  const r = a.rows
  const y0 = r[0][0] + 6
  const y1 = r[r.length - 1][0] - 2
  const f: Fold[] = []
  for (let i = 0; i < folds; i++) {
    const u = 0.2 + (i / Math.max(1, folds - 1)) * 0.6
    f.push({ d: foldOn(r, u, u + (i % 2 ? 0.08 : -0.06), y0 + i * 10, y1, 7 + (i % 2) * 5, { shape: 'spindle', wig: 2, phase: i }), u, hi: i % 2 === 0, a: 0.85 })
  }
  return { d: a.d, box: a.box, tone, mat, folds: f, key: side === 'L' ? 1 : 0.5 }
}

// ── Dresses ────────────────────────────────────────────────────────────────

function column(fabric: Fabric, view: View): Dressed {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'column')
  const wf = mat === 'velvet' ? 1.8 : 1
  const top: Knot[] =
    view === 'front'
      ? [[571, 262], [564, 229, 1], [533, 239], [501, 246], [470, 243], [440, 236, 1], [431, 262]]
      : [[571, 262], [564, 229, 1], [533, 226], [501, 224], [470, 226], [440, 236, 1], [431, 262]]
  const rows: Row[] = [
    [292, 429, 572],
    [334, 430, 568],
    [374, 438, 562],
    [420, 449, 554],
    [468, 434, 565],
    [514, 410, 574],
    [560, 409, 574],
    [640, 412, 571],
    [740, 416, 570],
    [840, 420, 572],
    [930, 423, 577],
    [972, 424, 581],
  ]
  const hem: Knot[] = [[424, 987, 1], [452, 994], [492, 998], [534, 997], [582, 988, 1]]
  const dress = make(
    rowsOutline(rows, hem, top),
    tone,
    mat,
    (b) => [
      H(b, [[416, 520], [418, 640], [422, 760], [427, 880], [431, 992]], 15 * wf, 1, 'flare'),
      Lo(b, [[440, 540], [444, 680], [449, 840], [453, 996]], 18 * wf, 0.7, 'flare'),
      H(b, [[468, 560], [472, 700], [476, 860], [480, 998]], 10 * wf, 0.7, 'flare'),
      H(b, [[522, 690], [525, 780], [528, 880], [532, 997]], 20 * wf, 0.9, 'flare'),
      Lo(b, [[550, 600], [552, 720], [555, 860], [558, 997]], 16 * wf, 0.9, 'flare'),
      H(b, [[567, 580], [567, 720], [570, 860], [574, 990]], 8 * wf, 0.7, 'flare'),
      H(b, [[444, 296], [442, 336], [447, 380]], 10 * wf, 0.8),
      Lo(b, [[468, 432], [488, 520], [498, 600]], 12 * wf, 0.6),
      Lo(b, [[452, 424], [500, 430], [552, 426]], 6, 0.4),
    ],
    { ao: 0.45 },
  )
  return { upper: [dress], lower: [], over: [], sleeves: {}, bareArms: true, hem: 987 }
}

function slip(fabric: Fabric, view: View): Dressed {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'slip')
  const top: Knot[] =
    view === 'front'
      ? [[569, 300], [562, 292, 1], [548, 298], [526, 312], [501, 326], [476, 313], [456, 300], [437, 298, 1], [432, 308]]
      : [[569, 300], [562, 292, 1], [541, 322], [501, 360], [461, 322], [437, 298, 1], [432, 308]]
  const rows: Row[] = [
    [318, 431, 568],
    [340, 432, 567],
    [374, 439, 561],
    [420, 450, 553],
    [468, 434, 565],
    [514, 410, 575],
    [560, 409, 578],
    [640, 410, 583],
    [720, 412, 590],
    [800, 414, 598],
    [870, 416, 604],
    [898, 416, 606],
  ]
  const hem: Knot[] = [[417, 913, 1], [440, 923], [470, 919], [502, 931], [536, 922], [572, 927], [607, 913, 1]]
  const dress = make(
    rowsOutline(rows, hem, top),
    tone,
    mat,
    (b) => [
      // Bias drape: the cloth sweeps from the high hip across the body.
      H(b, [[416, 500], [430, 600], [452, 720], [470, 830], [480, 930]], 14, 1),
      Lo(b, [[440, 470], [462, 560], [484, 660], [494, 780], [500, 930]], 12, 0.8),
      H(b, [[548, 540], [540, 620], [532, 700], [526, 770]], 18, 1),
      H(b, [[526, 770], [532, 840], [540, 930]], 14, 0.9, 'flare'),
      Lo(b, [[500, 590], [506, 700], [510, 820], [514, 934]], 16, 0.9, 'flare'),
      Lo(b, [[566, 600], [574, 720], [582, 840], [590, 928]], 12, 0.9, 'flare'),
      H(b, [[590, 640], [596, 760], [602, 920]], 7, 0.8, 'flare'),
      H(b, [[446, 330], [442, 366], [448, 404]], 9, 0.8),
      ...(view === 'front'
        ? [
            H(b, [[462, 318], [482, 333], [502, 340], [522, 332], [540, 318]], 6, 0.9),
            Lo(b, [[466, 330], [500, 348], [534, 330]], 6, 0.7),
            H(b, [[472, 344], [502, 356], [530, 344]], 4, 0.6),
          ]
        : []),
    ],
    { ao: 0.35 },
  )
  const strapL: CPt[] =
    view === 'front'
      ? [[455, 303, 3.4], [457, 262, 3.4], [461, 219, 3.4]]
      : [[461, 318, 3.4], [459, 268, 3.4], [461, 219, 3.4]]
  const strapR: CPt[] =
    view === 'front'
      ? [[547, 299, 3.4], [545, 256, 3.4], [541, 212, 3.4]]
      : [[541, 318, 3.4], [543, 262, 3.4], [541, 212, 3.4]]
  return { upper: [dress], lower: [], over: [band(strapL, tone, mat), band(strapR, tone, mat)], sleeves: {}, bareArms: true, hem: 913 }
}

function wrap(fabric: Fabric, view: View, pose: ArmPose): Dressed {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'wrap')
  const top: Knot[] =
    view === 'front'
      ? [[588, 262], [586, 238, 1], [560, 222], [522, 210, 1], [514, 248], [507, 288], [501, 318, 1], [491, 282], [485, 244], [480, 209, 1], [452, 222], [416, 240, 1], [411, 262]]
      : [[588, 262], [586, 238, 1], [560, 222], [522, 208], [500, 212], [480, 207], [452, 222], [416, 240, 1], [411, 262]]
  const rows: Row[] = [
    [296, 426, 572],
    [334, 430, 568],
    [374, 439, 561],
    [420, 450, 553],
    [462, 440, 562],
    [520, 424, 578],
    [600, 410, 592],
    [680, 400, 604],
    [760, 392, 616],
    [786, 390, 619],
  ]
  const hem: Knot[] = [[388, 800, 1], [412, 811], [446, 806], [482, 815], [516, 808], [552, 816], [590, 808], [622, 799, 1]]
  const dress = make(rowsOutline(rows, hem, top), tone, mat, (b) => [
    R(rows, 0.1, 0.06, 470, 812, 16, true),
    R(rows, 0.28, 0.24, 450, 812, 14, false),
    R(rows, 0.44, 0.42, 480, 814, 10, true, 0.8),
    R(rows, 0.64, 0.66, 470, 814, 16, false),
    R(rows, 0.84, 0.9, 470, 806, 12, true, 0.8),
    ...(view === 'front'
      ? [
          // The overlap: the top panel's edge runs from the V to the tie, then down the skirt.
          H(b, [[501, 320], [516, 350], [534, 390], [548, 424]], 5, 1),
          Lo(b, [[505, 330], [522, 364], [540, 400], [552, 428]], 8, 0.9),
          H(b, [[546, 434], [552, 560], [558, 690], [564, 812]], 5, 1, 'flare'),
          Lo(b, [[553, 436], [559, 560], [566, 690], [573, 812]], 9, 0.9, 'flare'),
          H(b, [[440, 300], [468, 346], [506, 392], [540, 420]], 9, 0.8),
          Lo(b, [[452, 330], [486, 370], [526, 410]], 8, 0.8),
        ]
      : [Lo(b, [[452, 424], [500, 430], [552, 426]], 7, 0.6)]),
    Lo(b, [[452, 424], [500, 432], [548, 428]], 6, 0.5),
  ])
  const over: Piece[] = []
  if (view === 'front') {
    const knot: Knot[] = [[540, 420], [549, 414], [559, 420], [558, 432], [548, 437], [539, 431]]
    over.push(make(knot, tone, mat, () => []))
  }
  const tie1: CPt[] = [[552, 432, 12], [556, 470, 11], [561, 520, 12], [563, 562, 9]]
  const tie2: CPt[] = [[546, 434, 10], [541, 480, 10], [535, 530, 11], [531, 572, 8]]
  if (view === 'back') {
    tie1.splice(0, 1, [566, 436, 10])
    tie2.splice(0, 1, [562, 440, 9])
  }
  over.push(band(tie2, tone, mat, { rim: 0.8, folds: [{ d: fold(tie2.map((c) => [c[0] + 1, c[1]] as const), 4), u: 0.4, hi: true }] }))
  over.push(band(tie1, tone, mat, { rim: 0.8, folds: [{ d: fold(tie1.map((c) => [c[0] - 1, c[1]] as const), 5), u: 0.4, hi: true }] }))
  const widen = (t: number): number => 7 - t * 2
  return {
    upper: [dress],
    lower: [],
    over,
    sleeves: {
      L: [sleeve('L', view, pose, widen, tone, mat, 3)],
      R: [sleeve('R', view, pose, widen, tone, mat, 3)],
    },
    bareArms: false,
    hem: 799,
  }
}

function evening(fabric: Fabric, view: View): Dressed {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'evening')
  const wf = mat === 'velvet' ? 1.6 : 1
  const top: Knot[] =
    view === 'front'
      ? [[566, 320], [562, 306, 1], [552, 288], [537, 252], [522, 208, 1], [519, 196], [501, 191], [485, 195], [482, 208, 1], [466, 252], [451, 290], [440, 306, 1], [436, 320]]
      : [[566, 322], [566, 306, 1], [561, 344], [557, 400], [549, 432], [528, 452], [502, 460], [476, 452], [455, 432], [446, 400], [441, 344], [436, 306, 1], [436, 322]]
  const back = view === 'back'
  const rows: Row[] = [
    [322, 435, 566],
    [340, 432, 567],
    [374, 439, 561],
    [420, 450, 553],
    [468, 434, 566],
    [514, 410, 576],
    [580, 404, 588],
    [660, 394, 604],
    [740, 382, 622],
    [820, 370, 640],
    [900, 356, 658],
    [960, 346, 670],
  ]
  const hem: Knot[] = back
    ? [[338, 990, 1], [360, 1002], [400, 1010], [450, 1012], [500, 1016], [550, 1012], [600, 1010], [640, 1002], [678, 992, 1]]
    : [[343, 987, 1], [370, 997], [410, 1001], [455, 998], [500, 1004], [545, 999], [590, 1003], [632, 998], [673, 989, 1]]
  const dress = make(
    rowsOutline(rows, hem, top),
    tone,
    mat,
    (b) => [
      R(rows, 0.06, 0.04, 520, 1000, 18 * wf, true),
      R(rows, 0.2, 0.16, 540, 1004, 16 * wf, false),
      R(rows, 0.34, 0.3, 560, 1004, 22 * wf, true, 0.9),
      R(rows, 0.47, 0.46, 560, 1006, 18 * wf, false),
      R(rows, 0.6, 0.62, 640, 1006, 24 * wf, true, 0.9),
      R(rows, 0.75, 0.78, 560, 1004, 16 * wf, false),
      R(rows, 0.9, 0.94, 540, 1000, 12 * wf, true, 0.8),
      ...(back ? [] : [H(b, [[446, 318], [443, 356], [448, 398]], 10 * wf, 0.8)]),
      Lo(b, [[452, 424], [500, 430], [552, 426]], 6, 0.4),
    ],
    { ao: 0.45 },
  )
  const over: Piece[] = []
  if (back) {
    const nb: CPt[] = [[483, 198, 9], [502, 203, 9], [520, 197, 9]]
    over.push(band(nb, tone, mat))
  }
  return { upper: [dress], lower: [], over, sleeves: {}, bareArms: true, hem: 987 }
}

// ── Tops ───────────────────────────────────────────────────────────────────

function blouse(fabric: Fabric, view: View, pose: ArmPose): Omit<Dressed, 'lower' | 'hem'> {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'blouse')
  const top: Knot[] = [[590, 256], [584, 238, 1], [560, 223], [530, 213], [520, 206, 1], [484, 207, 1], [474, 214], [446, 226], [418, 240, 1], [410, 258]]
  const rows: Row[] = [
    [292, 424, 576],
    [334, 426, 573],
    [374, 432, 568],
    [410, 438, 563],
    [436, 442, 560],
  ]
  const hem: Knot[] = [[442, 452, 1], [560, 452, 1]]
  const body = make(rowsOutline(rows, hem, top), tone, mat, (b) => [
    H(b, [[440, 300], [446, 360], [450, 420], [452, 450]], 14, 1),
    Lo(b, [[470, 324], [474, 390], [476, 450]], 10, 0.9),
    H(b, [[500, 310], [496, 380], [498, 450]], 8, 0.7),
    Lo(b, [[530, 318], [534, 390], [536, 450]], 12, 0.9),
    H(b, [[554, 300], [556, 380], [552, 450]], 8, 0.7),
    H(b, [[446, 440], [500, 446], [556, 440]], 6, 0.5),
    ...(view === 'front' ? [H(b, [[500, 216], [500, 260], [501, 300]], 3, 0.6), Lo(b, [[503, 216], [503, 260], [504, 300]], 4, 0.5)] : []),
  ])
  const collarK: Knot[] = [[482, 212, 1], [480, 186], [490, 180], [502, 179], [514, 180], [523, 185], [522, 208, 1], [502, 214]]
  const collar = make(collarK, tone, mat, (b) => [H(b, [[484, 190], [502, 184], [520, 188]], 4, 0.8)], { rim: 0.7 })
  // Bishop sleeve: full through the forearm, gathered at the wrist.
  const widen = (t: number): number => (t < 0.5 ? 8 + t * 10 : t < 0.84 ? 13 + (t - 0.5) * 70 : Math.max(5, 37 - (t - 0.84) * 200))
  const sleeves: Partial<Record<Side, Piece[]>> = {
    L: [sleeve('L', view, pose, widen, tone, mat, 4)],
    R: [sleeve('R', view, pose, widen, tone, mat, 4)],
  }
  return { upper: [body], over: [collar], sleeves, bareArms: false }
}

function knit(fabric: Fabric, view: View, pose: ArmPose): Omit<Dressed, 'lower' | 'hem'> {
  const tone = FABRIC[fabric]
  const mat: Mat = 'knit'
  const top: Knot[] = [[590, 254], [584, 236, 1], [560, 223], [534, 212], [520, 205, 1], [510, 212], [501, 215], [490, 212], [483, 206, 1], [468, 214], [440, 228], [418, 240, 1], [410, 256]]
  const rows: Row[] = [
    [292, 428, 573],
    [334, 430, 569],
    [374, 438, 562],
    [420, 448, 555],
    [440, 446, 558],
  ]
  const hem: Knot[] = [[446, 452, 1], [558, 452, 1]]
  // Rib lines follow the body's contour.
  const ribRows: Row[] = [[214, 440, 566], ...rows, [452, 446, 558]]
  let ribsLight = ''
  let ribsDark = ''
  for (let i = 0; i <= 22; i++) {
    const u = 0.02 + (i / 22) * 0.96
    const pts: Pt[] = [214, 270, 330, 390, 452].map((y) => [across(ribRows, y, u), y] as const)
    const d = pts.map((q, j) => `${j ? 'L' : 'M'}${fmt(q[0])} ${fmt(q[1])}`).join('')
    ribsLight += d
    const pts2: Pt[] = [214, 270, 330, 390, 452].map((y) => [across(ribRows, y, u + 0.02), y] as const)
    ribsDark += pts2.map((q, j) => `${j ? 'L' : 'M'}${fmt(q[0])} ${fmt(q[1])}`).join('')
  }
  const ribs = (
    <g fill="none">
      <path d={ribsDark} stroke={tone.deep} strokeWidth="1.7" opacity="0.5" />
      <path d={ribsLight} stroke={tone.sheen} strokeWidth="1" opacity="0.14" />
    </g>
  )
  const body = make(
    rowsOutline(rows, hem, top),
    tone,
    mat,
    (b) => [H(b, [[440, 290], [438, 350], [446, 410], [450, 450]], 18, 1), Lo(b, [[470, 340], [500, 350], [530, 340]], 14, 0.4)],
    { extra: ribs },
  )
  const widen = (t: number): number => 5 + (t > 0.85 ? 2 : 0)
  const neck: CPt[] = [[482, 206, 7], [491, 212, 7], [501, 215, 7], [511, 212, 7], [521, 205, 7]]
  return {
    upper: [body],
    over: view === 'front' ? [band(neck, tone, mat, { rim: 0.5 })] : [],
    sleeves: {
      L: [sleeve('L', view, pose, widen, tone, mat, 2)],
      R: [sleeve('R', view, pose, widen, tone, mat, 2)],
    },
    bareArms: false,
  }
}

function bodysuit(fabric: Fabric, view: View): Omit<Dressed, 'lower' | 'hem'> {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'bodysuit')
  const top: Knot[] =
    view === 'front'
      ? [[572, 292], [567, 262], [558, 226, 1], [536, 220, 1], [526, 240], [502, 254], [478, 244], [466, 226, 1], [444, 232, 1], [436, 262], [430, 292]]
      : [[572, 292], [567, 262], [558, 226, 1], [536, 220, 1], [526, 262], [502, 282], [478, 264], [466, 226, 1], [444, 232, 1], [436, 262], [430, 292]]
  const rows: Row[] = [
    [294, 430, 572],
    [334, 431, 568],
    [374, 439, 561],
    [420, 450, 553],
    [440, 447, 556],
  ]
  const hem: Knot[] = [[447, 452, 1], [556, 452, 1]]
  const body = make(rowsOutline(rows, hem, top), tone, mat, (b) => [
    H(b, [[452, 246], [441, 300], [438, 360], [447, 420], [450, 452]], 14, 1),
    H(b, [[556, 250], [562, 310], [556, 380], [550, 452]], 6, 0.5),
    Lo(b, [[468, 334], [500, 340], [532, 334]], 10, 0.5),
  ])
  return { upper: [body], over: [], sleeves: {}, bareArms: true }
}

function draped(fabric: Fabric, view: View): Omit<Dressed, 'lower' | 'hem'> {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'draped')
  const top: Knot[] =
    view === 'front'
      ? [[572, 290], [567, 258], [557, 224, 1], [540, 229], [524, 258], [502, 291], [480, 259], [465, 231], [448, 230, 1], [437, 262], [430, 290]]
      : [[572, 290], [567, 258], [557, 224, 1], [540, 224], [502, 230], [465, 226], [448, 230, 1], [437, 262], [430, 290]]
  const rows: Row[] = [
    [292, 430, 572],
    [334, 430, 569],
    [374, 437, 563],
    [420, 446, 557],
    [450, 440, 564],
  ]
  const hem: Knot[] = [[439, 462, 1], [470, 468], [510, 478], [548, 488], [567, 486, 1]]
  const body = make(rowsOutline(rows, hem, top), tone, mat, (b) => [
    // Bias drape: diagonal folds from the shoulder to the tie at the opposite hip.
    H(b, [[452, 248], [478, 302], [512, 362], [548, 420], [566, 470]], 12, 1),
    Lo(b, [[444, 282], [472, 338], [506, 394], [540, 446], [560, 482]], 11, 0.9),
    H(b, [[440, 322], [466, 372], [496, 422], [528, 464]], 10, 0.8),
    Lo(b, [[437, 362], [460, 406], [488, 448], [510, 472]], 9, 0.8),
    H(b, [[438, 402], [458, 436], [478, 462]], 7, 0.6),
    ...(view === 'front'
      ? [
          H(b, [[472, 270], [490, 294], [502, 300], [514, 294], [530, 268]], 6, 0.9),
          Lo(b, [[470, 290], [502, 312], [534, 288]], 7, 0.8),
          H(b, [[474, 306], [502, 322], [530, 304]], 5, 0.6),
        ]
      : []),
  ])
  const knot: Knot[] = [[557, 474], [567, 468], [577, 476], [575, 488], [565, 492], [556, 486]]
  const tie1: CPt[] = [[570, 488, 10], [576, 530, 9], [580, 590, 10], [579, 606, 7]]
  const tie2: CPt[] = [[562, 490, 9], [556, 530, 9], [551, 578, 8], [549, 590, 6]]
  return {
    upper: [body],
    over: [
      band(tie2, tone, mat, { rim: 0.8, folds: [{ d: fold(tie2.map((c) => [c[0] + 1, c[1]] as const), 4), u: 0.4, hi: true }] }),
      band(tie1, tone, mat, { rim: 0.8, folds: [{ d: fold(tie1.map((c) => [c[0] - 1, c[1]] as const), 4), u: 0.4, hi: true }] }),
      make(knot, tone, mat, () => []),
    ],
    sleeves: {},
    bareArms: true,
  }
}

// ── Trousers ───────────────────────────────────────────────────────────────

function waistband(tone: Tone, mat: Mat, y: number, h: number): Piece {
  const k: Knot[] = [[445, y, 1], [502, y + 2], [558, y + 4, 1], [559, y + h + 4, 1], [502, y + h + 2], [446, y + h, 1]]
  return make(k, tone, mat, (b) => [H(b, [[450, y + 2], [502, y + 4], [554, y + 6]], 3, 0.7)], { rim: 0.6 })
}

function wideLeg(fabric: Fabric, cut: TrouserCut): { lower: Piece[]; over: Piece[]; hem: number } {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, cut)
  const satin = cut === 'satin'
  const k: Knot[] = satin
    ? [[448, 414, 1], [438, 450], [420, 490], [408, 530], [404, 620], [400, 720], [398, 820], [396, 920], [394, 992, 1], [420, 997], [446, 998], [470, 994, 1], [474, 900], [480, 800], [486, 700], [494, 630], [500, 598, 1], [506, 630], [514, 700], [520, 800], [526, 900], [530, 994, 1], [556, 998], [582, 998], [606, 992, 1], [604, 900], [600, 800], [596, 700], [590, 610], [580, 530], [568, 478], [556, 418, 1]]
    : [[447, 412, 1], [438, 450], [420, 490], [408, 530], [402, 600], [395, 700], [388, 800], [382, 900], [378, 993, 1], [402, 998], [428, 1000], [452, 997], [472, 993, 1], [476, 900], [482, 800], [488, 700], [494, 630], [500, 598, 1], [506, 630], [514, 700], [520, 800], [526, 900], [530, 994, 1], [552, 999], [580, 1000], [604, 997], [622, 992, 1], [616, 900], [608, 800], [600, 700], [592, 600], [580, 530], [570, 480], [557, 416, 1]]
  const legs = make(k, tone, mat, (b) =>
    satin
      ? [
          H(b, [[432, 500], [420, 600], [417, 700], [423, 800], [419, 900], [414, 994]], 30, 0.7),
          H(b, [[432, 500], [421, 600], [418, 700], [424, 800], [420, 900], [415, 994]], 9, 1),
          Lo(b, [[452, 560], [450, 700], [452, 840], [450, 994]], 16, 0.9),
          H(b, [[464, 620], [466, 760], [462, 994]], 8, 0.7),
          H(b, [[542, 620], [532, 720], [538, 820], [550, 920], [558, 994]], 24, 0.8),
          H(b, [[542, 620], [533, 720], [539, 820], [551, 920], [559, 994]], 7, 1),
          Lo(b, [[572, 600], [578, 760], [584, 994]], 14, 0.9),
          H(b, [[592, 600], [598, 760], [600, 990]], 7, 0.7),
        ]
      : [
          H(b, [[420, 520], [410, 640], [404, 760], [399, 880], [397, 996]], 16, 1, 'flare'),
          Lo(b, [[446, 560], [441, 700], [437, 840], [434, 998]], 14, 0.9, 'flare'),
          H(b, [[462, 600], [462, 760], [460, 998]], 9, 0.8, 'flare'),
          H(b, [[520, 640], [530, 760], [540, 880], [548, 998]], 15, 0.9, 'flare'),
          Lo(b, [[556, 600], [566, 760], [574, 900], [580, 999]], 14, 1, 'flare'),
          H(b, [[590, 580], [598, 720], [604, 860], [608, 996]], 9, 0.7, 'flare'),
          H(b, [[394, 944], [412, 962], [436, 972]], 7, 0.35),
          H(b, [[538, 950], [560, 966], [586, 974]], 7, 0.3),
          Lo(b, [[470, 426], [468, 472], [466, 522]], 6, 0.7),
          Lo(b, [[532, 428], [534, 474], [536, 522]], 6, 0.7),
        ],
    { ao: 0.4 },
  )
  return { lower: [legs], over: [waistband(tone, mat, 404, 17)], hem: 992 }
}

function tailored(fabric: Fabric): { lower: Piece[]; over: Piece[]; hem: number } {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'tailored')
  const k: Knot[] = [[449, 414, 1], [440, 450], [422, 490], [411, 530], [414, 600], [418, 700], [422, 800], [426, 900], [428, 966, 1], [452, 970], [478, 967, 1], [480, 900], [484, 800], [490, 700], [496, 630], [500, 598, 1], [505, 630], [510, 700], [516, 800], [524, 900], [530, 968, 1], [556, 971], [580, 967, 1], [579, 900], [576, 800], [574, 700], [574, 600], [574, 530], [566, 480], [555, 418, 1]]
  const legs = make(
    k,
    tone,
    mat,
    (b) => [
      // Pressed creases: a crisp line of light down the front of each leg.
      H(b, [[441, 476], [446, 600], [451, 780], [453, 968]], 4, 2.4),
      Lo(b, [[445, 480], [450, 600], [455, 780], [457, 968]], 5, 0.9),
      H(b, [[548, 484], [545, 620], [549, 800], [555, 970]], 3.6, 2.2),
      Lo(b, [[552, 486], [549, 620], [553, 800], [559, 970]], 5, 0.9),
      H(b, [[420, 520], [420, 680], [426, 860], [430, 966]], 12, 0.6),
      Lo(b, [[488, 640], [494, 800], [500, 968]], 10, 0.7),
      H(b, [[520, 700], [526, 820], [532, 966]], 8, 0.5),
      Lo(b, [[432, 950], [454, 956], [476, 952]], 5, 0.5),
    ],
    { ao: 0.35 },
  )
  return { lower: [legs], over: [waistband(tone, mat, 406, 15)], hem: 966 }
}

function pleated(fabric: Fabric): { lower: Piece[]; over: Piece[]; hem: number } {
  const tone = FABRIC[fabric]
  const mat = matFor(fabric, 'pleated')
  const k: Knot[] = [[452, 402, 1], [440, 440], [420, 480], [404, 526], [405, 600], [414, 700], [426, 800], [438, 890], [444, 946, 1], [468, 950], [490, 947, 1], [489, 880], [487, 800], [490, 700], [495, 640], [500, 602, 1], [506, 640], [512, 700], [517, 800], [522, 880], [527, 948, 1], [552, 951], [575, 947, 1], [579, 880], [583, 800], [587, 700], [590, 610], [584, 530], [572, 470], [554, 404, 1]]
  const legs = make(
    k,
    tone,
    mat,
    (b) => [
      // Deep pleats from the waistband, softening into creases.
      Lo(b, [[462, 418], [458, 480], [452, 560], [448, 650]], 8, 1),
      H(b, [[466, 418], [463, 480], [458, 560], [455, 640]], 4, 1.1),
      Lo(b, [[482, 420], [479, 480], [476, 540]], 6, 0.8),
      Lo(b, [[540, 422], [544, 480], [548, 560], [552, 650]], 8, 1),
      H(b, [[536, 422], [540, 480], [544, 560], [547, 640]], 4, 0.9),
      Lo(b, [[522, 422], [525, 480], [528, 540]], 6, 0.8),
      H(b, [[452, 640], [456, 780], [466, 946]], 5, 0.8),
      H(b, [[550, 640], [548, 780], [552, 948]], 5, 0.6),
      H(b, [[414, 540], [414, 660], [424, 800], [436, 940]], 12, 0.7),
      Lo(b, [[500, 660], [504, 800], [508, 948]], 10, 0.6),
    ],
    { ao: 0.3 },
  )
  return { lower: [legs], over: [waistband(tone, mat, 396, 20)], hem: 946 }
}

// ── Assembly ───────────────────────────────────────────────────────────────

export function dress(outfit: Outfit, view: View, pose: ArmPose): Dressed {
  if (outfit.kind === 'dress') {
    const cut: DressCut = outfit.cut
    switch (cut) {
      case 'column':
        return column(outfit.fabric, view)
      case 'slip':
        return slip(outfit.fabric, view)
      case 'wrap':
        return wrap(outfit.fabric, view, pose)
      case 'evening':
        return evening(outfit.fabric, view)
    }
  }
  const topCut: TopCut = outfit.top
  const t =
    topCut === 'blouse'
      ? blouse(outfit.topFabric, view, pose)
      : topCut === 'knit'
        ? knit(outfit.topFabric, view, pose)
        : topCut === 'bodysuit'
          ? bodysuit(outfit.topFabric, view)
          : draped(outfit.topFabric, view)
  const tr = outfit.trouser
  const b = tr === 'tailored' ? tailored(outfit.trouserFabric) : tr === 'pleated' ? pleated(outfit.trouserFabric) : wideLeg(outfit.trouserFabric, tr)
  // The draped top's tie hangs over the waistband: waistband first.
  return { upper: t.upper, lower: b.lower, over: [...b.over, ...t.over], sleeves: t.sleeves, bareArms: t.bareArms, hem: b.hem }
}
