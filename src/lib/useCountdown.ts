import { useEffect, useMemo, useState } from 'react'

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  /** Milliseconds left, never negative. */
  totalMs: number
  done: boolean
}

const SECOND = 1000

/**
 * Pure split of the time left until `target`. Seconds round up, so the display reads
 * 00:00:01 through the final second and flips to done exactly at the target.
 */
export function getCountdownParts(target: Date | number, now: number = Date.now()): CountdownParts {
  const targetMs = typeof target === 'number' ? target : target.getTime()
  const totalMs = Math.max(0, targetMs - now)
  const total = Math.ceil(totalMs / SECOND)
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    totalMs,
    done: totalMs <= 0,
  }
}

/**
 * Live countdown to `target`. Re-renders once per second, woken just after each second
 * boundary (not on a drifting setInterval), stops at zero, and resyncs when the tab
 * becomes visible again.
 */
export function useCountdown(target: Date): CountdownParts {
  const targetMs = target.getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let timer = 0
    const tick = () => {
      setNow(Date.now())
      schedule()
    }
    const schedule = () => {
      window.clearTimeout(timer)
      const left = targetMs - Date.now()
      if (left <= 0) return
      timer = window.setTimeout(tick, (left % SECOND || SECOND) + 8)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    schedule()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [targetMs])

  return useMemo(() => getCountdownParts(targetMs, now), [targetMs, now])
}
