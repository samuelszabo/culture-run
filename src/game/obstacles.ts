import { Obstacle, ROAD_LEFT, ROAD_RIGHT, TRACK_LENGTH } from './types'

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

export function createBridgeObstacles(): Obstacle[] {
  const rand = mulberry32(0xdeadbeef)
  const obstacles: Obstacle[] = []

  const roadWidth = ROAD_RIGHT - ROAD_LEFT
  const minGap = 140
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

    const gapSize = minGap + rand() * 60
    const maxShift = 120
    const shiftRange = Math.min(maxShift, (roadWidth - gapSize) / 2)
    const rawCenter = lastGapCenter + (rand() - 0.5) * 2 * shiftRange
    const gapCenter = Math.max(ROAD_LEFT + gapSize / 2, Math.min(ROAD_RIGHT - gapSize / 2, rawCenter))
    lastGapCenter = gapCenter

    const gapLeft = gapCenter - gapSize / 2
    const gapRight = gapCenter + gapSize / 2

    const leftSegment = gapLeft - ROAD_LEFT
    const rightSegment = ROAD_RIGHT - gapRight

    if (leftSegment >= 50) {
      const kind = rand() < 0.6 ? 'stall' : 'wall'
      const w = kind === 'stall' ? 110 + rand() * 20 : 70 + rand() * 20
      const h = kind === 'stall' ? 70 + rand() * 10 : 50 + rand() * 10
      const maxObstacleW = Math.min(w, leftSegment)
      const cx = ROAD_LEFT + maxObstacleW / 2
      obstacles.push({ kind, x: cx, trackY, w: maxObstacleW, h })
    }

    if (rightSegment >= 50) {
      const kind = rand() < 0.4 ? 'stall' : 'wall'
      const w = kind === 'stall' ? 110 + rand() * 20 : 70 + rand() * 20
      const h = kind === 'stall' ? 70 + rand() * 10 : 50 + rand() * 10
      const maxObstacleW = Math.min(w, rightSegment)
      const cx = ROAD_RIGHT - maxObstacleW / 2
      obstacles.push({ kind, x: cx, trackY, w: maxObstacleW, h })
    }
  }

  return obstacles
}
