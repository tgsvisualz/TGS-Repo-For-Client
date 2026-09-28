import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type TransitionEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Button, Countdown, Icon, Placeholder, Wordmark } from '../components'
import { NAV_ITEMS, NEXT_DROP_NUMBER, dropCode, getCategory, getNextDropDate } from '../data/catalog'
import type { NavItem, NavItemId } from '../data/types'
import styles from './MobileMenu.module.css'

export interface MobileMenuProps {
  id: string
  open: boolean
  /** The open/close came from the keyboard: apply it without animation. */
  instant: boolean
  onClose: (instant: boolean, restoreFocus: boolean) => void
}

type Phase = 'closed' | 'enter' | 'open' | 'exit'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function readMs(token: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value
}

const isShown = (el: HTMLElement) => el.getClientRects().length > 0

const indexStyle = (name: '--i' | '--j', value: number) => ({ [name]: value }) as CSSProperties

function CategoryRows({ item }: { item: Extract<NavItem, { layout: 'list-preview' }> }) {
  const category = getCategory(item.id)
  return (
    <ul role="list" className={styles.subList}>
      {category.subcategories.map((sub, j) => (
        <li key={sub.id} style={indexStyle('--j', j)}>
          <a href={sub.href} className={styles.subRow}>
            <Placeholder assetId={sub.assetId} ratio={1} decorative className={styles.thumb} />
            <span className={styles.subText}>
              <span className={styles.subLabel}>{sub.label}</span>
              <span className={styles.subDesc}>{sub.description}</span>
            </span>
          </a>
        </li>
      ))}
      <li style={indexStyle('--j', category.subcategories.length)}>
        <a href={item.viewAll.href} className={styles.viewAll}>
          <span>
            {item.viewAll.label}
            {item.viewAll.description ? <span className={styles.viewAllMeta}> · {item.viewAll.description}</span> : null}
          </span>
          <Icon name="arrow-right" size={16} />
        </a>
      </li>
    </ul>
  )
}

function ItemContent({ item }: { item: NavItem }) {
  switch (item.layout) {
    case 'cards':
      return (
        <ul role="list" className={styles.cards}>
          {item.cards.map((card, j) => (
            <li key={card.assetId} style={indexStyle('--j', j)}>
              <a href={card.href} className={styles.card}>
                <Placeholder assetId={card.assetId} ratio={4 / 5} decorative className={styles.cardArt}>
                  <span className={styles.cardCaption}>
                    <span className={styles.cardTitle}>{card.title}</span>
                    <span className={styles.cardDesc}>{card.description}</span>
                  </span>
                </Placeholder>
              </a>
            </li>
          ))}
        </ul>
      )
    case 'list-preview':
      return <CategoryRows item={item} />
    case 'list':
      return (
        <ul role="list" className={styles.links}>
          {item.links.map((link, j) => (
            <li key={link.label} style={indexStyle('--j', j)}>
              <a href={link.href} className={styles.link}>
                <span className={styles.linkLabel}>{link.label}</span>
                {link.description ? <span className={styles.linkDesc}>{link.description}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      )
  }
}

function MenuItem({
  item,
  index,
  expanded,
  onToggle,
}: {
  item: NavItem
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const regionId = useId()
  return (
    <li className={styles.item} style={indexStyle('--i', index)}>
      <button
        type="button"
        className={styles.itemButton}
        aria-expanded={expanded}
        aria-controls={regionId}
        onClick={onToggle}
      >
        <span className={styles.itemLabel}>{item.label}</span>
        <Icon name={expanded ? 'minus' : 'plus'} size={18} className={styles.itemIcon} />
      </button>
      <div id={regionId} className={styles.region} hidden={!expanded}>
        <ItemContent item={item} />
      </div>
    </li>
  )
}

function MenuBody() {
  const nextDrop = useMemo(() => getNextDropDate(), [])
  const [expanded, setExpanded] = useState<ReadonlySet<NavItemId>>(() => new Set())
  const toggle = (id: NavItemId) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <nav aria-label="Primary" className={styles.nav}>
        <ul role="list" className={styles.list}>
          {NAV_ITEMS.map((item, index) => (
            <MenuItem
              key={item.id}
              item={item}
              index={index}
              expanded={expanded.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </ul>
      </nav>

      <div className={styles.foot} style={indexStyle('--i', NAV_ITEMS.length)}>
        <p className={styles.drop}>
          <span className="t-label">Drop {dropCode(NEXT_DROP_NUMBER)} in</span>
          <Countdown variant="inline" target={nextDrop} className={styles.countdown} />
        </p>
        <Button variant="pill" href="#list">
          Join the list
        </Button>
      </div>
    </>
  )
}

/**
 * The full-screen menu below BREAKPOINTS.nav: a modal dialog that drops in from the top.
 * Traps focus, locks page scroll, Esc closes and returns focus to the Menu button, and any
 * link closes it and then lets the browser follow its in-page anchor.
 */
export function MobileMenu({ id, open, instant, onClose }: MobileMenuProps) {
  const [phase, setPhase] = useState<Phase>('closed')
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const unlockRef = useRef<(() => void) | null>(null)

  // Follow `open` through the enter/exit phases.
  useLayoutEffect(() => {
    if (open) setPhase(instant ? 'open' : 'enter')
    else setPhase((current) => (current === 'closed' || instant ? 'closed' : 'exit'))
  }, [open, instant])

  // Enter: the from-state has been committed (forced style read), now run the transition.
  useLayoutEffect(() => {
    if (phase !== 'enter') return
    void dialogRef.current?.offsetHeight
    setPhase('open')
  }, [phase])

  // Exit: unmount once the drawer has left (transitionend, with a timer as a safety net).
  useEffect(() => {
    if (phase !== 'exit') return
    const timer = window.setTimeout(() => setPhase('closed'), readMs('--dur-drawer-exit', 280) + 80)
    return () => window.clearTimeout(timer)
  }, [phase])

  // While open: lock page scroll and make the page behind inert.
  useLayoutEffect(() => {
    if (!open) return
    const html = document.documentElement
    const app = document.getElementById('root')
    const previousOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    app?.setAttribute('inert', '')
    const unlock = () => {
      html.style.overflow = previousOverflow
      app?.removeAttribute('inert')
      unlockRef.current = null
    }
    unlockRef.current = unlock
    return () => unlockRef.current?.()
  }, [open])

  const shown = phase !== 'closed'
  // Focus moves in when the dialog appears (or reopens mid-exit).
  useEffect(() => {
    if (shown && open) closeRef.current?.focus({ preventScroll: true })
  }, [shown, open])

  /** Unlock synchronously first, so focus can return to the Menu button and anchors can scroll. */
  const requestClose = (closeInstantly: boolean, restoreFocus: boolean) => {
    unlockRef.current?.()
    onClose(closeInstantly, restoreFocus)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      requestClose(true, true)
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isShown)
    const first = items[0]
    const last = items[items.length - 1]
    if (!first || !last) return
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const onClick = (event: MouseEvent) => {
    if ((event.target as Element).closest('a[href]')) requestClose(event.detail === 0, false)
  }

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === dialogRef.current && phase === 'exit') setPhase('closed')
  }

  if (!shown) return null

  return createPortal(
    <div
      ref={dialogRef}
      id={id}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-state={phase}
      data-motion={instant ? 'none' : undefined}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onTransitionEnd={onTransitionEnd}
    >
      <div className={styles.top}>
        <a href="#top" className={styles.brand}>
          <Wordmark size="nav" />
        </a>
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          aria-label="Close menu"
          onClick={(event) => requestClose(event.detail === 0, true)}
        >
          <Icon name="close" size={22} />
        </button>
      </div>
      <MenuBody />
    </div>,
    document.body,
  )
}
