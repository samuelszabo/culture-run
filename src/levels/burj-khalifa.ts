import {
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
    // 360 → 250 px between features — a dense, busy skyline of obstacles. A jump's
    // airborne arc covers ~150–190px of forward travel and a lane-swap takes only
    // ~80px, so even the tightest spacing stays clearable.
    const spacing = 360 - progress * 110
    trackY += spacing + (rand() - 0.5) * 40
    if (trackY > FEATURE_END) break

    // No towers in the short opening teaching zone; after that the track is mostly
    // skyscraper tops to dodge, with the occasional jump-gap.
    const towerChance = progress < 0.1 ? 0 : 0.85
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

// Centre of the lane NOT blocked by a given tower-top.
function openLaneCenter(tw: Obstacle): number {
  return tw.x < ROAD_CENTER
    ? (tw.x + tw.w / 2 + ROAD_RIGHT) / 2
    : (ROAD_LEFT + tw.x - tw.w / 2) / 2
}

interface Waypoint {
  trackY: number
  x: number
}

// The navigable route: at each tower-top the safe x is its open lane; the path
// smoothly weaves between those. Food follows this, so it snakes around the
// skyscrapers exactly like the China level's pickups follow the gap path.
function buildSafePath(towers: Obstacle[]): Waypoint[] {
  return towers
    .map((tw) => ({ trackY: tw.trackY, x: openLaneCenter(tw) }))
    .sort((a, b) => a.trackY - b.trackY)
}

function pathXAt(trackY: number, path: Waypoint[]): number {
  if (path.length === 0) return ROAD_CENTER
  if (trackY <= path[0].trackY) return path[0].x
  if (trackY >= path[path.length - 1].trackY) return path[path.length - 1].x
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]
    const b = path[i + 1]
    if (trackY >= a.trackY && trackY <= b.trackY) {
      const t = (trackY - a.trackY) / (b.trackY - a.trackY)
      return a.x + t * (b.x - a.x)
    }
  }
  return ROAD_CENTER
}

const FOOD_KINDS: CollectibleKind[] = ['dubai-choc', 'datle', 'luqaimat']
const PICKUP_POINTS = 15
// 72 pickups × 15 = 1080 — matches the China/Slovak balance so the reward score
// thresholds line up across levels. Asserted in tests/level-dubai.test.ts.
const PICKUP_TARGET = 72

// Food follows the navigable route in a tidy trail — like the China/Slovak
// levels — weaving around the skyscrapers rather than running dead straight.
// Spacing alternates between single pickups and short tight clusters.
function createCloudCollectibles(towers: Obstacle[]): Collectible[] {
  const rand = mulberry32(0x5eed42)
  const path = buildSafePath(towers)
  const collectibles: Collectible[] = []
  let trackY = 1500
  let i = 0
  let inCluster = 0
  while (trackY <= 18500 && collectibles.length < PICKUP_TARGET) {
    const x = pathXAt(trackY, path)
    collectibles.push({
      kind: FOOD_KINDS[i % FOOD_KINDS.length],
      x,
      trackY,
      points: PICKUP_POINTS,
      collected: false,
    })
    i++

    if (inCluster > 0) {
      // Continue a tight run of pickups (China's tea-row feel).
      inCluster--
      trackY += 60
    } else if (rand() < 0.35) {
      // Start a short cluster of 2–3 more.
      inCluster = 2 + Math.floor(rand() * 2)
      trackY += 60
    } else {
      // Normal gap to the next single pickup.
      trackY += 230
    }
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
