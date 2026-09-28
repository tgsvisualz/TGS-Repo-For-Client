import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, Material } from 'three'
import { buildFigure } from './figure'
import type { FigureSpec } from './profiles'

export interface VeiledFigure3DProps {
  spec: FigureSpec
  /** No fabric sway. */
  reducedMotion: boolean
  /** The contact-shadow decal material, shared by the three figures. */
  shadow: Material
  /**
   * Reserved for stage two: a GLB of the real veiled model. Not read yet. To swap the
   * primitives, load it with drei's `useGLTF(modelUrl)` inside a <Suspense>, render its
   * `scene` in place of `built.parts` (scaled to ~1.75 m, feet at y 0, facing +z) and keep the
   * veil, sway and contact shadow from here. The GLB must ship with the site (no CDN).
   */
  modelUrl?: string
}

/** Sway of the veil around its crown, radians and rad/s. */
const SWAY = { z: 0.012, x: 0.008, speed: 0.6 }

/**
 * One veiled figure, built from primitives: elongated (~1.77 m to the crown), a featureless
 * head fully under a sheer veil, skin showing only at the neck, arms and hands.
 */
export function VeiledFigure3D({ spec, reducedMotion, shadow }: VeiledFigure3DProps) {
  const built = useMemo(() => buildFigure(spec), [spec])
  useEffect(() => () => built.dispose(), [built])

  const veil = useRef<Group>(null)
  const clock = useRef(spec.phase * 2)

  useFrame((_, delta) => {
    const g = veil.current
    if (!g) return
    if (reducedMotion) {
      g.rotation.set(0, 0, 0)
      return
    }
    // Own clock: fiber's restarts at 0 whenever the frameloop resumes.
    clock.current += Math.min(delta, 0.1)
    const t = clock.current * SWAY.speed
    g.rotation.z = SWAY.z * Math.sin(t + spec.phase)
    g.rotation.x = SWAY.x * Math.sin(t * 0.83 + spec.phase + 1.3)
  })

  return (
    <group position={[spec.position[0], spec.position[1], spec.position[2]]} rotation-y={spec.rotationY}>
      {built.parts.map((part) => (
        <mesh
          key={part.key}
          geometry={part.geometry}
          material={part.material}
          position={part.position ? [part.position[0], part.position[1], part.position[2]] : undefined}
          scale={part.scale ? [part.scale[0], part.scale[1], part.scale[2]] : undefined}
          rotation={part.rotation ? [part.rotation[0], part.rotation[1], part.rotation[2]] : undefined}
        />
      ))}

      {spec.bag ? <Bag leather={built.leather} brass={built.brass} shift={built.lean} /> : null}

      <group ref={veil} position={[0, spec.crown, 0]}>
        <mesh geometry={built.veil.geometry} material={built.veil.material} position={[0, -spec.crown, 0]} />
        <mesh geometry={built.veil.edge} material={built.veil.edgeMaterial} position={[0, -spec.crown, 0]} />
      </group>

      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, -0.03]} scale={[1.05, 0.85, 1]} material={shadow}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  )
}

/**
 * A black top-handle bag hanging from the figure's closed left hand (+x, the outer side for C),
 * turned so its face shows three-quarters to the front.
 */
function Bag({ leather, brass, shift }: { leather: Material; brass: Material; shift: number }) {
  const handle = 0.05
  return (
    <group position={[0.262 + shift, 0.752, 0.016]} rotation-y={1.05}>
      <mesh material={leather} position={[0, -handle, 0]}>
        <torusGeometry args={[handle, 0.0055, 8, 32, Math.PI]} />
      </mesh>
      <RoundedBox args={[0.22, 0.16, 0.07]} radius={0.018} smoothness={4} position={[0, -handle - 0.08, 0]} material={leather} />
      <mesh material={brass} position={[0, -handle - 0.026, 0.036]}>
        <boxGeometry args={[0.03, 0.018, 0.008]} />
      </mesh>
    </group>
  )
}
