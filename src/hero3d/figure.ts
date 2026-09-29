import { BufferGeometry, Material, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mirrorX, path, Profile, revolve, smoothstep, sweep, TAU } from './geometry'
import { FACES, hairGeometry, HEAD_CENTER, headGeometry, headMaterial, maskGeometry, maskMaterial, maskTextures } from './face'
import * as M from './materials'
import {
  ARM_CARRY,
  ARM_RADIUS,
  ARM_REST,
  COLUMN,
  DEPTH,
  FIST_RADIUS,
  FIST_SQUASH,
  HAND_SQUASH,
  LEG,
  SEAT,
  SLIP,
  TOP,
  TORSO,
  VEIL,
  type FigureSpec,
} from './profiles'

/**
 * Builds one veiled figure from primitives: a skin torso, the garment lathes over it, swept
 * arms with flat hands, a featureless head with the hair silhouette, and the veil. Returns
 * plain three objects (built once per mount) plus a dispose().
 */

export interface Part {
  key: string
  geometry: BufferGeometry
  material: Material
  position?: readonly [number, number, number]
  scale?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
}

export interface BuiltFigure {
  parts: Part[]
  /** The veil (inner blusher + outer layer in one mesh) and its hem edge; they sway about the crown. */
  veil: { geometry: BufferGeometry; material: Material; edge: BufferGeometry; edgeMaterial: Material }
  /** Sideways shift of the body at hand height (the bag hangs from the shifted hand). */
  lean: number
  /** Materials the bag reuses (C only). */
  leather: Material
  brass: Material
  dispose: () => void
}

const SEGMENTS = 48
/** How far a garment stands off the skin beneath it. */
const EASE = 0.005

const torso = new Profile(TORSO)

/** Wrapped angle, −π..π, 0 at the front. */
const wrap = (theta: number): number => (theta > Math.PI ? theta - TAU : theta)
const front = (theta: number): number => Math.max(0, Math.cos(theta))

/** The body's radius at height y (only inside the torso's range). */
function torsoRadius(y: number): number {
  if (y < TORSO[0][1] || y > TORSO[TORSO.length - 1][1]) return 0
  return torso.at(torso.uAtY(y)).r
}

/** A gentle bust volume, pushed forward at the front only. */
function bust(theta: number, y: number): number {
  const f = front(theta)
  return 0.02 * Math.exp(-(((y - 1.215) / 0.06) ** 2)) * f * f
}

/** A point on a body-shaped surface: radius r at angle theta and height y. */
function bodyPoint(theta: number, r: number, y: number, out: Vector3): Vector3 {
  return out.set(r * Math.sin(theta), y, r * Math.cos(theta) * DEPTH(y) + bust(theta, y))
}

interface GarmentOptions {
  profile: Profile
  rows: number
  /** Height of the top edge by angle (necklines); the whole profile when omitted. */
  top?: (theta: number) => number
  /** Final radius, given the eased radius (pleats, drapes, trains). */
  shape?: (theta: number, y: number, r: number) => number
  /** Radii of layers beneath, which this garment must clear. */
  over?: ReadonlyArray<(y: number) => number>
}

function garment({ profile, rows, top, shape, over = [] }: GarmentOptions): BufferGeometry {
  return revolve({
    segments: SEGMENTS,
    rows,
    point: (theta, v, out) => {
      const uTop = top ? profile.uAtY(top(theta)) : 1
      const { r: r0, y } = profile.at(v * uTop)
      let r = Math.max(r0, torsoRadius(y) + EASE)
      for (const under of over) {
        const ru = under(y)
        if (ru > 0) r = Math.max(r, ru + EASE)
      }
      if (shape) r = shape(theta, y, r)
      bodyPoint(theta, r, y, out)
    },
  })
}

function radiusOf(profile: Profile, lo: number, hi: number): (y: number) => number {
  return (y) => (y < lo || y > hi ? 0 : profile.at(profile.uAtY(y)).r)
}

const unitSphere = (): SphereGeometry => new SphereGeometry(1, 36, 24)

/** A tube along the arm path, from its start to arm parameter `until`, `extra` metres wider. */
function sleeve(points: ReadonlyArray<readonly [number, number, number]>, until: number, extra: number, side: number): BufferGeometry {
  const arm = path(points)
  const samples: Array<[number, number, number]> = []
  for (let i = 0; i <= 10; i++) {
    const p = arm.getPointAt((i / 10) * until)
    samples.push([p.x, p.y, p.z])
  }
  return sweep({
    curve: path(samples),
    segments: 28,
    radial: 16,
    radius: (u) => ARM_RADIUS(u * until) + extra + 0.004 * smoothstep(0.82, 1, u),
    side: new Vector3(side, 0, 0),
  })
}

export function buildFigure(spec: FigureSpec): BuiltFigure {
  const geometries: BufferGeometry[] = []
  const materials: Material[] = []
  const g = <T extends BufferGeometry>(geometry: T): T => {
    geometries.push(geometry)
    return geometry
  }
  const m = <T extends Material>(material: T): T => {
    materials.push(material)
    return material
  }

  const skin = m(M.skin(spec.skin))
  const hair = m(M.hair(spec.hair.color, spec.hair.sheen))
  const leather = m(M.leather())
  const brass = m(M.brass())
  const sphere = g(unitSphere())
  const parts: Part[] = []

  // ── Skin: torso and neck (everything above the neckline shows through or above the garment).
  const skinTorso = g(
    revolve({
      segments: SEGMENTS,
      rows: 40,
      point: (theta, v, out) => {
        const { r, y } = torso.at(v)
        bodyPoint(theta, r, y, out)
      },
    }),
  )
  parts.push({ key: 'torso', geometry: skinTorso, material: skin })

  // ── Hair: a cap set back from the brow, plus a shape. (The sculpted head and mask are added
  //    after the contrapposto below, so they are placed with the body rather than sheared.)
  if (spec.hair.style === 'bun') {
    parts.push({ key: 'bun', geometry: sphere, material: hair, position: [0, 1.708, -0.048], scale: [0.05, 0.047, 0.05] })
  } else if (spec.hair.style === 'chignon') {
    parts.push({ key: 'chignon', geometry: sphere, material: hair, position: [0, 1.56, -0.084], scale: [0.05, 0.038, 0.036] })
  } else {
    parts.push({ key: 'low', geometry: sphere, material: hair, position: [0, 1.545, -0.078], scale: [0.062, 0.045, 0.042] })
  }

  // ── Arms (the figure's left is +x). The bag hand closes around the handle.
  const armSides = [
    { side: 1, points: spec.bag ? ARM_CARRY : ARM_REST, fist: spec.bag },
    { side: -1, points: mirrorX(ARM_REST), fist: false },
  ]
  for (const { side, points, fist } of armSides) {
    const arm = g(
      sweep({
        curve: path(points),
        segments: 64,
        radial: 18,
        radius: fist ? FIST_RADIUS : ARM_RADIUS,
        squash: fist ? FIST_SQUASH : HAND_SQUASH,
        side: new Vector3(side, 0, 0),
      }),
    )
    parts.push({ key: `arm${side}`, geometry: arm, material: skin })
  }

  // ── Garments.
  if (spec.outfit === 'column') {
    // A: black silk column, bateau neck, pleats below the hip and a short train behind.
    const gown = g(
      garment({
        profile: new Profile(COLUMN),
        rows: 72,
        top: (theta) => 1.405 - 0.012 * front(theta) ** 2,
        shape: (theta, y, r) => {
          const pleats = 1 + 0.035 * Math.sin(9 * theta) * Math.max(0, 1 - y / 0.95)
          const back = Math.max(0, -Math.cos(theta))
          const train = y < 0.24 ? 0.14 * (1 - y / 0.24) ** 2 * back ** 1.6 : 0
          return r * pleats + train
        },
      }),
    )
    parts.push({ key: 'gown', geometry: gown, material: m(M.silk('#0F0D0B', '#6A5A4C')) })
  } else if (spec.outfit === 'slip') {
    // C: garnet bias-cut slip, straight neckline with a small V, low back, thin straps.
    const slipTop = (theta: number): number => 1.17 + 0.085 * ((1 + Math.cos(theta)) / 2) ** 0.9 - 0.014 * Math.exp(-((wrap(theta) / 0.28) ** 2))
    const dress = g(
      garment({
        profile: new Profile(SLIP),
        rows: 64,
        top: slipTop,
        shape: (theta, y, r) => r * (1 + 0.024 * Math.sin(6 * theta + 5 * y + 0.8) * (1 - smoothstep(0.3, 0.95, y))),
      }),
    )
    const garnet = m(M.silk('#5C1520', '#B34A56'))
    parts.push({ key: 'slip', geometry: dress, material: garnet })
    // Straps run straight up from the neckline, over the shoulder, and down to the low back.
    const strapX = 0.094
    let crest = 1.38
    while (crest < 1.46 && torsoRadius(crest) > strapX) crest += 0.002
    const onBody = (x: number, y: number, dir: 1 | -1): [number, number, number] => {
      const r = torsoRadius(y) + 0.004
      const c = Math.sqrt(Math.max(0, r * r - x * x))
      const theta = Math.asin(Math.min(1, Math.abs(x) / r))
      const z = dir * c * DEPTH(y) + (dir > 0 ? bust(theta, y) : 0)
      return [x, y, z]
    }
    for (const side of [1, -1]) {
      const x = side * strapX
      const strap: Array<[number, number, number]> = []
      for (let i = 0; i <= 5; i++) strap.push(onBody(x, 1.244 + (crest - 0.014 - 1.244) * (i / 5), 1))
      strap.push([x, crest + 0.004, 0])
      for (let i = 5; i >= 0; i--) strap.push(onBody(x, 1.19 + (crest - 0.014 - 1.19) * (i / 5), -1))
      const s = g(sweep({ curve: path(strap), segments: 40, radial: 6, radius: () => 0.0045 }))
      parts.push({ key: `strap${side}`, geometry: s, material: garnet })
    }
    // Legs below the hem, and black pumps (one foot a step ahead).
    for (const side of [1, -1]) {
      const step = side > 0 ? 0.04 : -0.01
      const leg = g(
        sweep({
          curve: path([
            [side * 0.074, 0.34, 0.0],
            [side * 0.078, 0.2, step * 0.5],
            [side * 0.08, 0.075, step],
          ]),
          segments: 16,
          radial: 14,
          radius: (u) => 0.036 - 0.012 * u,
        }),
      )
      parts.push({ key: `leg${side}`, geometry: leg, material: skin })
      parts.push({
        key: `shoe${side}`,
        geometry: sphere,
        material: leather,
        position: [side * 0.084, 0.03, 0.05 + step],
        scale: [0.031, 0.03, 0.105],
        rotation: [0, side * 0.12, 0],
      })
    }
  } else {
    // B: bone wide-leg trousers with a pressed crease, black draped top with a cowl, long sleeves.
    const bone = m(M.crepe('#CFC6B8', '#EFE8DD'))
    const black = m(M.silk('#16130F', '#6A5A4C'))
    const legProfile = new Profile(LEG)
    for (const side of [1, -1]) {
      const leg = g(
        revolve({
          segments: SEGMENTS,
          rows: 40,
          point: (theta, v, out) => {
            const { r, y } = legProfile.at(v)
            const crease = 1 + 0.02 * Math.exp(-((wrap(theta) / 0.2) ** 2))
            const cx = side * (0.118 + (0.086 - 0.118) * Math.min(1, y / 0.97))
            out.set(cx + r * crease * Math.sin(theta), y, r * crease * Math.cos(theta) * 0.9)
          },
        }),
      )
      parts.push({ key: `trouser${side}`, geometry: leg, material: bone })
      parts.push({
        key: `shoe${side}`,
        geometry: sphere,
        material: leather,
        position: [side * 0.118, 0.024, 0.1],
        scale: [0.036, 0.026, 0.09],
        rotation: [0, side * 0.1, 0],
      })
    }
    const seatProfile = new Profile(SEAT)
    const seat = g(garment({ profile: seatProfile, rows: 32 }))
    parts.push({ key: 'seat', geometry: seat, material: bone })
    const top = g(
      garment({
        profile: new Profile(TOP),
        rows: 72,
        over: [radiusOf(seatProfile, SEAT[0][1], SEAT[SEAT.length - 1][1])],
        top: (theta) => 1.405 - 0.1 * front(theta) ** 2.2,
        shape: (theta, y, r) => {
          const s = smoothstep(1.17, 1.3, y)
          const cowl = front(theta) ** 2 * (0.02 * s + 0.006 * Math.sin(3 * Math.PI * s))
          const peplum = 1 + 0.03 * Math.sin(7 * theta + 1) * (1 - smoothstep(0.88, 1.0, y))
          return r * peplum + cowl
        },
      }),
    )
    parts.push({ key: 'top', geometry: top, material: black })
    parts.push({ key: 'sleeveL', geometry: g(sleeve(ARM_REST, 0.715, 0.012, 1)), material: black })
    parts.push({ key: 'sleeveR', geometry: g(sleeve(mirrorX(ARM_REST), 0.715, 0.012, -1)), material: black })
  }

  // ── The veil: crown to waist in front, to mid-back behind, folds deepening toward the hem.
  //    A shorter inner layer (the blusher) doubles the fabric over the head, so the head reads
  //    as a soft shadow through it, never as a face.
  const veilProfile = new Profile(
    VEIL.map(([r, y], i) => [r, y + (spec.crown - VEIL[0][1]) * (1 - i / (VEIL.length - 1))] as const),
  )
  const phase = spec.phase
  type Reach = (theta: number) => number
  const veilPoint =
    (reach: Reach, inset: number) =>
    (theta: number, v: number, out: Vector3): Vector3 => {
      const u = v * reach(theta)
      const { r: r0, y: y0 } = veilProfile.at(u)
      // Folds radiate from where the veil is gathered at the crown and deepen as it falls.
      const folds =
        1 + 0.07 * u ** 1.3 * (Math.sin(7 * theta + phase) + 0.5 * Math.sin(12 * theta + 1.7 * phase + 0.5) + 0.25 * Math.sin(19 * theta + 0.6 * phase))
      const r = r0 * folds * inset
      // An uneven hem: soft waves, never a regular scallop.
      const hem = smoothstep(0.75, 1, v)
      const y = y0 + hem * (0.016 * Math.sin(5 * theta + phase) + 0.011 * Math.sin(11 * theta + 2 * phase))
      const depth = 1 - 0.12 * smoothstep(0.12, 0.5, u)
      return out.set(r * Math.sin(theta), y, r * Math.cos(theta) * depth - 0.03 * u * u)
    }
  const back = (theta: number): number => smoothstep(0, 1, (1 - Math.cos(theta)) / 2)
  const outerReach: Reach = (theta) => 0.84 + 0.16 * back(theta) + 0.03 * Math.sin(3 * theta + phase)
  const blusherReach: Reach = (theta) => 0.58 + 0.05 * back(theta) + 0.015 * Math.sin(4 * theta + phase)
  const outer = revolve({ segments: 72, rows: 64, flip: true, point: veilPoint(outerReach, 1) })
  const blusher = revolve({ segments: 72, rows: 28, flip: true, point: veilPoint(blusherReach, 0.965) })
  // One mesh, inner layer's triangles first: three draws a transparent double-sided mesh as all
  // back faces, then all front faces, so the outer layer's front always lands on top.
  const veilGeometry = g(mergeGeometries([blusher, outer]) ?? outer)
  if (veilGeometry !== outer) outer.dispose()
  blusher.dispose()
  const veilMaterial = m(M.veil(spec.veil))
  // A fine satin pencil edge along both hems: it draws the veil's outline as fabric.
  const hemEdge = (reach: Reach, inset: number, radius: number): BufferGeometry => {
    const points: Array<[number, number, number]> = []
    const at = veilPoint(reach, inset)
    const p = new Vector3()
    for (let i = 0; i < 180; i++) {
      at((i / 180) * TAU, 1, p)
      points.push([p.x, p.y, p.z])
    }
    const curve = path(points)
    curve.closed = true
    return sweep({ curve, segments: 360, radial: 5, radius: () => radius, side: new Vector3(0, 1, 0) })
  }
  const edgeGeometry = g(mergeGeometries([hemEdge(outerReach, 1, 0.0028), hemEdge(blusherReach, 0.965, 0.0022)]))
  const edgeMaterial = m(M.edge(spec.veil))

  // Contrapposto: the weight-bearing hip slides out and the shoulders settle back over it, a
  // gentle S through the body (feet and head stay put). Sheared in place; the normals barely
  // change and are kept.
  const lean = (y: number): number => spec.stance * (0.03 * Math.exp(-(((y - 0.95) / 0.45) ** 2)) - 0.006 * smoothstep(1.2, 1.7, y))
  for (const geometry of geometries) {
    if (geometry === sphere) continue
    const pos = geometry.getAttribute('position')
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + lean(pos.getY(i)))
    pos.needsUpdate = true
    geometry.computeBoundingSphere()
  }
  for (const part of parts) {
    if (part.geometry === sphere && part.position) {
      const [x, y, z] = part.position
      part.position = [x + lean(y), y, z]
    }
  }

  // ── Head, hair and mask, in head space, placed with the lean like the other head parts.
  const look = FACES[spec.id]
  const headGeo = headGeometry()
  const maskGeo = maskGeometry()
  const maskTex = maskTextures(look)
  geometries.push(headGeo, maskGeo)
  const headAt = [HEAD_CENTER[0] + lean(HEAD_CENTER[1]), HEAD_CENTER[1], HEAD_CENTER[2]] as const
  parts.push({ key: 'head', geometry: headGeo, material: m(headMaterial(spec.skin)), position: headAt })
  parts.push({ key: 'hair', geometry: g(hairGeometry()), material: hair, position: headAt })
  parts.push({ key: 'mask', geometry: maskGeo, material: m(maskMaterial(maskTex)), position: headAt })

  return {
    parts,
    lean: lean(0.75),
    veil: { geometry: veilGeometry, material: veilMaterial, edge: edgeGeometry, edgeMaterial },
    leather,
    brass,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose()
      M.disposeAll(materials)
      maskTex.map.dispose()
      maskTex.emissive.dispose()
    },
  }
}
