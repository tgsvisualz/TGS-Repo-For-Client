import { useId, useMemo } from 'react'
import type { ArtSpec } from '../data/types'
import { buildScene } from './scenes'

export interface ArtProps {
  spec: ArtSpec
  /** Width ÷ height of the frame the art fills, e.g. 4 / 5 or 5 / 4. */
  ratio: number
  className?: string
  /**
   * Draw the showroom (wall, key-light pool, floor, reflection, plinth, vignette). Default true.
   * false = the figure(s) or object only, on a transparent background, framed tightly
   * (crown to feet for full crops) for stages that draw their own light.
   */
  backdrop?: boolean
}

/**
 * Placeholder art for an image slot: veiled figures, bags on plinths and the trio, drawn in
 * SVG and composed for the frame's ratio. Deterministic; every id is prefixed per instance.
 *
 * Animation hooks (CSS): [data-part="figure"], [data-part="veil"] (transform-origin at the
 * crown, fill-box), [data-part="backdrop"], [data-part="floor"], [data-part="plinth"],
 * [data-part="object"].
 */
export function Art({ spec, ratio, className, backdrop = true }: ArtProps) {
  const uid = 'v' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const specKey = JSON.stringify(spec)
  const scene = useMemo(() => buildScene(JSON.parse(specKey) as ArtSpec, ratio, backdrop, uid), [specKey, ratio, backdrop, uid])
  return (
    <svg
      className={className}
      viewBox={scene.viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>{scene.defs}</defs>
      {scene.body}
    </svg>
  )
}
