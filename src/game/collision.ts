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

  const pBox = playerBox(state.player)
  const cullMargin = 150
  const airborne = state.player.jumpHeight >= JUMP_CLEAR_HEIGHT

  for (const obstacle of state.obstacles) {
    if (obstacle.harmless) continue
    if (airborne && isJumpable(obstacle.kind)) continue
    if (
      obstacle.trackY < state.distance - cullMargin ||
      obstacle.trackY > state.distance + cullMargin
    ) {
      continue
    }

    const oBox = obstacleBox(obstacle, state.distance)
    if (intersects(pBox, oBox)) {
      return obstacle
    }
  }

  return null
}
