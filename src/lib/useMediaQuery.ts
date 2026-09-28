import { useCallback, useSyncExternalStore } from 'react'

const lists = new Map<string, MediaQueryList>()

/** One shared MediaQueryList per query; null where matchMedia is missing (server, old engines). */
function getList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  let list = lists.get(query)
  if (!list) {
    list = window.matchMedia(query)
    lists.set(query, list)
  }
  return list
}

/** Non-hook read, for effects and event handlers. False when matchMedia is missing. */
export function matchesMedia(query: string): boolean {
  return getList(query)?.matches ?? false
}

const noop = () => {}
const serverSnapshot = () => false

/**
 * Live `matchMedia` result. On the client the first render already has the real value
 * (no flash); it is false on the server and wherever matchMedia is missing.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = getList(query)
      if (!list) return noop
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = useCallback(() => matchesMedia(query), [query])
  return useSyncExternalStore(subscribe, getSnapshot, serverSnapshot)
}
