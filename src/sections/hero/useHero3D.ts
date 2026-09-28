import { useCallback, useState, useSyncExternalStore, type RefObject } from 'react'
import { BREAKPOINTS, FEATURES } from '../../config'
import { HERO_3D_BUILD_ENABLED, type Hero3DQuality } from '../../hero3d'
import { canUseWebGL, readPref, useInView, useMediaQuery, usePrefersReducedMotion, writePref } from '../../lib'

/** The visitor's stored choice. 'auto' = 3D unless they prefer reduced motion. */
export type HeroMode = 'auto' | '3d' | 'still'

/** Mirrored on the section as data-hero3d. */
export type Hero3DState = 'off' | 'loading' | 'ready' | 'failed'

const PREF_KEY = 'hero-mode'

interface NavigatorHints {
  connection?: { saveData?: boolean }
  deviceMemory?: number
}

const hints = (): NavigatorHints => (typeof navigator === 'undefined' ? {} : (navigator as Navigator & NavigatorHints))

function readMode(): HeroMode {
  const stored = readPref(PREF_KEY)
  return stored === '3d' || stored === 'still' ? stored : 'auto'
}

/** `?3d=on|off` overrides the stored mode for this visit only. Read once. */
function readUrlOverride(): 'on' | 'off' | null {
  try {
    const value = new URLSearchParams(window.location.search).get('3d')
    return value === 'on' || value === 'off' ? value : null
  } catch {
    return null
  }
}

/**
 * Whether this visit could run the showroom at all. Cheapest checks first, so no WebGL probe
 * context is ever created while the feature or the build flag is off.
 */
function detectPossible(): boolean {
  if (!FEATURES.hero3d || !HERO_3D_BUILD_ENABLED) return false
  if (hints().connection?.saveData) return false
  return canUseWebGL()
}

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}
const isPageVisible = () => document.visibilityState === 'visible'
const serverVisible = () => true

export interface Hero3D {
  /** Feature on, build includes the chunk, WebGL available and no data saver: the toggle shows. */
  possible: boolean
  /** The 3D layer is mounted (or loading). */
  enabled: boolean
  state: Hero3DState
  /** Changes on every fresh mount; key the layer on it so a remount starts clean. */
  mountKey: number
  quality: Hero3DQuality
  /** Hero on screen and tab visible: the showroom renders, the still stage animates. */
  active: boolean
  reducedMotion: boolean
  coarsePointer: boolean
  onReady: () => void
  onError: (error: unknown) => void
  /** The 3D / Still toggle: persists the choice and drops any URL override. */
  choose: (mode: '3d' | 'still') => void
}

/**
 * The hero's 3D state machine.
 *
 *   off ──enable──▶ loading ──onReady──▶ ready
 *    ▲                │  └──────onError / render throw──▶ failed (sticky for this page view)
 *    └────disable─────┴──────────────── (from loading or ready)
 *
 * enabled = possible && !failed && (?3d=on | ?3d=off | mode '3d' | mode 'auto' && !reducedMotion).
 * Each enable is a new mount generation, so an onReady from an unmounted showroom can never
 * mark a newer mount ready.
 */
export function useHero3D(sectionRef: RefObject<HTMLElement | null>): Hero3D {
  const [possible] = useState(detectPossible)
  const [lowMemory] = useState(() => (hints().deviceMemory ?? 8) <= 4)
  const [override, setOverride] = useState(readUrlOverride)
  const [mode, setMode] = useState(readMode)
  const [failed, setFailed] = useState(false)

  const reducedMotion = usePrefersReducedMotion()
  const coarsePointer = useMediaQuery('(pointer: coarse)')
  const narrow = useMediaQuery(`(max-width: ${BREAKPOINTS.lite3d - 0.02}px)`)
  const inView = useInView(sectionRef, { threshold: 0 })
  const pageVisible = useSyncExternalStore(subscribeVisibility, isPageVisible, serverVisible)

  const wanted =
    override === 'on' ? true : override === 'off' ? false : mode === '3d' || (mode === 'auto' && !reducedMotion)
  const enabled = possible && !failed && wanted

  // A new generation each time the layer mounts (adjusting state while rendering, per the
  // React docs, so the first commit of a new mount already carries its own generation).
  const [mountKey, setMountKey] = useState(0)
  const [readyKey, setReadyKey] = useState(-1)
  const [wasEnabled, setWasEnabled] = useState(enabled)
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled)
    if (enabled) setMountKey((key) => key + 1)
  }

  const onReady = useCallback(() => setReadyKey(mountKey), [mountKey])
  const onError = useCallback((error: unknown) => {
    if (import.meta.env.DEV) console.warn('[hero] 3D showroom unavailable; showing the still showroom.', error)
    setFailed(true)
  }, [])
  const choose = useCallback((next: '3d' | 'still') => {
    setOverride(null)
    setMode(next)
    writePref(PREF_KEY, next)
  }, [])

  const state: Hero3DState = failed ? 'failed' : !enabled ? 'off' : readyKey === mountKey ? 'ready' : 'loading'

  return {
    possible,
    enabled,
    state,
    mountKey,
    quality: coarsePointer || narrow || lowMemory ? 'lite' : 'high',
    active: inView && pageVisible,
    reducedMotion,
    coarsePointer,
    onReady,
    onError,
    choose,
  }
}
