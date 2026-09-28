import { useCallback, useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { prefersReducedMotion } from '../lib/motion'
import styles from './Reveal.module.css'

export type RevealTag =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'figure'
  | 'ul'
  | 'ol'
  | 'li'
  | 'dl'
  | 'p'
  | 'span'
  | 'h2'
  | 'h3'
  | 'blockquote'

export interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: RevealTag
  /** Delay before the reveal starts, in ms. */
  delay?: number
  /**
   * Reveal the direct children one after another instead of the whole block: a number of ms
   * between them, or true for the --stagger token (60ms; 0 under reduced motion).
   */
  stagger?: number | boolean
  className?: string
  children?: ReactNode
}

const FAILSAFE_MS = 8000

function readMs(el: Element, token: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(token).trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value
}

/**
 * Progressive scroll reveal (fade + 16px rise). Content is visible by default: it is only held
 * back when IntersectionObserver exists, reduced motion is off and the element starts below
 * the fold. Anything already on screen at mount shows at once, with no animation. Uses
 * `translate` (not `transform`), so children keep their own transforms; pointer events are
 * never touched.
 */
export function Reveal({ as = 'div', delay = 0, stagger, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node
  }, [])
  const staggered = stagger !== undefined && stagger !== false
  const staggerValue = stagger === true ? 'var(--stagger)' : typeof stagger === 'number' ? `${stagger}ms` : '0ms'

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return
    if (el.getBoundingClientRect().top <= window.innerHeight) return

    const children = staggered ? Array.from(el.children) : []
    children.forEach((child, i) => (child as HTMLElement).style.setProperty('--i', String(i)))

    let finishTimer = 0
    const reveal = () => {
      if (el.dataset.reveal !== 'pending') return
      el.dataset.reveal = 'in'
      observers.forEach((observer) => observer.disconnect())
      window.clearTimeout(failsafe)
      // Drop the reveal styles once played, so nothing lingers on the element or its children.
      const staggerMs = staggered ? readMs(el, '--reveal-stagger', 0) * Math.max(0, children.length - 1) : 0
      const total = delay + staggerMs + readMs(el, '--dur-reveal', 700) + 100
      finishTimer = window.setTimeout(() => {
        delete el.dataset.reveal
      }, total)
    }

    el.dataset.reveal = 'pending'
    const observers = [
      // Reveal once the top clears the bottom 8% of the viewport...
      new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && reveal(), {
        rootMargin: '0px 0px -8% 0px',
      }),
      // ...or once fully visible: a short block at the very end of the page may never clear that
      // line. The 16px margin matches the pending translate, which IO measures.
      new IntersectionObserver((entries) => entries.some((e) => e.intersectionRatio >= 0.98) && reveal(), {
        rootMargin: '0px 0px 16px 0px',
        threshold: 1,
      }),
    ]
    observers.forEach((observer) => observer.observe(el))

    // Failsafe for anchor jumps and missed intersections: after 8s, show anything still held
    // back that already sits above the bottom of the viewport.
    const failsafe = window.setTimeout(() => {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal()
    }, FAILSAFE_MS)

    return () => {
      observers.forEach((observer) => observer.disconnect())
      window.clearTimeout(failsafe)
      window.clearTimeout(finishTimer)
      delete el.dataset.reveal
    }
  }, [delay, staggered])

  const Tag = as as 'div'
  const vars = { '--reveal-delay': `${delay}ms`, '--reveal-stagger': staggerValue, ...style } as CSSProperties
  return (
    <Tag ref={setRef} className={cx(styles.root, staggered && styles.stagger, className)} style={vars} {...rest}>
      {children}
    </Tag>
  )
}
