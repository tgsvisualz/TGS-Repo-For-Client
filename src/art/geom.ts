/**
 * Small geometry kit for the placeholder art: smooth splines through knots, ribbons along a
 * centreline (limbs, folds, straps), garment "rows" and bounding boxes. Pure functions only.
 */

export type Pt = readonly [number, number]
/** A spline knot: x, y and an optional corner flag (1 = the curve breaks sharply here). */
export type Knot = readonly [number, number] | readonly [number, number, number]
/** A centreline point with a width: x, y, w. */
export type CPt = readonly [number, number, number]
/** A garment row: at height y the piece spans xl..xr. Rows are sorted by y. */
export type Row = readonly [number, number, number]

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)
export const smooth = (t: number): number => t * t * (3 - 2 * t)

export function fmt(n: number): string {
  const v = Math.round(n * 10) / 10
  return v === 0 ? '0' : String(v)
}

/** Whole units: for soft features (folds, sheen) where a tenth of a unit is never seen. */
const fmt0 = (n: number): string => String(Math.round(n))

/** Catmull-Rom spline through knots, as cubic Béziers. `coarse` rounds to whole units. */
export function spline(pts: readonly Knot[], closed = false, tension = 1, coarse = false): string {
  const n = pts.length
  if (n === 0) return ''
  const f = coarse ? fmt0 : fmt
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  if (n === 1) return d
  const at = (i: number): Knot => (closed ? pts[((i % n) + n) % n] : pts[i < 0 ? 0 : i > n - 1 ? n - 1 : i])
  const k = tension / 6
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const p1 = at(i)
    const p2 = at(i + 1)
    const p0 = p1[2] ? p1 : at(i - 1)
    const p3 = p2[2] ? p2 : at(i + 2)
    d +=
      `C${f(p1[0] + (p2[0] - p0[0]) * k)} ${f(p1[1] + (p2[1] - p0[1]) * k)} ` +
      `${f(p2[0] - (p3[0] - p1[0]) * k)} ${f(p2[1] - (p3[1] - p1[1]) * k)} ${f(p2[0])} ${f(p2[1])}`
  }
  return closed ? d + 'Z' : d
}

/** Polygon with rounded corners (radius per corner or one for all). */
export function rounded(pts: readonly Pt[], r: number | readonly number[]): string {
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n]
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    const rad = typeof r === 'number' ? r : r[i] ?? 0
    const l1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]) || 1
    const l2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]) || 1
    const r1 = Math.min(rad, l1 / 2)
    const r2 = Math.min(rad, l2 / 2)
    const a: Pt = [cur[0] + ((prev[0] - cur[0]) / l1) * r1, cur[1] + ((prev[1] - cur[1]) / l1) * r1]
    const b: Pt = [cur[0] + ((next[0] - cur[0]) / l2) * r2, cur[1] + ((next[1] - cur[1]) / l2) * r2]
    d += `${i ? 'L' : 'M'}${fmt(a[0])} ${fmt(a[1])}Q${fmt(cur[0])} ${fmt(cur[1])} ${fmt(b[0])} ${fmt(b[1])}`
  }
  return d + 'Z'
}

/**
 * A closed outline around a centreline with a width per point. Zero width at an end gives a
 * point (folds); a cap length gives a rounded end (limbs, straps).
 */
export function ribbon(c: readonly CPt[], capStart = 0, capEnd = 0, coarse = false): string {
  const n = c.length
  const left: Knot[] = []
  const right: Knot[] = []
  const tan: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)]
    const b = c[Math.min(n - 1, i + 1)]
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    tx /= len
    ty /= len
    tan.push([tx, ty])
    const h = c[i][2] / 2
    left.push([c[i][0] - ty * h, c[i][1] + tx * h])
    right.push([c[i][0] + ty * h, c[i][1] - tx * h])
  }
  const pts: Knot[] = []
  const startPoint = c[0][2] < 0.05
  const endPoint = c[n - 1][2] < 0.05
  pts.push(...left)
  if (capEnd > 0 && !endPoint) {
    const e = c[n - 1]
    const t = tan[n - 1]
    pts.push([e[0] + t[0] * capEnd, e[1] + t[1] * capEnd])
  }
  const back = right.slice().reverse()
  if (endPoint) back.shift()
  if (startPoint) back.pop()
  pts.push(...back)
  if (capStart > 0 && !startPoint) {
    const s = c[0]
    const t = tan[0]
    pts.push([s[0] - t[0] * capStart, s[1] - t[1] * capStart])
  }
  return spline(pts, true, 1, coarse)
}

/** Left and right edge of a row set at height y (linear between rows, clamped at the ends). */
export function rowAt(rows: readonly Row[], y: number): [number, number] {
  if (y <= rows[0][0]) return [rows[0][1], rows[0][2]]
  for (let i = 1; i < rows.length; i++) {
    const b = rows[i]
    if (y <= b[0]) {
      const a = rows[i - 1]
      const t = (y - a[0]) / (b[0] - a[0] || 1)
      return [lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
    }
  }
  const z = rows[rows.length - 1]
  return [z[1], z[2]]
}

/** x at fraction u across the rows at height y. */
export function across(rows: readonly Row[], y: number, u: number): number {
  const [l, r] = rowAt(rows, y)
  return lerp(l, r, u)
}

export interface FoldOpts {
  /** Sideways wander of the fold line. */
  wig?: number
  phase?: number
  /** 'spindle' tapers at both ends; 'flare' starts thin and stays wide to the end (hem flutes). */
  shape?: 'spindle' | 'flare'
  steps?: number
}

/** A fold ribbon that follows a row set from (u0, y0) to (u1, y1). */
export function foldOn(rows: readonly Row[], u0: number, u1: number, y0: number, y1: number, w: number, o: FoldOpts = {}): string {
  const steps = o.steps ?? 5
  const wig = o.wig ?? 0
  const phase = o.phase ?? 0
  const c: CPt[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = lerp(y0, y1, t)
    const x = across(rows, y, lerp(u0, u1, smooth(t))) + Math.sin(t * Math.PI * 1.6 + phase) * wig
    const prof = o.shape === 'flare' ? Math.min(1, Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5)) : Math.pow(Math.sin(Math.PI * t), 0.7)
    c.push([x, y, w * prof])
  }
  return ribbon(c, 0, 0, true)
}

/** A free fold ribbon along given points (spindle profile). */
export function fold(pts: readonly Pt[], w: number, shape: 'spindle' | 'flare' = 'spindle'): string {
  const n = pts.length
  const c: CPt[] = pts.map((p, i) => {
    const t = n === 1 ? 0 : i / (n - 1)
    const prof = shape === 'flare' ? Math.min(1, Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5)) : Math.pow(Math.sin(Math.PI * t), 0.7)
    return [p[0], p[1], w * prof]
  })
  return ribbon(c, 0, 0, true)
}

/** Closed outline of a row set: left side down, the hem knots (left to right), right side up. */
export function rowsOutline(rows: readonly Row[], hem: readonly Knot[], top?: readonly Knot[]): Knot[] {
  const left: Knot[] = rows.map((r) => [r[1], r[0]] as const)
  const right: Knot[] = rows.map((r) => [r[2], r[0]] as const).reverse()
  return [...(top ?? []), ...left, ...hem, ...right]
}

export function boxOf(pts: readonly (Knot | Pt | CPt)[], pad = 0): Box {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of pts) {
    if (p[0] < x0) x0 = p[0]
    if (p[0] > x1) x1 = p[0]
    if (p[1] < y0) y0 = p[1]
    if (p[1] > y1) y1 = p[1]
  }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }
}

/** Bounding box of a centreline ribbon, including its widths. */
export function boxOfC(c: readonly CPt[], pad = 0): Box {
  return boxOf(
    c.flatMap((p) => [
      [p[0] - p[2] / 2, p[1] - p[2] / 2] as const,
      [p[0] + p[2] / 2, p[1] + p[2] / 2] as const,
    ]),
    pad,
  )
}

export function union(...boxes: readonly Box[]): Box {
  const x0 = Math.min(...boxes.map((b) => b.x))
  const y0 = Math.min(...boxes.map((b) => b.y))
  const x1 = Math.max(...boxes.map((b) => b.x + b.w))
  const y1 = Math.max(...boxes.map((b) => b.y + b.h))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Ellipse as a path (four cubic arcs), optionally rotated (degrees, clockwise). */
export function ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0): string {
  const k = 0.5523
  const a = (rot * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const P = (x: number, y: number): string => `${fmt(cx + x * cos - y * sin)} ${fmt(cy + x * sin + y * cos)}`
  return (
    `M${P(rx, 0)}` +
    `C${P(rx, ry * k)} ${P(rx * k, ry)} ${P(0, ry)}` +
    `C${P(-rx * k, ry)} ${P(-rx, ry * k)} ${P(-rx, 0)}` +
    `C${P(-rx, -ry * k)} ${P(-rx * k, -ry)} ${P(0, -ry)}` +
    `C${P(rx * k, -ry)} ${P(rx, -ry * k)} ${P(rx, 0)}Z`
  )
}

/** FNV-1a 32-bit. */
export function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
