import { Environment, Lightformer, MeshReflectorMaterial, SpotLight } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AdditiveBlending, Color, DoubleSide, MeshBasicMaterial, Object3D, type InstancedMesh, type SpotLight as SpotLightImpl } from 'three'
import { Dust } from './Dust'
import { contactShadow, radialTexture, riseTexture } from './materials'
import { FIGURES } from './profiles'
import { VeiledFigure3D } from './VeiledFigure3D'

export type Tier = 'high' | 'lite'

/** The room's ground and fog colour: the page's warm near-black (--bg). */
export const INK = '#0B0A09'

/** Plinth height; the figures stand on it. */
const PLINTH_H = 0.1
const PLINTH_R = 2.4
/** Runway: half-width, and the floor lights along both edges. */
const RUNWAY_HALF = 0.7
const RUNWAY_LIGHTS_PER_SIDE = 18
/** The hall: slim vertical light bars on a ring, dissolving into the fog. */
const BAR_COUNT = 16
const BAR_RADIUS = 11
const BAR_HEIGHT = 5.5

/**
 * Warm emissive colour. With the composer (high) it is HDR so Bloom catches it; without it
 * (lite, toneMapped off) it stays below 1 so it glows without clipping to white.
 */
function glow(hex: string, hdr: boolean, power: number, ldr: number): Color {
  return new Color(hex).multiplyScalar(hdr ? power : ldr)
}

interface SceneProps {
  tier: Tier
  reducedMotion: boolean
}

/** The showroom: everything inside the canvas except the camera rig and the post effects. */
export function Scene({ tier, reducedMotion }: SceneProps) {
  const hdr = tier === 'high'
  return (
    <>
      <Floor />
      <Plinth tier={tier} />
      <Runway hdr={hdr} />
      <LightBars hdr={hdr} />
      <Lights />
      <Environment resolution={128} frames={1} environmentIntensity={0.3}>
        {/* Key: a wide soft box above and in front. */}
        <Lightformer form="rect" color="#FFE2C4" intensity={2.4} position={[0, 5, 5.5]} scale={[7, 2.2, 1]} target={[0, 1.2, 0]} />
        {/* Rim: behind, cooler, for the silhouette and the veil's edge sheen. */}
        <Lightformer form="rect" color="#D5DCE6" intensity={1.1} position={[0, 3.4, -6]} scale={[8, 3, 1]} target={[0, 1.2, 0]} />
        {/* Tall side strips: long vertical highlights down the silk. */}
        <Lightformer form="rect" color="#FFE6CC" intensity={1.6} position={[-6, 2.4, 1.5]} scale={[0.7, 5, 1]} target={[0, 1.1, 0]} />
        <Lightformer form="rect" color="#FFE6CC" intensity={1.2} position={[6, 2.4, 1.5]} scale={[0.7, 5, 1]} target={[0, 1.1, 0]} />
        {/* Floor bounce: warm and dim, from below. */}
        <Lightformer form="rect" color="#6E5646" intensity={0.5} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
      </Environment>
      <Figures reducedMotion={reducedMotion} />
      <Dust count={tier === 'high' ? 70 : 30} still={reducedMotion} />
    </>
  )
}

/** The hall floor: a 40 m disc of dark satin whose edge the fog swallows. */
function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <circleGeometry args={[20, 96]} />
      <meshStandardMaterial color="#0E0C0B" roughness={0.45} metalness={0.2} envMapIntensity={0.35} />
    </mesh>
  )
}

/**
 * The circular satin-black plinth with a thin warm light line at its edge. The figures stand
 * on it, so its top carries the reflection (high): the veils and gowns mirror softly beneath
 * them, blurring with height. A floor-level mirror could never show them, the plinth is in
 * the way. Lite: the same satin as the sides.
 */
function Plinth({ tier }: { tier: Tier }) {
  const hdr = tier === 'high'
  const ring = useMemo(() => glow('#FFC690', hdr, 3.2, 0.85), [hdr])
  return (
    <group>
      <mesh position-y={PLINTH_H / 2}>
        <cylinderGeometry args={[PLINTH_R, PLINTH_R, PLINTH_H, 128, 1, true]} />
        <meshPhysicalMaterial color="#0B0908" roughness={0.58} metalness={0} clearcoat={0.2} clearcoatRoughness={0.45} envMapIntensity={0.12} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={PLINTH_H}>
        <circleGeometry args={[PLINTH_R, 128]} />
        {hdr ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[300, 90]}
            mixBlur={1}
            mixStrength={18}
            mixContrast={1}
            roughness={1}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#14100D"
            metalness={0.5}
            envMapIntensity={0.2}
          />
        ) : (
          <meshPhysicalMaterial color="#0B0908" roughness={0.5} metalness={0} clearcoat={0.3} clearcoatRoughness={0.4} envMapIntensity={0.15} />
        )}
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={PLINTH_H + 0.001}>
        <torusGeometry args={[PLINTH_R - 0.004, 0.006, 6, 256]} />
        <meshBasicMaterial color={ring} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A 1.4 m runway along z through the plinth, marked by small floor lights on both edges. */
function Runway({ hdr }: { hdr: boolean }) {
  const lights = useRef<InstancedMesh>(null)
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({ color: glow('#FFD2A0', hdr, 2.6, 0.8), toneMapped: false })
    // Lights that pass right under the orbiting camera fade out rather than flare.
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <fog_fragment>',
        ['#include <fog_fragment>', '#ifdef USE_FOG', 'gl_FragColor.rgb = mix( fogColor, gl_FragColor.rgb, smoothstep( 4.0, 7.0, vFogDepth ) );', '#endif'].join('\n'),
      )
    }
    m.customProgramCacheKey = () => 'velato-runway'
    return m
  }, [hdr])
  useEffect(() => () => material.dispose(), [material])

  useLayoutEffect(() => {
    const mesh = lights.current
    if (!mesh) return
    const o = new Object3D()
    let i = 0
    const perSection = RUNWAY_LIGHTS_PER_SIDE / 2
    for (const side of [-1, 1]) {
      for (const dir of [-1, 1]) {
        for (let k = 0; k < perSection; k++) {
          o.position.set(side * (RUNWAY_HALF + 0.08), 0.006, dir * (PLINTH_R + 0.55 + k * 1.05))
          o.updateMatrix()
          mesh.setMatrixAt(i++, o.matrix)
        }
      }
    }
    mesh.count = i
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.002}>
        <planeGeometry args={[RUNWAY_HALF * 2, 26]} />
        <meshStandardMaterial color="#2A231E" roughness={0.5} metalness={0} transparent opacity={0.16} depthWrite={false} envMapIntensity={0.4} />
      </mesh>
      <instancedMesh ref={lights} args={[undefined, undefined, RUNWAY_LIGHTS_PER_SIDE * 2]} material={material} frustumCulled={false}>
        <boxGeometry args={[0.06, 0.01, 0.06]} />
      </instancedMesh>
    </group>
  )
}

/** Sixteen slim light bars on an 11 m ring: a large dark hall without hard walls. */
function LightBars({ hdr }: { hdr: boolean }) {
  const bars = useRef<InstancedMesh>(null)
  const ramp = useMemo(() => riseTexture(), [])
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({
      color: glow('#FFD6AA', hdr, 1.5, 0.5),
      map: ramp,
      toneMapped: false,
      side: DoubleSide,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    // The camera orbits inside the ring: bars close to it melt into the dark instead of slicing
    // across the frame, far ones are taken by the fog. Only the hall's far side ever glows.
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <fog_fragment>',
        ['#include <fog_fragment>', '#ifdef USE_FOG', 'gl_FragColor.rgb *= smoothstep( 12.0, 17.0, vFogDepth ) * ( 1.0 - smoothstep( 10.0, 26.0, vFogDepth ) );', '#endif'].join('\n'),
      )
    }
    m.customProgramCacheKey = () => 'velato-bars'
    return m
  }, [hdr, ramp])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => ramp.dispose(), [ramp])

  useLayoutEffect(() => {
    const mesh = bars.current
    if (!mesh) return
    const o = new Object3D()
    for (let i = 0; i < BAR_COUNT; i++) {
      const a = ((i + 0.5) / BAR_COUNT) * Math.PI * 2
      o.position.set(Math.sin(a) * BAR_RADIUS, BAR_HEIGHT / 2, Math.cos(a) * BAR_RADIUS)
      o.rotation.set(0, a + Math.PI, 0)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [])

  return (
    <instancedMesh ref={bars} args={[undefined, undefined, BAR_COUNT]} material={material} frustumCulled={false}>
      <planeGeometry args={[0.14, BAR_HEIGHT]} />
    </instancedMesh>
  )
}

/** Three soft shafts of warm light, one above each figure; a dim cool rim from behind. */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.06} color="#FFE9D6" />
      {FIGURES.map((f) => (
        <Beam
          key={f.id}
          position={[f.position[0], 4.6, f.position[2] + 0.7]}
          target={[f.position[0], 0.6, f.position[2]]}
          intensity={f.id === 'A' ? 62 : 46}
        />
      ))}
      <Rim />
    </>
  )
}

/** A narrow spot behind and above the trio: it outlines shoulders and veils, not the floor. */
function Rim() {
  const light = useRef<SpotLightImpl>(null)
  const [aim] = useState(() => new Object3D())
  useLayoutEffect(() => {
    aim.position.set(0, 1.35, 0.1)
    aim.updateMatrixWorld()
    if (light.current) light.current.target = aim
  }, [aim])
  return (
    <>
      <primitive object={aim} />
      <spotLight ref={light} position={[0.6, 4.2, -5.2]} color="#D9DEE6" intensity={26} angle={0.36} penumbra={0.9} distance={12} decay={2} />
    </>
  )
}

const BEAM_ANGLE = 0.3
const BEAM_DISTANCE = 8

function Beam({
  position,
  target,
  intensity,
}: {
  position: [number, number, number]
  target: [number, number, number]
  intensity: number
}) {
  const light = useRef<SpotLightImpl>(null)
  const [aim] = useState(() => new Object3D())
  const [tx, ty, tz] = target

  useLayoutEffect(() => {
    aim.position.set(tx, ty, tz)
    aim.updateMatrixWorld()
    if (light.current) light.current.target = aim
  }, [aim, tx, ty, tz])

  return (
    <>
      <primitive object={aim} />
      <SpotLight
        ref={light}
        position={position}
        color="#FFDDB8"
        intensity={intensity}
        angle={BEAM_ANGLE}
        penumbra={0.7}
        distance={BEAM_DISTANCE}
        decay={2}
        castShadow={false}
        volumetric
        attenuation={5}
        anglePower={12}
        opacity={0.2}
        radiusTop={0.04}
        radiusBottom={Math.tan(BEAM_ANGLE) * BEAM_DISTANCE}
      />
    </>
  )
}

/** The three figures on the plinth, each grounded by a soft contact shadow. */
function Figures({ reducedMotion }: { reducedMotion: boolean }) {
  const texture = useMemo(() => radialTexture(64), [])
  const shadow = useMemo(() => contactShadow(texture, 0.62), [texture])
  useEffect(
    () => () => {
      shadow.dispose()
      texture.dispose()
    },
    [shadow, texture],
  )
  return (
    <group position-y={PLINTH_H}>
      {FIGURES.map((spec) => (
        <VeiledFigure3D key={spec.id} spec={spec} reducedMotion={reducedMotion} shadow={shadow} />
      ))}
    </group>
  )
}
