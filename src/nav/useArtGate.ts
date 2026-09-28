import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { NavItem } from '../data/types'
import { getCategory } from '../data/catalog'

/** Which placeholder art a panel may render yet. */
export interface ArtGate {
  has: (assetId: string) => boolean
  /** Mount these now (on demand: the panel or row the visitor is reaching for). */
  request: (assetIds: readonly string[]) => void
}

/** The art a panel shows first: the cards, or a category's first preview. */
export function primaryAssets(item: NavItem): string[] {
  switch (item.layout) {
    case 'cards':
      return item.cards.map((card) => card.assetId)
    case 'list-preview':
      return [getCategory(item.id).subcategories[0].assetId]
    case 'list':
      return []
  }
}

/** Every panel's first view, then the remaining previews. */
export function warmOrder(items: readonly NavItem[]): string[] {
  const first = items.flatMap(primaryAssets)
  const rest = items.flatMap((item) =>
    item.layout === 'list-preview' ? getCategory(item.id).subcategories.slice(1).map((sub) => sub.assetId) : [],
  )
  return [...first, ...rest]
}

function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: 700 })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(callback, 50)
  return () => window.clearTimeout(handle)
}

/**
 * The mega-dropdown holds 22 SVG placeholders (~9,500 nodes). Mounting them in one go on the
 * first hover blocked the main thread for hundreds of ms, so the art mounts progressively:
 * on demand for what the visitor is reaching for, and one piece per idle slot for the rest
 * (`warm`, started on the first nav hover/focus). First paint never pays for any of it.
 */
export function useArtGate(order: readonly string[]) {
  const [ready, setReady] = useState<ReadonlySet<string>>(() => new Set())
  const readyRef = useRef(ready)
  const warming = useRef(false)
  const cancel = useRef<(() => void) | null>(null)

  useEffect(() => {
    readyRef.current = ready
  }, [ready])

  const request = useCallback((assetIds: readonly string[]) => {
    if (!assetIds.length) return
    setReady((current) => {
      if (assetIds.every((id) => current.has(id))) return current
      const next = new Set(current)
      assetIds.forEach((id) => next.add(id))
      return next
    })
  }, [])

  const warm = useCallback(() => {
    if (warming.current) return
    warming.current = true
    let index = 0
    const step = () => {
      while (index < order.length && readyRef.current.has(order[index])) index += 1
      if (index >= order.length) {
        cancel.current = null
        return
      }
      request([order[index]])
      index += 1
      cancel.current = onIdle(step)
    }
    cancel.current = onIdle(step)
  }, [order, request])

  useEffect(() => () => cancel.current?.(), [])

  const gate = useMemo<ArtGate>(() => ({ has: (id) => ready.has(id), request }), [ready, request])
  return { gate, warm }
}
