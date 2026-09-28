import { cx } from '../lib/cx'
import styles from './Wordmark.module.css'

export type WordmarkSize = 'nav' | 'display' | 'footer'

export interface WordmarkProps {
  size?: WordmarkSize
  as?: 'span' | 'p' | 'h1' | 'div'
  className?: string
}

/**
 * VELATO, set wide in the display face, with a sheer veil drawn across the upper part of the
 * capitals. The veil is a CSS pseudo-element; the element's text stays the real, selectable
 * word "Velato", which is what assistive tech reads.
 *
 * It is inline-block and cancels its trailing letter-spacing, so it sits flush left and centres
 * truly under flex/grid/text-align centring (don't centre it with margin-inline: auto).
 */
export function Wordmark({ size = 'nav', as: Tag = 'span', className }: WordmarkProps) {
  return <Tag className={cx(styles.root, styles[size], className)}>Velato</Tag>
}
