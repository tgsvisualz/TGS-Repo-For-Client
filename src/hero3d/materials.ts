import {
  CanvasTexture,
  Color,
  DoubleSide,
  LinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
} from 'three'
import type { VeilSpec } from './profiles'

/**
 * Materials for the showroom. Colours are the brand's placeholder palette (src/art/palette.ts):
 * warm, low-key, never pure black or white. Hex strings are sRGB; three converts them.
 */

/** Silk: a soft sheen on the folds and a whisper of clearcoat, never plastic. */
export function silk(color: string, sheenColor: string): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.32,
    metalness: 0,
    sheen: 0.6,
    sheenColor: new Color(sheenColor),
    sheenRoughness: 0.4,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
    // The side strip light-formers run long highlights down the folds.
    envMapIntensity: 1.6,
  })
}

/** Matte crepe (the bone trousers): no clearcoat, a low sheen. */
export function crepe(color: string, sheenColor: string): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.62,
    metalness: 0,
    sheen: 0.35,
    sheenColor: new Color(sheenColor),
    sheenRoughness: 0.55,
  })
}

export function skin(color: string): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0 })
}

export function hair(color: string, sheenColor: string): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.46,
    metalness: 0,
    sheen: 0.5,
    sheenColor: new Color(sheenColor),
    sheenRoughness: 0.3,
  })
}

/** Black patent leather: shoes and the bag. */
export function leather(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: '#0E0C0B',
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.75,
    clearcoatRoughness: 0.2,
  })
}

/** Brushed brass hardware. */
export function brass(): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: '#C2A978', metalness: 1, roughness: 0.3 })
}

/**
 * A sheer veil. Real tulle is nearly clear where you look straight through it and dense where
 * it turns away (folds, the silhouette), so the alpha follows the viewing angle: `opacity`
 * edge-on, `opacity × face` head-on. Over the head the fabric is gathered and doubled, so
 * there it stays almost opaque (`head`): the head reads as a veiled form, never as a face.
 * Folds and edges catch a soft sheen glow, like tulle lit from behind. Double-sided (three
 * draws the inside, then the outside) and depth-write off.
 */
export function veil(spec: VeilSpec): MeshPhysicalMaterial {
  const material = new MeshPhysicalMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity,
    roughness: 0.55,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.35,
    sheenColor: new Color(spec.sheen),
    // The rim and key light-formers catch the folds and the silhouette.
    envMapIntensity: 2.2,
    side: DoubleSide,
    depthWrite: false,
  })
  const uniforms = {
    veilFace: { value: spec.face },
    veilHead: { value: spec.head },
    veilGlow: { value: new Color(spec.sheen).multiplyScalar(spec.glow) },
  }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying float vVeilY;\nvoid main() {')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvVeilY = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float veilFace;\nuniform float veilHead;\nuniform vec3 veilGlow;\nvarying float vVeilY;\nvoid main() {')
      .replace(
        '#include <opaque_fragment>',
        [
          'float veilFacing = clamp( abs( dot( normal, geometryViewDir ) ), 0.0, 1.0 );',
          'float veilSheer = mix( veilFace, veilHead, smoothstep( 1.44, 1.54, vVeilY ) );',
          'diffuseColor.a *= mix( 1.0, veilSheer, pow( veilFacing, 0.5 ) );',
          'outgoingLight += veilGlow * pow( 1.0 - veilFacing, 2.5 ) * ( 0.45 + 0.55 * smoothstep( 0.85, 1.75, vVeilY ) );',
          '#include <opaque_fragment>',
        ].join('\n'),
      )
  }
  material.customProgramCacheKey = () => 'velato-veil'
  return material
}

/** The veil's satin pencil edge: opaque, a touch lighter than the tulle, catching the light. */
export function edge(spec: VeilSpec): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: new Color(spec.color).lerp(new Color(spec.sheen), 0.35),
    roughness: 0.35,
    metalness: 0,
    sheen: 1,
    sheenRoughness: 0.3,
    sheenColor: new Color(spec.sheen),
    envMapIntensity: 1.6,
  })
}

/**
 * A soft radial falloff (white centre → black edge), drawn once on a small opaque canvas. Used
 * as an alphaMap, which reads the green channel, so the ramp lives in the colour, not in alpha.
 */
export function radialTexture(size = 64): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const c = size / 2
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)
    const gradient = ctx.createRadialGradient(c, c, 0, c, c, c)
    // A gaussian-like falloff: no visible rim at any size.
    for (let i = 0; i <= 8; i++) {
      const t = i / 8
      const v = Math.round(255 * Math.exp(-4.5 * t * t) * (1 - t))
      gradient.addColorStop(t, `rgb(${v},${v},${v})`)
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}

/**
 * The glow of one of the hall's light bars (u across its width, v up its height): soft-edged
 * across, rising from the floor and gone by about a third of its height, so each bar reads as
 * a column of light dissolving upward, never as a rod hanging into the frame.
 */
export function riseTexture(): CanvasTexture {
  const w = 16
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Canvas y runs down; the texture's v runs up (flipY), so the floor is at the canvas bottom.
    const up = ctx.createLinearGradient(0, h, 0, 0)
    const stops: ReadonlyArray<readonly [number, number]> = [
      [0, 0.3],
      [0.03, 1],
      [0.1, 0.72],
      [0.2, 0.32],
      [0.3, 0.1],
      [0.42, 0.02],
      [0.55, 0],
      [1, 0],
    ]
    for (const [t, a] of stops) {
      const v = Math.round(255 * a)
      up.addColorStop(t, `rgb(${v},${v},${v})`)
    }
    ctx.fillStyle = up
    ctx.fillRect(0, 0, w, h)
    const across = ctx.createLinearGradient(0, 0, w, 0)
    for (let i = 0; i <= 8; i++) {
      const t = i / 8
      const v = Math.round(255 * Math.exp(-(((t - 0.5) / 0.22) ** 2)))
      across.addColorStop(t, `rgb(${v},${v},${v})`)
    }
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = across
    ctx.fillRect(0, 0, w, h)
  }
  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  return texture
}

/** Contact shadow under a figure: a dark radial decal (no real shadow maps: too costly). */
export function contactShadow(alphaMap: CanvasTexture, opacity: number): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: '#030202',
    alphaMap,
    transparent: true,
    opacity,
    depthWrite: false,
  })
}

/** Dispose a list of materials (and nothing they share). */
export function disposeAll(materials: Iterable<Material>): void {
  for (const m of materials) m.dispose()
}
