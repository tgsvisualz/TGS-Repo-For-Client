let cached: boolean | undefined

function probe(type: 'webgl2' | 'webgl'): boolean {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext(type) as WebGLRenderingContext | WebGL2RenderingContext | null
  if (!gl) return false
  // Hand the context straight back: browsers cap live WebGL contexts per page.
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  return true
}

/**
 * Whether this browser can create a WebGL context (webgl2, else webgl), each tried on a
 * throwaway canvas. Cached after the first call; false on any throw.
 */
export function canUseWebGL(): boolean {
  if (cached !== undefined) return cached
  try {
    cached = typeof document !== 'undefined' && (probe('webgl2') || probe('webgl'))
  } catch {
    cached = false
  }
  return cached
}
