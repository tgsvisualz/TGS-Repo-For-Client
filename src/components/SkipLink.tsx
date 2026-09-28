import styles from './SkipLink.module.css'

export interface SkipLinkProps {
  /** Default '#main' (the <main id="main" tabIndex={-1}> in App). */
  href?: string
  children?: string
}

/** First tab stop on the page: hidden until focused, then a bone pill top-left. */
export function SkipLink({ href = '#main', children = 'Skip to content' }: SkipLinkProps) {
  return (
    <a className={styles.root} href={href}>
      {children}
    </a>
  )
}
