import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, Material, PointLight } from 'three'
import { buildFigure } from './figure'
import { reveal } from './reveal'
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

/** The unveiling: rates (1/s) up and down, how far the veil rises (m) and grows as it goes. */
const LIFT = { up: 3.2, down: 1.8, rise: 0.55, grow: 0.06 }

/** The beauty light in front of the face: where it sits, its reach (m), colour and intensity. */
const BEAUTY = { at: [0.32, 1.9, 0.52] as [number, number, number], reach: 1.5, color: '#FFE3CC', rest: 0.35, lit: 1.6 }

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
  const beauty = useRef<PointLight>(null)
  const clock = useRef(spec.phase * 2)
  const lift = useRef(0)

  useFrame((_, delta) => {
    const g = veil.current
    if (!g) return
    const dt = Math.min(delta, 0.1)

    // Unveiling: the veil rises off the head and dissolves into the light, then settles back.
    const target = reveal.target[spec.id]
    const rate = target > lift.current ? LIFT.up : LIFT.down
    lift.current += (target - lift.current) * (1 - Math.exp(-rate * dt))
    const l = lift.current
    const eased = l * l * (3 - 2 * l)
    const fade = Math.min(1, eased * 1.25)
    const uniform = built.veil.material.userData.lift as { value: number } | undefined
    if (uniform) uniform.value = fade
    ;(built.veil.edgeMaterial as Material & { opacity: number }).opacity = 1 - fade
    g.visible = fade < 0.995
    // The light finds her: a soft beauty light on the face, brighter once the veil is off.
    if (beauty.current) beauty.current.intensity = BEAUTY.rest + (BEAUTY.lit - BEAUTY.rest) * eased
    g.position.y = spec.crown + (reducedMotion ? 0 : LIFT.rise * eased)
    g.scale.setScalar(reducedMotion ? 1 : 1 + LIFT.grow * eased)

    if (reducedMotion) {
      g.rotation.set(0, 0, 0)
      return
    }
    // Own clock: fiber's restarts at 0 whenever the frameloop resumes.
    clock.current += dt
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

      <pointLight ref={beauty} position={BEAUTY.at} intensity={BEAUTY.rest} distance={BEAUTY.reach} decay={2} color={BEAUTY.color} />

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
