import type { RefObject } from 'react'

export type Hero3DQuality = 'high' | 'lite'

/**
 * The fixed contract between the 2D hero (src/sections/hero/Hero.tsx) and the lazily loaded
 * 3D showroom. The hero owns the decision to mount it; the showroom owns everything inside
 * the canvas.
 */
export interface ShowroomProps {
  quality: Hero3DQuality
  /** Hero on screen and tab visible. When false the render loop stops (frameloop "never"). */
  active: boolean
  /** The hero <section>; the camera rig reads the pointer relative to its rect. */
  pointerTarget: RefObject<HTMLElement | null>
  /** No idle drift and no fabric sway. */
  reducedMotion: boolean
  /** Called once, after the first few frames have rendered. */
  onReady: () => void
  /** Called on init failure or WebGL context loss; the hero falls back to the still stage. */
  onError: (error: unknown) => void
}
