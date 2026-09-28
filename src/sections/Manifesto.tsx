import { Fragment, type CSSProperties } from 'react'
import { Reveal } from '../components'
import { COPY } from '../data/catalog'
import { cx } from '../lib'
import styles from './Manifesto.module.css'

const WORDS = COPY.veil.body.split(/\s+/)
const LAST = Math.max(1, WORDS.length - 1)

/**
 * The Veil: a dictionary gloss, then the manifesto set large. Where scroll-driven animations
 * exist (and motion is welcome) each word brightens from shadow as the paragraph crosses the
 * viewport; everywhere else the text is simply shown. Screen readers get the plain sentence.
 */
export function Manifesto() {
  return (
    <section id="the-veil" aria-labelledby="the-veil-title" className={cx('section', styles.root)}>
      <div className={cx('container', styles.grid)}>
        <h2 id="the-veil-title" className={cx('t-label', styles.label)}>
          The Veil
        </h2>

        <Reveal as="p" className={styles.gloss}>
          <i lang="it" className={cx('t-accent', styles.headword)}>
            {COPY.veil.word}
          </i>
          <span lang="it" className={styles.syllables} aria-hidden="true">
            {COPY.veil.syllables}
          </span>
          <span className={cx('t-accent', styles.pos)}>Italian, adj.</span>
          <span className={styles.meaning}>{COPY.veil.meaning}</span>
        </Reveal>

        <p className={styles.body}>
          <span className="visually-hidden">{COPY.veil.body}</span>
          <span aria-hidden="true">
            {WORDS.map((word, i) => (
              <Fragment key={i}>
                <span className={styles.word} style={{ '--p': (i / LAST).toFixed(3) } as CSSProperties}>
                  {word}
                </span>
                {i < LAST ? ' ' : null}
              </Fragment>
            ))}
          </span>
        </p>

        <Reveal className={styles.coda}>
          <p className="t-label">No faces · No logos · No names</p>
        </Reveal>
      </div>
    </section>
  )
}
