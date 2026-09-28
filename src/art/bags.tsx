/**
 * Bags and purses, drawn in local space: origin at the bottom centre of the bag, y up is
 * negative, about 300 units wide at scale 1. The same builders serve the still life (on a
 * plinth, strap arranged) and the figures (carried; straps drawn by the figure).
 */
import type { ReactElement, ReactNode } from 'react'
import type { BagShape, Fabric } from '../data/types'
import { boxOf, boxOfC, clamp, ellipse, fmt, fold, ribbon, rounded, spline, type Box, type CPt, type Knot, type Pt } from './geom'
import { FABRIC, METAL, STAGE, type Tone } from './palette'
import { piece, type Fold, type LightDir, type Mat, type Paint } from './paint'

export type BagMode = 'still' | 'carry'

export interface BagDraw {
  node: ReactElement
  /** Bounds in local space (unscaled). */
  box: Box
  /** Where a hand holds it (local). */
  grip: Pt
  /** Strap attachment points (local), for straps the figure draws. */
  attach: readonly [Pt, Pt]
}

export function bagMat(shape: BagShape, fabric: Fabric): Mat {
  if (fabric === 'garnet') return 'velvet'
  if (fabric === 'champagne') return 'satin'
  if (fabric === 'smoke' && shape === 'pouch') return 'suede'
  if (shape === 'evening' && fabric === 'noir') return 'satin'
  return 'leather'
}

/** Product-shot scale: evens out the visual size of very different shapes. */
export const STILL_SCALE: Record<BagShape, number> = {
  'top-handle': 1.02,
  shoulder: 0.94,
  tote: 0.98,
  crossbody: 1.18,
  clutch: 0.92,
  mini: 1.22,
  evening: 1.28,
  pouch: 1.16,
}

/** Scale when carried by a figure (figure units: a 28 cm bag is ~160 units). */
export const CARRY_SCALE: Record<BagShape, number> = {
  'top-handle': 0.5,
  shoulder: 0.52,
  tote: 0.6,
  crossbody: 0.46,
  clutch: 0.44,
  mini: 0.5,
  evening: 0.5,
  pouch: 0.48,
}

const uOf = (b: Box, pts: readonly Pt[]): number => clamp((pts.reduce((s, p) => s + p[0], 0) / pts.length - b.x) / (b.w || 1), 0, 1)
const hi = (b: Box, pts: readonly Pt[], w: number, a = 1): Fold => ({ d: fold(pts, w), u: uOf(b, pts), hi: true, a })
const lo = (b: Box, pts: readonly Pt[], w: number, a = 1): Fold => ({ d: fold(pts, w), u: uOf(b, pts), hi: false, a })

/** Darker tone for the side of a bag turned away from the light. */
function sideTone(t: Tone): Tone {
  return { deep: t.deep, base: t.deep, lit: t.base, sheen: t.lit, rim: t.sheen }
}

function metalBits(p: Paint, L: LightDir, key: string, d: string, box: Box, glint?: Pt): ReactNode {
  return (
    <g key={key}>
      {piece(p, { d, box, tone: METAL, mat: 'metal' }, L)}
      {glint && <ellipse cx={fmt(glint[0])} cy={fmt(glint[1])} rx="2.6" ry="2" fill={STAGE.key} opacity="0.9" />}
    </g>
  )
}

function chainPath(p: Paint, pts: readonly Pt[], key: string, width = 3.4): ReactNode {
  const d = spline(pts)
  return (
    <g key={key} fill="none" strokeLinecap="round">
      <path d={d} stroke={METAL.base} strokeWidth={fmt(width)} strokeDasharray={`${fmt(width * 1.5)} ${fmt(width * 0.9)}`} />
      <path d={d} stroke={p.linear([[0, METAL.sheen, 0.9], [0.5, METAL.lit, 0.5], [1, METAL.sheen, 0.2]], 0, 0, 1, 0, true)} strokeWidth={fmt(width * 0.45)} strokeDasharray={`${fmt(width * 0.8)} ${fmt(width * 1.6)}`} />
    </g>
  )
}

function strap(p: Paint, c: readonly CPt[], tone: Tone, mat: Mat, L: LightDir, key: string, rim = 0.8): ReactElement {
  return piece(p, { d: ribbon(c, 2, 2), box: boxOfC(c, 2), tone, mat, rim, folds: [] }, L, key)
}

function arch(x0: number, x1: number, y: number, h: number, w: number, lean = 0): CPt[] {
  const c: CPt[] = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const a = Math.PI * t
    c.push([x0 + (x1 - x0) * (1 - Math.cos(a)) * 0.5 + Math.sin(a) * lean, y - Math.sin(a) * h, w])
  }
  return c
}

/** Gusset: the sliver of side panel that gives a bag its depth, on the side away from the key. */
function gusset(L: LightDir, bottom: Pt, top: Pt, depth: number): Pt[] {
  const s = L === 'right' ? -1 : 1
  return [
    [bottom[0] * s, bottom[1]],
    [bottom[0] * s + depth * s, bottom[1] - 5],
    [top[0] * s + depth * 0.8 * s, top[1] + 3],
    [top[0] * s, top[1]],
  ]
}

export function bag(p: Paint, shape: BagShape, fabric: Fabric, L: LightDir, mode: BagMode): BagDraw {
  const t = FABRIC[fabric]
  const mat = bagMat(shape, fabric)
  const leather = mat === 'leather'
  const edge = leather ? 1 : 0.6
  const k: ReactNode[] = []
  const still = mode === 'still'
  const gSide = L === 'right' ? -1 : 1

  switch (shape) {
    case 'top-handle': {
      const handle = arch(-72, 72, -196, 124, 13)
      k.push(strap(p, handle, t, mat, L, 'h'))
      k.push(<path key="hh" d={fold(handle.slice(1, 5).map(([x, y]) => [x + 2, y + 2] as const), 4)} fill={t.sheen} opacity="0.55" />)
      const g = gusset(L, [150, 0], [122, -200], 12)
      k.push(piece(p, { d: spline(g.map((q) => [q[0], q[1], 1] as const), true), box: boxOf(g), tone: sideTone(t), mat, rim: 0.4, key: 0 }, L, 'g'))
      const bodyPts: Pt[] = [[-150, 0], [150, 0], [122, -200], [-122, -200]]
      const bb = boxOf(bodyPts)
      k.push(
        piece(
          p,
          {
            d: rounded(bodyPts, [16, 16, 9, 9]),
            box: bb,
            tone: t,
            mat,
            folds: [hi(bb, [[-140, -12], [0, -8], [140, -12]], 5, 0.5 * edge), lo(bb, [[-60, -90], [0, -60], [60, -90]], 30, 0.3)],
          },
          L,
          'b',
        ),
      )
      const flap: Knot[] = [[-127, -203, 1], [127, -203, 1], [133, -160], [119, -126], [62, -110], [0, -106], [-62, -110], [-119, -126], [-133, -160]]
      const fb = boxOf(flap)
      k.push(
        piece(
          p,
          {
            d: spline(flap, true),
            box: fb,
            tone: t,
            mat,
            ao: 0.2,
            folds: [
              hi(fb, [[-120, -198], [0, -200], [120, -198]], 6, 0.9 * edge),
              hi(fb, [[-116, -128], [-60, -112], [0, -108], [60, -112], [116, -128]], 5, 0.9 * edge),
              lo(fb, [[-110, -122], [-60, -104], [0, -100], [60, -104], [110, -122]], 7, 0.8),
            ],
          },
          L,
          'f',
        ),
      )
      k.push(metalBits(p, L, 'cl', rounded([[-15, -116], [15, -116], [15, -95], [-15, -95]], 5), { x: -15, y: -116, w: 30, h: 21 }, [-6 * gSide, -110]))
      return { node: <g>{k}</g>, box: { x: -164, y: -330, w: 328, h: 332 }, grip: [0, -316], attach: [[-72, -196], [72, -196]] }
    }

    case 'shoulder': {
      if (still) {
        const s: CPt[] = [[-160, -150, 9], [-156, -250, 9], [-122, -366, 9], [-60, -428, 9], [0, -440, 9], [60, -428, 9], [122, -366, 9], [156, -250, 9], [160, -150, 9]]
        k.push(strap(p, s, t, mat, L, 's'))
      }
      const body: Knot[] = [
        [-174, -158, 1],
        [-122, -127],
        [-60, -114],
        [0, -110],
        [60, -114],
        [122, -127],
        [174, -158, 1],
        [168, -100],
        [144, -46],
        [92, -10],
        [0, 3],
        [-92, -10],
        [-144, -46],
        [-168, -100],
      ]
      const bb = boxOf(body)
      k.push(
        piece(
          p,
          {
            d: spline(body, true),
            box: bb,
            tone: t,
            mat,
            ao: 0.25,
            folds: [
              hi(bb, [[-150, -128], [-110, -80], [-50, -34], [0, -14]], 14, 0.9),
              lo(bb, [[-80, -112], [-56, -66], [-14, -24]], 16, 0.7),
              hi(bb, [[20, -108], [40, -64], [70, -26]], 10, 0.6),
              lo(bb, [[130, -128], [110, -80], [70, -30]], 14, 0.7),
              hi(bb, [[-150, -150], [-60, -118], [0, -114], [60, -118], [150, -150]], 5, 0.8 * edge),
            ],
          },
          L,
          'b',
        ),
      )
      k.push(metalBits(p, L, 'r1', ellipse(-166, -156, 7, 7), { x: -173, y: -163, w: 14, h: 14 }, [-168, -159]))
      k.push(metalBits(p, L, 'r2', ellipse(166, -156, 7, 7), { x: 159, y: -163, w: 14, h: 14 }, [164, -159]))
      return { node: <g>{k}</g>, box: { x: -180, y: still ? -448 : -166, w: 360, h: still ? 452 : 170 }, grip: [0, -440], attach: [[-166, -156], [166, -156]] }
    }

    case 'tote': {
      const back = arch(-68, 68, -300, 108, 15)
      k.push(strap(p, back, sideTone(t), mat, L, 'hb', 0.5))
      const rimBack: Knot[] = [[-128, -290, 1], [-126, -303, 1], [126, -303, 1], [128, -290, 1]]
      k.push(piece(p, { d: spline(rimBack, true), box: boxOf(rimBack), tone: sideTone(t), mat, rim: 0.3 }, L, 'rb'))
      k.push(<path key="in" d={spline([[-122, -291, 1], [-120, -299, 1], [120, -299, 1], [122, -291, 1]], true)} fill={STAGE.shadow} opacity="0.9" />)
      const g = gusset(L, [140, 0], [128, -290], 18)
      k.push(piece(p, { d: spline(g.map((q) => [q[0], q[1], 1] as const), true), box: boxOf(g), tone: sideTone(t), mat, rim: 0.4, key: 0 }, L, 'g'))
      const bodyPts: Pt[] = [[-140, 0], [140, 0], [128, -290], [-128, -290]]
      const bb = boxOf(bodyPts)
      k.push(
        piece(
          p,
          {
            d: rounded(bodyPts, [10, 10, 5, 5]),
            box: bb,
            tone: t,
            mat,
            ao: 0.3,
            folds: [
              hi(bb, [[-124, -288], [0, -290], [124, -288]], 5, 0.9 * edge),
              hi(bb, [[-100, -280], [-104, -150], [-110, -20]], 16, 0.5),
              lo(bb, [[-10, -270], [-6, -150], [0, -30]], 22, 0.35),
              hi(bb, [[60, -270], [66, -150], [72, -30]], 12, 0.3),
              hi(bb, [[-134, -10], [0, -6], [134, -10]], 4, 0.6 * edge),
            ],
          },
          L,
          'b',
        ),
      )
      const front = arch(-62, 62, -286, 104, 15)
      k.push(strap(p, front, t, mat, L, 'hf'))
      k.push(<path key="hfh" d={fold(front.slice(1, 5).map(([x, y]) => [x + 2, y + 3] as const), 4)} fill={t.sheen} opacity="0.5" />)
      for (const x of [-62, 62]) {
        const tab: Pt[] = [[x - 11, -300], [x + 11, -300], [x + 11, -266], [x - 11, -266]]
        k.push(piece(p, { d: rounded(tab, 3), box: boxOf(tab), tone: t, mat, rim: 0.6 }, L, `t${x}`))
      }
      return { node: <g>{k}</g>, box: { x: -160, y: -404, w: 320, h: 406 }, grip: [0, -392], attach: [[-62, -286], [62, -286]] }
    }

    case 'crossbody': {
      if (still) {
        const r: CPt[] = [[102, -140, 6], [132, -100, 6], [146, -40, 6], [164, 2, 6], [210, 12, 6], [270, 10, 6], [330, 16, 6]]
        const l: CPt[] = [[-102, -140, 6], [-128, -96, 6], [-140, -36, 6], [-160, 4, 6], [-210, 14, 6], [-262, 10, 6]]
        k.push(strap(p, l, t, mat, L, 'sl'))
        k.push(strap(p, r, t, mat, L, 'sr'))
      }
      const g = gusset(L, [110, 0], [106, -150], 12)
      k.push(piece(p, { d: spline(g.map((q) => [q[0], q[1], 1] as const), true), box: boxOf(g), tone: sideTone(t), mat, rim: 0.4, key: 0 }, L, 'g'))
      const bodyPts: Pt[] = [[-110, 0], [110, 0], [106, -150], [-106, -150]]
      const bb = boxOf(bodyPts)
      k.push(piece(p, { d: rounded(bodyPts, 12), box: bb, tone: t, mat, folds: [hi(bb, [[-100, -10], [0, -6], [100, -10]], 4, 0.6 * edge)] }, L, 'b'))
      const flap: Knot[] = [[-109, -152, 1], [109, -152, 1], [109, -84], [100, -66], [0, -61], [-100, -66], [-109, -84]]
      const fb = boxOf(flap)
      k.push(
        piece(
          p,
          {
            d: spline(flap, true),
            box: fb,
            tone: t,
            mat,
            folds: [
              hi(fb, [[-100, -148], [0, -150], [100, -148]], 5, 0.9 * edge),
              hi(fb, [[-98, -70], [0, -62], [98, -70]], 4, 0.9 * edge),
              lo(fb, [[-96, -64], [0, -57], [96, -64]], 6, 0.8),
            ],
          },
          L,
          'f',
        ),
      )
      k.push(metalBits(p, L, 'cl', rounded([[-18, -70], [18, -70], [18, -58], [-18, -58]], 3), { x: -18, y: -70, w: 36, h: 12 }, [-8 * gSide, -66]))
      return { node: <g>{k}</g>, box: still ? { x: -270, y: -160, w: 610, h: 180 } : { x: -122, y: -160, w: 244, h: 162 }, grip: [0, -150], attach: [[-104, -146], [104, -146]] }
    }

    case 'clutch': {
      const g = gusset(L, [180, 0], [178, -150], 10)
      k.push(piece(p, { d: spline(g.map((q) => [q[0], q[1], 1] as const), true), box: boxOf(g), tone: sideTone(t), mat, rim: 0.4, key: 0 }, L, 'g'))
      const bodyPts: Pt[] = [[-180, 0], [180, 0], [178, -150], [-178, -150]]
      const bb = boxOf(bodyPts)
      k.push(piece(p, { d: rounded(bodyPts, 10), box: bb, tone: t, mat, ao: 0.2, folds: [hi(bb, [[-170, -8], [0, -5], [170, -8]], 4, 0.5)] }, L, 'b'))
      const flap: Knot[] = [[-180, -152, 1], [180, -152, 1], [178, -136], [16, -63], [0, -58], [-16, -63], [-178, -136]]
      const fb = boxOf(flap)
      k.push(
        piece(
          p,
          {
            d: spline(flap, true),
            box: fb,
            tone: t,
            mat,
            folds: [
              hi(fb, [[-170, -134], [-90, -98], [-20, -66], [0, -61]], 6, 0.8),
              hi(fb, [[0, -61], [20, -66], [90, -98], [170, -134]], 6, 0.6),
              lo(fb, [[-168, -128], [-90, -92], [0, -54], [90, -92], [168, -128]], 9, 0.7),
              hi(fb, [[-170, -148], [0, -150], [170, -148]], 5, 0.5),
            ],
          },
          L,
          'f',
        ),
      )
      k.push(metalBits(p, L, 'cl', ellipse(0, -60, 7, 9), { x: -7, y: -69, w: 14, h: 18 }, [-3 * gSide, -64]))
      return { node: <g>{k}</g>, box: { x: -186, y: -156, w: 372, h: 158 }, grip: [-10, -118], attach: [[-178, -150], [178, -150]] }
    }

    case 'mini': {
      const s = arch(-48, 48, -168, 82, 9)
      k.push(strap(p, s, t, mat, L, 's'))
      const topFace: Knot[] = [[-90, -150, 1], [90, -150, 1], [83, -170, 1], [-83, -170, 1]]
      k.push(piece(p, { d: spline(topFace, true), box: boxOf(topFace), tone: { ...t, deep: t.base, base: t.lit }, mat, rim: 0.5 }, L, 'tf'))
      const g = gusset(L, [95, 0], [90, -150], 14)
      const g2: Pt[] = [...g.slice(0, 3), [g[2][0] - 6 * gSide, -168], g[3]]
      k.push(piece(p, { d: spline(g2.map((q) => [q[0], q[1], 1] as const), true), box: boxOf(g2), tone: sideTone(t), mat, rim: 0.4, key: 0 }, L, 'g'))
      const bodyPts: Pt[] = [[-95, 0], [95, 0], [90, -150], [-90, -150]]
      const bb = boxOf(bodyPts)
      k.push(
        piece(
          p,
          {
            d: rounded(bodyPts, [12, 12, 3, 3]),
            box: bb,
            tone: t,
            mat,
            folds: [
              hi(bb, [[-86, -118], [0, -114], [86, -118]], 4, 0.8),
              lo(bb, [[-86, -112], [0, -108], [86, -112]], 5, 0.6),
              hi(bb, [[-60, -140], [-66, -80], [-70, -10]], 22, 0.6),
              hi(bb, [[40, -140], [44, -80], [46, -10]], 10, 0.4),
            ],
          },
          L,
          'b',
        ),
      )
      k.push(metalBits(p, L, 'cl', rounded([[-9, -116], [9, -116], [9, -98], [-9, -98]], 4), { x: -9, y: -116, w: 18, h: 18 }, [-3 * gSide, -110]))
      return { node: <g>{k}</g>, box: { x: -110, y: -254, w: 220, h: 256 }, grip: [0, -246], attach: [[-48, -168], [48, -168]] }
    }

    case 'evening': {
      const grip: Pt = [0, -236]
      if (still) {
        k.push(chainPath(p, [[-86, -152], [-116, -108], [-134, -40], [-160, 2], [-214, 11], [-276, 6]], 'cl'))
        k.push(chainPath(p, [[86, -152], [110, -100], [128, -32], [156, 4], [222, 12], [262, 9]], 'cr'))
      } else {
        k.push(chainPath(p, [[-86, -152], [-50, -196], grip], 'cl', 2.6))
        k.push(chainPath(p, [[86, -152], [50, -196], grip], 'cr', 2.6))
      }
      const body: Knot[] = [[-89, -148, 1], [89, -148, 1], [102, -112], [106, -58], [88, -14], [40, -2], [0, 0], [-40, -2], [-88, -14], [-106, -58], [-102, -112]]
      const bb = boxOf(body)
      k.push(
        piece(
          p,
          {
            d: spline(body, true),
            box: bb,
            tone: t,
            mat,
            ao: 0.25,
            folds: [
              hi(bb, [[-70, -144], [-84, -90], [-70, -30]], 12, 1),
              lo(bb, [[-40, -144], [-46, -90], [-36, -20]], 12, 0.8),
              hi(bb, [[-8, -144], [-6, -80], [-2, -10]], 10, 0.7),
              lo(bb, [[28, -144], [34, -80], [30, -16]], 12, 0.8),
              hi(bb, [[62, -144], [74, -90], [62, -26]], 9, 0.6),
            ],
          },
          L,
          'b',
        ),
      )
      const frame: CPt[] = [[-94, -150, 8], [-50, -156, 8], [0, -158, 8], [50, -156, 8], [94, -150, 8]]
      k.push(metalBits(p, L, 'fr', ribbon(frame, 3, 3), boxOfC(frame), [-40 * gSide, -157]))
      k.push(metalBits(p, L, 'k1', ellipse(-6, -168, 6.5, 6.5), { x: -13, y: -175, w: 13, h: 13 }, [-8, -170]))
      k.push(metalBits(p, L, 'k2', ellipse(6, -168, 6.5, 6.5), { x: -1, y: -175, w: 13, h: 13 }, [4, -170]))
      return { node: <g>{k}</g>, box: still ? { x: -280, y: -178, w: 546, h: 192 } : { x: -110, y: -240, w: 220, h: 242 }, grip, attach: [[-86, -152], [86, -152]] }
    }

    case 'pouch': {
      const body: Knot[] = [
        [-50, -186, 1],
        [-72, -170],
        [-104, -124],
        [-113, -58],
        [-96, -15],
        [-50, 0],
        [0, 3],
        [50, 0],
        [96, -15],
        [113, -58],
        [104, -124],
        [72, -170],
        [50, -186, 1],
      ]
      const bb = boxOf(body)
      const rays: [Pt, Pt, boolean][] = [
        [[-40, -180], [-92, -40], true],
        [[-22, -182], [-50, -8], false],
        [[-4, -184], [2, -4], true],
        [[18, -182], [50, -8], false],
        [[38, -180], [92, -40], true],
      ]
      k.push(
        piece(
          p,
          {
            d: spline(body, true),
            box: bb,
            tone: t,
            mat,
            ao: 0.3,
            folds: rays.map(([a, b, h], i) => {
              const mid: Pt = [(a[0] + b[0]) / 2 + (i - 2) * 4, (a[1] + b[1]) / 2]
              return h ? hi(bb, [a, mid, b], 16, 0.9) : lo(bb, [a, mid, b], 18, 0.9)
            }),
          },
          L,
          'b',
        ),
      )
      const ruffle: Knot[] = [[-52, -184, 1], [-61, -206], [-50, -224], [-34, -234], [-18, -226], [-4, -238], [12, -228], [28, -238], [44, -226], [58, -210], [52, -184, 1]]
      const rb = boxOf(ruffle)
      k.push(
        piece(
          p,
          {
            d: spline(ruffle, true),
            box: rb,
            tone: t,
            mat,
            folds: [hi(rb, [[-40, -190], [-36, -222]], 6), lo(rb, [[-12, -190], [-10, -224]], 7), hi(rb, [[14, -190], [16, -226]], 6), lo(rb, [[40, -190], [42, -220]], 6)],
          },
          L,
          'r',
        ),
      )
      const cord: CPt[] = [[-56, -186, 6], [0, -190, 6], [56, -186, 6]]
      k.push(piece(p, { d: ribbon(cord, 3, 3), box: boxOfC(cord), tone: sideTone(t), mat, rim: 0.7 }, L, 'c'))
      const tail: CPt[] = [[44, -186, 3.2], [54, -150, 3.2], [58, -112, 3.2]]
      k.push(piece(p, { d: ribbon(tail, 1, 1), box: boxOfC(tail), tone: sideTone(t), mat, rim: 0.7 }, L, 'ct'))
      k.push(metalBits(p, L, 'bd', ellipse(58, -106, 5, 6.5), { x: 53, y: -113, w: 10, h: 13 }, [56, -109]))
      return { node: <g>{k}</g>, box: { x: -118, y: -242, w: 236, h: 246 }, grip: [0, -198], attach: [[-50, -186], [50, -186]] }
    }
  }
}
