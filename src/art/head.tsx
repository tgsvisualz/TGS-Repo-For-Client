/**
 * Head, hair and veil. The face is NEVER drawn: the head is a smooth oval under the veil and
 * the three models differ only by the hair silhouette beneath it (A: close-coiled high bun,
 * B: sleek low bun, C: soft wavy chignon) and the skin tone seen through the sheer fabric.
 */
import type { ReactElement, ReactNode } from 'react'
import type { ModelId, VeilTone } from '../data/types'
import { HEAD, headBox, headPath } from './body'
import { boxOf, clamp, ellipse, fmt, fold, foldOn, lerp, spline, type Box, type Knot, type Row } from './geom'
import { HAIR, SKIN, VEIL, type VeilInk } from './palette'
import { acrossLight, lightAt, piece, type LightDir, type Paint } from './paint'

// ── Head ───────────────────────────────────────────────────────────────────

export function head(p: Paint, model: ModelId, L: LightDir): ReactElement {
  return piece(p, { d: headPath(), box: headBox(), tone: SKIN[model], mat: 'skin', aoTop: 0.25 }, L, 'head')
}

// ── Hair ───────────────────────────────────────────────────────────────────

function coils(p: Paint, cx: number, cy: number, rx: number, ry: number, color: string, seed: number): ReactNode {
  // Close coils: tiny arcs scattered over the bun, strongest on the lit half.
  let d = ''
  let s = seed
  for (let i = 0; i < 26; i++) {
    s = (s * 9301 + 49297) % 233280
    const a = (s / 233280) * Math.PI * 2
    s = (s * 9301 + 49297) % 233280
    const r = Math.sqrt(s / 233280) * 0.85
    const x = cx + Math.cos(a) * rx * r
    const y = cy + Math.sin(a) * ry * r
    const k = 2.2 + (i % 3)
    d += `M${fmt(x - k)} ${fmt(y)}a${fmt(k)} ${fmt(k * 0.8)} 0 0 1 ${fmt(k * 2)} 0`
  }
  void p
  return <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
}

/** Hair that sits behind the head and neck (low buns, chignon), front view. */
export function hairBehind(p: Paint, model: ModelId, L: LightDir): ReactElement | null {
  const t = HAIR[model]
  if (model === 'B') {
    return piece(p, { d: ellipse(473, 160, 17, 13, -12), box: { x: 454, y: 145, w: 38, h: 30 }, tone: t, mat: 'hair' }, L, 'hb')
  }
  if (model === 'C') {
    const d = ellipse(469, 164, 24, 17, -16) + ellipse(537, 168, 15, 11, 12)
    return piece(p, { d, box: { x: 443, y: 145, w: 112, h: 38 }, tone: t, mat: 'hair' }, L, 'hb')
  }
  return null
}

/** Hair over the head, front view. */
export function hairFront(p: Paint, model: ModelId, L: LightDir): ReactElement {
  const t = HAIR[model]
  if (model === 'A') {
    const cap: Knot[] = [
      [467, 112],
      [469, 85],
      [485, 66],
      [507, 59],
      [527, 64],
      [541, 82],
      [543, 108],
      [535, 97],
      [522, 83],
      [505, 77],
      [488, 83],
      [476, 99],
    ]
    const bun = ellipse(509, 40, 25, 21, 4)
    return (
      <g key="hair">
        {piece(p, { d: spline(cap, true), box: boxOf(cap, 2), tone: t, mat: 'hair' }, L, 'cap')}
        {piece(
          p,
          {
            d: bun,
            box: { x: 482, y: 17, w: 54, h: 46 },
            tone: t,
            mat: 'hair',
            extra: coils(p, 509, 40, 22, 18, t.sheen, 7),
            folds: [{ d: fold([[492, 30], [505, 22], [522, 26]], 6), u: 0.3, hi: true, a: 0.7 }],
          },
          L,
          'bun',
        )}
      </g>
    )
  }
  if (model === 'B') {
    const cap: Knot[] = [
      [466, 144],
      [464, 106],
      [472, 78],
      [488, 62],
      [507, 57],
      [526, 62],
      [540, 78],
      [545, 106],
      [542, 144],
      [535, 128],
      [531, 100],
      [520, 84],
      [505, 78],
      [489, 84],
      [479, 102],
      [474, 132],
    ]
    return piece(
      p,
      {
        d: spline(cap, true),
        box: boxOf(cap, 2),
        tone: t,
        mat: 'hair',
        folds: [
          { d: fold([[471, 104], [479, 80], [497, 65], [520, 64], [536, 78]], 7), u: 0.3, hi: true, a: 1 },
          { d: fold([[468, 132], [470, 108], [476, 90]], 4), u: 0.1, hi: true, a: 0.6 },
          { d: fold([[541, 130], [540, 104], [534, 86]], 4), u: 0.9, hi: true, a: 0.6 },
        ],
      },
      L,
      'hair',
    )
  }
  const hair: Knot[] = [
    [461, 154],
    [457, 124],
    [461, 93],
    [473, 70],
    [491, 58],
    [510, 55],
    [529, 60],
    [543, 76],
    [550, 100],
    [547, 128],
    [549, 154],
    [541, 161],
    [537, 140],
    [535, 110],
    [525, 88],
    [507, 80],
    [491, 86],
    [479, 104],
    [475, 134],
    [471, 160],
  ]
  return piece(
    p,
    {
      d: spline(hair, true),
      box: boxOf(hair, 2),
      tone: t,
      mat: 'hair',
      folds: [
        { d: fold([[468, 150], [462, 128], [468, 106], [478, 86], [494, 70]], 6), u: 0.15, hi: true, a: 1 },
        { d: fold([[474, 124], [470, 104], [480, 84]], 4), u: 0.2, hi: true, a: 0.7 },
        { d: fold([[500, 64], [516, 62], [532, 70]], 5), u: 0.5, hi: true, a: 0.8 },
        { d: fold([[542, 150], [546, 126], [540, 102], [532, 84]], 5), u: 0.85, hi: true, a: 0.8 },
      ],
    },
    L,
    'hair',
  )
}

/** Hair seen from behind (the whole back of the head plus the bun or chignon). */
export function hairRear(p: Paint, model: ModelId, L: LightDir): ReactElement {
  const t = HAIR[model]
  const skull = ellipse(HEAD.cx, HEAD.cy - 2, HEAD.rx + 2, HEAD.ry + 1, HEAD.rot)
  const box: Box = { x: HEAD.cx - 42, y: HEAD.cy - 58, w: 84, h: 112 }
  if (model === 'A') {
    return (
      <g key="hair">
        {piece(p, { d: skull, box, tone: t, mat: 'hair', folds: [{ d: fold([[478, 80], [492, 66], [512, 62]], 6), u: 0.3, hi: true, a: 0.6 }] }, L, 'sk')}
        {piece(p, { d: ellipse(509, 40, 25, 21, 4), box: { x: 482, y: 17, w: 54, h: 46 }, tone: t, mat: 'hair', extra: coils(p, 509, 40, 22, 18, t.sheen, 11) }, L, 'bun')}
      </g>
    )
  }
  if (model === 'B') {
    const lines = [
      fold([[474, 86], [484, 120], [496, 148]], 4),
      fold([[500, 64], [502, 110], [503, 146]], 4),
      fold([[532, 86], [522, 120], [510, 148]], 4),
    ]
    return (
      <g key="hair">
        {piece(p, { d: skull, box, tone: t, mat: 'hair', folds: lines.map((d, i) => ({ d, u: 0.2 + i * 0.3, hi: true, a: 0.8 })) }, L, 'sk')}
        {piece(p, { d: ellipse(503, 153, 23, 16, 0), box: { x: 478, y: 135, w: 50, h: 36 }, tone: t, mat: 'hair', folds: [{ d: fold([[486, 150], [500, 142], [516, 146]], 5), u: 0.3, hi: true }] }, L, 'bun')}
      </g>
    )
  }
  const waves = [
    fold([[470, 84], [462, 106], [470, 128], [482, 146]], 5),
    fold([[494, 62], [488, 90], [496, 116], [492, 140]], 5),
    fold([[530, 76], [536, 102], [528, 126], [520, 146]], 5),
  ]
  return (
    <g key="hair">
      {piece(p, { d: ellipse(HEAD.cx, HEAD.cy, HEAD.rx + 7, HEAD.ry + 4, HEAD.rot), box: { x: 458, y: 55, w: 92, h: 116 }, tone: t, mat: 'hair', folds: waves.map((d, i) => ({ d, u: 0.2 + i * 0.3, hi: true })) }, L, 'sk')}
      {piece(
        p,
        {
          d: ellipse(503, 156, 31, 21, 0),
          box: { x: 470, y: 133, w: 66, h: 46 },
          tone: t,
          mat: 'hair',
          folds: [
            { d: fold([[478, 154], [492, 142], [512, 140], [528, 150]], 6), u: 0.3, hi: true },
            { d: fold([[484, 166], [502, 172], [522, 166]], 4), u: 0.5, hi: true, a: 0.6 },
          ],
        },
        L,
        'chig',
      )}
    </g>
  )
}

// ── Veil ───────────────────────────────────────────────────────────────────

/** Half-width of the veiled head silhouette, from the crown down to the chin. */
const PROFILE: Record<ModelId, readonly (readonly [number, number])[]> = {
  A: [
    [14, 0],
    [19, 14],
    [28, 24],
    [40, 28.5],
    [53, 26],
    [62, 31],
    [76, 38.5],
    [96, 42],
    [124, 43],
    [154, 43.5],
  ],
  B: [
    [51, 0],
    [55, 17],
    [64, 30],
    [78, 38],
    [100, 42],
    [128, 43],
    [156, 44],
  ],
  C: [
    [49, 0],
    [53, 19],
    [62, 33],
    [76, 42],
    [100, 48],
    [128, 50],
    [156, 50.5],
  ],
}

/** Front layer: falls over the face and rests on the shoulders, to the bust. */
const DRAPE_FRONT: readonly (readonly [number, number])[] = [
  [184, 53],
  [206, 66],
  [226, 86],
  [244, 99],
  [290, 105],
  [350, 108],
  [398, 106],
]
/** Back layer: behind the body, widening past the shoulders to the hip. */
const DRAPE_BACK: readonly (readonly [number, number])[] = [
  [184, 58],
  [208, 80],
  [230, 108],
  [262, 124],
  [322, 136],
  [400, 145],
  [470, 149],
  [520, 146],
]
/** Seen from behind: one long layer trailing down the back. */
const DRAPE_REAR: readonly (readonly [number, number])[] = [
  [184, 55],
  [208, 72],
  [230, 100],
  [262, 118],
  [330, 132],
  [420, 143],
  [510, 150],
  [590, 146],
]

export type VeilLayer = 'front' | 'back' | 'rear'

export interface VeilOpts {
  model: ModelId
  tone: VeilTone
  light: LightDir
  layer: VeilLayer
  /** Sideways drift of the hem, in figure units (deterministic per spec). */
  sway: number
}

export const VEIL_STYLE = { transformBox: 'fill-box', transformOrigin: '50% 0%' } as const

function veilRows(o: VeilOpts): { rows: Row[]; hem: Knot[]; top: number; bottom: number; centre: (y: number) => number } {
  const prof = PROFILE[o.model]
  const drape = o.layer === 'front' ? DRAPE_FRONT : o.layer === 'back' ? DRAPE_BACK : DRAPE_REAR
  const crownX = o.model === 'A' ? 509 : 506
  const centre = (y: number): number => {
    const t = clamp((y - 60) / 180, 0, 1)
    const base = lerp(crownX, 500, t)
    const k = Math.max(0, (y - 190) / 360)
    return base + o.sway * Math.pow(k, 1.5)
  }
  // The back layer is a touch wider at the head: it falls behind the crown.
  const grow = o.layer === 'back' ? 3 : 0
  const rows: Row[] = [...prof, ...drape].map(([y, hw]) => {
    const c = centre(y)
    const w = hw > 0 ? hw + grow : 0
    return [y, c - w, c + w] as const
  })
  const last = rows[rows.length - 1]
  const yL = last[0]
  const depth = o.layer === 'front' ? 50 : o.layer === 'back' ? 74 : 96
  const c = centre(yL + depth)
  const hw = (last[2] - last[1]) / 2
  const hem: Knot[] = [
    [c - hw * 0.93, yL + depth * 0.3],
    [c - hw * 0.66, yL + depth * 0.68],
    [c - hw * 0.28, yL + depth * 0.92],
    [c + hw * 0.08, yL + depth],
    [c + hw * 0.45, yL + depth * 0.86],
    [c + hw * 0.78, yL + depth * 0.58],
    [c + hw * 0.96, yL + depth * 0.24],
  ]
  return { rows, hem, top: rows[0][0], bottom: yL + depth, centre }
}

export function veilExtent(model: ModelId, layer: VeilLayer, sway: number): Box {
  const v = veilRows({ model, tone: 'ivory', light: 'left', layer, sway })
  const pts: Knot[] = [...v.rows.flatMap((r) => [[r[1], r[0]] as const, [r[2], r[0]] as const]), ...v.hem]
  return boxOf(pts)
}

export function veil(p: Paint, o: VeilOpts): ReactElement {
  const ink: VeilInk = VEIL[o.tone]
  const { rows, hem, top, bottom, centre } = veilRows(o)
  const apex = rows[0]
  const outline: Knot[] = [
    [apex[1], apex[0]],
    ...rows.slice(1).map((r) => [r[1], r[0]] as const),
    ...hem,
    ...rows
      .slice(1)
      .reverse()
      .map((r) => [r[2], r[0]] as const),
  ]
  const d = spline(outline, true)
  const s = p.shape(d)
  const box = boxOf(outline)
  const L = o.light
  const H = bottom - top
  const a = ink.alpha * (o.layer === 'back' ? 0.78 : 1)
  const back = L === 'back'

  // Sheer body: dense where it doubles over the crown, thinning and dissolving at the hem.
  const body = p.linear(
    [
      [0, ink.color, a],
      [0.22, ink.color, a * 0.9],
      [0.5, ink.color, a * 0.7],
      [0.78, ink.color, a * 0.42],
      [0.93, ink.color, a * 0.14],
      [1, ink.color, 0],
    ],
    0,
    top,
    0,
    bottom,
  )
  const kids: ReactNode[] = []

  // Light: the key side glows, the far side falls into shadow.
  if (!back) {
    const kx = L === 'left' ? box.x + box.w * 0.18 : L === 'right' ? box.x + box.w * 0.82 : centre(top + 60)
    const ky = L === 'top' ? top + 40 : top + H * 0.3
    kids.push(
      <rect
        key="kl"
        x={fmt(box.x - 5)}
        y={fmt(top - 5)}
        width={fmt(box.w + 10)}
        height={fmt(H + 10)}
        fill={p.radial([[0, ink.hi, ink.hiA * 1.1], [0.45, ink.hi, ink.hiA * 0.45], [1, ink.hi, 0]], kx, ky, box.w * 0.62, H * 0.62)}
      />,
    )
    if (o.tone !== 'tulle') {
      kids.push(
        <rect
          key="sh"
          x={fmt(box.x - 5)}
          y={fmt(top - 5)}
          width={fmt(box.w + 10)}
          height={fmt(H + 10)}
          fill={
            L === 'top'
              ? p.linear([[0, ink.lo, 0], [0.45, ink.lo, 0.1], [1, ink.lo, 0.45]], 0, top, 0, bottom)
              : acrossLight(p, [[0, ink.lo, 0], [0.45, ink.lo, 0.08], [0.8, ink.lo, 0.42], [1, ink.lo, 0.55]], box, L)
          }
        />,
      )
    }
  }

  // Folds fall from under the head and spread toward the hem.
  const us = o.layer === 'front' ? [0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.92] : [0.06, 0.18, 0.3, 0.7, 0.82, 0.94]
  const y0 = o.layer === 'front' ? 176 : 200
  const hiG = p.linear([[0, ink.hi, 0], [0.25, ink.hi, 1], [0.7, ink.hi, 0.6], [1, ink.hi, 0]], 0, 0, 0, 1, true)
  const loG = p.linear([[0, ink.lo, 0], [0.3, ink.lo, 1], [1, ink.lo, 0]], 0, 0, 0, 1, true)
  us.forEach((u, i) => {
    const hi = i % 2 === 0
    const u1 = 0.5 + (u - 0.5) * 1.12
    const w = (hi ? 13 : 16) + ((i * 7) % 5) * 2
    const fd = foldOn(rows, u, u1, y0 + (i % 3) * 14, bottom + 6, w, { wig: 3, phase: i, shape: 'flare' })
    const k = hi ? ink.hiA * 1.25 * (back ? 0.5 : lightAt(u, L)) : 0.32
    kids.push(<path key={`f${i}`} d={fd} fill={hi ? hiG : loG} opacity={fmt(clamp(k, 0, 1))} />)
  })

  // Highlight where the fabric rounds over the crown.
  if (o.layer !== 'back' && !back) {
    const prof = PROFILE[o.model]
    const yTop = prof[0][0]
    const pts: [number, number][] = []
    if (L === 'top') {
      const c = centre(yTop + 20)
      const w1 = prof[3][1]
      pts.push([c - w1 * 0.8, yTop + 26], [c - w1 * 0.35, yTop + 9], [c + 2, yTop + 5], [c + w1 * 0.4, yTop + 10], [c + w1 * 0.8, yTop + 26])
    } else {
      const sgn = L === 'left' ? -1 : 1
      for (const [y, hw] of prof.slice(1)) {
        pts.push([centre(y) + sgn * Math.max(0, hw - 7), y])
      }
    }
    const kd = fold(pts, 11)
    kids.push(<path key="dome" d={kd} fill={hiG} opacity={fmt(clamp(ink.hiA * 1.7, 0, 1))} />)
  }

  // Denser at the silhouette, where the sheer fabric folds away from the eye.
  const edgeA = back ? 1 : 0.8
  const edge = p.linear([[0, ink.color, a * 0.75 * edgeA], [0.6, ink.color, a * 0.5 * edgeA], [0.9, ink.color, a * 0.15], [1, ink.color, 0]], 0, top, 0, bottom)
  kids.push(<use key="ed" href={s.href} fill="none" stroke={edge} strokeWidth="22" />)
  // A fine lit edge (both edges when backlit).
  const lit =
    back || L === 'top'
      ? p.linear([[0, ink.hi, 0.9], [0.25, ink.hi, 0.15], [0.75, ink.hi, 0.15], [1, ink.hi, 0.9]], box.x, 0, box.x + box.w, 0)
      : acrossLight(p, [[0, ink.hi, 0.9], [0.3, ink.hi, 0.2], [0.7, ink.hi, 0.05], [1, ink.hi, 0.3]], box, L)
  kids.push(<use key="le" href={s.href} fill="none" stroke={lit} strokeWidth="3" opacity={fmt(clamp((back ? 0.95 : 0.6) * (o.tone === 'tulle' ? 0.55 : 1), 0, 1))} />)
  if (back) {
    kids.push(<use key="bg" href={s.href} fill="none" stroke={lit} strokeWidth="16" opacity={fmt(o.tone === 'tulle' ? 0.14 : 0.28)} />)
  }

  return (
    <g key={`veil-${o.layer}`} data-part="veil" style={VEIL_STYLE}>
      <use href={s.href} fill={body} />
      <g clipPath={s.clip}>{kids}</g>
    </g>
  )
}
