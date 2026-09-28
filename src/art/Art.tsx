import { useId } from 'react'
import type { ArtSpec } from '../data/types'

export interface ArtProps {
  spec: ArtSpec
  /** Width ÷ height of the frame the art fills, e.g. 4 / 5 or 5 / 4. */
  ratio: number
  className?: string
}

/**
 * TEMPORARY STUB: replaced by the art system (src/art/**) in Phase 1.
 * Renders a lit dark stage so layouts can be built against a real frame.
 */
export function Art({ ratio, className }: ArtProps) {
  const id = useId()
  const w = 1000
  const h = Math.round(w / ratio)
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-spot`} cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#3a332d" />
          <stop offset="100%" stopColor="#0b0a09" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-spot)`} />
      <ellipse cx={w / 2} cy={h * 0.5} rx={w * 0.08} ry={h * 0.32} fill="#1b1917" />
    </svg>
  )
}
