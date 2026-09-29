import type { CSSProperties } from 'react'
import { cx } from '../../lib'
import { LOOKS, srcSet } from './cast'
import styles from './HeroLooks.module.css'

const total = String(LOOKS.length).padStart(2, '0')

/**
 * A letterboxed strip across the masked eyes of whichever model is in the light, captioned like
 * a contact-sheet frame. It cross-fades as the light moves. Decorative: the look index below
 * carries the same information for assistive tech.
 */
export function EyeStrip({ focus, className, style }: { focus: number; className?: string; style?: CSSProperties }) {
  const look = LOOKS[focus] ?? LOOKS[0]!
  return (
    <figure className={cx(styles.strip, className)} style={style} aria-hidden="true">
      <div className={styles.frame}>
        {LOOKS.map((l, i) => (
          <img
            key={l.slot}
            className={styles.eyes}
            src={l.src1x}
            srcSet={srcSet(l)}
            sizes="1100px"
            alt=""
            decoding="async"
            draggable={false}
            data-active={i === focus ? '' : undefined}
            style={{ '--cx': l.eyes.cx, '--cy': l.eyes.cy, '--bw': l.eyes.bw } as CSSProperties}
          />
        ))}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.code}>
          VLT·014 — Look {look.number} / {total}
        </span>
        <span key={look.slot} className={styles.name}>
          <i lang="it">{look.name}</i> <span className={styles.gloss}>{look.gloss}</span>
        </span>
      </figcaption>
    </figure>
  )
}

/** The three looks, left to right. Hover, focus or press one to put that model in the light. */
export function LookIndex({
  focus,
  onFocus,
  className,
  style,
}: {
  focus: number
  onFocus: (index: number) => void
  className?: string
  style?: CSSProperties
}) {
  return (
    <ol className={cx(styles.index, className)} style={style} aria-label="The looks">
      {LOOKS.map((look, i) => (
        <li key={look.slot}>
          <button
            type="button"
            className={styles.look}
            aria-pressed={i === focus}
            aria-label={`Look ${look.number}, ${look.name} (${look.gloss}): ${look.mask.toLowerCase()}`}
            onClick={() => onFocus(i)}
            onFocus={() => onFocus(i)}
            onPointerEnter={(event) => {
              if (event.pointerType !== 'touch') onFocus(i)
            }}
          >
            <span className={styles.num}>{look.number}</span>
            <i lang="it" className={styles.lookName}>
              {look.name}
            </i>
          </button>
        </li>
      ))}
    </ol>
  )
}
