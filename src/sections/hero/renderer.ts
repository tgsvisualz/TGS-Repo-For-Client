let cached: boolean | undefined

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i

/**
 * True when the browser rasterises on the CPU through a software GL driver (SwiftShader,
 * llvmpipe…: VMs, remote desktops, blocklisted GPUs, headless test runs). There, repainting
 * the swaying veils (SVG) every frame drops the page to ~1fps and the reflections' blur stalls
 * the first frames for seconds, so the still stage keeps the veils at rest and the reflections
 * crisp. Probed once on a throwaway canvas (call it early, while the GPU is idle), then cached.
 */
export function isSoftwareRenderer(): boolean {
  if (cached !== undefined) return cached
  cached = false
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
      cached = SOFTWARE.test(renderer)
      // Hand the context straight back: browsers cap live WebGL contexts per page.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    cached = false
  }
  return cached
}
