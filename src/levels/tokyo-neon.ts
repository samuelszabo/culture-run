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

// Tokio v noci — zaparkované autá blokujú pruhy nočnej ulice. Cesta má tri
// pruhy; každý rad je náhodný: raz jedno auto, raz rad dvoch áut s jedinou
// medzerou. Voľný pruh sa mení nepravidelne, takže hráč musí reagovať, nie iba
// striedavo kľučkovať. Rozostup rastie s dĺžkou úhybu, aby bol prejazd vždy
// férový. Žiadne skoky. Max skóre = 72 × 15 = 1080.

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
const CAR_WIDTH = LANE_WIDTH * 0.9

const FEATURE_START = 1600
const FEATURE_END = TRACK_LENGTH - 700

interface Waypoint {
  trackY: number
  x: number
}

function createFeatures(): { cars: Obstacle[]; waypoints: Waypoint[] } {
  const rand = mulberry32(0xc0ff33)
  const cars: Obstacle[] = []
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
      cars.push({
        kind: 'car',
        x: LANES[lane],
        trackY,
        w: CAR_WIDTH,
        h: 38 + Math.floor(rand() * 10),
      })
    }
    waypoints.push({ trackY, x: LANES[openLane] })
    prevOpen = openLane
  }

  return { cars, waypoints }
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

const FOOD_KINDS: CollectibleKind[] = ['sushi', 'ramen', 'mochi']
const PICKUP_POINTS = 15
const PICKUP_TARGET = 72

function createCarCollectibles(waypoints: Waypoint[]): Collectible[] {
  const rand = mulberry32(0x5eed43)
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

export const TOKYO_NEON_LANDMARKS: Landmark[] = [
  { id: 'tokyo-tower', trackY: 4000, nameKey: 'landmark.tokyo-tower', factKey: 'landmark.tokyo-tower.fact' },
  { id: 'shibuya', trackY: 10000, nameKey: 'landmark.shibuya', factKey: 'landmark.shibuya.fact' },
  { id: 'sensoji', trackY: 15500, nameKey: 'landmark.sensoji', factKey: 'landmark.sensoji.fact' },
]

export function createTokyoNeonLevel(): Level {
  const { cars, waypoints } = createFeatures()
  const collectibles = createCarCollectibles(waypoints)
  return {
    obstacles: cars,
    collectibles,
  }
}
