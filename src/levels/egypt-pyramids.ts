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

// Egypt — púštna cesta okolo pyramíd; ťavy a kamenné bloky blokujú pruhy.
// Tri pruhy; každý rad má náhodný voľný pruh, takže hráč musí reagovať.
// Jedlo: datle, pita, falafel. Max skóre = 72 × 15 = 1080.

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

const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT
const LANE_WIDTH = ROAD_WIDTH / 3
const LANES = [
  ROAD_LEFT + LANE_WIDTH * 0.5,
  ROAD_LEFT + LANE_WIDTH * 1.5,
  ROAD_LEFT + LANE_WIDTH * 2.5,
]
const CAMEL_WIDTH = LANE_WIDTH * 0.75
const STONE_WIDTH = LANE_WIDTH * 0.85

const FEATURE_START = 1600
const FEATURE_END = TRACK_LENGTH - 700

interface Waypoint {
  trackY: number
  x: number
}

function createFeatures(): { obstacles: Obstacle[]; waypoints: Waypoint[] } {
  const rand = mulberry32(0xa3f7b1d9)
  const obstacles: Obstacle[] = []
  const waypoints: Waypoint[] = []

  let trackY = FEATURE_START
  let prevOpen = 1

  while (true) {
    const progress = (trackY - FEATURE_START) / (FEATURE_END - FEATURE_START)

    const r = rand()
    let openLane: number
    if (progress < 0.12) {
      const step = r < 0.4 ? 0 : r < 0.7 ? -1 : 1
      openLane = Math.max(0, Math.min(2, prevOpen + step))
    } else {
      openLane = Math.floor(rand() * 3)
    }

    const laneDist = Math.abs(openLane - prevOpen)
    const spacing = 380 - progress * 80 + laneDist * 95 + (rand() - 0.5) * 50
    trackY += spacing
    if (trackY > FEATURE_END) break

    const isDouble = progress >= 0.12 && rand() < 0.3 + progress * 0.3
    let blocked: number[]
    if (isDouble) {
      blocked = [0, 1, 2].filter((l) => l !== openLane)
    } else if (openLane !== prevOpen) {
      blocked = [prevOpen]
    } else {
      blocked = [prevOpen === 1 ? (rand() < 0.5 ? 0 : 2) : 1]
    }

    for (const lane of blocked) {
      const isCamel = rand() < 0.5
      obstacles.push({
        kind: isCamel ? 'camel' : 'stone-block',
        x: LANES[lane],
        trackY,
        w: isCamel ? CAMEL_WIDTH : STONE_WIDTH,
        h: 38 + Math.floor(rand() * 10),
      })
    }
    waypoints.push({ trackY, x: LANES[openLane] })
    prevOpen = openLane
  }

  return { obstacles, waypoints }
}

function pathXAt(trackY: number, path: Waypoint[]): number {
  if (path.length === 0) return LANES[1]
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
  return LANES[1]
}

const FOOD_KINDS: CollectibleKind[] = ['datle', 'pita', 'falafel']
const PICKUP_POINTS = 15
const PICKUP_TARGET = 72

function createFoodCollectibles(waypoints: Waypoint[]): Collectible[] {
  const rand = mulberry32(0x4e9c2a07)
  const collectibles: Collectible[] = []
  let trackY = 1500
  let i = 0
  let inCluster = 0
  while (trackY <= 18500 && collectibles.length < PICKUP_TARGET) {
    const x = pathXAt(trackY, waypoints)
    collectibles.push({
      kind: FOOD_KINDS[i % FOOD_KINDS.length],
      x,
      trackY,
      points: PICKUP_POINTS,
      collected: false,
    })
    i++

    if (inCluster > 0) {
      inCluster--
      trackY += 60
    } else if (rand() < 0.35) {
      inCluster = 2 + Math.floor(rand() * 2)
      trackY += 60
    } else {
      trackY += 230
    }
  }
  return collectibles
}

export const EGYPT_PYRAMIDS_LANDMARKS: Landmark[] = [
  { id: 'great-pyramid', trackY: 4000, nameKey: 'landmark.great-pyramid', factKey: 'landmark.great-pyramid.fact' },
  { id: 'sphinx', trackY: 10000, nameKey: 'landmark.sphinx', factKey: 'landmark.sphinx.fact' },
  { id: 'obelisk', trackY: 15500, nameKey: 'landmark.obelisk', factKey: 'landmark.obelisk.fact' },
]

export function createEgyptPyramidsLevel(): Level {
  const { obstacles, waypoints } = createFeatures()
  const collectibles = createFoodCollectibles(waypoints)
  return {
    obstacles,
    collectibles,
  }
}
