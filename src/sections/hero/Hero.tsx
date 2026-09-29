import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Button, Countdown, Icon, VisuallyHidden } from '../../components'
import { DATE_LOCALE } from '../../config'
import { COPY, dropCode, formatTime, getNextDropDate, NEXT_DROP_NUMBER } from '../../data/catalog'
import { cx } from '../../lib'
import { DEFAULT_FOCUS } from './cast'
import styles from './Hero.module.css'
import { HeroCast } from './HeroCast'
import { EyeStrip, LookIndex } from './HeroLooks'

/** Entrance order: each element rises in after the one before it. */
const step = (i: number) => ({ '--i': i }) as CSSProperties

/**
 * The hero: three masked models in one dark room (HeroCast), the text overlay, and the look
 * index. One model stands in the light at a time: the pointer, the look index or, left alone,
 * a slow rotation decides which. The eye strip above the headline follows her.
 * Section state for styling: data-paused while off screen or the tab is hidden.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [focus, setFocus] = useState(DEFAULT_FOCUS)
  const onFocus = useCallback((index: number) => setFocus(index), [])
  const paused = usePaused(sectionRef)

  const nextDrop = useMemo(() => getNextDropDate(), [])
  const code = dropCode(NEXT_DROP_NUMBER)
  const weekday = useMemo(() => new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' }).format(nextDrop), [nextDrop])

  return (
    <section
      ref={sectionRef}
      id="top"
      className={styles.hero}
      aria-labelledby="hero-title"
      data-paused={paused ? '' : undefined}
    >
      <HeroCast pointerTarget={sectionRef} focus={focus} onFocus={onFocus} paused={paused} />

      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.fog} aria-hidden="true" />

      <p className={cx(styles.vertical, styles.enter)} style={step(6)} aria-hidden="true">
        <span lang="it">Maschera</span> · Drop {code} · <span lang="it">Autunno</span> 2026
      </p>

      <div className={styles.overlay}>
        <div className={cx('container', styles.content)}>
          <EyeStrip focus={focus} className={cx(styles.strip, styles.enter)} style={step(0)} />
          <p className={cx('t-label', styles.eyebrow, styles.enter)} style={step(1)}>
            Drop {code} · Unveils {weekday}, {formatTime(nextDrop)}
          </p>
          <h1 id="hero-title" className={styles.title}>
            <span className={cx(styles.line, styles.enter)} style={step(2)}>
              {COPY.hero.titleLead}
            </span>{' '}
            <span className={cx(styles.line, styles.lineAccent, styles.enter)} style={step(3)}>
              <em>{COPY.hero.titleAccent}</em>
            </span>
          </h1>
          <p className={cx('t-body-l', styles.lede, styles.enter)} style={step(4)}>
            {COPY.hero.lede}
          </p>
          <div className={cx(styles.ctas, styles.enter)} style={step(5)}>
            <Button variant="pill" href="#drop" icon={<Icon name="arrow-right" />}>
              {COPY.hero.primaryCta}
            </Button>
            <Button variant="text" href="#list">
              {COPY.hero.secondaryCta}
            </Button>
          </div>
        </div>

        {/* The row's children enter one by one (never the row itself). */}
        <div className={cx('container', styles.bottom)}>
          <p className={cx(styles.countdown, styles.enter)} style={step(6)}>
            <span className={styles.countdownLabel}>Drop {code} in</span>{' '}
            <Countdown variant="inline" target={nextDrop} className={styles.timer} />
          </p>

          <a className={cx(styles.scroll, styles.enter)} style={step(6)} href="#the-veil">
            <span aria-hidden="true">(</span>
            <span className={styles.scrollWord}>{COPY.hero.scroll}</span>
            <VisuallyHidden> to The Veil</VisuallyHidden>
            <span aria-hidden="true">)</span>
          </a>

          <LookIndex focus={focus} onFocus={onFocus} className={cx(styles.looks, styles.enter)} style={step(7)} />
        </div>
      </div>
    </section>
  )
}

/** True while the hero is off screen or the tab is hidden (idle motion pauses). */
function usePaused(ref: RefObject<HTMLElement | null>): boolean {
  const [offscreen, setOffscreen] = useState(false)
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden)

  useEffect(() => {
    const el = ref.current
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    let observer: IntersectionObserver | undefined
    if (el && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => setOffscreen(!entry?.isIntersecting), { threshold: 0.15 })
      observer.observe(el)
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      observer?.disconnect()
    }
  }, [ref])

  return offscreen || hidden
}
