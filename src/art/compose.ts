/**
 * Framing. Each drawing has a focus rectangle (what must be seen: crown to toe, the bag and
 * its plinth, a hand at the hip); the viewBox expands its short side to the frame's ratio and
 * places the slack editorially: the subject leans toward the light, portraits keep headroom.
 */
import type { Crop, Light } from '../data/types'
import type { Box, Pt } from './geom'

/** Grow `focus` to `ratio` (w ÷ h). ax/ay: share of the slack placed left/above (0.5 = centred). */
export function fit(focus: Box, ratio: number, ax = 0.5, ay = 0.5): Box {
  let w = focus.w
  let h = focus.h
  if (w / h < ratio) w = h * ratio
  else h = w / ratio
  return { x: focus.x - (w - focus.w) * ax, y: focus.y - (h - focus.h) * ay, w, h }
}

/** Horizontal slack split: the subject sits a little toward the key light. */
export function leanFor(light: Light | 'back'): number {
  return light === 'left' ? 0.42 : light === 'right' ? 0.58 : 0.5
}

export interface FigureFrame {
  extent: Box
  anchor: Pt
  top: number
}

/** Focus rectangle for a figure crop, in figure space (1000 units tall). */
export function figureFocus(crop: Crop, f: FigureFrame, tight: boolean): { focus: Box; ay: number } {
  const e = f.extent
  const halfW = (pad: number): number => Math.max(500 - e.x, e.x + e.w - 500) + pad
  switch (crop) {
    case 'full':
    case 'back': {
      if (tight) {
        const hw = halfW(10)
        return { focus: { x: 500 - hw, y: 12, w: hw * 2, h: 996 }, ay: 0.5 }
      }
      const hw = Math.max(190, halfW(24))
      const top = Math.min(f.top - 22, 30)
      return { focus: { x: 500 - hw, y: top, w: hw * 2, h: 1014 - top }, ay: 0.45 }
    }
    case 'waist-up': {
      const top = f.top - 18
      return { focus: { x: 318, y: top, w: 364, h: 588 - top }, ay: 0.2 }
    }
    case 'lower':
      return { focus: { x: 330, y: 392, w: 340, h: 622 }, ay: 0.7 }
    case 'detail': {
      // Close on the hand and the bag at the hip; the veil's edge falls into the top of frame.
      const [ax, ay] = f.anchor
      return { focus: { x: ax - 150, y: ay - 190, w: 300, h: 320 }, ay: 0.5 }
    }
  }
}
