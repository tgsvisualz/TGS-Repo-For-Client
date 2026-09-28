import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { WebGLRenderer } from 'three'
import { CameraRig, FOV } from './CameraRig'
import { Effects } from './Effects'
import { INK, Scene, type Tier } from './Scene'
import type { ShowroomProps } from './types'

/**
 * The 3D showroom: a dark hall, a satin plinth on a runway, three veiled figures under shafts
 * of warm light, and a camera that orbits the floor with the cursor. Mounted lazily by the
 * hero (its own chunk), which fades it in on onReady() and falls back to the still stage on
 * onError(). Decorative: aria-hidden, no focusable content.
 *
 * Tiers: 'high' = reflective floor, post effects (Bloom, ACES, grain, vignette), dpr up to
 * 1.75. 'lite' = satin floor, no composer, dpr up to 1.25, fewer dust motes. A 'high' mount
 * that keeps missing its frame budget steps its dpr down and finally drops to 'lite'.
 */

const CANVAS_STYLE: CSSProperties = { position: 'absolute', inset: 0, touchAction: 'pan-y' }
const CAMERA = { fov: FOV, near: 0.1, far: 60, position: [0, 3.13, 7.83] as [number, number, number] }
const DPR_MAX: Record<Tier, number> = { high: 1.75, lite: 1.25 }
/** Frames rendered before the hero is told the showroom is up. */
const READY_FRAMES = 3
/** Seconds of rendering before performance is judged (shader compiles, first uploads). */
const WARM_UP = 3

export default function Showroom({ quality, active, pointerTarget, reducedMotion, onReady, onError }: ShowroomProps) {
  const [degraded, setDegraded] = useState(false)
  const tier: Tier = quality === 'high' && !degraded ? 'high' : 'lite'
  const [factor, setFactor] = useState(1)
  const dpr = useMemo<[number, number]>(() => [1, 1 + (DPR_MAX[tier] - 1) * factor], [tier, factor])
  // Context attributes are fixed at creation: MSAA on the canvas only when there is no composer.
  const [gl] = useState(() => ({
    antialias: quality === 'lite',
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance' as const,
  }))

  const errorRef = useRef(onError)
  useEffect(() => {
    errorRef.current = onError
  }, [onError])

  // Unmounting disposes the renderer, which loses the context on purpose: not an error.
  const mounted = useRef(true)
  useLayoutEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const onCreated = useCallback(({ gl: renderer }: RootState) => {
    const canvas = renderer.domElement
    canvas.style.touchAction = 'pan-y'
    canvas.setAttribute('aria-hidden', 'true')
    canvas.addEventListener(
      'webglcontextlost',
      () => {
        if (mounted.current) errorRef.current(new Error('The 3D showroom lost its WebGL context.'))
      },
      { once: true },
    )
  }, [])

  const onDegrade = useCallback(() => setDegraded(true), [])

  return (
    <Canvas
      aria-hidden="true"
      style={CANVAS_STYLE}
      dpr={dpr}
      gl={gl}
      camera={CAMERA}
      frameloop={active ? 'always' : 'never'}
      onCreated={onCreated}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 10, 26]} />
      <Suspense fallback={null}>
        <Scene tier={tier} reducedMotion={reducedMotion} />
        <CameraRig pointerTarget={pointerTarget} reducedMotion={reducedMotion} />
        {tier === 'high' ? <Effects /> : null}
        <ReadySignal onReady={onReady} />
      </Suspense>
      {active ? <Monitor factor={factor} canDegrade={tier === 'high'} onFactor={setFactor} onDegrade={onDegrade} /> : null}
    </Canvas>
  )
}

/** Tells the hero once, after the first few frames have actually rendered. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const ready = useRef(onReady)
  const frames = useRef(0)
  useEffect(() => {
    ready.current = onReady
  }, [onReady])
  useFrame(() => {
    if (frames.current > READY_FRAMES) return
    frames.current += 1
    if (frames.current > READY_FRAMES) ready.current()
  })
  return null
}

const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i

function isSoftwareGL(renderer: WebGLRenderer): boolean {
  try {
    const context = renderer.getContext()
    const info = context.getExtension('WEBGL_debug_renderer_info')
    return SOFTWARE_GL.test(String(context.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER) ?? ''))
  } catch {
    return false
  }
}

/**
 * Watches the frame rate once the scene has warmed up (mounted only while active, so a
 * paused tab never counts as a slow frame). Each decline lowers the dpr a step; a 'high'
 * mount that declines at the lowest dpr drops to 'lite'. On a software rasteriser the tier
 * was forced on purpose (?3d=high for demos and headless checks), so it is left alone.
 */
function Monitor({
  factor,
  canDegrade,
  onFactor,
  onDegrade,
}: {
  /** Where the last watch left the dpr (0 = lowest, 1 = highest). */
  factor: number
  canDegrade: boolean
  onFactor: (factor: number) => void
  onDegrade: () => void
}) {
  const renderer = useThree((s) => s.gl)
  const [software] = useState(() => isSoftwareGL(renderer))
  const [armed, setArmed] = useState(false)
  const [initial] = useState(factor)
  const warm = useRef(0)

  useFrame((_, delta) => {
    if (armed || software) return
    warm.current += Math.min(delta, 0.25)
    if (warm.current > WARM_UP) setArmed(true)
  })

  if (software || !armed) return null
  return (
    <PerformanceMonitor
      factor={initial}
      step={0.25}
      flipflops={6}
      onChange={(api) => onFactor(api.factor)}
      onDecline={(api) => {
        if (canDegrade && api.factor <= 0) onDegrade()
      }}
    />
  )
}
