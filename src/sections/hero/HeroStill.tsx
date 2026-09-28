import { useEffect, useRef, type RefObject } from 'react'
import { Placeholder } from '../../components'
import { cx, MEDIA } from '../../lib'
import styles from './HeroStill.module.css'
import { isSoftwareRenderer } from './renderer'

/** Full-length figure cut-outs (crown to toe, transparent ground). */
const RATIO = 2 / 5

/** Left to right on the runway; A is drawn last so it stands in front. */
const FIGURES = [
  { assetId: 'HERO-FIG-B', slot: 'b' },
  { assetId: 'HERO-FIG-C', slot: 'c' },
  { assetId: 'HERO-FIG-A', slot: 'a' },
] as const

type Slot = (typeof FIGURES)[number]['slot']

const SLOT_CLASS: Record<Slot, string> = { a: styles.slotA, b: styles.slotB, c: styles.slotC }

/** Parallax travel at depth 1 (the front figure), in px, for the pointer at an edge. */
const TRAVEL_X = 14
const TRAVEL_Y = 7
/** Per-frame easing at 60fps; scaled by the real frame time so 120Hz screens feel the same. */
const LERP_PARALLAX = 0.08
const LERP_LANTERN = 0.14

/** Longest frame step the easing will take (keeps slow machines converging in real time). */
const MAX_DT = 250

const ease = (k: number, dt: number) => 1 - Math.pow(1 - k, dt / (1000 / 60))
const clamp = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v)

export interface HeroStillProps {
  /** The hero section: pointer position is read relative to its rect. */
  pointerTarget: RefObject<HTMLElement | null>
  /** The 3D showroom is up: figures and beams fade out but stay mounted as the fallback. */
  receded: boolean
  /** Hero off screen or tab hidden: idle animations pause. */
  paused: boolean
}

/**
 * The 2D still showroom: three veiled figures on a dark floor, each under its own shaft of
 * warm light, with a mirrored reflection and a pool of light at the feet. Fine pointers get
 * a gentle parallax and the lantern, a soft light that follows the cursor and lifts the dark.
 * Decorative only (aria-hidden); the hero's text lives in the overlay above.
 */
export function HeroStill({ pointerTarget, receded, paused }: HeroStillProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const lanternRef = useRef<HTMLDivElement>(null)
  const recededRef = useRef(receded)

  useEffect(() => {
    recededRef.current = receded
  }, [receded])

  // Veils sway only where repainting them each frame is affordable (not on software GL).
  useEffect(() => {
    const root = rootRef.current
    if (root && !isSoftwareRenderer()) root.dataset.sway = ''
  }, [])

  useEffect(() => {
    const section = pointerTarget.current
    const root = rootRef.current
    const lantern = lanternRef.current
    if (!section || !root || !lantern) return

    const layers = Array.from(root.querySelectorAll<HTMLElement>('[data-depth]'), (el) => ({
      el,
      depth: Number(el.dataset.depth) || 0,
    }))
    const fine = window.matchMedia(MEDIA.finePointer)
    const reduce = window.matchMedia(MEDIA.reducedMotion)

    // Pointer offset from the stage centre, -1..1 on each axis: target and eased.
    const aim = { x: 0, y: 0 }
    const now = { x: 0, y: 0 }
    // Lantern position in px inside the stage: target and eased.
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
      if (event.pointerType === 'touch' || !fine.matches || recededRef.current) return
      const rect = section.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      aim.x = clamp((px / rect.width) * 2 - 1)
      aim.y = clamp((py / rect.height) * 2 - 1)
      lamp.tx = px
      lamp.ty = py
      if (!lit) {
        // Light up where the pointer is, rather than sweeping in from the corner.
        lamp.x = px
        lamp.y = py
        lit = true
        root.dataset.lantern = 'on'
      }
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
    return () => {
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [pointerTarget])

  return (
    <div
      ref={rootRef}
      className={styles.still}
      aria-hidden="true"
      data-receded={receded ? '' : undefined}
      data-paused={paused ? '' : undefined}
    >
      <div className={styles.room} />
      <div className={styles.floor} />

      <div className={styles.beams} data-depth="0.45">
        {FIGURES.map(({ slot }) => (
          <span key={slot} className={cx(styles.beam, SLOT_CLASS[slot])}>
            <span className={styles.motes} />
          </span>
        ))}
      </div>

      {FIGURES.map(({ assetId, slot }) => (
        <div key={assetId} className={cx(styles.figure, SLOT_CLASS[slot])} data-depth={slot === 'a' ? '1' : '0.7'}>
          <span className={styles.pool} />
          <div className={styles.reflection}>
            <Placeholder assetId={assetId} ratio={RATIO} backdrop={false} decorative className={styles.art} />
          </div>
          <Placeholder assetId={assetId} ratio={RATIO} backdrop={false} decorative className={cx(styles.art, styles.body)}>
            {slot === 'a' ? null : <span className={styles.recess} />}
          </Placeholder>
        </div>
      ))}

      <div ref={lanternRef} className={styles.lantern} />
    </div>
  )
}
