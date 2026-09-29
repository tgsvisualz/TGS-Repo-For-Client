import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { Vector3 } from 'three'
import type { ModelId } from '../data/types'
import { FIGURES } from './profiles'

/**
 * The unveiling. Each figure's veil lifts away (VeiledFigure3D reads `reveal.target`) when the
 * pointer is over her, as the camera carries her under it; it settles back when the pointer
 * moves on. A tap does the same on touch screens, for a few seconds. Left alone, the veils
 * lift one figure at a time, so the room is never static during a pitch. Nothing here causes
 * a React render: the controller writes plain numbers that the figures read every frame.
 */

export const reveal: { target: Record<ModelId, number> } = {
  target: { A: 0, B: 0, C: 0 },
}

/** Plinth height the figures stand on (Scene.tsx). */
const FLOOR = 0.1
/** Crown and hem heights used for the hit box, metres above the plinth. */
const TOP = 1.86
/** Half the width of the hit box at the figure, metres. */
const HALF = 0.3
/** Input-free time before the veils start lifting on their own, and the time each stays up. */
const IDLE_AFTER = 5000
const IDLE_STEP = 3400
/** How long a tapped figure stays unveiled. */
const TAP_HOLD = 6000
/** Order of the idle unveiling: the centre, then right, then left. */
const IDLE_ORDER: readonly ModelId[] = ['A', 'C', 'B']

const world = FIGURES.map((f) => ({
  id: f.id,
  top: new Vector3(f.position[0], FLOOR + TOP, f.position[2]),
  foot: new Vector3(f.position[0], FLOOR, f.position[2]),
}))

export function RevealController({
  pointerTarget,
  reducedMotion,
}: {
  pointerTarget: RefObject<HTMLElement | null>
  reducedMotion: boolean
}) {
  const camera = useThree((s) => s.camera)
  const canvas = useThree((s) => s.gl.domElement)
  const state = useRef({
    /** Pointer in canvas px, or null when it is outside the hero. */
    pointer: null as null | { x: number; y: number },
    lastInput: 0,
    tapped: null as null | { id: ModelId; until: number },
    idleIndex: 0,
    idleSince: 0,
  })
  const tmp = useRef({ a: new Vector3(), b: new Vector3(), c: new Vector3(), right: new Vector3() })

  useEffect(() => {
    const section = pointerTarget.current
    if (!section) return
    const s = state.current
    let down: null | { x: number; y: number; t: number } = null

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onMove = (e: PointerEvent) => {
      s.lastInput = performance.now()
      if (e.pointerType === 'touch') return
      s.pointer = local(e)
    }
    const onLeave = () => {
      s.pointer = null
    }
    const onDown = (e: PointerEvent) => {
      s.lastInput = performance.now()
      down = { ...local(e), t: performance.now() }
    }
    const onUp = (e: PointerEvent) => {
      s.lastInput = performance.now()
      if (!down || e.pointerType !== 'touch') return
      const p = local(e)
      const still = Math.hypot(p.x - down.x, p.y - down.y) < 12 && performance.now() - down.t < 450
      down = null
      if (!still) return
      const hit = hitTest(p.x, p.y)
      if (hit) s.tapped = { id: hit, until: performance.now() + TAP_HOLD }
    }

    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('pointerleave', onLeave)
    section.addEventListener('pointerdown', onDown, { passive: true })
    section.addEventListener('pointerup', onUp, { passive: true })
    return () => {
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      section.removeEventListener('pointerdown', onDown)
      section.removeEventListener('pointerup', onUp)
    }
    // hitTest reads the live camera; it is stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointerTarget, canvas])

  /** The figure under a canvas point (nearest by x when boxes overlap), or null. */
  function hitTest(px: number, py: number): ModelId | null {
    const { a, b, c, right } = tmp.current
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const toPx = (v: Vector3) => ({ x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h })
    right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    let best: ModelId | null = null
    let bestDx = Infinity
    for (const f of world) {
      const top = toPx(a.copy(f.top).project(camera))
      const foot = toPx(b.copy(f.foot).project(camera))
      const side = toPx(c.copy(f.top).addScaledVector(right, HALF).project(camera))
      const half = Math.abs(side.x - top.x)
      const cx = (top.x + foot.x) / 2
      const dx = Math.abs(px - cx)
      if (dx > half || py < top.y - half * 0.4 || py > foot.y) continue
      if (dx < bestDx) {
        bestDx = dx
        best = f.id
      }
    }
    return best
  }

  useFrame(() => {
    const s = state.current
    const now = performance.now()
    let lifted: ModelId | null = null

    if (s.tapped && now < s.tapped.until) lifted = s.tapped.id
    else if (s.tapped) s.tapped = null

    if (!lifted && s.pointer) lifted = hitTest(s.pointer.x, s.pointer.y)

    if (!lifted && !reducedMotion && now - s.lastInput > IDLE_AFTER) {
      if (!s.idleSince) s.idleSince = now
      const step = Math.floor((now - s.idleSince) / IDLE_STEP)
      // Every other step lets all three veils fall, so each unveiling reads as its own moment.
      lifted = step % 2 === 0 ? IDLE_ORDER[(s.idleIndex + step / 2) % IDLE_ORDER.length]! : null
    } else if (s.idleSince) {
      s.idleIndex = (s.idleIndex + 1) % IDLE_ORDER.length
      s.idleSince = 0
    }

    // Dev only (stripped from builds): window.__velatoReveal = 'A' | 'B' | 'C' | 'all' pins it.
    let all = false
    if (import.meta.env.DEV) {
      const pin = (window as unknown as { __velatoReveal?: ModelId | 'all' }).__velatoReveal
      if (pin === 'all') all = true
      else if (pin) lifted = pin
    }

    for (const f of world) reveal.target[f.id] = all || f.id === lifted ? 1 : 0
  })

  return null
}
