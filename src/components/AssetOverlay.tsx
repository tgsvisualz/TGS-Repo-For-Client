import { useEffect } from 'react'

const CLASS = 'show-asset-ids'
const HASH = '#assets'

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.matches('input, textarea, select')
}

/**
 * No UI. Prints every placeholder's asset ID on the page (styled in base.css) so the client
 * can match slots to ASSETS.md: Shift+A toggles it (ignored while typing), and #assets in the
 * URL turns it on, on load and on hashchange.
 */
export function AssetOverlay() {
  useEffect(() => {
    const root = document.documentElement
    let lastHash = location.hash

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      if (event.key.toLowerCase() !== 'a' || isTyping(event.target)) return
      root.classList.toggle(CLASS)
    }

    const onHashChange = () => {
      if (location.hash === HASH) root.classList.add(CLASS)
      else if (lastHash === HASH) root.classList.remove(CLASS)
      lastHash = location.hash
    }

    if (location.hash === HASH) root.classList.add(CLASS)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('hashchange', onHashChange)
      root.classList.remove(CLASS)
    }
  }, [])

  return null
}
