import type { ReactNode } from 'react'
import type { DropStatus, PieceStatus } from '../data/types'
import { cx } from '../lib/cx'
import styles from './StatusChip.module.css'

export type ChipStatus = PieceStatus | DropStatus

export interface StatusChipProps {
  status: ChipStatus
  /** The words, specific to the moment: "Live until Sunday", "Last one", "Veiled until Thursday". */
  children: ReactNode
  className?: string
}

/** Marks that carry a dot; sold-out and archived are text-only. */
const MARK: Partial<Record<ChipStatus, 'dot' | 'ring'>> = {
  live: 'dot',
  'last-pieces': 'dot',
  veiled: 'ring',
}

/**
 * Status encoded in form, never colour alone (DESIGN §2): live = garnet dot, veiled = hollow
 * ring, last pieces = garnet dot + brighter label, sold out = struck through, archived = dimmed.
 * An uppercase label, no pill background.
 */
export function StatusChip({ status, children, className }: StatusChipProps) {
  const mark = MARK[status]
  return (
    <span className={cx('t-label', styles.root, styles[status], className)}>
      {mark ? <span className={cx(styles.mark, styles[mark])} aria-hidden="true" /> : null}
      <span className={styles.text}>{children}</span>
    </span>
  )
}
