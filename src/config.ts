/**
 * Prototype switches. Everything the pitch might need to toggle lives here.
 */

export const FEATURES: { hero3d: boolean } = {
  /**
   * The React Three Fiber showroom layered over the hero. The 2D still stage always renders
   * underneath, so turning this off (or it failing at runtime) never breaks the page.
   * Also: `?3d=off|on` in the URL, the 3D / Still toggle in the hero, or `VITE_HERO_3D=off`
   * at build time to strip the 3D chunk entirely.
   */
  hero3d: true,
}

/** Weekly drop rhythm, in the viewer's local time. */
export const DROP_SCHEDULE = {
  /** 0 = Sunday … 4 = Thursday. */
  unveilWeekday: 4,
  unveilHour: 20,
  unveilMinute: 0,
  /** A drop stays live until the Sunday after the following unveil, at 23:59. */
  liveDays: 10,
  leaveHour: 23,
  leaveMinute: 59,
} as const

/** Switch to { code: 'EUR', locale: 'it-IT' } etc. in one place. */
export const CURRENCY = { code: 'USD', locale: 'en-US' } as const

/** Dates and times read the European way: "Thursday 1 Oct, 20:00". */
export const DATE_LOCALE = 'en-GB'

export const BREAKPOINTS = {
  /** Below this the header collapses to the Menu overlay. */
  nav: 1100,
  /** Below this the 3D showroom runs in its lite tier. */
  lite3d: 768,
} as const
