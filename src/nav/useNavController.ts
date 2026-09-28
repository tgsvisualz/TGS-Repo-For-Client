import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { NavItemId } from '../data/types'
import { hasFinePointer } from '../lib'

/**
 * How the shared viewport reaches its next state:
 * - enter: scale in from the trigger (closed → open)
 * - glide: slide + resize to another trigger's panel (open → open), content cross-slides
 * - exit: scale down and fade (open → closed)
 * - instant: no animation (keyboard-initiated, resize)
 */
export type NavMotion = 'enter' | 'glide' | 'exit' | 'instant'
type Source = 'pointer' | 'click' | 'keyboard'

export interface NavSnapshot {
  /** Panel contents mount lazily, on the first hover or focus inside the nav, then stay mounted. */
  mounted: boolean
  /** The panel on show, or the one last shown while the viewport closes. */
  activeId: NavItemId | null
  open: boolean
  motion: NavMotion
  source: Source | null
  /** Move focus to the active panel's first link once it is open (keyboard opens). */
  focusFirst: boolean
  /** Bumped by every command, so the viewport effect runs exactly once per command. */
  seq: number
}

const INITIAL: NavSnapshot = {
  mounted: false,
  activeId: null,
  open: false,
  motion: 'instant',
  source: null,
  focusFirst: false,
  seq: 0,
}

/** Hover intent: open after this long on a trigger; close this long after leaving triggers + panel. */
const OPEN_DELAY = 70
const CLOSE_DELAY = 180
/** A click this soon after a hover-open confirms the panel rather than toggling it shut. */
const CLICK_GRACE = 450
/** The panel's left edge sits this far left of its trigger's left edge. */
const TRIGGER_INSET = 12
/** Viewport chrome around a panel: 1px border + 4px padding on each side (DesktopNav.module.css). */
const CHROME = 10

export const FOCUSABLE = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'

interface Geometry {
  x: number
  w: number
  h: number
  origin: number
}

function readMs(token: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return fallback
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value
}

/** The page gutter in px, read off the header row (padding-inline: var(--gutter)). */
function readGutter(from: Element | null): number {
  const row = from?.closest('[data-header-row]')
  const value = row ? Number.parseFloat(getComputedStyle(row).paddingLeft) : Number.NaN
  return Number.isFinite(value) ? value : 16
}

function sameGeometry(a: Geometry | null, b: Geometry): boolean {
  return !!a && a.x === b.x && a.w === b.w && a.h === b.h && a.origin === b.origin
}

/**
 * The mega-dropdown's state machine. One shared viewport shows one panel at a time:
 * hover intent opens it (70ms), moving between triggers glides it, leaving closes it (180ms).
 * The viewport's geometry and animation state are written straight to the DOM in a layout
 * effect (CSS custom properties + data attributes), so every transition starts from the
 * exact on-screen value and stays interruptible.
 */
export function useNavController(ids: readonly NavItemId[]) {
  const machine = useRef<NavSnapshot>(INITIAL)
  const [snapshot, setSnapshot] = useState<NavSnapshot>(INITIAL)

  const navRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const triggers = useRef(new Map<NavItemId, HTMLButtonElement>())
  const panels = useRef(new Map<NavItemId, HTMLElement>())
  /** The trigger order (a module constant, so it is read once). */
  const idsRef = useRef(ids)

  const openTimer = useRef(0)
  const closeTimer = useRef(0)
  const pendingId = useRef<NavItemId | null>(null)
  /** While the exit animation still shows, a new hover resumes (glides) instead of re-entering. */
  const closingUntil = useRef(0)
  const openedAt = useRef(0)
  const keyHandledAt = useRef(0)
  const lastGeometry = useRef<Geometry | null>(null)

  const api = useMemo(() => {
    const commit = (patch: Partial<NavSnapshot>) => {
      const next = { ...machine.current, ...patch, seq: machine.current.seq + 1 }
      machine.current = next
      setSnapshot(next)
    }

    const clearOpen = () => {
      window.clearTimeout(openTimer.current)
      openTimer.current = 0
      pendingId.current = null
    }
    const clearClose = () => {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = 0
    }
    const visible = () => machine.current.open || performance.now() < closingUntil.current

    const panelItems = (id: NavItemId): HTMLElement[] => {
      const panel = panels.current.get(id)
      return panel ? [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
    }

    const mount = () => {
      if (!machine.current.mounted) commit({ mounted: true })
    }

    const show = (id: NavItemId, source: Source, { instant = false, focusFirst = false } = {}) => {
      clearOpen()
      clearClose()
      const m = machine.current
      const same = m.open && m.activeId === id
      if (same && !instant && !focusFirst) return
      if (!same) {
        openedAt.current = performance.now()
        // Switching away from a panel that holds focus (pointer switch): keep focus on the nav.
        const previous = m.activeId ? panels.current.get(m.activeId) : null
        if (previous?.contains(document.activeElement)) triggers.current.get(id)?.focus({ preventScroll: true })
      }
      const motion: NavMotion = instant ? 'instant' : visible() ? 'glide' : 'enter'
      closingUntil.current = 0
      commit({
        mounted: true,
        activeId: id,
        open: true,
        motion,
        source: same && source === 'pointer' ? m.source : source,
        focusFirst,
      })
    }

    const hide = (instant: boolean) => {
      clearOpen()
      clearClose()
      if (!machine.current.open) return
      closingUntil.current = instant ? 0 : performance.now() + readMs('--dur-menu-exit', 150)
      commit({ open: false, motion: instant ? 'instant' : 'exit', focusFirst: false })
    }

    /** Hover intent only for real hovering pointers (mouse, pen), never touch. */
    const hoverPointer = (event: ReactPointerEvent) => event.pointerType !== 'touch' && hasFinePointer()

    const focusTrigger = (id: NavItemId) => {
      // Follow focus with the panel if one is open (keyboard: instant), then move focus.
      if (machine.current.open) show(id, 'keyboard', { instant: true })
      triggers.current.get(id)?.focus()
    }

    return {
      mount,
      hide,

      onZoneEnter(event: ReactPointerEvent) {
        mount()
        if (hoverPointer(event)) clearClose()
      },

      onZoneLeave(event: ReactPointerEvent) {
        if (!hoverPointer(event)) return
        clearOpen()
        const m = machine.current
        if (!m.open) return
        // A keyboard user's panel stays put while their focus is inside it.
        if (m.source === 'keyboard' && navRef.current?.contains(document.activeElement)) return
        clearClose()
        closeTimer.current = window.setTimeout(() => hide(false), CLOSE_DELAY)
      },

      onTriggerEnter(id: NavItemId, event: ReactPointerEvent) {
        if (!hoverPointer(event)) return
        clearClose()
        if (visible()) {
          show(id, 'pointer') // already open: switching is immediate
          return
        }
        if (pendingId.current === id) return
        clearOpen()
        pendingId.current = id
        openTimer.current = window.setTimeout(() => show(id, 'pointer'), OPEN_DELAY)
      },

      onTriggerLeave(id: NavItemId) {
        if (pendingId.current === id) clearOpen()
      },

      onTriggerFocus(id: NavItemId) {
        mount()
        const m = machine.current
        // Tabbing onto another trigger closes a keyboard-opened panel.
        if (m.open && m.activeId !== id && m.source === 'keyboard') hide(true)
      },

      onTriggerClick(id: NavItemId, event: ReactMouseEvent) {
        const keyboard = event.detail === 0
        // Enter/Space were already handled on keydown.
        if (keyboard && performance.now() - keyHandledAt.current < 500) return
        const m = machine.current
        if (m.open && m.activeId === id) {
          if (!keyboard && m.source === 'pointer' && performance.now() - openedAt.current < CLICK_GRACE) return
          hide(keyboard)
          return
        }
        show(id, keyboard ? 'keyboard' : 'click', { instant: keyboard, focusFirst: keyboard })
      },

      onTriggerKeyDown(id: NavItemId, event: ReactKeyboardEvent) {
        const list = idsRef.current
        const index = list.indexOf(id)
        const m = machine.current
        const openHere = m.open && m.activeId === id
        switch (event.key) {
          case 'Enter':
          case ' ':
            event.preventDefault()
            keyHandledAt.current = performance.now()
            if (openHere && m.source === 'keyboard') hide(true)
            else show(id, 'keyboard', { instant: true, focusFirst: true })
            break
          case 'ArrowDown':
            event.preventDefault()
            show(id, 'keyboard', { instant: true, focusFirst: true })
            break
          case 'ArrowRight':
            if (index < list.length - 1) {
              event.preventDefault()
              focusTrigger(list[index + 1])
            }
            break
          case 'ArrowLeft':
            if (index > 0) {
              event.preventDefault()
              focusTrigger(list[index - 1])
            }
            break
          case 'Home':
            event.preventDefault()
            focusTrigger(list[0])
            break
          case 'End':
            event.preventDefault()
            focusTrigger(list[list.length - 1])
            break
          case 'Escape':
            if (m.open) {
              event.preventDefault()
              hide(true)
            }
            break
          case 'Tab':
            // The panels live in one viewport after all triggers: Tab from an open trigger goes into its panel.
            if (!event.shiftKey && openHere) {
              const first = panelItems(id)[0]
              if (first) {
                event.preventDefault()
                first.focus()
              }
            }
            break
        }
      },

      onPanelKeyDown(event: ReactKeyboardEvent) {
        const m = machine.current
        const id = m.activeId
        if (!id || !m.open) return
        const items = panelItems(id)
        const i = items.indexOf(document.activeElement as HTMLElement)
        const trigger = triggers.current.get(id)
        switch (event.key) {
          case 'Escape':
            event.preventDefault()
            hide(true)
            trigger?.focus()
            break
          case 'ArrowDown':
            if (i < items.length - 1) {
              event.preventDefault()
              items[i + 1].focus()
            }
            break
          case 'ArrowUp':
            event.preventDefault()
            if (i > 0) items[i - 1].focus()
            else trigger?.focus()
            break
          case 'Tab': {
            if (event.shiftKey && i === 0) {
              event.preventDefault()
              trigger?.focus()
            } else if (!event.shiftKey && i === items.length - 1) {
              // Past the last link: close and continue to the next trigger. After the last
              // trigger's panel the natural Tab order continues to the pill (focusout closes).
              const next = idsRef.current[idsRef.current.indexOf(id) + 1]
              if (next) {
                event.preventDefault()
                hide(true)
                triggers.current.get(next)?.focus()
              }
            }
            break
          }
        }
      },

      onPanelClick(event: ReactMouseEvent) {
        // Any link inside closes the panel; the browser then follows the in-page anchor.
        if ((event.target as Element).closest('a[href]')) hide(event.detail === 0)
      },

      onNavBlur(event: ReactFocusEvent) {
        const next = event.relatedTarget as Node | null
        if (next && navRef.current?.contains(next)) return
        const m = machine.current
        if (!m.open) return
        // A hover-opened panel belongs to the pointer; losing focus to nowhere doesn't close it.
        if (!next && m.source === 'pointer') return
        hide(true)
      },

      /** Stable callback refs, one per id. */
      triggerRef: (() => {
        const cache = new Map<NavItemId, (el: HTMLButtonElement | null) => void>()
        return (id: NavItemId) => {
          let ref = cache.get(id)
          if (!ref) {
            ref = (el) => {
              if (el) triggers.current.set(id, el)
              else triggers.current.delete(id)
            }
            cache.set(id, ref)
          }
          return ref
        }
      })(),

      panelRef: (() => {
        const cache = new Map<NavItemId, (el: HTMLElement | null) => void>()
        return (id: NavItemId) => {
          let ref = cache.get(id)
          if (!ref) {
            ref = (el) => {
              if (el) panels.current.set(id, el)
              else panels.current.delete(id)
            }
            cache.set(id, ref)
          }
          return ref
        }
      })(),
    }
  }, [])

  /** Where the viewport should sit for panel `id`, relative to its containing block (the header). */
  const measure = (id: NavItemId): Geometry | null => {
    const vp = viewportRef.current
    const trigger = triggers.current.get(id)
    const panel = panels.current.get(id)
    if (!vp || !trigger || !panel) return null
    const box = (vp.offsetParent as HTMLElement | null)?.getBoundingClientRect()
    const t = trigger.getBoundingClientRect()
    const w = panel.offsetWidth + CHROME
    const h = panel.offsetHeight + CHROME
    const gutter = readGutter(navRef.current)
    const maxLeft = document.documentElement.clientWidth - gutter - w
    const left = Math.round(Math.max(gutter, Math.min(t.left - TRIGGER_INSET, maxLeft)))
    return {
      x: left - Math.round(box?.left ?? 0),
      w,
      h,
      // Scale from the trigger: the origin sits under the trigger's centre.
      origin: Math.round(t.left + t.width / 2 - left),
    }
  }

  const apply = (vp: HTMLElement, g: Geometry) => {
    lastGeometry.current = g
    vp.style.setProperty('--vp-x', `${g.x}px`)
    vp.style.setProperty('--vp-w', `${g.w}px`)
    vp.style.setProperty('--vp-h', `${g.h}px`)
    vp.style.setProperty('--vp-origin', `${g.origin}px`)
  }

  // Drive the viewport from each command.
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const { open, activeId, motion, focusFirst } = snapshot
    if (open && activeId) {
      const g = measure(activeId)
      if (g) {
        if (motion === 'enter') {
          // Snap to the from-state at the new position, commit it, then transition to open.
          vp.dataset.motion = 'none'
          vp.dataset.state = 'pre'
          apply(vp, g)
          void vp.offsetWidth
          vp.dataset.motion = 'enter'
        } else {
          vp.dataset.motion = motion === 'instant' ? 'none' : 'glide'
          apply(vp, g)
        }
        vp.dataset.state = 'open'
      }
      if (focusFirst) {
        panels.current.get(activeId)?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true })
      }
    } else {
      vp.dataset.motion = motion === 'instant' ? 'none' : 'exit'
      vp.dataset.state = 'closed'
    }
    // measure/apply only read refs: the snapshot is this effect's single trigger.
  }, [snapshot])

  // Panel content can change size after mount (fonts, countdown): keep the viewport fitted.
  useEffect(() => {
    if (!snapshot.mounted || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const m = machine.current
      const vp = viewportRef.current
      if (!m.open || !m.activeId || !vp) return
      const g = measure(m.activeId)
      if (g && !sameGeometry(lastGeometry.current, g)) apply(vp, g)
    })
    panels.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [snapshot.mounted])

  // While open: follow resize/scroll, close on outside press and Escape (focus anywhere).
  useEffect(() => {
    if (!snapshot.open) return
    let frame = 0
    const reposition = () => {
      frame = 0
      const m = machine.current
      const vp = viewportRef.current
      if (!m.open || !m.activeId || !vp) return
      const g = measure(m.activeId)
      if (!g || sameGeometry(lastGeometry.current, g)) return
      vp.dataset.motion = 'none'
      apply(vp, g)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(reposition)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) api.hide(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) api.hide(true)
    }
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [snapshot.open, api])

  // Timers die with the nav (e.g. crossing below the desktop breakpoint).
  useEffect(
    () => () => {
      window.clearTimeout(openTimer.current)
      window.clearTimeout(closeTimer.current)
    },
    [],
  )

  return { snapshot, navRef, viewportRef, ...api }
}
