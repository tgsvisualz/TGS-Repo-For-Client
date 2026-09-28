/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "off" at build time to strip the 3D showroom chunk from the bundle entirely. */
  readonly VITE_HERO_3D?: 'on' | 'off'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
