/**
 * Velato placeholder-art palette. Warm, dark, low-key: nothing here is grey-blue, nothing is
 * pure black or pure white. Every material is described as a Tone: the colour it takes in deep
 * shadow, its mid value, where the key light lands, the specular sheen, and the rim light.
 */
import type { Fabric, ModelId, VeilTone } from '../data/types'

export interface Tone {
  deep: string
  base: string
  lit: string
  sheen: string
  rim: string
}

/** The room: backdrop ink, stage values and the warm key-light pool. */
export const STAGE = {
  ink0: '#0B0A09',
  ink1: '#121110',
  ink2: '#1B1917',
  ink3: '#26221F',
  pool: '#3A322B',
  poolHot: '#4A4037',
  /** Occlusion / contact shadow (warm, never #000). */
  shadow: '#060504',
  /** Colour of the key light itself, used for beams and glints. */
  key: '#EAD9C0',
} as const

export const FABRIC: Record<Fabric, Tone> = {
  noir: { deep: '#070606', base: '#100F0E', lit: '#221E1B', sheen: '#4A423B', rim: '#7C6F62' },
  bone: { deep: '#2A2621', base: '#6E665A', lit: '#C3BAAB', sheen: '#E6DED2', rim: '#EFE8DD' },
  garnet: { deep: '#180407', base: '#380C13', lit: '#5C1520', sheen: '#8E2A36', rim: '#B34A56' },
  smoke: { deep: '#0F0E0D', base: '#282422', lit: '#4A4541', sheen: '#7A726B', rim: '#A0978D' },
  ash: { deep: '#191715', base: '#3A3632', lit: '#6B655E', sheen: '#978F86', rim: '#BBB2A7' },
  champagne: { deep: '#231D15', base: '#5E5140', lit: '#B8A58A', sheen: '#E8D8BE', rim: '#F2E6D2' },
  oxblood: { deep: '#110305', base: '#2A090E', lit: '#4A1219', sheen: '#7A2630', rim: '#9E444E' },
}

/**
 * Skin, per placeholder model. `lit` and `sheen` are the brief's skin tone and highlight;
 * `base` and `deep` carry the same hue down into the low-key shadow.
 */
export const SKIN: Record<ModelId, Tone> = {
  A: { deep: '#1C110B', base: '#40291D', lit: '#5B3A29', sheen: '#7A4E37', rim: '#A2735A' },
  B: { deep: '#3E2A1C', base: '#8F6A48', lit: '#C99A6E', sheen: '#DDB186', rim: '#EDCDA6' },
  C: { deep: '#523C31', base: '#A88670', lit: '#E6C3A8', sheen: '#F2D8C4', rim: '#FBEADC' },
}

/** Hair under the veil: A close-coiled black, B sleek black, C soft brown. */
export const HAIR: Record<ModelId, Tone> = {
  A: { deep: '#060504', base: '#0F0B09', lit: '#231913', sheen: '#4A372B', rim: '#6E5444' },
  B: { deep: '#060505', base: '#0E0C0B', lit: '#211D1A', sheen: '#6A625A', rim: '#8E847A' },
  C: { deep: '#130C08', base: '#2A1D14', lit: '#4A3423', sheen: '#7C5C42', rim: '#A07D60' },
}

export interface VeilInk {
  /** Veil colour. */
  color: string
  /** Peak opacity (where the fabric doubles over the crown). */
  alpha: number
  /** Colour of the sheen on folds and the lit side. */
  hi: string
  /** Strength of that sheen. */
  hiA: number
  /** Shadow in the folds. */
  lo: string
}

export const VEIL: Record<VeilTone, VeilInk> = {
  ivory: { color: '#E8E0D4', alpha: 0.42, hi: '#FAF5EC', hiA: 0.26, lo: '#3A342E' },
  tulle: { color: '#0E0D0C', alpha: 0.8, hi: '#9A8E80', hiA: 0.2, lo: '#050404' },
  smoke: { color: '#6E6862', alpha: 0.65, hi: '#C9C0B5', hiA: 0.3, lo: '#24211F' },
}

/** Brass hardware: clasps, frames, chains. */
export const METAL: Tone = { deep: '#3A2E1F', base: '#7A6647', lit: '#C2A978', sheen: '#F3E4C4', rim: '#FFF3DC' }

/** Shoes are always black leather. */
export const SHOE: Tone = { deep: '#060505', base: '#0E0C0B', lit: '#1F1B18', sheen: '#6B5F54', rim: '#8A7D70' }
