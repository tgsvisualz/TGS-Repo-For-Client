import { lazy } from 'react'

export type { Hero3DQuality, ShowroomProps } from './types'

/** False when built with VITE_HERO_3D=off; the lazy chunk is then never referenced. */
export const HERO_3D_BUILD_ENABLED = import.meta.env.VITE_HERO_3D !== 'off'

/** The R3F showroom, in its own chunk. Only imported when the hero decides to mount it. */
export const LazyShowroom = lazy(() => import('./Showroom'))
