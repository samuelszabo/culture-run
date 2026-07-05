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

// Tokio v noci — zaparkované autá blokujú striedavo ľavý a pravý pruh.
// Hráč uhýba do strán — žiadne skoky, žiadne medzery. Čistá laterálna
// mechanika (ako čínske stánky). Max skóre = 72 × 15 = 1080.

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

const CAR_LANE = 190
const CAR_WIDTH = ROAD_WIDTH - CAR_LANE

const FEATURE_START = 1400
const FEATURE_END = TRACK_LENGTH - 700

function openLaneCenter(car: Obstacle): number {
  return car.x < ROAD_CENTER
    ? (car.x + car.w / 2 + ROAD_RIGHT) / 2
    : (ROAD_LEFT + car.x - car.w / 2) / 2
}

interface Waypoint {
  trackY: number
  x: number
}

function buildSafePath(cars: Obstacle[]): Waypoint[] {
  return cars
    .map((c) => ({ trackY: c.trackY, x: openLaneCenter(c) }))
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

function createParkedCars(): Obstacle[] {
  const rand = mulberry32(0xc0ff33)
  const cars: Obstacle[] = []

  let trackY = FEATURE_START
  let carSide = 1

  while (trackY <= FEATURE_END) {
    const progress = (trackY - FEATURE_START) / (FEATURE_END - FEATURE_START)
    const spacing = 360 - progress * 110
    trackY += spacing + (rand() - 0.5) * 40
    if (trackY > FEATURE_END) break

    carSide = -carSide
    const cx =
      carSide < 0 ? ROAD_LEFT + CAR_WIDTH / 2 : ROAD_RIGHT - CAR_WIDTH / 2
    cars.push({ kind: 'car', x: cx, trackY, w: CAR_WIDTH, h: 40 })
  }

  return cars
}

const FOOD_KINDS: CollectibleKind[] = ['sushi', 'ramen', 'mochi']
const PICKUP_POINTS = 15
const PICKUP_TARGET = 72

function createCarCollectibles(cars: Obstacle[]): Collectible[] {
  const rand = mulberry32(0x5eed43)
  const path = buildSafePath(cars)
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
  const cars = createParkedCars()
  const collectibles = createCarCollectibles(cars)
  return {
    obstacles: cars,
    collectibles,
  }
}
