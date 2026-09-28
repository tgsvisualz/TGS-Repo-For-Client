import { Sparkles } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { ShaderMaterial } from 'three'

/**
 * drei's Sparkles with a safer material. Its stock shader divides by the distance to the
 * point's centre (infinite alpha when a centre lands exactly on a pixel centre, and alpha
 * above 1 around it). On a canvas that clamps, harmless; in the composer's HalfFloat buffer
 * it becomes NaN, which Bloom's mip chain spreads over the whole frame (a blank flash).
 * Same attributes and motion as the stock material; the glow is clamped.
 */
class DustMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: { time: { value: 0 }, pixelRatio: { value: 1 } },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        uniform float pixelRatio;
        uniform float time;
        attribute float size;
        attribute float speed;
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = size * 25.0 * pixelRatio / max(-viewPosition.z, 0.1);
          vColor = color;
          vOpacity = opacity;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float d = max(distance(gl_PointCoord, vec2(0.5)), 0.002);
          float strength = clamp(0.05 / d - 0.1, 0.0, 1.0);
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
  }

  /** Written by Sparkles every frame. */
  get time(): number {
    return this.uniforms.time.value as number
  }

  set time(value: number) {
    this.uniforms.time.value = value
  }
}

export interface DustProps {
  count: number
  /** Motes hang still (reduced motion). */
  still: boolean
}

/** Warm dust drifting in the light shafts. */
export function Dust({ count, still }: DustProps) {
  const dpr = useThree((s) => s.viewport.dpr)
  const material = useMemo(() => new DustMaterial(), [])
  useEffect(() => {
    material.uniforms.pixelRatio.value = dpr
  }, [material, dpr])
  useEffect(() => () => material.dispose(), [material])

  return (
    <Sparkles
      count={count}
      size={1.6}
      speed={still ? 0 : 0.18}
      opacity={0.35}
      color="#FFE3C2"
      scale={[6, 4, 6]}
      position={[0, 2.1, 0]}
      noise={0.6}
    >
      <primitive object={material} attach="material" />
    </Sparkles>
  )
}
