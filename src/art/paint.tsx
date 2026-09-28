/**
 * Paint: collects <defs> (gradients, shapes, clips, masks) under one per-instance id prefix and
 * renders "pieces": a shape lit like low-key photography. A piece gets a base gradient across
 * its form (key side lit, terminator, deep shadow), fold highlights and creases clipped inside
 * it, a soft key-side glow and a rim light on the far edge. No outlines, no flat fills.
 */
import type { Key, ReactElement, ReactNode } from 'react'
import { fmt, type Box } from './geom'
import { STAGE, type Tone } from './palette'

/** Key-light direction inside a drawing ('back' = backlit, used by the trio). */
export type LightDir = 'left' | 'right' | 'top' | 'back'
export type Stop = readonly [number, string, number?]
export type Mat = 'silk' | 'satin' | 'velvet' | 'wool' | 'knit' | 'leather' | 'suede' | 'skin' | 'hair' | 'metal'

const o3 = (n: number): string => String(Math.round(n * 1000) / 1000)
const o2 = (n: number): string => String(Math.round(n * 100) / 100)

/** #RRGGBB + opacity → #RRGGBBAA (opacity 1 keeps the short form). */
function withAlpha(c: string, a?: number): string {
  if (a === undefined || a >= 0.998 || c.length !== 7) return c
  const v = Math.max(0, Math.min(255, Math.round(a * 255)))
  return c + v.toString(16).padStart(2, '0').toUpperCase()
}

export class Paint {
  readonly defs: ReactElement[] = []
  private cache = new Map<string, string>()
  private shapes = new Map<string, { href: string; clip: string }>()
  private n = 0

  constructor(readonly uid: string) {}

  id(tag: string): string {
    return `${this.uid}${tag}${(this.n++).toString(36)}`
  }

  private stops(stops: readonly Stop[]): ReactElement[] {
    // Colour and opacity in one 8-digit hex: half the markup of stop-color + stop-opacity.
    return stops.map(([o, c, a], i) => <stop key={i} offset={o2(o)} stopColor={withAlpha(c, a)} />)
  }

  private memo(key: string, make: (id: string) => ReactElement, tag: string): string {
    const hit = this.cache.get(key)
    if (hit) return hit
    const id = this.id(tag)
    this.defs.push(make(id))
    const url = `url(#${id})`
    this.cache.set(key, url)
    return url
  }

  /** Linear gradient in user space (or the object's bounding box when bbox = true). */
  linear(stops: readonly Stop[], x1: number, y1: number, x2: number, y2: number, bbox = false): string {
    const key = `L${bbox ? 'b' : 'u'}${[x1, y1, x2, y2].map(bbox ? o3 : fmt).join(',')}|${stops.map((s) => s.join(':')).join(';')}`
    return this.memo(
      key,
      (id) => (
        <linearGradient
          key={id}
          id={id}
          gradientUnits={bbox ? 'objectBoundingBox' : 'userSpaceOnUse'}
          x1={bbox ? o3(x1) : fmt(x1)}
          y1={bbox ? o3(y1) : fmt(y1)}
          x2={bbox ? o3(x2) : fmt(x2)}
          y2={bbox ? o3(y2) : fmt(y2)}
        >
          {this.stops(stops)}
        </linearGradient>
      ),
      'l',
    )
  }

  /** Elliptical radial gradient in user space. */
  radial(stops: readonly Stop[], cx: number, cy: number, rx: number, ry = rx, rot = 0): string {
    const key = `R${[cx, cy, rx, ry, rot].map(fmt).join(',')}|${stops.map((s) => s.join(':')).join(';')}`
    return this.memo(
      key,
      (id) => (
        <radialGradient
          key={id}
          id={id}
          gradientUnits="userSpaceOnUse"
          cx="0"
          cy="0"
          r="1"
          gradientTransform={`translate(${fmt(cx)} ${fmt(cy)})${rot ? ` rotate(${fmt(rot)})` : ''} scale(${fmt(rx)} ${fmt(ry)})`}
        >
          {this.stops(stops)}
        </radialGradient>
      ),
      'r',
    )
  }

  /** Registers a path once; returns an href for <use> and a clip-path url. */
  shape(d: string): { href: string; clip: string } {
    const hit = this.shapes.get(d)
    if (hit) return hit
    const pid = this.id('p')
    const cid = this.id('c')
    this.defs.push(<path key={pid} id={pid} d={d} />)
    this.defs.push(
      <clipPath key={cid} id={cid}>
        <use href={`#${pid}`} />
      </clipPath>,
    )
    const out = { href: `#${pid}`, clip: `url(#${cid})` }
    this.shapes.set(d, out)
    return out
  }

  /** A luminance mask covering `box`, painted by `fill`. */
  mask(box: Box, fill: string): string {
    const id = this.id('m')
    this.defs.push(
      <mask key={id} id={id} maskUnits="userSpaceOnUse" x={fmt(box.x)} y={fmt(box.y)} width={fmt(box.w)} height={fmt(box.h)}>
        <rect x={fmt(box.x)} y={fmt(box.y)} width={fmt(box.w)} height={fmt(box.h)} fill={fill} />
      </mask>,
    )
    return `url(#${id})`
  }
}

// ── Materials ───────────────────────────────────────────────────────────────

interface MatSpec {
  /** Where the terminator falls across the form (0 = key edge, 1 = far edge). */
  term: number
  /** Key-side edge glow: width and strength. */
  keyW: number
  keyA: number
  /** Rim light on the far edge: crisp line + soft glow. */
  rimW: number
  rimA: number
  softW: number
  softA: number
  /** Fold highlight / crease strength. */
  hi: number
  lo: number
}

const MAT: Record<Mat, MatSpec> = {
  silk: { term: 0.4, keyW: 12, keyA: 0.26, rimW: 2, rimA: 0.62, softW: 11, softA: 0.2, hi: 0.9, lo: 0.75 },
  satin: { term: 0.44, keyW: 14, keyA: 0.3, rimW: 2.2, rimA: 0.7, softW: 13, softA: 0.22, hi: 1, lo: 0.7 },
  velvet: { term: 0.34, keyW: 20, keyA: 0.2, rimW: 4, rimA: 0.4, softW: 24, softA: 0.34, hi: 0.45, lo: 0.85 },
  wool: { term: 0.4, keyW: 13, keyA: 0.3, rimW: 1.8, rimA: 0.42, softW: 10, softA: 0.14, hi: 0.45, lo: 0.65 },
  knit: { term: 0.42, keyW: 12, keyA: 0.18, rimW: 1.8, rimA: 0.38, softW: 10, softA: 0.14, hi: 0.36, lo: 0.55 },
  leather: { term: 0.42, keyW: 5, keyA: 0.36, rimW: 1.5, rimA: 0.62, softW: 8, softA: 0.14, hi: 0.95, lo: 0.6 },
  suede: { term: 0.4, keyW: 16, keyA: 0.18, rimW: 3, rimA: 0.36, softW: 18, softA: 0.24, hi: 0.4, lo: 0.6 },
  skin: { term: 0.4, keyW: 7, keyA: 0.36, rimW: 1.3, rimA: 0.36, softW: 6, softA: 0.14, hi: 0.55, lo: 0.5 },
  hair: { term: 0.42, keyW: 5, keyA: 0.25, rimW: 1.4, rimA: 0.5, softW: 7, softA: 0.18, hi: 0.8, lo: 0.6 },
  metal: { term: 0.5, keyW: 3, keyA: 0.6, rimW: 1.2, rimA: 0.9, softW: 4, softA: 0.3, hi: 1, lo: 0.7 },
}

/** How much key light reaches a fold at fraction u across a piece (canonical space). */
export function lightAt(u: number, L: LightDir): number {
  switch (L) {
    case 'left':
      return 0.14 + 0.86 * Math.pow(1 - u, 1.35)
    case 'right':
      return 0.14 + 0.86 * Math.pow(u, 1.35)
    case 'top':
      return 0.45 + 0.55 * (1 - Math.abs(2 * u - 1))
    case 'back':
      return 0.1 + 0.25 * Math.pow(Math.abs(2 * u - 1), 3)
  }
}

export interface Fold {
  d: string
  /** Position across the piece (0 = left edge, 1 = right edge), for lighting. */
  u: number
  /** Highlight (sheen) or crease (shadow). */
  hi: boolean
  /** Strength multiplier. */
  a?: number
}

export interface Piece {
  d: string
  box: Box
  tone: Tone
  mat: Mat
  folds?: readonly Fold[]
  /** Drawn inside the clip after the folds (rib lines, creases, seams). */
  extra?: ReactNode
  /** Rim-light and key-glow multipliers (0 turns them off). */
  rim?: number
  key?: number
  /** Darkening toward the bottom of the piece (floor occlusion). */
  ao?: number
  /** Darkening toward the top (under the veil, under a chin). */
  aoTop?: number
  /** Overall shadow over the piece (occluded, turned away from the key). */
  dim?: number
}

function rectOf(b: Box, pad = 4): { x: string; y: string; width: string; height: string } {
  return { x: fmt(b.x - pad), y: fmt(b.y - pad), width: fmt(b.w + pad * 2), height: fmt(b.h + pad * 2) }
}

function mirrorStops(stops: readonly Stop[]): Stop[] {
  return stops.map(([o, c, a]) => [1 - o, c, a] as Stop).reverse()
}

/** Gradient running across the form in the light's direction (user space over box b). */
export function acrossLight(p: Paint, stops: readonly Stop[], b: Box, L: LightDir): string {
  const x0 = b.x
  const x1 = b.x + b.w
  if (L === 'right') return p.linear(mirrorStops(stops), x0, 0, x1, 0)
  if (L === 'left') return p.linear(stops, x0, 0, x1, 0)
  return p.linear(stops, 0, b.y, 0, b.y + b.h)
}

/** The same, in the painted object's bounding box: shared by every piece with equal stops. */
function acrossBox(p: Paint, stops: readonly Stop[], L: LightDir): string {
  if (L === 'right') return p.linear(mirrorStops(stops), 0, 0, 1, 0, true)
  if (L === 'left') return p.linear(stops, 0, 0, 1, 0, true)
  return p.linear(stops, 0, 0, 0, 1, true)
}
const VERT = [0, 0, 0, 1] as const
const HORZ = [0, 0, 1, 0] as const

/**
 * Edge light that follows the key: the rim (far side) is strongest high on the form and dies
 * away toward the hem; the key-side glow is strongest high on the near side. Tilted gradient
 * vectors do this in one paint, so bottoms of forms dissolve into the dark (lost edges).
 */
function edgeGrad(p: Paint, stops: readonly Stop[], b: Box, L: 'left' | 'right', rim: boolean): string {
  // In bounding-box units; the tilt is quantised so similar pieces share one gradient.
  const tilt = Math.round(Math.min(0.9, Math.max(0.1, (0.3 * b.w) / (b.h || 1))) * 10) / 10
  const xa = L === 'left' ? 0 : 1
  const xb = 1 - xa
  const s = rim ? 1 : -1
  return p.linear(stops, xa, 0.5 + tilt * s, xb, 0.5 - tilt * s, true)
}

/** Render a lit piece. */
export function piece(p: Paint, pc: Piece, L: LightDir, key?: Key): ReactElement {
  const m = MAT[pc.mat]
  const t = pc.tone
  const b = pc.box
  const s = p.shape(pc.d)
  const kids: ReactNode[] = []
  const rimK = pc.rim ?? 1
  const keyK = pc.key ?? 1

  let base: string
  if (L === 'left' || L === 'right') {
    // Low key: a narrow band of light on the near side, then the form turns into shadow.
    const st: Stop[] = [
      [0, t.lit],
      [m.term * 0.3, t.lit],
      [m.term, t.base],
      [Math.min(0.95, m.term + 0.26), t.deep],
      [1, t.deep],
    ]
    base = acrossBox(p, st, L)
    // The key is high: light falls off down the figure.
    kids.push(<rect key="v" {...rectOf(b)} fill={p.linear([[0, t.deep, 0], [0.4, t.deep, 0.05], [1, t.deep, 0.6]], ...VERT, true)} />)
  } else if (L === 'top') {
    base = p.linear([[0, t.lit], [0.14, t.lit], [0.36, t.base], [0.7, t.deep], [1, t.deep]], ...VERT, true)
    kids.push(<rect key="e" {...rectOf(b)} fill={p.linear([[0, t.deep, 0.9], [0.32, t.deep, 0], [0.68, t.deep, 0], [1, t.deep, 0.9]], ...HORZ, true)} />)
  } else {
    base = p.linear([[0, t.base, 1], [0.08, t.deep], [1, t.deep]], ...VERT, true)
  }

  if (pc.folds?.length) {
    const hiG = p.linear([[0, t.sheen, 0], [0.22, t.sheen, 1], [0.7, t.sheen, 0.75], [1, t.sheen, 0]], 0, 0, 0, 1, true)
    const loG = p.linear([[0, t.deep, 0], [0.25, t.deep, 1], [0.8, t.deep, 0.8], [1, t.deep, 0.3]], 0, 0, 0, 1, true)
    const halo = pc.mat === 'silk' || pc.mat === 'satin' || pc.mat === 'velvet' || pc.mat === 'suede'
    const hw = pc.mat === 'velvet' || pc.mat === 'suede' ? 14 : 7
    pc.folds.forEach((f, i) => {
      const a = (f.a ?? 1) * (f.hi ? (L === 'back' ? 0 : m.hi * lightAt(f.u, L)) : m.lo * (L === 'back' ? 0.4 : 1))
      if (a <= 0.02) return
      if (f.hi && halo) {
        // A soft halo around the sheen band: silk light blooms, it is not a drawn line.
        kids.push(<path key={`f${i}`} d={f.d} fill={hiG} stroke={hiG} strokeWidth={hw} strokeOpacity="0.28" strokeLinejoin="round" opacity={o3(Math.min(1, a))} />)
      } else {
        kids.push(<path key={`f${i}`} d={f.d} fill={f.hi ? hiG : loG} opacity={o3(Math.min(1, a))} />)
      }
    })
  }
  if (pc.extra) kids.push(<g key="x">{pc.extra}</g>)
  if (pc.ao) kids.push(<rect key="ao" {...rectOf(b)} fill={p.linear([[0, STAGE.shadow, 0], [0.55, STAGE.shadow, 0], [1, STAGE.shadow, pc.ao]], ...VERT, true)} />)
  if (pc.aoTop) kids.push(<rect key="at" {...rectOf(b)} fill={p.linear([[0, STAGE.shadow, pc.aoTop], [0.3, STAGE.shadow, 0]], ...VERT, true)} />)
  if (pc.dim) kids.push(<rect key="dim" {...rectOf(b)} fill={STAGE.shadow} opacity={o3(pc.dim)} />)

  // Key-side glow: the lit edge rolls off softly, following the silhouette.
  if (keyK > 0 && L !== 'back') {
    const g =
      L === 'top'
        ? p.linear([[0, t.sheen, 1], [0.16, t.sheen, 0.25], [0.36, t.sheen, 0]], ...VERT, true)
        : edgeGrad(p, [[0, t.sheen, 1], [0.24, t.sheen, 0.3], [0.5, t.sheen, 0]], b, L, false)
    kids.push(<use key="k" href={s.href} fill="none" stroke={g} strokeWidth={m.keyW * 2} opacity={o3(m.keyA * keyK)} />)
  }
  // Rim light on the far edge: a crisp line plus a soft spill, dying away down the form.
  if (rimK > 0) {
    let g: string
    if (L === 'top') g = p.linear([[0, t.rim, 1], [0.1, t.rim, 0.45], [0.3, t.rim, 0.08], [0.6, t.rim, 0]], ...VERT, true)
    else if (L === 'back') g = p.linear([[0, t.rim, 1], [0.16, t.rim, 0.05], [0.84, t.rim, 0.05], [1, t.rim, 1]], ...HORZ, true)
    else g = edgeGrad(p, [[0, t.rim, 0], [0.6, t.rim, 0], [0.86, t.rim, 0.5], [1, t.rim, 1]], b, L, true)
    const boost = L === 'back' ? (pc.mat === 'skin' ? 0.8 : 1.5) : 1
    kids.push(<use key="r2" href={s.href} fill="none" stroke={g} strokeWidth={m.softW * 2} opacity={o3(Math.min(1, m.softA * rimK * boost))} />)
    kids.push(<use key="r1" href={s.href} fill="none" stroke={g} strokeWidth={m.rimW * 2} opacity={o3(Math.min(1, m.rimA * rimK * boost))} />)
  }

  return (
    <g key={key}>
      <use href={s.href} fill={base} />
      <g clipPath={s.clip}>{kids}</g>
    </g>
  )
}
