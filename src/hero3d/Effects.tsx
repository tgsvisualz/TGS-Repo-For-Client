import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'

/**
 * High tier only. The composer renders the scene into a multisampled HDR buffer (that is the
 * anti-aliasing: the canvas itself is created without it) and switches the renderer's own tone
 * mapping off, so ACES filmic comes back as an effect, after Bloom (which wants linear HDR:
 * only the emissive lines and floor lights pass its threshold) and before the grain and the
 * vignette, which belong to the final image.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.6} radius={0.72} />
      <ToneMapping />
      <Noise premultiply opacity={0.035} />
      <Vignette offset={0.3} darkness={0.8} />
    </EffectComposer>
  )
}
