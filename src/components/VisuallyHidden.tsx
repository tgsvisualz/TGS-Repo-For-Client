import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3' | 'label'
  children?: ReactNode
}

/** Text for assistive tech only (uses the .visually-hidden utility). */
export function VisuallyHidden({ as = 'span', className, children, ...rest }: VisuallyHiddenProps) {
  const Tag = as as 'span'
  return (
    <Tag className={cx('visually-hidden', className)} {...rest}>
      {children}
    </Tag>
  )
}
