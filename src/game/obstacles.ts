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

function packSegment(
  rand: () => number,
  segStart: number,
  segEnd: number,
  trackY: number,
  obstacles: Obstacle[]
): void {
  const segWidth = segEnd - segStart
  if (segWidth < 40) return

  const blockCount = Math.max(1, Math.round(segWidth / 100))
  const blockWidth = segWidth / blockCount

  for (let i = 0; i < blockCount; i++) {
    const blockLeft = segStart + i * blockWidth
    const blockRight = blockLeft + blockWidth
    const cx = (blockLeft + blockRight) / 2
    const isStall = rand() < 0.55
    const h = isStall ? 70 + rand() * 10 : 50 + rand() * 10
    obstacles.push({
      kind: isStall ? 'stall' : 'wall',
      x: cx,
      trackY,
      w: blockWidth,
      h,
    })
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
    const gapCenter = Math.max(
      ROAD_LEFT + gapSize / 2,
      Math.min(ROAD_RIGHT - gapSize / 2, rawCenter)
    )
    lastGapCenter = gapCenter

    const gapLeft = gapCenter - gapSize / 2
    const gapRight = gapCenter + gapSize / 2

    packSegment(rand, ROAD_LEFT, gapLeft, trackY, obstacles)
    packSegment(rand, gapRight, ROAD_RIGHT, trackY, obstacles)
  }

  return obstacles
}
