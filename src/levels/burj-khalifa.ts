import {
  COLLECTIBLE_SIZE,
  Collectible,
  CollectibleKind,
  Obstacle,
  ROAD_LEFT,
  ROAD_RIGHT,
  TRACK_LENGTH,
} from '../game/types'
import { Landmark } from './landmark'
import { Level } from './china-wall'

// Dubaj — Burj Khalifa: beh v oblakoch. Namiesto behu po rovine je hlavná
// mechanika ČASOVANÝ SKOK ponad medzery v oblakovej ceste (`cloud-gap` — plná
// šírka cesty, smrteľná iba na zemi). Z oblakov trčia špičky mrakodrapov
// (`tower-top`) — vysoké prekážky na uhýbanie do strán. Logika ostáva 2D, skok
// už v hre existuje. Hodnoty sú vyladené simuláciou (viď tests/level-dubai).

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff
  }
}

const ROAD_CENTER = (ROAD_LEFT + ROAD_RIGHT) / 2
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT

// Tower-tops leave a generous dodge lane (kid-friendly, parity with the other
// levels' clean-run achievability).
const TOWER_LANE = 190
const TOWER_WIDTH = ROAD_WIDTH - TOWER_LANE

const FEATURE_START = 1400
const FEATURE_END = TRACK_LENGTH - 700

interface Features {
  gaps: Obstacle[]
  towers: Obstacle[]
}

// Walk the track placing cloud-gaps (the signature jump challenge) with the odd
// skyscraper-top to dodge. Spacing tightens with progress for a gentle ramp; the
// first stretch is gaps-only so a child learns the jump before towers appear.
function createCloudFeatures(): Features {
  const rand = mulberry32(0xdba1)
  const gaps: Obstacle[] = []
  const towers: Obstacle[] = []

  let trackY = FEATURE_START
  let towerSide = 1

  while (trackY <= FEATURE_END) {
    const progress = (trackY - FEATURE_START) / (FEATURE_END - FEATURE_START)
    // 560 → 320 px between features. A jump's airborne arc covers ~150–190px of
    // forward travel, so even the tightest spacing leaves time to land, run a
    // step and jump the next gap.
    const spacing = 560 - progress * 240
    trackY += spacing + (rand() - 0.5) * 60
    if (trackY > FEATURE_END) break

    // No towers in the opening teaching zone; ~1/3 of later features are towers.
    const towerChance = progress < 0.12 ? 0 : 0.32
    if (rand() < towerChance) {
      towerSide = -towerSide
      const cx =
        towerSide < 0 ? ROAD_LEFT + TOWER_WIDTH / 2 : ROAD_RIGHT - TOWER_WIDTH / 2
      // Collision depth is shallow (the mesh renders tall via OBSTACLE_WORLD_HEIGHTS);
      // a child only has to hold the open lane for ~one body-length to clear it.
      towers.push({ kind: 'tower-top', x: cx, trackY, w: TOWER_WIDTH, h: 90 })
    } else {
      // h is the HALF-depth of the hole (collision is symmetric ±h around the
      // centre and the renderer draws a 2·h-deep gap), so the kill zone exactly
      // matches the visible hole. 32 → a clearly visible ~64px-wide chasm.
      gaps.push({ kind: 'cloud-gap', x: ROAD_CENTER, trackY, w: ROAD_WIDTH, h: 32 })
    }
  }

  return { gaps, towers }
}

// Lateral position that is safe at `trackY`: if a tower-top sits near it, hug the
// open lane on the far side; otherwise the centre is clear (gaps are full-width
// but harmless mid-jump, so a centred pickup is grabbed as you leap).
function safeXAt(trackY: number, towers: Obstacle[]): number {
  for (const tw of towers) {
    if (Math.abs(tw.trackY - trackY) < 130) {
      return tw.x < ROAD_CENTER ? ROAD_RIGHT - 70 : ROAD_LEFT + 70
    }
  }
  return ROAD_CENTER
}

const FOOD_KINDS: CollectibleKind[] = ['dubai-choc', 'datle', 'luqaimat']
const PICKUP_POINTS = 15
// 72 pickups × 15 = 1080 — matches the China/Slovak balance so the reward score
// thresholds line up across levels. Asserted in tests/level-dubai.test.ts.
const PICKUP_TARGET = 72

const HALF = COLLECTIBLE_SIZE / 2
// A loose left↔right weave plus random jitter — the food scatters across the
// cloud road rather than tracing a clean zig-zag, so it feels organic.
const WEAVE_AMP = 115
const WEAVE_JITTER = 70

function createCloudCollectibles(towers: Obstacle[]): Collectible[] {
  const rand = mulberry32(0x5eed42)
  const collectibles: Collectible[] = []
  let trackY = 1500
  let i = 0
  while (trackY <= 18500 && collectibles.length < PICKUP_TARGET) {
    // Base sine weave, nudged by random jitter so the line isn't perfectly regular.
    let x = ROAD_CENTER + WEAVE_AMP * Math.sin(i * 0.8) + (rand() - 0.5) * 2 * WEAVE_JITTER
    // Near a tower-top, snap onto the guaranteed-open lane so the pickup is never
    // buried inside the skyscraper.
    const lane = safeXAt(trackY, towers)
    if (lane !== ROAD_CENTER) x = lane
    x = Math.max(ROAD_LEFT + HALF, Math.min(ROAD_RIGHT - HALF, x))
    // Mostly cycle the three foods, occasionally pick at random for variety.
    const kind =
      rand() < 0.3
        ? FOOD_KINDS[Math.floor(rand() * FOOD_KINDS.length)]
        : FOOD_KINDS[i % FOOD_KINDS.length]
    collectibles.push({ kind, x, trackY, points: PICKUP_POINTS, collected: false })
    trackY += 160 + rand() * 80
    i++
  }
  return collectibles
}

export const BURJ_KHALIFA_LANDMARKS: Landmark[] = [
  { id: 'burj-khalifa', trackY: 4000, nameKey: 'landmark.burj-khalifa', factKey: 'landmark.burj-khalifa.fact' },
  { id: 'burj-al-arab', trackY: 10000, nameKey: 'landmark.burj-al-arab', factKey: 'landmark.burj-al-arab.fact' },
  { id: 'dubai-frame', trackY: 15500, nameKey: 'landmark.dubai-frame', factKey: 'landmark.dubai-frame.fact' },
]

export function createBurjKhalifaLevel(): Level {
  const { gaps, towers } = createCloudFeatures()
  const collectibles = createCloudCollectibles(towers)
  return {
    obstacles: [...gaps, ...towers],
    collectibles,
  }
}
