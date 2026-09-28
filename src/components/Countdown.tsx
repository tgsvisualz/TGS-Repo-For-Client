import { Fragment, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { useCountdown, type CountdownParts } from '../lib/useCountdown'
import styles from './Countdown.module.css'

export interface CountdownProps {
  target: Date
  /** large: display numerals with unit captions. inline: compact "2d 14:09:33". Default 'large'. */
  variant?: 'inline' | 'large'
  className?: string
}

type UnitKey = 'days' | 'hours' | 'minutes' | 'seconds'

const UNITS: { key: UnitKey; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`

/** Spoken label, at minute granularity so it changes at most once a minute. */
function describe({ days, hours, minutes }: CountdownParts): string {
  const units = [
    days > 0 && plural(days, 'day'),
    hours > 0 && plural(hours, 'hour'),
    minutes > 0 && plural(minutes, 'minute'),
  ].filter((unit): unit is string => Boolean(unit))
  if (!units.length) return 'Unveils in under a minute'
  const last = units.pop()
  return `Unveils in ${units.length ? `${units.join(', ')} and ${last}` : last}`
}

/** Each digit in its own fixed-width box, so nothing shifts as the seconds tick. */
function Digits({ value, pad = 2 }: { value: number; pad?: number }) {
  const text = String(value).padStart(pad, '0')
  return (
    <span className={styles.digits}>
      {Array.from(text, (digit, i) => (
        <span key={i} className={styles.digit}>
          {digit}
        </span>
      ))}
    </span>
  )
}

/**
 * Live countdown to `target` in a <time role="timer">. The ticking digits are hidden from
 * assistive tech; the element's label ("Unveils in 2 days, 14 hours and 9 minutes") carries
 * the meaning and changes once a minute, with aria-live off so nothing is announced each second.
 */
export function Countdown({ target, variant = 'large', className }: CountdownProps) {
  const parts = useCountdown(target)
  const doneText = variant === 'large' ? 'Unveiled' : 'Now live'
  const label = parts.done ? doneText : describe(parts)

  let body: ReactNode
  if (parts.done) {
    body = <span className={styles.done}>{doneText}</span>
  } else if (variant === 'large') {
    body = UNITS.map(({ key, label: unit }, i) => (
      <Fragment key={key}>
        {i > 0 ? <span className={styles.sep}>:</span> : null}
        <span className={styles.unit}>
          <Digits value={parts[key]} />
          <span className={cx('t-label', styles.caption)}>{unit}</span>
        </span>
      </Fragment>
    ))
  } else {
    body = (
      <>
        {parts.days > 0 ? (
          <>
            <Digits value={parts.days} pad={1} />
            <span className={styles.dayMark}>d</span>
          </>
        ) : null}
        <Digits value={parts.hours} />
        <span className={styles.sep}>:</span>
        <Digits value={parts.minutes} />
        <span className={styles.sep}>:</span>
        <Digits value={parts.seconds} />
      </>
    )
  }

  return (
    <time
      className={cx(styles.root, styles[variant], className)}
      dateTime={target.toISOString()}
      role="timer"
      aria-live="off"
      aria-label={label}
    >
      <span className={cx(styles.face, variant === 'large' && !parts.done && styles.grid)} aria-hidden="true">
        {body}
      </span>
    </time>
  )
}
