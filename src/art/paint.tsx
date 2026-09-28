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

export class Paint {
  readonly defs: ReactElement[] = []
  private cache = new Map<string, string>()
  private n = 0

  constructor(readonly uid: string) {}

  id(tag: string): string {
    return `${this.uid}${tag}${(this.n++).toString(36)}`
  }

  private stops(stops: readonly Stop[]): ReactElement[] {
    return stops.map(([o, c, a], i) => <stop key={i} offset={o3(o)} stopColor={c} stopOpacity={a === undefined ? undefined : o3(a)} />)
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
    const key = `L${bbox ? 'b' : 'u'}${[x1, y1, x2, y2].map(fmt).join(',')}|${stops.map((s) => s.join(':')).join(';')}`
    return this.memo(
      key,
      (id) => (
        <linearGradient
          key={id}
          id={id}
          gradientUnits={bbox ? 'objectBoundingBox' : 'userSpaceOnUse'}
          x1={bbox ? x1 : fmt(x1)}
          y1={bbox ? y1 : fmt(y1)}
          x2={bbox ? x2 : fmt(x2)}
          y2={bbox ? y2 : fmt(y2)}
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
    const hit = this.cache.get('S' + d)
    if (hit) return JSON.parse(hit) as { href: string; clip: string }
    const pid = this.id('p')
    const cid = this.id('c')
    this.defs.push(<path key={pid} id={pid} d={d} />)
    this.defs.push(
      <clipPath key={cid} id={cid}>
        <use href={`#${pid}`} />
      </clipPath>,
    )
    const out = { href: `#${pid}`, clip: `url(#${cid})` }
    this.cache.set('S' + d, JSON.stringify(out))
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
  silk: { term: 0.46, keyW: 9, keyA: 0.3, rimW: 2.2, rimA: 0.7, softW: 12, softA: 0.2, hi: 0.85, lo: 0.75 },
  satin: { term: 0.5, keyW: 12, keyA: 0.38, rimW: 2.4, rimA: 0.8, softW: 14, softA: 0.24, hi: 1, lo: 0.7 },
  velvet: { term: 0.4, keyW: 20, keyA: 0.16, rimW: 4, rimA: 0.42, softW: 26, softA: 0.34, hi: 0.42, lo: 0.85 },
  wool: { term: 0.48, keyW: 12, keyA: 0.16, rimW: 2, rimA: 0.45, softW: 10, softA: 0.14, hi: 0.4, lo: 0.65 },
  knit: { term: 0.5, keyW: 12, keyA: 0.14, rimW: 2, rimA: 0.4, softW: 10, softA: 0.14, hi: 0.32, lo: 0.55 },
  leather: { term: 0.5, keyW: 5, keyA: 0.45, rimW: 1.8, rimA: 0.85, softW: 9, softA: 0.2, hi: 0.95, lo: 0.6 },
  suede: { term: 0.44, keyW: 16, keyA: 0.16, rimW: 3, rimA: 0.4, softW: 18, softA: 0.26, hi: 0.35, lo: 0.6 },
  skin: { term: 0.56, keyW: 7, keyA: 0.32, rimW: 1.6, rimA: 0.6, softW: 7, softA: 0.22, hi: 0.5, lo: 0.5 },
  hair: { term: 0.5, keyW: 5, keyA: 0.25, rimW: 1.6, rimA: 0.55, softW: 7, softA: 0.2, hi: 0.8, lo: 0.6 },
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
}

function rectOf(b: Box, pad = 4): { x: string; y: string; width: string; height: string } {
  return { x: fmt(b.x - pad), y: fmt(b.y - pad), width: fmt(b.w + pad * 2), height: fmt(b.h + pad * 2) }
}

function mirrorStops(stops: readonly Stop[]): Stop[] {
  return stops.map(([o, c, a]) => [1 - o, c, a] as Stop).reverse()
}

/** Gradient running across the form in the light's direction. */
export function acrossLight(p: Paint, stops: readonly Stop[], b: Box, L: LightDir): string {
  const x0 = b.x
  const x1 = b.x + b.w
  if (L === 'right') return p.linear(mirrorStops(stops), x0, 0, x1, 0)
  if (L === 'left') return p.linear(stops, x0, 0, x1, 0)
  return p.linear(stops, 0, b.y, 0, b.y + b.h)
}

/** Render a lit piece. */
export function piece(p: Paint, pc: Piece, L: LightDir, key?: Key): ReactElement {
  const m = MAT[pc.mat]
  const t = pc.tone
  const b = pc.box
  const s = p.shape(pc.d)
  const x0 = b.x
  const x1 = b.x + b.w
  const y0 = b.y
  const y1 = b.y + b.h
  const kids: ReactNode[] = []
  const rimK = pc.rim ?? 1
  const keyK = pc.key ?? 1

  let base: string
  if (L === 'left' || L === 'right') {
    const st: Stop[] = [
      [0, t.lit],
      [m.term * 0.42, t.lit],
      [m.term, t.base],
      [Math.min(0.96, m.term + 0.3), t.deep],
      [1, t.deep],
    ]
    base = acrossLight(p, st, b, L)
    // The key is high: light falls off down the figure.
    kids.push(<rect key="v" {...rectOf(b)} fill={p.linear([[0, t.deep, 0], [0.45, t.deep, 0], [1, t.deep, 0.55]], 0, y0, 0, y1)} />)
  } else if (L === 'top') {
    base = p.linear([[0, t.lit], [0.22, t.base], [0.62, t.deep], [1, t.deep]], 0, y0, 0, y1)
    kids.push(
      <rect key="e" {...rectOf(b)} fill={p.linear([[0, t.deep, 0.85], [0.3, t.deep, 0], [0.7, t.deep, 0], [1, t.deep, 0.85]], x0, 0, x1, 0)} />,
    )
  } else {
    base = p.linear([[0, t.base], [0.25, t.deep], [1, t.deep]], 0, y0, 0, y1)
  }

  if (pc.folds?.length) {
    const hiG = p.linear([[0, t.sheen, 0], [0.22, t.sheen, 1], [0.7, t.sheen, 0.75], [1, t.sheen, 0]], 0, 0, 0, 1, true)
    const loG = p.linear([[0, t.deep, 0], [0.25, t.deep, 1], [0.8, t.deep, 0.8], [1, t.deep, 0.3]], 0, 0, 0, 1, true)
    pc.folds.forEach((f, i) => {
      const a = (f.a ?? 1) * (f.hi ? m.hi * lightAt(f.u, L) : m.lo * (L === 'back' ? 0.4 : 1))
      if (a > 0.02) kids.push(<path key={`f${i}`} d={f.d} fill={f.hi ? hiG : loG} opacity={o3(Math.min(1, a))} />)
    })
  }
  if (pc.extra) kids.push(<g key="x">{pc.extra}</g>)
  if (pc.ao) kids.push(<rect key="ao" {...rectOf(b)} fill={p.linear([[0, STAGE.shadow, 0], [0.55, STAGE.shadow, 0], [1, STAGE.shadow, pc.ao]], 0, y0, 0, y1)} />)
  if (pc.aoTop) kids.push(<rect key="at" {...rectOf(b)} fill={p.linear([[0, STAGE.shadow, pc.aoTop], [0.3, STAGE.shadow, 0]], 0, y0, 0, y1)} />)

  // Key-side glow: the lit edge rolls off softly, following the silhouette.
  if (keyK > 0 && L !== 'back') {
    const g =
      L === 'top'
        ? p.linear([[0, t.sheen, 1], [0.18, t.sheen, 0.25], [0.4, t.sheen, 0]], 0, y0, 0, y1)
        : acrossLight(p, [[0, t.sheen, 1], [0.28, t.sheen, 0.2], [0.55, t.sheen, 0]], b, L)
    kids.push(<use key="k" href={s.href} fill="none" stroke={g} strokeWidth={m.keyW * 2} opacity={o3(m.keyA * keyK)} />)
  }
  // Rim light on the far edge: a crisp line plus a soft spill.
  if (rimK > 0) {
    let g: string
    if (L === 'top') g = p.linear([[0, t.rim, 1], [0.12, t.rim, 0.5], [0.4, t.rim, 0.12], [1, t.rim, 0]], 0, y0, 0, y1)
    else if (L === 'back') g = p.linear([[0, t.rim, 1], [0.2, t.rim, 0.05], [0.8, t.rim, 0.05], [1, t.rim, 1]], x0, 0, x1, 0)
    else g = acrossLight(p, [[0, t.rim, 0], [0.55, t.rim, 0], [0.86, t.rim, 0.55], [1, t.rim, 1]], b, L)
    const boost = L === 'back' ? 1.35 : 1
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
