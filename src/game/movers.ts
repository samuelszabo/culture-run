import { GameState, Obstacle, ObstacleKind, ROAD_LEFT, ROAD_RIGHT, TRACK_LENGTH } from './types'

const FIRECRACKER_REST = 2.2
const FIRECRACKER_WARNING = 1.0
const FIRECRACKER_BLAST = 0.6
const FIRECRACKER_CYCLE = FIRECRACKER_REST + FIRECRACKER_WARNING + FIRECRACKER_BLAST

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

function applyFirecrackerPhase(obstacle: Obstacle): void {
  const t = obstacle.timer ?? 0
  if (t < FIRECRACKER_REST) {
    obstacle.harmless = true
    obstacle.warning = false
  } else if (t < FIRECRACKER_REST + FIRECRACKER_WARNING) {
    obstacle.harmless = true
    obstacle.warning = true
  } else {
    obstacle.harmless = false
    obstacle.warning = false
  }
}

export function createMovers(staticObstacles: Obstacle[]): Obstacle[] {
  const rand = mulberry32(0xc4fec4fe)
  const movers: Obstacle[] = []

  const staticYSet = new Set(staticObstacles.map((o) => o.trackY))
  const sortedStaticY = Array.from(staticYSet).sort((a, b) => a - b)

  const MIN_CLEARANCE = 170

  const eligibleSlots: number[] = []

  const boundaries = [0, ...sortedStaticY, TRACK_LENGTH]
  for (let i = 0; i < boundaries.length - 1; i++) {
    const gapStart = boundaries[i]
    const gapEnd = boundaries[i + 1]
    const usableStart = gapStart + MIN_CLEARANCE
    const usableEnd = gapEnd - MIN_CLEARANCE
    if (usableEnd - usableStart >= 1) {
      const slotY = usableStart + rand() * (usableEnd - usableStart)
      eligibleSlots.push(slotY)
    }
  }

  eligibleSlots.sort((a, b) => a - b)

  const totalSlots = eligibleSlots.length

  const TARGET_WALKERS = 10
  const TARGET_CARRIERS = 5
  const TARGET_FIRECRACKERS = 8
  const totalNeeded = TARGET_WALKERS + TARGET_CARRIERS + TARGET_FIRECRACKERS

  const selectedIndices = new Set<number>()
  if (totalSlots <= totalNeeded) {
    for (let i = 0; i < totalSlots; i++) selectedIndices.add(i)
  } else {
    while (selectedIndices.size < totalNeeded) {
      const idx = Math.floor(rand() * totalSlots)
      selectedIndices.add(idx)
    }
  }

  const sortedSelected = Array.from(selectedIndices).sort((a, b) => a - b)
  const KIND_CYCLE: ObstacleKind[] = ['walker', 'firecracker', 'walker', 'carrier', 'firecracker']

  sortedSelected.forEach((idx, i) => {
    const trackY = eligibleSlots[idx]
    const kind = KIND_CYCLE[i % KIND_CYCLE.length]

    if (kind === 'firecracker') {
      const cx = ROAD_LEFT + 30 + rand() * (ROAD_RIGHT - ROAD_LEFT - 60)
      const fc: Obstacle = {
        kind,
        x: cx,
        trackY,
        w: 36,
        h: 36,
        vx: 0,
        timer: rand() * FIRECRACKER_CYCLE,
        harmless: true,
        warning: false,
      }
      applyFirecrackerPhase(fc)
      movers.push(fc)
      return
    }

    const w = kind === 'walker' ? 30 : 46
    const h = kind === 'walker' ? 40 : 44
    const minX = ROAD_LEFT + w / 2
    const maxX = ROAD_RIGHT - w / 2
    const x = minX + rand() * (maxX - minX)
    const speed = kind === 'walker' ? 50 + rand() * 40 : 90 + rand() * 40
    const vx = rand() < 0.5 ? speed : -speed
    movers.push({ kind, x, trackY, w, h, vx, minX, maxX, harmless: false, warning: false })
  })

  return movers
}

export function updateMovers(state: GameState, dt: number): void {
  const WINDOW = 900
  for (const obstacle of state.obstacles) {
    if (
      obstacle.kind !== 'walker' &&
      obstacle.kind !== 'carrier' &&
      obstacle.kind !== 'firecracker'
    ) {
      continue
    }
    if (Math.abs(obstacle.trackY - state.distance) > WINDOW) continue

    if (obstacle.kind === 'walker' || obstacle.kind === 'carrier') {
      const vx = obstacle.vx ?? 0
      let x = obstacle.x + vx * dt
      const minX = obstacle.minX ?? ROAD_LEFT
      const maxX = obstacle.maxX ?? ROAD_RIGHT
      if (x < minX) {
        x = minX
        obstacle.vx = Math.abs(vx)
      } else if (x > maxX) {
        x = maxX
        obstacle.vx = -Math.abs(vx)
      }
      obstacle.x = x
    }

    if (obstacle.kind === 'firecracker') {
      obstacle.timer = ((obstacle.timer ?? 0) + dt) % FIRECRACKER_CYCLE
      applyFirecrackerPhase(obstacle)
    }
  }
}
