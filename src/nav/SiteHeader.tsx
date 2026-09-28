import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { Button, Icon, Wordmark } from '../components'
import { BREAKPOINTS } from '../config'
import { useMediaQuery } from '../lib'
import { DesktopNav } from './DesktopNav'
import { MobileMenu } from './MobileMenu'
import styles from './SiteHeader.module.css'

/** Past this scroll offset the header leaves the hero and turns to glass. */
const SCROLLED_AT = 24

function useScrolled(threshold: number): boolean {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY >= threshold)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY >= threshold)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold])
  return scrolled
}

function Brand() {
  return (
    <a href="#top" className={styles.brand}>
      <Wordmark size="nav" />
    </a>
  )
}

function DesktopRow() {
  return (
    <>
      <Brand />
      <DesktopNav />
      <Button variant="pill" size="sm" href="#list" className={styles.cta}>
        Join the list
      </Button>
    </>
  )
}

interface MenuState {
  open: boolean
  /** Opened or closed from the keyboard: no animation (DESIGN §5). */
  instant: boolean
}

function MobileRow() {
  const [menu, setMenu] = useState<MenuState>({ open: false, instant: false })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const openMenu = (event: MouseEvent) => setMenu({ open: true, instant: event.detail === 0 })
  const closeMenu = useCallback((instant: boolean, restoreFocus: boolean) => {
    setMenu({ open: false, instant })
    if (restoreFocus) buttonRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.menuButton}
        aria-haspopup="dialog"
        aria-expanded={menu.open}
        aria-controls={menuId}
        onClick={openMenu}
      >
        <Icon name="menu" size={20} />
        <span>Menu</span>
      </button>
      <Brand />
      <Button variant="pill" size="sm" href="#list" className={styles.cta} aria-label="Join the list">
        Join
      </Button>
      <MobileMenu id={menuId} open={menu.open} instant={menu.instant} onClose={closeMenu} />
    </>
  )
}

/**
 * The fixed site header. Transparent over the hero with a soft top scrim; glass once scrolled.
 * ≥ BREAKPOINTS.nav: wordmark · mega-dropdown triggers · "Join the list".
 * Below: Menu · wordmark · Join, with the full-screen menu.
 */
export function SiteHeader() {
  const desktop = useMediaQuery(`(min-width: ${BREAKPOINTS.nav}px)`)
  const scrolled = useScrolled(SCROLLED_AT)

  return (
    <header className={styles.header} data-scrolled={scrolled ? '' : undefined}>
      <div className={styles.row} data-header-row="" data-layout={desktop ? 'desktop' : 'mobile'}>
        {desktop ? <DesktopRow /> : <MobileRow />}
      </div>
    </header>
  )
}
