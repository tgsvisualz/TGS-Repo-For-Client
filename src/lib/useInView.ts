import { useEffect, useState, type RefObject } from 'react'

export interface InViewOptions {
  /** Stop observing after the first entry; the value then stays true. */
  once?: boolean
  rootMargin?: string
  threshold?: number | number[]
}

const hasIntersectionObserver = () => typeof window !== 'undefined' && 'IntersectionObserver' in window

/**
 * Whether the element behind `ref` intersects the viewport. The ref must be attached on mount.
 * Always true where IntersectionObserver is unsupported, so gated content still shows.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { once = false, rootMargin = '0px', threshold = 0 }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(() => !hasIntersectionObserver())
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasIntersectionObserver()) return
    const thresholds = thresholdKey.split(',').map(Number)
    const minRatio = Math.min(...thresholds)
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        if (entry.isIntersecting && entry.intersectionRatio >= minRatio) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold: thresholds },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, once, rootMargin, thresholdKey])

  return inView
}
