import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Icon, Placeholder, Reveal } from '../components'
import { CATEGORIES, COPY, formatPrice, fromPrice } from '../data/catalog'
import { cx, useFinePointer, usePrefersReducedMotion } from '../lib'
import styles from './CategoryIndex.module.css'

/** Share of the remaining distance the preview covers per 60Hz frame. */
const LERP = 0.14
/** Breathing room between the preview and the viewport edges, in px. */
const EDGE = 16

const TOTAL_RELEASED = CATEGORIES.reduce((sum, category) => sum + category.released, 0)

interface Follow {
  x: number
  y: number
  tx: number
  ty: number
  raf: number
  last: number
  /** Top limit (below the fixed header), measured once per hover. */
  top: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

function headerHeight(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-h')
  const px = Number.parseFloat(raw)
  return Number.isFinite(px) ? px : 72
}

/**
 * The floating preview for fine pointers: five stacked images in one fixed frame that trails
 * the cursor (rAF + frame-rate-independent lerp), clamped inside the viewport, painted behind
 * the list's type. Position is written straight to the DOM; React only hears about the
 * hovered row and whether the frame is shown.
 */
function useFollow(reduced: boolean) {
  const frame = useRef<HTMLDivElement | null>(null)
  const follow = useRef<Follow>({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, last: 0, top: 0 })

  const paint = useCallback(() => {
    const f = follow.current
    if (frame.current) frame.current.style.transform = `translate3d(${f.x.toFixed(2)}px, ${f.y.toFixed(2)}px, 0)`
  }, [])

  const step = useCallback(
    (now: number) => {
      const f = follow.current
      const dt = f.last ? Math.min(64, now - f.last) : 1000 / 60
      f.last = now
      const k = reduced ? 1 : 1 - Math.pow(1 - LERP, dt / (1000 / 60))
      f.x += (f.tx - f.x) * k
      f.y += (f.ty - f.y) * k
      const settled = Math.abs(f.tx - f.x) < 0.1 && Math.abs(f.ty - f.y) < 0.1
      if (settled) {
        f.x = f.tx
        f.y = f.ty
        f.last = 0
      }
      paint()
      f.raf = settled ? 0 : requestAnimationFrame(step)
    },
    [reduced, paint],
  )

  /** Aim the frame's centre at the pointer; `snap` jumps there (first entry) instead of gliding. */
  const aim = useCallback(
    (clientX: number, clientY: number, snap: boolean) => {
      const el = frame.current
      if (!el) return
      const f = follow.current
      if (snap || !f.top) f.top = headerHeight() + EDGE
      const w = el.offsetWidth
      const h = el.offsetHeight
      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight
      f.tx = clamp(clientX - w / 2, EDGE, vw - w - EDGE)
      f.ty = clamp(clientY - h / 2, f.top, vh - h - EDGE)
      if (snap) {
        f.x = f.tx
        f.y = f.ty
        paint()
      }
      if (!f.raf) f.raf = requestAnimationFrame(step)
    },
    [step, paint],
  )

  useEffect(() => {
    const f = follow.current
    return () => {
      cancelAnimationFrame(f.raf)
      f.raf = 0
    }
  }, [])

  return { frame, aim }
}

/** The Index: five categories set large, each a way into the drop. */
export function CategoryIndex() {
  const finePointer = useFinePointer()
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)
  const hoveringRef = useRef(false)
  const { frame, aim } = useFollow(reduced)

  const isMouse = (event: ReactPointerEvent) => event.pointerType !== 'touch'

  const onEnter = (event: ReactPointerEvent<HTMLElement>) => {
    if (!finePointer || !isMouse(event)) return
    aim(event.clientX, event.clientY, !hoveringRef.current)
    hoveringRef.current = true
    setHovering(true)
  }

  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!finePointer || !isMouse(event)) return
    aim(event.clientX, event.clientY, !hoveringRef.current)
    if (!hoveringRef.current) {
      hoveringRef.current = true
      setHovering(true)
    }
  }

  const onLeave = () => {
    hoveringRef.current = false
    setHovering(false)
  }

  return (
    <section id="index" aria-labelledby="index-title" className={cx('section', styles.root)}>
      <div className="container">
        <Reveal className={styles.head}>
          <h2 id="index-title" className="t-label">
            {COPY.index.eyebrow}
          </h2>
          <p className={cx('t-label', styles.total)}>
            <span className="tabular">{TOTAL_RELEASED}</span> pieces since Drop 001
          </p>
        </Reveal>

        <Reveal
          as="ul"
          role="list"
          stagger
          className={cx(styles.list, hovering && styles.hovering)}
          onPointerEnter={onEnter}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          {CATEGORIES.map((category, i) => (
            <li key={category.id} className={styles.item}>
              <a
                href="#drop"
                className={cx(styles.row, hovering && active === i && styles.current)}
                data-cursor="view"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className={styles.label}>{category.label}</span>
                <span className={styles.meta}>
                  <span className={styles.count}>{category.released} pieces so far</span>
                  <span className={cx('tabular', styles.from)}>from {formatPrice(fromPrice(category.id))}</span>
                </span>
                <Icon name="arrow-up-right" size={22} className={styles.arrow} />
                <Placeholder assetId={category.indexAssetId} ratio={3 / 4} decorative className={styles.thumb} />
              </a>
            </li>
          ))}
        </Reveal>
      </div>

      {finePointer ? (
        <div ref={frame} className={cx(styles.preview, hovering && styles.previewShown)} aria-hidden="true">
          <div className={styles.previewFrame}>
            {CATEGORIES.map((category, i) => (
              <Placeholder
                key={category.id}
                assetId={category.indexAssetId}
                ratio={3 / 4}
                decorative
                loading="eager"
                className={cx(styles.previewImage, i === active && styles.previewActive)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
