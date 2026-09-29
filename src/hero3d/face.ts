import { BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, MeshStandardMaterial, SphereGeometry, SRGBColorSpace } from 'three'
import type { ModelId } from '../data/types'

/**
 * A quiet, sculpted face for each figure, and the masquerade mask she wears over her eyes.
 * The head is a sphere pushed into shape (brow, eye sockets, nose, cheekbones, lips, chin),
 * with the lips tinted through vertex colours. The mask is a shell that follows the same
 * surface a few millimetres out, cut and decorated by a canvas texture: black lace with a
 * metal edge, filigree at the temples, a crest over the brow and a few crystals that catch
 * the light (and the bloom). Nothing here is detailed enough to read as a portrait: it is a
 * couture mannequin in a mask.
 */

/** The head's half-extents in metres (x, y, z) and its centre in figure space. */
export const HEAD_SCALE = [0.083, 0.11, 0.096] as const
export const HEAD_CENTER = [0, 1.605, 0.008] as const

const smooth = (a: number, b: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const gauss = (d: number): number => Math.exp(-d * d)

/**
 * Pushes a point of the unit sphere (z = front, y = up) into a face. Returns the displaced
 * point in unit space; the caller scales it to metres.
 */
function sculpt(x: number, y: number, z: number, out: [number, number, number]): [number, number, number] {
  const front = smooth(0.05, 0.45, z)
  // Jaw: narrower and slightly shallower toward the chin.
  const jaw = smooth(-0.1, -0.95, y)
  let px = x * (1 - 0.26 * jaw)
  let pz = z * (1 - 0.05 * jaw)
  // Cheekbones: a little fuller just under the eyes, at the sides.
  px *= 1 + 0.035 * gauss((y + 0.05) / 0.16)

  let dz = 0
  dz += 0.035 * gauss((y - 0.2) / 0.09) // brow ridge
  dz -= 0.05 * (gauss(Math.hypot((x - 0.35) / 0.16, (y - 0.04) / 0.1)) + gauss(Math.hypot((x + 0.35) / 0.16, (y - 0.04) / 0.1))) // eye sockets
  // Nose: a ridge from the brow down to a soft tip, then under it.
  const ridge = y > -0.3 ? 0.03 + 0.15 * smooth(0.15, -0.3, y) : 0.18 * gauss((y + 0.3) / 0.075)
  const width = 0.05 + 0.065 * smooth(0.1, -0.33, y)
  dz += ridge * gauss(x / width)
  dz += 0.03 * gauss(Math.hypot((Math.abs(x) - 0.42) / 0.14, (y + 0.12) / 0.14)) // cheek apples
  dz += 0.038 * gauss(x / 0.2) * gauss((y + 0.515) / 0.045) // upper lip
  dz += 0.045 * gauss(x / 0.18) * gauss((y + 0.625) / 0.05) // lower lip
  dz -= 0.014 * gauss(x / 0.2) * gauss((y + 0.57) / 0.014) // mouth line
  dz -= 0.02 * gauss(x / 0.2) * gauss((y + 0.72) / 0.045) // under the lower lip
  dz += 0.06 * gauss(x / 0.24) * gauss((y + 0.83) / 0.11) // chin

  pz += dz * front
  out[0] = px
  out[1] = y
  out[2] = pz
  return out
}

/** How dark the eyes are at a point of the unit sphere (0..1): shadowed eyes behind the mask. */
function eyeWeight(x: number, y: number, z: number): number {
  if (z < 0.4) return 0
  return Math.min(1, gauss(Math.hypot((Math.abs(x) - 0.35) / 0.13, (y - 0.05) / 0.07)) * 1.3)
}

/** How much of the lip colour a point of the unit sphere takes (0..1). */
function lipWeight(x: number, y: number, z: number): number {
  if (z < 0.5) return 0
  const upper = gauss(x / 0.19) * gauss((y + 0.515) / 0.035)
  const lower = gauss(x / 0.17) * gauss((y + 0.628) / 0.042)
  return Math.min(1, 1.6 * (upper + lower)) * smooth(0.5, 0.8, z)
}

export interface FaceLook {
  lips: string
  /** The mask's metal (edge, filigree, crest). */
  metal: string
  /** The mask's lace ground. */
  lace: string
}

/** One mask and lip colour per model. */
export const FACES: Record<ModelId, FaceLook> = {
  A: { lips: '#5A1C22', metal: '#C9A24A', lace: '#0D0B0A' },
  B: { lips: '#7E2328', metal: '#D9D3C8', lace: '#0C0B0B' },
  C: { lips: '#8E262C', metal: '#C9A24A', lace: '#100D0B' },
}

/** The sculpted head, in metres around its own centre, with vertex colours (skin, lips). */
export function headGeometry(skin: string, look: FaceLook): BufferGeometry {
  const sphere = new SphereGeometry(1, 72, 56)
  const pos = sphere.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const skinColor = new Color(skin)
  const lipColor = new Color(look.lips)
  const eyeColor = new Color('#140E0C')
  const c = new Color()
  const p: [number, number, number] = [0, 0, 0]
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    sculpt(x, y, z, p)
    pos.setXYZ(i, p[0] * HEAD_SCALE[0], p[1] * HEAD_SCALE[1], p[2] * HEAD_SCALE[2])
    c.copy(skinColor).lerp(lipColor, 0.85 * lipWeight(x, y, z)).lerp(eyeColor, 0.85 * eyeWeight(x, y, z))
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  sphere.setAttribute('color', new Float32BufferAttribute(colors, 3))
  sphere.computeVertexNormals()
  return sphere
}

/**
 * The hair: a shell over the crown, swept back from a hairline above the brow to the nape,
 * standing just off the head. (The bun, chignon or low knot is added by the figure.)
 */
export function hairGeometry(): BufferGeometry {
  // A cap from the top down to just below the equator, tilted back about x.
  const cap = new SphereGeometry(1, 56, 28, 0, Math.PI * 2, 0, Math.PI * 0.57)
  const tilt = -0.74
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  const pos = cap.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ty = y * cos - z * sin
    const tz = y * sin + z * cos
    // Close to the scalp at the hairline, fuller over the crown and at the back.
    const k = 1.05 + 0.04 * Math.max(0, ty) + 0.03 * Math.max(0, -tz)
    pos.setXYZ(i, x * k * HEAD_SCALE[0], ty * k * HEAD_SCALE[1], tz * k * HEAD_SCALE[2])
  }
  cap.computeVertexNormals()
  return cap
}

export function headMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: '#FFFFFF', vertexColors: true, roughness: 0.52, metalness: 0 })
}

/** The mask's reach on the unit sphere: azimuth (radians either side of the front) and height. */
const MASK_AZ = 1.25
const MASK_Y: readonly [number, number] = [-0.24, 0.44]
/** How far the mask stands off the face, as a fraction of the head. */
const MASK_LIFT = 0.045

/** A shell over the upper face, following the sculpted surface, with UVs for the mask texture. */
export function maskGeometry(): BufferGeometry {
  const cols = 64
  const rows = 28
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const p: [number, number, number] = [0, 0, 0]
  for (let j = 0; j <= rows; j++) {
    const v = j / rows
    const y = MASK_Y[0] + (MASK_Y[1] - MASK_Y[0]) * v
    const ring = Math.sqrt(Math.max(0, 1 - y * y))
    for (let i = 0; i <= cols; i++) {
      const u = i / cols
      const az = (u * 2 - 1) * MASK_AZ
      sculpt(ring * Math.sin(az), y, ring * Math.cos(az), p)
      // Further out toward the temples, so the wings sit over the hair.
      const k = 1 + MASK_LIFT + 0.09 * smooth(0.55, 1.2, Math.abs(az))
      positions.push(p[0] * k * HEAD_SCALE[0], p[1] * k * HEAD_SCALE[1], p[2] * k * HEAD_SCALE[2])
      uvs.push(u, v)
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i
      const b = a + cols + 1
      indices.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Canvas size of the mask texture: the shell is about three times wider than it is tall. */
const W = 1024
const H = 352

/** Where things sit on the texture, from the same unit-sphere coordinates as sculpt(). */
const uOf = (x: number, y: number): number => {
  const ring = Math.sqrt(1 - y * y)
  return (Math.asin(Math.min(1, x / ring)) / MASK_AZ + 1) / 2
}
const vOf = (y: number): number => (y - MASK_Y[0]) / (MASK_Y[1] - MASK_Y[0])
const X = (x: number, y: number): number => uOf(x, y) * W
const Y = (y: number): number => (1 - vOf(y)) * H

/** The mask outline (left half; mirrored), as unit-sphere (x, y) points. */
function outline(ctx: CanvasRenderingContext2D) {
  const half = (s: number) => {
    // From the crest down the brow, out to the temple wing, round under the eye, back to the nose.
    ctx.lineTo(X(0.06 * s, 0.34), Y(0.34))
    ctx.bezierCurveTo(X(0.22 * s, 0.26), Y(0.26), X(0.4 * s, 0.3), Y(0.3), X(0.56 * s, 0.33), Y(0.33))
    ctx.bezierCurveTo(X(0.7 * s, 0.36), Y(0.36), X(0.78 * s, 0.42), Y(0.42), X(0.84 * s, 0.4), Y(0.4))
    ctx.bezierCurveTo(X(0.86 * s, 0.24), Y(0.24), X(0.82 * s, 0.02), Y(0.02), X(0.7 * s, -0.12), Y(-0.12))
    ctx.bezierCurveTo(X(0.56 * s, -0.22), Y(-0.22), X(0.3 * s, -0.2), Y(-0.2), X(0.17 * s, -0.13), Y(-0.13))
    ctx.bezierCurveTo(X(0.1 * s, -0.09), Y(-0.09), X(0.06 * s, -0.04), Y(-0.04), X(0, -0.03), Y(-0.03))
  }
  ctx.beginPath()
  ctx.moveTo(X(0, 0.43), Y(0.43))
  half(-1)
  ctx.lineTo(X(0, -0.03), Y(-0.03))
  // Right half, traced in reverse so the path closes cleanly.
  ctx.bezierCurveTo(X(0.06, -0.04), Y(-0.04), X(0.1, -0.09), Y(-0.09), X(0.17, -0.13), Y(-0.13))
  ctx.bezierCurveTo(X(0.3, -0.2), Y(-0.2), X(0.56, -0.22), Y(-0.22), X(0.7, -0.12), Y(-0.12))
  ctx.bezierCurveTo(X(0.82, 0.02), Y(0.02), X(0.86, 0.24), Y(0.24), X(0.84, 0.4), Y(0.4))
  ctx.bezierCurveTo(X(0.78, 0.42), Y(0.42), X(0.7, 0.36), Y(0.36), X(0.56, 0.33), Y(0.33))
  ctx.bezierCurveTo(X(0.4, 0.3), Y(0.3), X(0.22, 0.26), Y(0.26), X(0.06, 0.34), Y(0.34))
  ctx.closePath()
}

function eyes(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  for (const s of [-1, 1]) {
    const cx = 0.35 * s
    ctx.moveTo(X(cx - 0.17 * s, 0.05), Y(0.05))
    ctx.bezierCurveTo(X(cx - 0.08 * s, 0.13), Y(0.13), X(cx + 0.1 * s, 0.13), Y(0.13), X(cx + 0.19 * s, 0.07), Y(0.07))
    ctx.bezierCurveTo(X(cx + 0.1 * s, -0.03), Y(-0.03), X(cx - 0.06 * s, -0.03), Y(-0.03), X(cx - 0.17 * s, 0.05), Y(0.05))
    ctx.closePath()
  }
}

/** A curl of filigree: a small spiral with a tail, in canvas px. */
function curl(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, dir: number) {
  ctx.beginPath()
  for (let t = 0; t <= 1; t += 0.02) {
    const a = dir * (t * Math.PI * 3.2)
    const rr = r * (1 - t * 0.85)
    const px = x + Math.cos(a) * rr
    const py = y + Math.sin(a) * rr
    if (t === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}

export interface MaskTextures {
  map: CanvasTexture
  emissive: CanvasTexture
}

/** Draws one mask: lace ground with see-through holes, metal edge and filigree, crystals. */
export function maskTextures(look: FaceLook): MaskTextures {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Lace ground inside the outline.
  ctx.save()
  outline(ctx)
  ctx.clip()
  ctx.fillStyle = look.lace
  ctx.fillRect(0, 0, W, H)
  // Lace holes: a staggered net of small openings (see-through up close, a soft tone far away).
  ctx.globalCompositeOperation = 'destination-out'
  for (let row = 0, y = 6; y < H; y += 17, row++) {
    for (let x = row % 2 ? 9 : 0; x < W; x += 18) {
      ctx.beginPath()
      ctx.ellipse(x, y, 5.5, 4, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalCompositeOperation = 'source-over'
  // Denser lace bands along the brow and under the eyes keep the shape reading as a mask.
  ctx.strokeStyle = look.lace
  ctx.lineWidth = 22
  outline(ctx)
  ctx.stroke()
  ctx.restore()

  // Eye openings.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  eyes(ctx)
  ctx.fill()
  ctx.restore()

  // Metal: the edge, the eye rims, filigree curls at the temples and a crest over the brow.
  ctx.strokeStyle = look.metal
  ctx.fillStyle = look.metal
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 9
  outline(ctx)
  ctx.stroke()
  ctx.lineWidth = 7
  eyes(ctx)
  ctx.stroke()
  ctx.lineWidth = 5
  for (const s of [-1, 1]) {
    curl(ctx, X(0.68 * s, 0.26), Y(0.26), 26, s)
    curl(ctx, X(0.58 * s, -0.1), Y(-0.1), 18, -s)
    curl(ctx, X(0.3 * s, 0.22), Y(0.22), 14, s)
  }
  // Crest: a small fleur over the bridge of the nose.
  const cx = X(0, 0.3)
  const cy = Y(0.3)
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx, cy + 30)
  ctx.quadraticCurveTo(cx - 28, cy - 4, cx, cy - 40)
  ctx.quadraticCurveTo(cx + 28, cy - 4, cx, cy + 30)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy - 6, 8, 0, Math.PI * 2)
  ctx.fill()

  // Crystals: along the brow edge and at the wing tips.
  const crystals: Array<[number, number]> = [[X(0, 0.3), Y(0.3) - 6]]
  for (const s of [-1, 1]) {
    for (const [x, y] of [
      [0.2, 0.27],
      [0.38, 0.29],
      [0.55, 0.32],
      [0.83, 0.39],
      [0.62, -0.17],
      [0.36, -0.19],
    ] as const) {
      crystals.push([X(x * s, y), Y(y)])
    }
  }
  const glow = document.createElement('canvas')
  glow.width = W
  glow.height = H
  const gtx = glow.getContext('2d')!
  gtx.fillStyle = '#000'
  gtx.fillRect(0, 0, W, H)
  for (const [x, y] of crystals) {
    ctx.fillStyle = '#F4EFE6'
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
    const g = gtx.createRadialGradient(x, y, 0, x, y, 9)
    g.addColorStop(0, '#FFFFFF')
    g.addColorStop(1, '#000000')
    gtx.fillStyle = g
    gtx.beginPath()
    gtx.arc(x, y, 9, 0, Math.PI * 2)
    gtx.fill()
  }

  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 4
  const emissive = new CanvasTexture(glow)
  emissive.colorSpace = SRGBColorSpace
  return { map, emissive }
}

export function maskMaterial(textures: MaskTextures): MeshStandardMaterial {
  return new MeshStandardMaterial({
    map: textures.map,
    alphaTest: 0.5,
    side: DoubleSide,
    metalness: 0.6,
    roughness: 0.3,
    envMapIntensity: 1.8,
    emissive: '#FFF4E0',
    emissiveMap: textures.emissive,
    emissiveIntensity: 1.6,
  })
}
