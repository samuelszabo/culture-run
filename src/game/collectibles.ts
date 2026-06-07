import {
  Collectible,
  CollectibleKind,
  COLLECTIBLE_SIZE,
  GameState,
  Obstacle,
  ROAD_LEFT,
  ROAD_RIGHT,
  collectibleBox,
  obstacleBox,
  playerBox,
} from './types'
import { intersects } from './collision'

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

interface GapRow {
  trackY: number
  gapCenter: number
  gapLeft: number
  gapRight: number
}

function deriveGapRows(staticObstacles: Obstacle[]): GapRow[] {
  const rowMap = new Map<number, Obstacle[]>()
  for (const obs of staticObstacles) {
    const existing = rowMap.get(obs.trackY)
    if (existing) {
      existing.push(obs)
    } else {
      rowMap.set(obs.trackY, [obs])
    }
  }

  const rows: GapRow[] = []
  for (const [trackY, rowObs] of rowMap) {
    const blocked: Array<[number, number]> = rowObs.map(o => [o.x - o.w / 2, o.x + o.w / 2])
    blocked.sort((a, b) => a[0] - b[0])

    let bestGapSize = 0
    let bestGapLeft = ROAD_LEFT
    let bestGapRight = ROAD_LEFT

    let cursor = ROAD_LEFT
    for (const [bLeft, bRight] of blocked) {
      const freeLeft = cursor
      const freeRight = Math.min(bLeft, ROAD_RIGHT)
      if (freeRight > freeLeft) {
        const gap = freeRight - freeLeft
        if (gap > bestGapSize) {
          bestGapSize = gap
          bestGapLeft = freeLeft
          bestGapRight = freeRight
        }
      }
      cursor = Math.max(cursor, bRight)
    }
    const trailingLeft = cursor
    const trailingRight = ROAD_RIGHT
    if (trailingRight > trailingLeft) {
      const gap = trailingRight - trailingLeft
      if (gap > bestGapSize) {
        bestGapLeft = trailingLeft
        bestGapRight = trailingRight
      }
    }

    rows.push({
      trackY,
      gapCenter: (bestGapLeft + bestGapRight) / 2,
      gapLeft: bestGapLeft,
      gapRight: bestGapRight,
    })
  }

  rows.sort((a, b) => a.trackY - b.trackY)
  return rows
}

function safeXAt(trackY: number, rows: GapRow[]): number {
  if (rows.length === 0) return (ROAD_LEFT + ROAD_RIGHT) / 2
  if (trackY <= rows[0].trackY) return rows[0].gapCenter
  if (trackY >= rows[rows.length - 1].trackY) return rows[rows.length - 1].gapCenter

  let lo = 0
  let hi = rows.length - 1
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1
    if (rows[mid].trackY <= trackY) lo = mid
    else hi = mid
  }

  const t = (trackY - rows[lo].trackY) / (rows[hi].trackY - rows[lo].trackY)
  return rows[lo].gapCenter + t * (rows[hi].gapCenter - rows[lo].gapCenter)
}

function overlapsAnyObstacle(candidate: Collectible, obstacles: Obstacle[]): boolean {
  const cBox = collectibleBox(candidate, 0)
  for (const obs of obstacles) {
    const oBox = obstacleBox(obs, 0)
    if (intersects(cBox, oBox)) return true
  }
  return false
}

function makeCollectible(
  kind: CollectibleKind,
  x: number,
  trackY: number,
  points: number
): Collectible {
  return { kind, x, trackY, points, collected: false }
}

export function createCollectibles(staticObstacles: Obstacle[]): Collectible[] {
  const rand = mulberry32(0xcafe1234)
  const rows = deriveGapRows(staticObstacles)
  const collectibles: Collectible[] = []

  if (rows.length < 2) return collectibles

  const halfSize = COLLECTIBLE_SIZE / 2
  const teaSpacing = 44

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (i % 3 === 0) {
      const candidate = makeCollectible('baozi', row.gapCenter, row.trackY, 15)
      if (!overlapsAnyObstacle(candidate, staticObstacles)) {
        collectibles.push(candidate)
      }
    }

    if (i + 1 >= rows.length) continue

    const rowB = rows[i + 1]
    const keepout = 90
    const segStart = row.trackY + keepout
    const segEnd = rowB.trackY - keepout

    if (segEnd <= segStart) continue

    const segLen = segEnd - segStart
    const roll = rand()

    if (roll < 0.30) {
      const rawCount = Math.floor(segLen / teaSpacing)
      const teaCount = Math.min(rawCount, 3 + Math.floor(rand() * 3))
      if (teaCount >= 1) {
        const span = (teaCount - 1) * teaSpacing
        let ty = (row.trackY + rowB.trackY) / 2 - span / 2
        for (let t = 0; t < teaCount; t++) {
          const x = safeXAt(ty, rows)
          const clampedX = Math.max(ROAD_LEFT + halfSize, Math.min(ROAD_RIGHT - halfSize, x))
          const cand = makeCollectible('tea', clampedX, ty, 10)
          if (!overlapsAnyObstacle(cand, staticObstacles)) {
            collectibles.push(cand)
          }
          ty += teaSpacing
        }
      }
    } else if (roll < 0.52) {
      const midY = (row.trackY + rowB.trackY) / 2
      const mx = safeXAt(midY, rows)
      const cx = Math.max(ROAD_LEFT + halfSize, Math.min(ROAD_RIGHT - halfSize, mx))
      const kind: CollectibleKind = rand() < 0.55 ? 'noodles' : 'baozi'
      const cand = makeCollectible(kind, cx, midY, 15)
      if (!overlapsAnyObstacle(cand, staticObstacles)) {
        collectibles.push(cand)
      }
    }
  }

  const safePoints = collectibles.reduce((s, c) => s + c.points, 0)
  const riskyBudget = Math.floor(safePoints * 0.10)
  let riskyPoints = 0

  for (let i = 2; i + 1 < rows.length - 1 && riskyPoints + 15 <= riskyBudget; i += 4) {
    const offset = rand() < 0.5 ? -60 : 60
    const rx = rows[i].gapCenter + offset
    const clampedRx = Math.max(ROAD_LEFT + halfSize, Math.min(ROAD_RIGHT - halfSize, rx))
    const midY = (rows[i].trackY + rows[i + 1].trackY) / 2
    const kind: CollectibleKind = rand() < 0.5 ? 'noodles' : 'baozi'
    const cand = makeCollectible(kind, clampedRx, midY, 15)
    if (!overlapsAnyObstacle(cand, staticObstacles)) {
      collectibles.push(cand)
      riskyPoints += 15
    }
  }

  return collectibles
}

export function collectPickups(state: GameState): void {
  if (state.phase !== 'running') return

  const cullMargin = 150
  const pBox = playerBox(state.player)

  for (const c of state.collectibles) {
    if (c.collected) continue
    if (c.trackY < state.distance - cullMargin || c.trackY > state.distance + cullMargin) continue

    const cBox = collectibleBox(c, state.distance)
    if (intersects(pBox, cBox)) {
      c.collected = true
      state.score += c.points
      state.lastCollected.kind = c.kind
      state.lastCollected.seq++
    }
  }
}
