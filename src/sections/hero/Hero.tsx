import { Suspense, useMemo, useRef, type CSSProperties } from 'react'
import { Button, Countdown, ErrorBoundary, Icon, VisuallyHidden } from '../../components'
import { DATE_LOCALE } from '../../config'
import { COPY, dropCode, formatTime, getNextDropDate, NEXT_DROP_NUMBER } from '../../data/catalog'
import { LazyShowroom } from '../../hero3d'
import { cx } from '../../lib'
import styles from './Hero.module.css'
import { HeroStill } from './HeroStill'
import { ModeToggle } from './ModeToggle'
import { useHero3D } from './useHero3D'

/** Entrance order: each element rises in after the one before it. */
const step = (i: number) => ({ '--i': i }) as CSSProperties

/**
 * The hero: the 2D still showroom, the lazily mounted 3D showroom over it (when possible and
 * wanted), and the text overlay. Section state for tests and styling:
 * data-hero3d = off | loading | ready | failed; data-cursor="orbit" once the 3D is live.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const hero3d = useHero3D(sectionRef)
  const ready = hero3d.state === 'ready'

  const nextDrop = useMemo(() => getNextDropDate(), [])
  const code = dropCode(NEXT_DROP_NUMBER)
  const weekday = useMemo(() => new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' }).format(nextDrop), [nextDrop])

  return (
    <section
      ref={sectionRef}
      id="top"
      className={styles.hero}
      aria-labelledby="hero-title"
      data-hero3d={hero3d.state}
      data-cursor={ready ? 'orbit' : undefined}
      data-paused={hero3d.active ? undefined : ''}
    >
      <HeroStill pointerTarget={sectionRef} receded={ready} paused={!hero3d.active} />

      {hero3d.enabled ? (
        <div className={styles.layer3d} aria-hidden="true">
          <ErrorBoundary key={hero3d.mountKey} fallback={null} onError={hero3d.onError}>
            <Suspense fallback={null}>
              <LazyShowroom
                quality={hero3d.quality}
                active={hero3d.active}
                pointerTarget={sectionRef}
                reducedMotion={hero3d.reducedMotion}
                onReady={hero3d.onReady}
                onError={hero3d.onError}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : null}

      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.fog} aria-hidden="true" />

      <div className={styles.overlay}>
        <div className={cx('container', styles.content)}>
          <p className={cx('t-label', styles.eyebrow, styles.enter)} style={step(0)}>
            Drop {code} · Unveils {weekday}, {formatTime(nextDrop)}
          </p>
          <h1 id="hero-title" className={styles.title}>
            <span className={cx(styles.line, styles.enter)} style={step(1)}>
              {COPY.hero.titleLead}
            </span>{' '}
            <span className={cx(styles.line, styles.lineAccent, styles.enter)} style={step(2)}>
              <em>{COPY.hero.titleAccent}</em>
            </span>
          </h1>
          <p className={cx('t-body-l', styles.lede, styles.enter)} style={step(3)}>
            {COPY.hero.lede}
          </p>
          <div className={cx(styles.ctas, styles.enter)} style={step(4)}>
            <Button variant="pill" href="#drop" icon={<Icon name="arrow-right" />}>
              {COPY.hero.primaryCta}
            </Button>
            <Button variant="text" href="#list">
              {COPY.hero.secondaryCta}
            </Button>
          </div>
        </div>

        {/* The row's children enter one by one (never the row itself: a transformed row would
            become the containing block of the toggle, which is absolutely placed on phones). */}
        <div className={cx('container', styles.bottom)}>
          <p className={cx(styles.countdown, styles.enter)} style={step(5)}>
            <span className={styles.countdownLabel}>Drop {code} in</span>{' '}
            <Countdown variant="inline" target={nextDrop} className={styles.timer} />
          </p>

          <a className={cx(styles.scroll, styles.enter)} style={step(5)} href="#the-veil">
            <span aria-hidden="true">(</span>
            <span className={styles.scrollWord}>{COPY.hero.scroll}</span>
            <VisuallyHidden> to The Veil</VisuallyHidden>
            <span aria-hidden="true">)</span>
          </a>

          <div className={styles.controls}>
            {ready ? (
              <p className={styles.hint}>
                <Icon name="orbit" size={18} />
                <span>{hero3d.coarsePointer ? COPY.hero.orbitHintTouch : COPY.hero.orbitHint}</span>
              </p>
            ) : null}
            {hero3d.possible ? (
              <ModeToggle
                state={hero3d.state}
                showing3d={hero3d.enabled}
                onChoose={hero3d.choose}
                className={cx(styles.toggle, styles.enter)}
                style={step(6)}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
