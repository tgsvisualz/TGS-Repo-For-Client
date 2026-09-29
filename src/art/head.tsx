/**
 * Head, face, hair and veil. The face is quiet: shadowed eyes behind a masquerade mask, a hint
 * of nose and lips, all under the sheer veil. The three models differ by the hair silhouette
 * (A: close-coiled high bun, B: sleek low bun, C: soft wavy chignon), skin tone and mask metal.
 */
import type { ReactElement, ReactNode } from 'react'
import type { ModelId, VeilTone } from '../data/types'
import { HEAD, headBox, headPath } from './body'
import { boxOf, clamp, ellipse, fmt, fold, foldOn, lerp, spline, type Box, type Knot, type Row } from './geom'
import { HAIR, SKIN, VEIL, type VeilInk } from './palette'
import { acrossLight, lightAt, piece, type LightDir, type Paint } from './paint'

// ── Head ───────────────────────────────────────────────────────────────────

export function head(p: Paint, model: ModelId, L: LightDir): ReactElement {
  return piece(p, { d: headPath(), box: headBox(), tone: SKIN[model], mat: 'skin', aoTop: 0.3, dim: 0.28, rim: 0.5, key: 0.6 }, L, 'head')
}

// ── Face and mask (front view) ────────────────────────────────────────────

const LIPS: Record<ModelId, string> = { A: '#5A1C22', B: '#7E2328', C: '#8E262C' }
const MASK_METAL: Record<ModelId, string> = { A: '#C9A24A', B: '#D9D3C8', C: '#C9A24A' }

/** One side of the mask outline, from the crest to the bridge of the nose (s = -1 left, 1 right). */
function maskSide(s: number): string {
  const x = (dx: number) => fmt(503 + dx * s)
  return (
    `L${x(7)} 97 C${x(13)} 97 ${x(22)} 99 ${x(28)} 98 C${x(33)} 97 ${x(36)} 93 ${x(37)} 89 ` +
    `C${x(40)} 96 ${x(38)} 108 ${x(30)} 115 C${x(24)} 120 ${x(15)} 120 ${x(9)} 116 C${x(6)} 114 ${x(3)} 112.5 503 112.5`
  )
}

export function faceFront(model: ModelId): ReactElement {
  const metal = MASK_METAL[model]
  const outline = `M503 92 ${maskSide(-1)} M503 92 ${maskSide(1)}`
  // The filled shape: left side down to the bridge, then the right side back up to the crest.
  const x = (dx: number) => fmt(503 + dx)
  const fill =
    `M503 92 ${maskSide(-1)} ` +
    `C${x(3)} 112.5 ${x(6)} 114 ${x(9)} 116 C${x(15)} 120 ${x(24)} 120 ${x(30)} 115 C${x(38)} 108 ${x(40)} 96 ${x(37)} 89 ` +
    `C${x(36)} 93 ${x(33)} 97 ${x(28)} 98 C${x(22)} 99 ${x(13)} 97 ${x(7)} 97 Z`
  const eyes = `${ellipse(490, 107.5, 6.4, 3.3, -6)} ${ellipse(516, 107.5, 6.4, 3.3, 6)}`
  return (
    <g key="face" transform={`rotate(${HEAD.rot} ${HEAD.cx} ${HEAD.cy})`}>
      <path d={eyes} fill="#140E0C" opacity="0.9" />
      <path d="M503.5 111 Q501.5 122 500.5 128 Q503.5 131.5 507.5 129" fill="none" stroke={SKIN[model].deep} strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
      <path d="M496 140 Q500 137.4 503.5 139 Q507 137.4 511 140 Q503.5 141.8 496 140Z" fill={LIPS[model]} />
      <path d="M497 140.6 Q503.5 146.2 510 140.6 Q503.5 142.6 497 140.6Z" fill={LIPS[model]} opacity="0.92" />
      <path d={`${fill} ${eyes}`} fill="#0D0B0A" fillRule="evenodd" />
      <path d={outline} fill="none" stroke={metal} strokeWidth="1.3" strokeLinejoin="round" />
      <path d={eyes} fill="none" stroke={metal} strokeWidth="0.9" />
      <path d="M503 102 Q499 97 503 90 Q507 97 503 102Z" fill="none" stroke={metal} strokeWidth="0.9" />
      {[
        [503, 96],
        [488, 99],
        [518, 99],
        [474, 95],
        [532, 95],
      ].map(([cx, cy]) => (
        <circle key={`${cx}`} cx={cx} cy={cy} r="0.95" fill="#F4EFE6" />
      ))}
    </g>
  )
}

// ── Hair ───────────────────────────────────────────────────────────────────

function coils(cx: number, cy: number, rx: number, ry: number, color: string, seed: number): ReactNode {
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
  return <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
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
            extra: coils(509, 40, 22, 18, t.sheen, 7),
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
        {piece(p, { d: ellipse(509, 40, 25, 21, 4), box: { x: 482, y: 17, w: 54, h: 46 }, tone: t, mat: 'hair', extra: coils(509, 40, 22, 18, t.sheen, 11) }, L, 'bun')}
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

/** Front layer: falls over the face, rests on the shoulders and dissolves at the waist. */
const DRAPE_FRONT: readonly (readonly [number, number])[] = [
  [184, 51],
  [206, 62],
  [226, 84],
  [246, 102],
  [290, 108],
  [350, 110],
  [410, 109],
  [450, 106],
]
/** Back layer: behind the body, falling past the shoulders to the hip. */
const DRAPE_BACK: readonly (readonly [number, number])[] = [
  [184, 55],
  [208, 72],
  [230, 102],
  [262, 118],
  [322, 126],
  [400, 131],
  [470, 133],
  [530, 131],
]
/** Seen from behind: one long layer trailing down the back. */
const DRAPE_REAR: readonly (readonly [number, number])[] = [
  [184, 53],
  [208, 68],
  [230, 98],
  [262, 114],
  [330, 124],
  [420, 132],
  [510, 136],
  [600, 134],
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
  const depth = o.layer === 'front' ? 44 : o.layer === 'back' ? 64 : 90
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
  const back = L === 'back'
  const tulle = o.tone === 'tulle'
  // Backlit, the veil's face is in shadow: it thins to a haze and glows at its edges.
  const a = ink.alpha * (tulle ? 0.82 : 0.56) * (o.layer === 'back' ? 0.62 : o.layer === 'rear' ? 0.82 : 1) * (back ? (tulle ? 0.6 : 0.3) : 1)
  const col = ink.color

  // Sheer body: dense where it doubles over the crown, thinning, dissolving well before the hem.
  const body = p.linear(
    [
      [0, col, a * 0.95],
      [0.14, col, a],
      [0.34, col, a * 0.7],
      [0.56, col, a * 0.42],
      [0.76, col, a * 0.16],
      [0.9, col, a * 0.03],
      [1, col, 0],
    ],
    0,
    top,
    0,
    bottom,
  )
  const kids: ReactNode[] = []
  const full = { x: fmt(box.x - 6), y: fmt(top - 6), width: fmt(box.w + 12), height: fmt(H + 12) }

  // The fabric doubles over the head: a soft denser hood that also softens the head's edge.
  if (o.layer !== 'back') {
    const hy = o.layer === 'rear' ? 112 : 108
    const hx = centre(hy)
    const hr = PROFILE[o.model][PROFILE[o.model].length - 1][1] + 16
    kids.push(<rect key="hood" {...full} fill={p.radial([[0, col, a * 0.62], [0.5, col, a * 0.42], [1, col, 0]], hx, hy - 4, hr, 92)} />)
  }

  // Light: the key side glows, the far side falls into shadow.
  if (!back) {
    const kx = L === 'left' ? box.x + box.w * 0.2 : L === 'right' ? box.x + box.w * 0.8 : centre(top + 60)
    const ky = L === 'top' ? top + 30 : top + H * 0.26
    kids.push(<rect key="kl" {...full} fill={p.radial([[0, ink.hi, ink.hiA * 1.15], [0.4, ink.hi, ink.hiA * 0.5], [1, ink.hi, 0]], kx, ky, box.w * 0.6, H * 0.55)} />)
    if (!tulle) {
      kids.push(
        <rect
          key="sh"
          {...full}
          fill={
            L === 'top'
              ? p.linear([[0, ink.lo, 0], [0.4, ink.lo, 0.12], [1, ink.lo, 0.5]], 0, top, 0, bottom)
              : acrossLight(p, [[0, ink.lo, 0], [0.4, ink.lo, 0.1], [0.75, ink.lo, 0.45], [1, ink.lo, 0.6]], box, L)
          }
        />,
      )
    }
  } else {
    kids.push(<rect key="kl" {...full} fill={p.radial([[0, ink.hi, tulle ? 0.1 : 0.2], [1, ink.hi, 0]], centre(top + 90), top + 90, box.w * 0.5, H * 0.35)} />)
  }

  // Gathers: soft pleats radiating from the crown comb, fanning out toward the hem.
  const us = o.layer === 'back' ? [0.06, 0.2, 0.8, 0.94] : [0.1, 0.27, 0.41, 0.6, 0.76, 0.9]
  const hiG = p.linear([[0, ink.hi, 0], [0.18, ink.hi, 0.7], [0.45, ink.hi, 1], [0.8, ink.hi, 0.35], [1, ink.hi, 0]], 0, 0, 0, 1, true)
  const loG = p.linear([[0, ink.lo, 0], [0.25, ink.lo, 0.8], [0.6, ink.lo, 0.6], [1, ink.lo, 0]], 0, 0, 0, 1, true)
  const yStart = o.layer === 'back' ? 190 : top + 10
  us.forEach((u, i) => {
    const hi = i % 2 === 0
    const u0 = 0.5 + (u - 0.5) * (o.layer === 'back' ? 0.9 : 0.4)
    const w = (hi ? 16 : 24) + ((i * 7) % 5) * 3
    const fd = foldOn(rows, u0, u, yStart + (i % 3) * 8, bottom - 4, w, { wig: 2.5, phase: i * 1.3, shape: 'flare', steps: 6 })
    const k = hi ? ink.hiA * (back ? 0.3 : 0.55 * lightAt(u, L)) : tulle ? 0.24 : 0.14
    kids.push(<path key={`f${i}`} d={fd} fill={hi ? hiG : loG} opacity={fmt(clamp(k, 0, 1))} />)
  })

  // Where the fabric rounds over the crown it catches the key.
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
      for (const [y, hw] of prof.slice(1, -1)) pts.push([centre(y) + sgn * Math.max(0, hw - 8), y])
    }
    kids.push(<path key="dome" d={fold(pts, 12)} fill={hiG} opacity={fmt(clamp(ink.hiA * 1.5, 0, 1))} />)
  }

  // Denser toward the silhouette, where the sheer cloth turns away: soft, never a line.
  const edgeFade = (k: number): string =>
    p.linear([[0, col, a * k], [0.35, col, a * k * 0.7], [0.62, col, a * k * 0.2], [0.8, col, 0]], 0, top, 0, bottom)
  kids.push(<use key="e1" href={s.href} fill="none" stroke={edgeFade(0.3)} strokeWidth="60" />)
  if (back) {
    // Backlit sheer fabric glows at its silhouette.
    const glow = p.linear([[0, ink.hi, 0.9], [0.5, ink.hi, 0.5], [0.8, ink.hi, 0.12], [1, ink.hi, 0]], 0, top, 0, bottom)
    kids.push(<use key="g1" href={s.href} fill="none" stroke={glow} strokeWidth="16" opacity={fmt(tulle ? 0.16 : 0.3)} />)
    kids.push(<use key="g2" href={s.href} fill="none" stroke={glow} strokeWidth="4" opacity={fmt(tulle ? 0.4 : 0.7)} />)
  } else {
    // The rolled edge on the key side catches a thread of light high up.
    const lit =
      L === 'top'
        ? p.linear([[0, ink.hi, 0.8], [0.25, ink.hi, 0.2], [0.5, ink.hi, 0]], 0, top, 0, bottom)
        : p.linear(L === 'left' ? [[0, ink.hi, 0.7], [0.35, ink.hi, 0.1], [0.6, ink.hi, 0]] : [[0.4, ink.hi, 0], [0.65, ink.hi, 0.1], [1, ink.hi, 0.7]], box.x, top, box.x + box.w, top + H * 0.9)
    kids.push(<use key="le" href={s.href} fill="none" stroke={lit} strokeWidth="10" opacity={fmt(tulle ? 0.2 : 0.28)} />)
  }

  // Sheer cloth has no hard edge: fade the last few units of the silhouette via a mask.
  const mid = p.id('vm')
  p.defs.push(
    <mask key={mid} id={mid} maskUnits="userSpaceOnUse" x={fmt(box.x - 20)} y={fmt(top - 20)} width={fmt(box.w + 40)} height={fmt(H + 40)}>
      <use href={s.href} fill="#fff" />
      <g fill="none" stroke="#000">
        <use href={s.href} strokeWidth="34" strokeOpacity="0.16" />
        <use href={s.href} strokeWidth="22" strokeOpacity="0.2" />
        <use href={s.href} strokeWidth="13" strokeOpacity="0.26" />
        <use href={s.href} strokeWidth="6" strokeOpacity="0.36" />
      </g>
    </mask>,
  )
  return (
    <g key={`veil-${o.layer}`} data-part="veil" style={VEIL_STYLE}>
      <g mask={`url(#${mid})`}>
        <use href={s.href} fill={body} />
        <g clipPath={s.clip}>{kids}</g>
      </g>
    </g>
  )
}
