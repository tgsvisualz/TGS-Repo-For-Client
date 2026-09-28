import { Wordmark } from '../components'

/** STUB (foundation): the nav feature replaces this with the glass header and mega-dropdown. */
export function SiteHeader() {
  return (
    <header
      style={{
        position: 'fixed',
        insetBlockStart: 0,
        insetInline: 0,
        zIndex: 'var(--z-header)',
        display: 'flex',
        alignItems: 'center',
        height: 'var(--header-h)',
        paddingInline: 'var(--gutter)',
      }}
    >
      <a href="#top">
        <Wordmark size="nav" />
      </a>
    </header>
  )
}
