import type { ReactElement } from 'react'
import { cx } from '../lib/cx'
import styles from './Icon.module.css'

export type IconName =
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'plus'
  | 'minus'
  | 'close'
  | 'menu'
  | 'bag'
  | 'orbit'
  | 'eye-off'

/** Drawn on a 24 grid. Strokes stay 1.25px at every size (non-scaling), like a pen hairline. */
const GLYPHS: Record<IconName, ReactElement> = {
  'chevron-down': <path d="M7 10l5 5 5-5" />,
  'arrow-right': <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  'arrow-up-right': <path d="M7 17L17 7M8.5 7H17v8.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  menu: <path d="M4 9.5h16M4 14.5h16" />,
  bag: (
    <>
      <path d="M5.5 8.5h13l-1 11.5h-11z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </>
  ),
  orbit: (
    <>
      <path d="M3.14 11.22A9 4.5 0 0 1 20.46 10.46M20.63 8.06l-.17 2.4-2.33-.58" />
      <path d="M20.86 12.78A9 4.5 0 0 1 3.54 13.54M3.37 15.94l.17-2.4 2.33.58" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M4 4l16 16" />
    </>
  ),
}

export interface IconProps {
  name: IconName
  /** Rendered size in px (default 16). */
  size?: number
  className?: string
}

/** Decorative inline icon in currentColor. Name the control that holds it, never the icon. */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      className={cx(styles.icon, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  )
}
