/**
 * Prototype switches. Everything the pitch might need to toggle lives here.
 */

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
} as const
