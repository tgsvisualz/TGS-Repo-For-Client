import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '../lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'pill' | 'ghost' | 'text'
export type ButtonSize = 'sm' | 'md'

interface ButtonOwnProps {
  /** pill: bone fill (primary). ghost: hairline outline. text: bare label with a drawn underline. */
  variant?: ButtonVariant
  size?: ButtonSize
  /** Trailing icon, e.g. <Icon name="arrow-right" />. Nudges 2px on hover. */
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps | 'href'> & {
    /** Renders an <a>. Stage one: in-page anchors only ("#drop"). */
    href: string
    ref?: Ref<HTMLAnchorElement>
  }

export type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
    href?: undefined
    ref?: Ref<HTMLButtonElement>
  }

export type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps

/**
 * The one button. With `href` it renders an <a>, otherwise a <button type="button">
 * (pass type="submit" in forms). Other props (onClick, aria-*, data-cursor…) pass through.
 */
export function Button({ variant = 'pill', size = 'md', icon, className, children, ...rest }: ButtonProps) {
  const classes = cx(styles.root, styles[variant], styles[size], className)
  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </>
  )

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...rest}>
        {content}
      </a>
    )
  }

  const { type = 'button', ...buttonRest } = rest
  return (
    <button className={classes} type={type} {...buttonRest}>
      {content}
    </button>
  )
}
