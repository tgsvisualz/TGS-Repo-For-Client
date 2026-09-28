import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'

/**
 * High tier only. The composer renders the scene into a multisampled HDR buffer (that is the
 * anti-aliasing: the canvas itself is created without it) and switches the renderer's own tone
 * mapping off, so ACES filmic comes back as an effect, after Bloom (which wants linear HDR)
 * and before the grain and the vignette, which belong to the final image. Bloom's threshold
 * sits above the brightest lit fabric (the ivory veil in its spot reaches ~1.8): only the
 * emissive plinth line and floor lights (4–6) glow, and five mip levels keep the halo tight.
 * Lower, it spreads the veil into a brown haze over the whole room.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur levels={5} luminanceThreshold={2} luminanceSmoothing={0.3} intensity={0.6} radius={0.6} />
      <ToneMapping />
      <Noise premultiply opacity={0.035} />
      <Vignette offset={0.3} darkness={0.8} />
    </EffectComposer>
  )
}
