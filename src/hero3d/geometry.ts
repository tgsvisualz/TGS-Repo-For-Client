import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3, type Curve } from 'three'

/**
 * Geometry builders for the veiled figures: surfaces of revolution with per-vertex shaping
 * (pleats, veils that fall longer at the back) and swept tubes with a varying radius (arms,
 * straps, sleeves). Everything is generated once, in metres, with +z as the figure's front.
 */

export const TAU = Math.PI * 2

/** A profile point: [radius, height] in metres. */
export type ProfilePoint = readonly [r: number, y: number]

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export { smoothstep }

/** Piecewise-linear lookup over [x, value] knots (x ascending), clamped at both ends. */
export function knots(table: ReadonlyArray<readonly [number, number]>): (x: number) => number {
  return (x) => {
    if (x <= table[0][0]) return table[0][1]
    for (let i = 1; i < table.length; i++) {
      const [x1, v1] = table[i]
      if (x <= x1) {
        const [x0, v0] = table[i - 1]
        const t = smoothstep(0, 1, (x - x0) / (x1 - x0))
        return v0 + (v1 - v0) * t
      }
    }
    return table[table.length - 1][1]
  }
}

/**
 * A smooth, arc-length parameterised profile through coarse [radius, height] points
 * (centripetal Catmull-Rom: no overshoot at the shoulder or the neck).
 */
export class Profile {
  private readonly curve: CatmullRomCurve3
  private readonly us: number[] = []
  private readonly ys: number[] = []
  private readonly tmp = new Vector3()

  constructor(points: readonly ProfilePoint[]) {
    this.curve = new CatmullRomCurve3(
      points.map(([r, y]) => new Vector3(r, y, 0)),
      false,
      'centripetal',
    )
    const steps = 256
    for (let i = 0; i <= steps; i++) {
      const u = i / steps
      this.curve.getPointAt(u, this.tmp)
      this.us.push(u)
      this.ys.push(this.tmp.y)
    }
  }

  /** Radius and height at arc parameter u (0..1). */
  at(u: number): { r: number; y: number } {
    this.curve.getPointAt(Math.min(1, Math.max(0, u)), this.tmp)
    return { r: Math.max(0, this.tmp.x), y: this.tmp.y }
  }

  /** The arc parameter where the profile reaches height y (profile heights must be monotonic). */
  uAtY(y: number): number {
    const { us, ys } = this
    const rising = ys[ys.length - 1] > ys[0]
    for (let i = 1; i < ys.length; i++) {
      const a = ys[i - 1]
      const b = ys[i]
      if ((rising && y <= b) || (!rising && y >= b)) {
        const t = b === a ? 0 : (y - a) / (b - a)
        return us[i - 1] + (us[i] - us[i - 1]) * Math.min(1, Math.max(0, t))
      }
    }
    return 1
  }
}

export interface SurfaceSpec {
  /** Segments around the axis. */
  segments: number
  /** Vertex rows along the profile. */
  rows: number
  /**
   * The vertex at angle theta (0 = +z, the front; π/2 = +x) and row v (0..1). Rows must run
   * bottom to top for outward normals (or pass `flip`).
   */
  point: (theta: number, v: number, out: Vector3) => void
  /** Reverse the winding (for surfaces whose rows run top to bottom). */
  flip?: boolean
}

/**
 * A closed surface around the y axis. The seam column is duplicated (so each column can be
 * shaped freely) and its normals are welded afterwards, so no crease shows down the back.
 */
export function revolve({ segments, rows, point, flip = false }: SurfaceSpec): BufferGeometry {
  const cols = segments + 1
  const pos = new Float32Array(cols * rows * 3)
  const p = new Vector3()
  for (let i = 0; i < cols; i++) {
    const theta = ((i % segments) / segments) * TAU
    for (let j = 0; j < rows; j++) {
      point(theta, j / (rows - 1), p)
      const k = (i * rows + j) * 3
      pos[k] = p.x
      pos[k + 1] = p.y
      pos[k + 2] = p.z
    }
  }
  const index: number[] = []
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = i * rows + j
      const b = (i + 1) * rows + j
      const c = b + 1
      const d = a + 1
      if (flip) index.push(a, d, b, c, b, d)
      else index.push(a, b, d, c, d, b)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setIndex(index)
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geometry.computeVertexNormals()
  weldSeam(geometry, segments, rows)
  geometry.computeBoundingSphere()
  return geometry
}

function weldSeam(geometry: BufferGeometry, segments: number, rows: number): void {
  const n = geometry.getAttribute('normal')
  const v = new Vector3()
  for (let j = 0; j < rows; j++) {
    const a = j
    const b = segments * rows + j
    v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b))
    if (v.lengthSq() > 1e-12) v.normalize()
    n.setXYZ(a, v.x, v.y, v.z)
    n.setXYZ(b, v.x, v.y, v.z)
  }
  n.needsUpdate = true
}

export interface TubeSpec {
  curve: Curve<Vector3>
  /** Rings along the curve. */
  segments: number
  /** Vertices around each ring. */
  radial: number
  /** Radius at u (0..1 along the curve). */
  radius: (u: number) => number
  /** Scale of the cross-section along the side axis and the other axis, at u. */
  squash?: (u: number) => readonly [side: number, other: number]
  /** World direction the cross-section's first axis leans toward (default +x: out from the body). */
  side?: Vector3
}

/** A tube swept along a curve with a varying (optionally flattened) cross-section. */
export function sweep({ curve, segments, radial, radius, squash, side = new Vector3(1, 0, 0) }: TubeSpec): BufferGeometry {
  const ring = radial + 1
  const pos = new Float32Array((segments + 1) * ring * 3)
  const c = new Vector3()
  const t = new Vector3()
  const n = new Vector3()
  const b = new Vector3()
  for (let s = 0; s <= segments; s++) {
    const u = s / segments
    curve.getPointAt(u, c)
    curve.getTangentAt(u, t).normalize()
    n.copy(side).addScaledVector(t, -side.dot(t))
    if (n.lengthSq() < 1e-8) n.set(0, 0, 1).addScaledVector(t, -t.z)
    n.normalize()
    b.crossVectors(t, n).normalize()
    const r = radius(u)
    const [sx, sy] = squash ? squash(u) : [1, 1]
    for (let k = 0; k <= radial; k++) {
      const phi = ((k % radial) / radial) * TAU
      const cx = Math.cos(phi) * r * sx
      const cy = Math.sin(phi) * r * sy
      const i = (s * ring + k) * 3
      pos[i] = c.x + n.x * cx + b.x * cy
      pos[i + 1] = c.y + n.y * cx + b.y * cy
      pos[i + 2] = c.z + n.z * cx + b.z * cy
    }
  }
  const index: number[] = []
  for (let s = 0; s < segments; s++) {
    for (let k = 0; k < radial; k++) {
      const a = s * ring + k
      const bb = (s + 1) * ring + k
      const cc = bb + 1
      const d = a + 1
      index.push(a, d, bb, d, cc, bb)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setIndex(index)
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geometry.computeVertexNormals()
  // Weld the ring seams.
  const nrm = geometry.getAttribute('normal')
  const v = new Vector3()
  for (let s = 0; s <= segments; s++) {
    const a = s * ring
    const z = s * ring + radial
    v.set(nrm.getX(a) + nrm.getX(z), nrm.getY(a) + nrm.getY(z), nrm.getZ(a) + nrm.getZ(z))
    if (v.lengthSq() > 1e-12) v.normalize()
    nrm.setXYZ(a, v.x, v.y, v.z)
    nrm.setXYZ(z, v.x, v.y, v.z)
  }
  nrm.needsUpdate = true
  geometry.computeBoundingSphere()
  return geometry
}

/** A smooth curve through points (centripetal Catmull-Rom). */
export function path(points: ReadonlyArray<readonly [number, number, number]>): CatmullRomCurve3 {
  return new CatmullRomCurve3(
    points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    'centripetal',
  )
}

/** Mirror a path across the figure's centre line (x → −x). */
export function mirrorX(points: ReadonlyArray<readonly [number, number, number]>): Array<[number, number, number]> {
  return points.map(([x, y, z]) => [-x, y, z])
}
