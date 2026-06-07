/**
 * Quality tier detection — runs once at startup.
 *
 * Tier 'low'  → capped pixelRatio 1.5, shorter fog, no antialias, fewer trees
 * Tier 'high' → capped pixelRatio 2.0, full fog, antialias, full tree density
 *
 * Heuristics (all checked; any one match → low tier):
 *  - navigator.hardwareConcurrency <= 4
 *  - navigator.deviceMemory <= 4  (optional API — guarded)
 *  - coarse pointer (touch-primary device)
 */

export type QualityTier = 'high' | 'low'

function detectTier(): QualityTier {
  // Coarse pointer = likely a phone/tablet
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches

  const lowCores =
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 4

  // deviceMemory is not in all browsers; cast through unknown to satisfy TS
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory
  const lowMemory = typeof mem === 'number' && mem <= 4

  if (coarsePointer || lowCores || lowMemory) return 'low'
  return 'high'
}

export const QUALITY_TIER: QualityTier = detectTier()

/** Maximum devicePixelRatio to use when creating / resizing the renderer. */
export const DPR_CAP: number = QUALITY_TIER === 'low' ? 1.5 : 2.0

/** Whether to enable WebGL antialiasing (must be set at renderer creation time). */
export const ANTIALIAS: boolean = QUALITY_TIER !== 'low'

/** Fog near/far distances (world units). Shorter on low tier = fewer fragments shaded. */
export const FOG_NEAR: number = QUALITY_TIER === 'low' ? 30 : 45
export const FOG_FAR: number  = QUALITY_TIER === 'low' ? 50 : 70

/**
 * Track-unit radius within which collectible bob/spin animation runs.
 * Chosen to stay inside the fog end so invisible items are never animated.
 * FOG_FAR * UNIT — UNIT = 50.
 */
export const ANIM_CULL_DISTANCE: number = FOG_FAR * 50

/**
 * Fraction of decorative trees to spawn (1.0 = all, 0.5 = half).
 * Low tier spawns fewer to reduce draw calls from instanced meshes.
 */
export const TREE_DENSITY: number = QUALITY_TIER === 'low' ? 0.5 : 1.0
