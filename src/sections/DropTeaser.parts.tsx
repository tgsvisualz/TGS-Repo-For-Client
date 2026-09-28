import { Icon } from '../components'
import { COPY, dropCode } from '../data/catalog'
import { cx } from '../lib'
import styles from './DropTeaser.parts.module.css'

export interface VeilProps {
  /** Show "Veiled until Thursday" under the icon. Narrow slots hide the words on their own. */
  label?: boolean
  className?: string
}

/**
 * The frosted veil laid over a veiled piece, as a child of its <Placeholder>. It is static;
 * inside an element carrying data-cursor="peek" it lifts partly on hover (fine pointers) and
 * on keyboard focus: the "peek". Decorative: the card's own label says it is veiled.
 */
export function Veil({ label = true, className }: VeilProps) {
  return (
    <span className={cx(styles.veil, className)} aria-hidden="true">
      <span className={styles.mark}>
        <Icon name="eye-off" size={16} />
        {label ? <span className={cx('t-label', styles.words)}>{COPY.drop.veiledLabel}</span> : null}
      </span>
    </span>
  )
}

export interface DropNumberProps {
  number: number
  className?: string
}

/**
 * "N° 014": a small italic numero sign hung beside the numerals. Assistive tech reads
 * "Drop 014". Size it with font-size on `className`; everything inside scales in em.
 */
export function DropNumber({ number, className }: DropNumberProps) {
  return (
    <span className={cx(styles.number, className)}>
      <span className="visually-hidden">Drop </span>
      <span className={styles.numero} aria-hidden="true">
        N°
      </span>
      <span className={styles.code}>{dropCode(number)}</span>
    </span>
  )
}
