import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { cx, MEDIA } from '../../lib'
import { LOOKS, srcSet, type Slot } from './cast'
import styles from './HeroCast.module.css'

const SLOT_CLASS: Record<Slot, string> = { a: styles.slotA, b: styles.slotB, c: styles.slotC }

/** Entrance order: the two behind rise first, the front model last. */
const ENTER_ORDER: Record<Slot, number> = { b: 0, c: 1, a: 2 }

/** Parallax travel at depth 1 (the front model), in px, for the pointer at an edge. */
const TRAVEL_X = 18
const TRAVEL_Y = 8
/** Per-frame easing at 60fps; scaled by the real frame time so 120Hz screens feel the same. */
const LERP_PARALLAX = 0.07
const LERP_LANTERN = 0.14
const MAX_DT = 250

/** With no pointer activity for IDLE_AFTER ms, the light moves to the next look every IDLE_STEP ms. */
const IDLE_AFTER = 6000
const IDLE_STEP = 4800

const ease = (k: number, dt: number) => 1 - Math.pow(1 - k, dt / (1000 / 60))
const clamp = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v)

const DESCRIPTION =
  'Three masked models in black evening gowns: a platinum bob in opera gloves, a brunette holding a lace mask to her eyes, and a blonde glancing back over a velvet shoulder.'

export interface HeroCastProps {
  /** The hero section: pointer position is read relative to its rect. */
  pointerTarget: RefObject<HTMLElement | null>
  /** Index into LOOKS of the model in the light. */
  focus: number
  onFocus: (index: number) => void
  /** Hero off screen or tab hidden: idle cycling and the lantern pause. */
  paused: boolean
}

/**
 * The cast: three masked models standing in one dark room, each photograph feathered into the
 * ground so the backdrops read as a single wall. The model nearest the pointer steps into the
 * light while the others fall back into shadow; the stage drifts with a little parallax and a
 * soft lantern follows the cursor. Left alone, the light moves from model to model on its own.
 * Clicking anywhere on the stage goes to the Drop 014 preview.
 */
export function HeroCast({ pointerTarget, focus, onFocus, paused }: HeroCastProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const lanternRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef(focus)
  const onFocusRef = useRef(onFocus)
  const pausedRef = useRef(paused)
  const lastMoveRef = useRef(0)

  useEffect(() => {
    focusRef.current = focus
    onFocusRef.current = onFocus
    pausedRef.current = paused
  })

  // Pointer: parallax, lantern and "nearest model steps into the light".
  useEffect(() => {
    const section = pointerTarget.current
    const root = rootRef.current
    const lantern = lanternRef.current
    if (!section || !root || !lantern) return

    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-depth]'), (el) => ({
      el,
      depth: Number(el.dataset.depth) || 0,
    }))
    const figures = Array.from(root.querySelectorAll<HTMLElement>('[data-look]'))
    const fine = window.matchMedia(MEDIA.finePointer)
    const reduce = window.matchMedia(MEDIA.reducedMotion)

    // Horizontal centre of each model's body, in viewport px (refreshed on resize and scroll).
    let centres: number[] = []
    const measure = () => {
      centres = figures.map((el) => {
        const r = el.getBoundingClientRect()
        return r.left + r.width * Number(el.dataset.body ?? 0.5)
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)

    const aim = { x: 0, y: 0 }
    const now = { x: 0, y: 0 }
    const lamp = { tx: 0, ty: 0, x: 0, y: 0 }
    let lit = false
    let raf = 0
    let last = 0

    const paint = () => {
      const still = reduce.matches
      for (const { el, depth } of layers) {
        el.style.transform = still
          ? ''
          : `translate3d(${(-now.x * TRAVEL_X * depth).toFixed(2)}px, ${(-now.y * TRAVEL_Y * depth).toFixed(2)}px, 0)`
      }
      lantern.style.transform = `translate3d(${lamp.x.toFixed(1)}px, ${lamp.y.toFixed(1)}px, 0)`
    }

    const frame = (time: number) => {
      raf = 0
      const dt = last ? Math.min(time - last, MAX_DT) : 1000 / 60
      last = time
      const instant = reduce.matches
      const kp = instant ? 1 : ease(LERP_PARALLAX, dt)
      const kl = instant ? 1 : ease(LERP_LANTERN, dt)
      now.x += (aim.x - now.x) * kp
      now.y += (aim.y - now.y) * kp
      lamp.x += (lamp.tx - lamp.x) * kl
      lamp.y += (lamp.ty - lamp.y) * kl
      const settled =
        Math.abs(aim.x - now.x) < 0.0005 &&
        Math.abs(aim.y - now.y) < 0.0005 &&
        Math.abs(lamp.tx - lamp.x) < 0.25 &&
        Math.abs(lamp.ty - lamp.y) < 0.25
      if (settled) {
        now.x = aim.x
        now.y = aim.y
        lamp.x = lamp.tx
        lamp.y = lamp.ty
      }
      paint()
      if (settled) last = 0
      else raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !fine.matches) return
      lastMoveRef.current = performance.now()
      const rect = section.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      aim.x = clamp((px / rect.width) * 2 - 1)
      aim.y = clamp((py / rect.height) * 2 - 1)
      lamp.tx = px
      lamp.ty = py
      if (!lit) {
        lamp.x = px
        lamp.y = py
        lit = true
        root.dataset.lantern = 'on'
      }

      // The model whose body is nearest the pointer takes the light, but only while the pointer
      // is over the room itself: over the text, buttons or look index it stays where it is.
      if (!(event.target instanceof Node) || !root.contains(event.target)) {
        wake()
        return
      }
      let best = focusRef.current
      let bestDistance = Infinity
      centres.forEach((c, i) => {
        const d = Math.abs(event.clientX - c)
        if (d < bestDistance) {
          bestDistance = d
          best = i
        }
      })
      if (best !== focusRef.current) onFocusRef.current(best)
      wake()
    }
    const onLeave = () => {
      aim.x = 0
      aim.y = 0
      lit = false
      delete root.dataset.lantern
      wake()
    }

    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', measure)
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pointerTarget])

  // Idle: the light walks from model to model (also the only way it moves on touch screens).
  useEffect(() => {
    const reduce = window.matchMedia(MEDIA.reducedMotion)
    const id = window.setInterval(() => {
      if (pausedRef.current || reduce.matches) return
      if (performance.now() - lastMoveRef.current < IDLE_AFTER) return
      onFocusRef.current((focusRef.current + 1) % LOOKS.length)
    }, IDLE_STEP)
    return () => window.clearInterval(id)
  }, [])

  const toDrop = () => {
    const target = document.getElementById('drop')
    if (!target) return
    const smooth = !window.matchMedia(MEDIA.reducedMotion).matches
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  return (
    <div
      ref={rootRef}
      className={styles.stage}
      role="img"
      aria-label={DESCRIPTION}
      data-cursor="view"
      data-paused={paused ? '' : undefined}
      onClick={toDrop}
    >
      {LOOKS.map((look, i) => (
          <div
            key={look.slot}
            className={cx(styles.fig, SLOT_CLASS[look.slot])}
            data-look={i}
            data-body={look.eyes.cx}
            data-active={i === focus ? '' : undefined}
            style={{ '--i': ENTER_ORDER[look.slot] } as CSSProperties}
          >
            <div className={styles.depth} data-depth={look.depth}>
              <img
                className={styles.img}
                src={look.src1x}
                srcSet={srcSet(look)}
                sizes="(max-aspect-ratio: 6/5) 60vh, 75vh"
                width={1280}
                height={1920}
                alt=""
                decoding="async"
                fetchPriority={look.slot === 'a' ? 'high' : 'auto'}
                draggable={false}
              />
            </div>
          </div>
      ))}
      <div ref={lanternRef} className={styles.lantern} />
    </div>
  )
}
