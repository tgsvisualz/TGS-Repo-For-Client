import { useEffect, useRef } from 'react'
import { MEDIA, useFinePointer } from '../lib'
import styles from './CustomCursor.module.css'

/** Hovering one of these grows the ring and hides the dot. */
const INTERACTIVE = 'a[href], button, [role="button"], label, summary, [data-cursor]'

/** Text entry keeps the native caret; the custom cursor steps aside. */
const TEXT_ENTRY = [
  'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="image"], [type="hidden"])',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ')

/** data-cursor values that turn the ring into a labelled disc. */
const LABELS: Record<string, string> = { view: 'View', peek: 'Peek', orbit: 'Orbit' }

/** Ring follow per frame at 60fps (scaled by the real frame time, up to MAX_DT). */
const RING_LERP = 0.18
const MAX_DT = 250

type CursorState = 'default' | 'link' | 'label' | 'text'

function stateFor(target: EventTarget | null): { state: CursorState; label: string } {
  const el = target instanceof Element ? target : null
  if (!el) return { state: 'default', label: '' }
  if (el.closest(TEXT_ENTRY)) return { state: 'text', label: '' }
  const hit = el.closest(INTERACTIVE)
  if (!hit) return { state: 'default', label: '' }
  const label = LABELS[hit.getAttribute('data-cursor') ?? '']
  return label ? { state: 'label', label } : { state: 'link', label: '' }
}

/**
 * The custom cursor (DESIGN §6): a bone dot on the pointer and a ring that follows with a
 * little lag, both in difference blend; over `data-cursor="view|peek|orbit"` the ring opens
 * into an 84px bone disc with a label. Fine pointers only: nothing renders on touch.
 */
export function CustomCursor() {
  const fine = useFinePointer()
  if (!fine || isArtSheet()) return null
  return <CursorLayer />
}

function isArtSheet(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('view') === 'art'
  } catch {
    return false
  }
}

function CursorLayer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    const disc = discRef.current
    const labelEl = labelRef.current
    if (!root || !dot || !ring || !disc || !labelEl) return

    const html = document.documentElement
    html.classList.add('has-custom-cursor')
    const reduce = window.matchMedia(MEDIA.reducedMotion)

    let x = 0
    let y = 0
    let rx = 0
    let ry = 0
    let raf = 0
    let last = 0
    let shown = false
    let state: CursorState = 'default'

    const place = () => {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
      const ringAt = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`
      ring.style.transform = ringAt
      disc.style.transform = ringAt
    }

    const frame = (time: number) => {
      raf = 0
      const dt = last ? Math.min(time - last, MAX_DT) : 1000 / 60
      last = time
      const k = reduce.matches ? 1 : 1 - Math.pow(1 - RING_LERP, dt / (1000 / 60))
      rx += (x - rx) * k
      ry += (y - ry) * k
      const settled = Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1
      if (settled) {
        rx = x
        ry = y
      }
      place()
      if (settled) last = 0
      else raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const setVisible = (visible: boolean) => {
      if (visible === shown) return
      shown = visible
      root.dataset.visible = visible ? 'true' : 'false'
    }
    const setState = (target: EventTarget | null) => {
      const next = stateFor(target)
      if (next.label && labelEl.textContent !== next.label) labelEl.textContent = next.label
      if (next.state !== state) {
        state = next.state
        root.dataset.state = state
      }
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        setVisible(false)
        return
      }
      x = event.clientX
      y = event.clientY
      if (!shown) {
        // Appear on the pointer, not sweeping in from where it was last seen.
        rx = x
        ry = y
        place()
        setState(event.target)
        setVisible(true)
      }
      wake()
    }
    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') setState(event.target)
    }
    const onOut = (event: PointerEvent) => {
      // relatedTarget null: the pointer left the page.
      if (!event.relatedTarget) setVisible(false)
    }
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') root.dataset.pressed = ''
    }
    const onUp = () => {
      delete root.dataset.pressed
    }
    const onBlur = () => {
      onUp()
      setVisible(false)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    html.addEventListener('pointerleave', onBlur)
    document.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointercancel', onUp, { passive: true })
    window.addEventListener('blur', onBlur)

    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      html.removeEventListener('pointerleave', onBlur)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', onBlur)
      cancelAnimationFrame(raf)
      html.classList.remove('has-custom-cursor')
    }
  }, [])

  // The wrapper creates no stacking context, so each fixed part blends with the page itself.
  return (
    <div ref={rootRef} className={styles.root} data-custom-cursor="" data-state="default" data-visible="false" aria-hidden="true">
      <div ref={ringRef} className={styles.ring} data-custom-cursor="ring">
        <div className={styles.ringShape} />
      </div>
      <div ref={discRef} className={styles.disc} data-custom-cursor="disc">
        <div className={styles.discShape}>
          <span ref={labelRef} className={styles.label} />
        </div>
      </div>
      <div ref={dotRef} className={styles.dot} data-custom-cursor="dot">
        <div className={styles.dotShape} />
      </div>
    </div>
  )
}
