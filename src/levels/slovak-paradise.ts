import { createCollectibles } from '../game/collectibles'
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

// Pack a span of the road with rock-wall blocks (the gorge cliff faces).
function packGorge(
  rand: () => number,
  segStart: number,
  segEnd: number,
  trackY: number,
  obstacles: Obstacle[],
): void {
  const segWidth = segEnd - segStart
  if (segWidth < 40) return

  const blockCount = Math.max(1, Math.round(segWidth / 100))
  const blockWidth = segWidth / blockCount

  for (let i = 0; i < blockCount; i++) {
    const blockLeft = segStart + i * blockWidth
    const cx = blockLeft + blockWidth / 2
    obstacles.push({
      kind: 'gorge-wall',
      x: cx,
      trackY,
      w: blockWidth,
      h: 60 + rand() * 16,
    })
  }
}

/**
 * Gorge gates: each row is a rock face spanning the canyon with a single
 * ladder lane the player must line up with. Same cadence/difficulty curve as
 * the China wall rows, themed as Slovenský raj roklina passages.
 *
 * Returns the solid rock walls and the (harmless) ladder markers separately so
 * the collectible/mover generators only see the walls when deriving the lane.
 */
function createGorgeGates(): { walls: Obstacle[]; ladders: Obstacle[] } {
  const rand = mulberry32(0x51074c)
  const walls: Obstacle[] = []
  const ladders: Obstacle[] = []

  const roadWidth = ROAD_RIGHT - ROAD_LEFT
  const minGap = 150
  const startTrackY = 800
  const endTrackY = TRACK_LENGTH - 400

  let trackY = startTrackY
  let lastGapCenter = (ROAD_LEFT + ROAD_RIGHT) / 2

  while (trackY <= endTrackY) {
    const progress = (trackY - startTrackY) / (endTrackY - startTrackY)

    const spacing = 520 - progress * 250
    const jitter = (rand() - 0.5) * 80
    trackY += spacing + jitter

    if (trackY > endTrackY) break

    const gapSize = minGap + rand() * 55
    const maxShift = 120
    const shiftRange = Math.min(maxShift, (roadWidth - gapSize) / 2)
    const rawCenter = lastGapCenter + (rand() - 0.5) * 2 * shiftRange
    const gapCenter = Math.max(
      ROAD_LEFT + gapSize / 2,
      Math.min(ROAD_RIGHT - gapSize / 2, rawCenter),
    )
    lastGapCenter = gapCenter

    const gapLeft = gapCenter - gapSize / 2
    const gapRight = gapCenter + gapSize / 2

    packGorge(rand, ROAD_LEFT, gapLeft, trackY, walls)
    packGorge(rand, gapRight, ROAD_RIGHT, trackY, walls)

    // Decorative ladder filling the lane — never collides (harmless).
    ladders.push({
      kind: 'ladder',
      x: gapCenter,
      trackY,
      w: gapSize,
      h: 10,
      harmless: true,
    })
  }

  // Promote the ladder nearest each anchor into a full climb-mini-game section.
  // Three, spaced between the landmark captions so a child isn't reading and
  // climbing at once. The rest stay decorative dodge-through gaps.
  for (const anchor of [3500, 9000, 14500]) {
    let best: Obstacle | null = null
    let bestDist = Infinity
    for (const l of ladders) {
      const d = Math.abs(l.trackY - anchor)
      if (d < bestDist) {
        bestDist = d
        best = l
      }
    }
    if (best) best.climb = true
  }

  // Keep a ladder ONLY where you actually climb — a ladder now unambiguously
  // means "climb here", instead of a decorative mat in every gap.
  return { walls, ladders: ladders.filter((l) => l.climb) }
}

// Hikers and forest animals crossing the trail between gorge gates.
function createTrailMovers(walls: Obstacle[]): Obstacle[] {
  const rand = mulberry32(0x4f02e57)
  const movers: Obstacle[] = []

  const sortedY = Array.from(new Set(walls.map((o) => o.trackY))).sort((a, b) => a - b)
  const CLEARANCE_AFTER = 280
  const CLEARANCE_BEFORE = 170

  const boundaries = [0, ...sortedY, TRACK_LENGTH]
  const slots: number[] = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    const usableStart = boundaries[i] + CLEARANCE_AFTER
    const usableEnd = boundaries[i + 1] - CLEARANCE_BEFORE
    if (usableEnd - usableStart >= 1) {
      slots.push(usableStart + rand() * (usableEnd - usableStart))
    }
  }
  slots.sort((a, b) => a - b)

  // Fewer, gentler movers than China's full mix (which leans on mostly-harmless
  // firecrackers). Each patrols a limited band so a transiting player can always
  // route around it — keeps a clean 0-death run achievable, like the wall level.
  const TARGET = 9
  const PATROL_HALF = 55
  const step = Math.max(1, Math.floor(slots.length / TARGET))
  for (let i = 0; i < slots.length; i += step) {
    const trackY = slots[i]
    // Alternate person (walker) and animal carrying load (carrier) for variety.
    const kind = (i / step) % 3 === 2 ? 'carrier' : 'walker'
    const w = kind === 'walker' ? 30 : 46
    const h = kind === 'walker' ? 40 : 44
    const x = ROAD_LEFT + w / 2 + rand() * (ROAD_RIGHT - ROAD_LEFT - w)
    const minX = Math.max(ROAD_LEFT + w / 2, x - PATROL_HALF)
    const maxX = Math.min(ROAD_RIGHT - w / 2, x + PATROL_HALF)
    const speed = kind === 'walker' ? 30 + rand() * 25 : 45 + rand() * 25
    const vx = rand() < 0.5 ? speed : -speed
    movers.push({ kind, x, trackY, w, h, vx, minX, maxX, harmless: false, warning: false })
  }

  return movers
}

// Reuse the proven China collectible placement (derived from the gorge gaps),
// then re-theme each pickup as Slovak food. Points are preserved so the level's
// max score stays in the same balanced range.
const KIND_REMAP: Record<string, CollectibleKind> = {
  baozi: 'halusky',
  noodles: 'pstruh',
  tea: 'cucoriedky',
}

function themeCollectibles(items: Collectible[]): Collectible[] {
  for (const c of items) {
    c.kind = KIND_REMAP[c.kind] ?? c.kind
  }
  return items
}

export const SLOVAK_PARADISE_LANDMARKS: Landmark[] = [
  { id: 'gorge', trackY: 5000, nameKey: 'landmark.gorge', factKey: 'landmark.gorge.fact' },
  { id: 'waterfall', trackY: 10500, nameKey: 'landmark.waterfall', factKey: 'landmark.waterfall.fact' },
  { id: 'viewpoint', trackY: 15500, nameKey: 'landmark.viewpoint', factKey: 'landmark.viewpoint.fact' },
]

export function createSlovakParadiseLevel(): Level {
  const { walls, ladders } = createGorgeGates()
  const movers = createTrailMovers(walls)
  const collectibles = themeCollectibles(createCollectibles(walls))
  return {
    obstacles: [...walls, ...ladders, ...movers],
    collectibles,
  }
}
