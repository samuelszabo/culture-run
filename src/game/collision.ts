import { AABB, GameState, JUMP_CLEAR_HEIGHT, Obstacle, PLAYER_SCREEN_Y, isJumpable, obstacleBox, playerBox } from './types'

export function intersects(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

// A cloud-gap is a hole you fall into — only the player's FEET matter, not their
// whole 48px-tall body box. Using the full box made the gap lethal while it was
// still ~48px ahead (at head height in screen projection), so the runner "died
// before reaching the hole". This shallow foot-print lines the deadly zone up
// with the hole actually under the player.
const FOOT_HEIGHT = 12

function playerFootBox(pBox: AABB): AABB {
  return { x: pBox.x, y: PLAYER_SCREEN_Y - FOOT_HEIGHT, w: pBox.w, h: FOOT_HEIGHT }
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
    const hitBox = obstacle.kind === 'cloud-gap' ? playerFootBox(pBox) : pBox
    if (intersects(hitBox, oBox)) {
      return obstacle
    }
  }

  return null
}
