import { AABB, GameState, JUMP_CLEAR_HEIGHT, Obstacle, isJumpable, obstacleBox, playerBox } from './types'

export function intersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

export function findCollision(state: GameState): Obstacle | null {
  if (state.phase !== 'running' || state.player.invulnerableFor > 0) {
    return null
  }

  const player = state.player
  const pBox = playerBox(player)
  const cullMargin = 150
  const airborne = player.jumpHeight >= JUMP_CLEAR_HEIGHT

  for (const obstacle of state.obstacles) {
    if (obstacle.harmless) continue
    if (airborne && isJumpable(obstacle.kind)) continue
    if (
      obstacle.trackY < state.distance - cullMargin ||
      obstacle.trackY > state.distance + cullMargin
    ) {
      continue
    }

    // A cloud-gap is a hole you fall into: lethal (when grounded) only while the
    // player's FEET are over it. Its `h` is the HALF-depth, so the deadly span is
    // symmetric (±h around the centre) and exactly equals the visible hole — you
    // fall the instant you step onto it, never "before reaching" it.
    if (obstacle.kind === 'cloud-gap') {
      const overHole = Math.abs(obstacle.trackY - state.distance) <= obstacle.h
      const overLane = Math.abs(player.x - obstacle.x) < obstacle.w / 2
      if (overHole && overLane) return obstacle
      continue
    }

    const oBox = obstacleBox(obstacle, state.distance)
    if (intersects(pBox, oBox)) {
      return obstacle
    }
  }

  return null
}
