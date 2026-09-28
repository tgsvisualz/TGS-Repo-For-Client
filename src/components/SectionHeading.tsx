import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './SectionHeading.module.css'

export interface SectionHeadingProps {
  /** Small uppercase line above the title ("The next drop"). */
  eyebrow?: ReactNode
  /** The heading. One italic accent at most: <>Luxury, <em>unnamed.</em></> */
  title: ReactNode
  /** Lede paragraph under the title, capped at the reading measure. */
  lede?: ReactNode
  /** Heading level. Default 'h2'. */
  as?: 'h1' | 'h2' | 'h3'
  /** id on the heading element, for <section aria-labelledby>. */
  titleId?: string
  className?: string
}

/** Left-aligned eyebrow / display title / lede stack, spaced from the tokens. */
export function SectionHeading({ eyebrow, title, lede, as: Tag = 'h2', titleId, className }: SectionHeadingProps) {
  return (
    <div className={cx(styles.root, className)}>
      {eyebrow ? <p className={cx('t-label', styles.eyebrow)}>{eyebrow}</p> : null}
      <Tag id={titleId} className={cx('t-display-m', styles.title)}>
        {title}
      </Tag>
      {lede ? <p className={cx('t-body-l', styles.lede)}>{lede}</p> : null}
    </div>
  )
}
