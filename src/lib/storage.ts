/**
 * Small persisted preferences (the 3D / Still toggle, a dismissed hint...).
 * Every access is wrapped: storage throws in private windows, sandboxed frames (the claude.ai
 * preview) and when site data is blocked. Treat a null read as "no preference", never an error.
 */
const PREFIX = 'velato:'

export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

/** Returns false when the value could not be stored. */
export function writePref(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, value)
    return true
  } catch {
    return false
  }
}

export function removePref(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // Storage unavailable: nothing to remove.
  }
}
