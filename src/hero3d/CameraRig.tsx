import { useFrame, useThree } from '@react-three/fiber'
import { damp } from 'maath/easing'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'

/**
 * The cursor-driven 360° orbit around the showroom floor.
 *
 * Fine pointers: the pointer's x across the hero maps to an azimuth, centre = the fronts,
 * both edges = the backs (the same view). Consecutive readings are unwrapped, so a pointer
 * that leaves one edge and comes back at the other continues the short way round instead of
 * spinning 360°. y sets the elevation and distance. Coarse pointers drag horizontally on the
 * canvas (vertical pans stay with the page: touch-action pan-y). After 4 s without input the
 * camera drifts slowly (not under reduced motion). Frame-rate independent (maath damp on the
 * frame delta) and no React state per frame.
 */

const TAU = Math.PI * 2
/** Azimuth that faces the fronts (camera on +z). */
const BASE = 0
export const LOOK_AT = new Vector3(0, 1.05, 0)
/** Resting view, before any input. */
const REST = { az: 0, el: 0.26, r: 8.1 }
/** Elevation and distance at the top (y = 0) and bottom (y = 1) of the hero. */
const EL: readonly [number, number] = [0.4, 0.14]
const R: readonly [number, number] = [7.4, 8.8]
const SMOOTH = 0.45
const IDLE_MS = 4000
const DRIFT = 0.07

/** Base vertical field of view; widened when the trio would not fit the free space. */
export const FOV = 26
/** Half the trio's width with veils (m) and the resting distance to the trio's back row (m). */
const TRIO_HALF = 1.55
const TRIO_DEPTH = 8.2

/** Where the trio's top (B and C's crowns) and bottom (A's feet) sit from the look-at point at
 * the resting view, as tangents of the angle: the vertical extent the lens has to hold. */
function restExtent(py: number, pz: number): number {
  const y0 = LOOK_AT.y + REST.r * Math.sin(REST.el)
  const z0 = REST.r * Math.cos(REST.el)
  const dy = py - y0
  const dz = pz - z0
  const depth = -dy * Math.sin(REST.el) - dz * Math.cos(REST.el)
  const up = dy * Math.cos(REST.el) - dz * Math.sin(REST.el)
  return up / depth
}
const TRIO_TOP = restExtent(1.88, -0.3) * 1.06
const TRIO_BOTTOM = -restExtent(0.1, 0.5) * 1.06

export const wrapToPi = (a: number): number => a - TAU * Math.floor((a + Math.PI) / TAU)
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

interface RigState {
  current: { az: number; el: number; r: number }
  target: { az: number; el: number; r: number }
  prevRaw: number | null
  lastInput: number
  /** Frames rendered (read by headless checks: it must stand still while the hero is away). */
  frames: number
}

/** The hero copy's edges, in px from the section's top left (text boxes only). */
export interface CopyBox {
  top: number
  left: number
  right: number
}

/**
 * Measures the hero's copy block (the eyebrow, headline, lede and calls to action around
 * #hero-title) from its text boxes, so block-level widths never inflate it.
 */
export function measureCopy(section: HTMLElement | null): CopyBox | null {
  const block = section?.querySelector('#hero-title')?.parentElement
  if (!section || !block) return null
  const origin = section.getBoundingClientRect()
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let top = Infinity
  let left = Infinity
  let right = -Infinity
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue
    range.selectNodeContents(node)
    const r = range.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    top = Math.min(top, r.top - origin.top)
    left = Math.min(left, r.left - origin.left)
    right = Math.max(right, r.right - origin.left)
  }
  return Number.isFinite(top) && Number.isFinite(right) ? { top, left, right } : null
}

/**
 * Lens and framing by viewport shape, around the hero copy. Wide screens: the trio fills the
 * content column right of the headline (bottom left), never under it; the column's right edge
 * mirrors the copy's left inset, so on very wide screens the trio stays within the page grid.
 * Stacked layouts (phones, portrait tablets): the trio sits in the band between the header
 * and the copy below. In both, the lens only ever widens from its base field of view.
 */
export function frame(camera: PerspectiveCamera, width: number, height: number, copy: CopyBox | null): void {
  if (width <= 0 || height <= 0) return
  const aspect = width / height
  const stacked = width < 768 || aspect < 1.2
  let left: number
  let right: number
  let top: number
  let bottom: number
  if (stacked) {
    left = 0.04 * width
    right = 0.96 * width
    top = 0.11 * height
    bottom = copy ? Math.max(top + 0.3 * height, copy.top - 0.02 * height) : 0.55 * height
  } else {
    // Keep at least half the width for the trio; below that it may pass behind the copy (the
    // hero's scrim keeps the text legible there).
    left = copy ? Math.min(copy.right + 0.03 * width, 0.5 * width) : 0.4 * width
    right = copy ? Math.min(0.97 * width, width - copy.left) : 0.97 * width
    top = 0.1 * height
    bottom = 0.94 * height
  }
  const fitWidth = (TRIO_HALF / TRIO_DEPTH) * (width / (right - left)) / aspect
  const fitHeight = ((TRIO_TOP + TRIO_BOTTOM) / 2) * (height / (bottom - top))
  const tanHalf = Math.max(Math.tan(MathUtils.degToRad(FOV / 2)), fitWidth, fitHeight)
  camera.fov = MathUtils.radToDeg(2 * Math.atan(tanHalf))
  // Shift the frustum (a positive offset moves the picture left / up) so the trio's centre,
  // trioMid px below the look-at point, lands on the free region's centre.
  const trioMid = ((TRIO_BOTTOM - TRIO_TOP) / 2 / tanHalf) * (height / 2)
  const shiftX = width / 2 - (left + right) / 2
  const shiftY = height / 2 + trioMid - (top + bottom) / 2
  camera.setViewOffset(width, height, shiftX, shiftY, width, height)
  camera.updateProjectionMatrix()
}

export interface CameraRigProps {
  pointerTarget: RefObject<HTMLElement | null>
  reducedMotion: boolean
}

export function CameraRig({ pointerTarget, reducedMotion }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const canvas = useThree((s) => s.gl.domElement)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const getState = useThree((s) => s.get)
  const [rig] = useState<RigState>(() => ({
    current: { ...REST },
    target: { ...REST },
    prevRaw: null,
    lastInput: performance.now(),
    frames: 0,
  }))
  const still = useRef(reducedMotion)

  useEffect(() => {
    still.current = reducedMotion
  }, [reducedMotion])

  useLayoutEffect(() => {
    const reframe = () => frame(camera, width, height, measureCopy(pointerTarget.current))
    reframe()
    // Measure again once the headline's web font has landed and the copy's entrance (a short
    // rise) has settled.
    let live = true
    document.fonts?.ready.then(() => live && reframe()).catch(() => {})
    const settle = window.setTimeout(reframe, 1600)
    return () => {
      live = false
      window.clearTimeout(settle)
    }
  }, [camera, width, height, pointerTarget])

  // Dev only (stripped from builds): lets headless checks read the orbit, e.g. to prove an
  // edge crossing never spins the long way round.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as Window & { __velatoRig?: RigState & { camera: PerspectiveCamera; getState: typeof getState } }
    const handle = Object.assign(rig, { camera, getState })
    w.__velatoRig = handle
    return () => {
      if (w.__velatoRig === handle) delete w.__velatoRig
    }
  }, [rig, camera, getState])

  // Fine pointer: read the pointer against the hero's rect (the text overlay sits above us).
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const section = pointerTarget.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const { clientX, clientY } = event
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return
      const x = clamp01((clientX - rect.left) / rect.width)
      const y = clamp01((clientY - rect.top) / rect.height)
      const raw = BASE + (x - 0.5) * TAU
      if (rig.prevRaw === null) rig.target.az = rig.current.az + wrapToPi(raw - rig.current.az)
      else rig.target.az += wrapToPi(raw - rig.prevRaw)
      rig.prevRaw = raw
      rig.target.el = MathUtils.lerp(EL[0], EL[1], y)
      rig.target.r = MathUtils.lerp(R[0], R[1], y)
      rig.lastInput = performance.now()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [pointerTarget, rig])

  // Coarse pointer: horizontal drags on the canvas turn the room (half a turn per full width).
  useEffect(() => {
    let active: number | null = null
    let lastX = 0
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || active !== null) return
      active = event.pointerId
      lastX = event.clientX
      rig.lastInput = performance.now()
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // Capture is a nicety; the drag still works while the finger stays on the canvas.
      }
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== active) return
      const w = canvas.getBoundingClientRect().width || 1
      rig.target.az -= ((event.clientX - lastX) / w) * Math.PI
      lastX = event.clientX
      rig.lastInput = performance.now()
    }
    const onEnd = (event: PointerEvent) => {
      if (event.pointerId !== active) return
      active = null
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onEnd)
    canvas.addEventListener('pointercancel', onEnd)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onEnd)
      canvas.removeEventListener('pointercancel', onEnd)
    }
  }, [canvas, rig])

  useFrame((_, delta) => {
    rig.frames++
    const dt = Math.min(delta, 0.5)
    const { current, target } = rig
    if (!still.current && performance.now() - rig.lastInput > IDLE_MS) target.az += DRIFT * Math.min(dt, 0.1)
    damp(current, 'az', target.az, SMOOTH, dt)
    damp(current, 'el', target.el, SMOOTH, dt)
    damp(current, 'r', target.r, SMOOTH, dt)
    // Keep the unwrapped angles small without changing where the camera is heading.
    if (Math.abs(current.az) > 2 * TAU) {
      const k = Math.round(current.az / TAU) * TAU
      current.az -= k
      target.az -= k
    }
    const { az, el, r } = current
    const flat = r * Math.cos(el)
    camera.position.set(LOOK_AT.x + flat * Math.sin(az), LOOK_AT.y + r * Math.sin(el), LOOK_AT.z + flat * Math.cos(az))
    camera.lookAt(LOOK_AT)
    // Dev only (stripped from builds): window.__velatoCam = [x, y, z, lookX, lookY, lookZ] pins
    // the camera for close inspection of the figures.
    if (import.meta.env.DEV) {
      const pin = (window as unknown as { __velatoCam?: number[] }).__velatoCam
      if (pin) {
        camera.position.set(pin[0]!, pin[1]!, pin[2]!)
        camera.lookAt(pin[3]!, pin[4]!, pin[5]!)
      }
    }
  })

  return null
}
