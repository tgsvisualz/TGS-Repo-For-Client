import { matchesMedia, useMediaQuery } from './useMediaQuery'

/** The media queries behind the motion and input hooks, for CSS-in-JS or matchMedia use. */
export const MEDIA = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** Hover-capable fine pointer (mouse, trackpad). Hover effects and the custom cursor are gated on it. */
  finePointer: '(hover: hover) and (pointer: fine)',
} as const

/** True when the visitor asked for reduced motion. Live: flips if the OS setting changes. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA.reducedMotion)
}

/** True on hover-capable fine pointers. False on touch, and on the server. */
export function useFinePointer(): boolean {
  return useMediaQuery(MEDIA.finePointer)
}

/** Non-hook reads, for effects and event handlers. */
export const prefersReducedMotion = (): boolean => matchesMedia(MEDIA.reducedMotion)
export const hasFinePointer = (): boolean => matchesMedia(MEDIA.finePointer)
