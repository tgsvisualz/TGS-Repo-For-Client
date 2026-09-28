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

/** Base vertical field of view; widened when the trio would not fit a narrow screen. */
export const FOV = 26
/** Half the trio's width with veils, in metres, and how much of the screen width it may take. */
const TRIO_HALF = 1.55
const TRIO_FILL = 0.9

export const wrapToPi = (a: number): number => a - TAU * Math.floor((a + Math.PI) / TAU)
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

interface RigState {
  current: { az: number; el: number; r: number }
  target: { az: number; el: number; r: number }
  prevRaw: number | null
  lastInput: number
}

/**
 * Lens and framing by viewport shape. Wide screens: the trio sits a touch right of centre,
 * clear of the headline (bottom left). Stacked layouts (phones, portrait): the trio is lifted
 * into the upper half, above the text, and the lens widens until all three fit across.
 */
export function frame(camera: PerspectiveCamera, width: number, height: number): void {
  if (width <= 0 || height <= 0) return
  const aspect = width / height
  const stacked = width < 768 || aspect < 1.2
  const fit = MathUtils.radToDeg(2 * Math.atan(TRIO_HALF / (REST.r * TRIO_FILL) / aspect))
  camera.fov = Math.max(FOV, fit)
  const shiftX = stacked ? 0 : -0.11 * width
  const shiftY = stacked ? 0.16 * height : 0.015 * height
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
  const [rig] = useState<RigState>(() => ({
    current: { ...REST },
    target: { ...REST },
    prevRaw: null,
    lastInput: performance.now(),
  }))
  const still = useRef(reducedMotion)

  useEffect(() => {
    still.current = reducedMotion
  }, [reducedMotion])

  useLayoutEffect(() => {
    frame(camera, width, height)
  }, [camera, width, height])

  // Dev only (stripped from builds): lets headless checks read the orbit, e.g. to prove an
  // edge crossing never spins the long way round.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as Window & { __velatoRig?: RigState & { camera: PerspectiveCamera } }
    const handle = Object.assign(rig, { camera })
    w.__velatoRig = handle
    return () => {
      if (w.__velatoRig === handle) delete w.__velatoRig
    }
  }, [rig, camera])

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
  })

  return null
}
