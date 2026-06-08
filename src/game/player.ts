import {
  GameState,
  InputState,
  JUMP_GRAVITY,
  JUMP_VELOCITY,
  PLAYER_MOVE_SPEED,
  ROAD_LEFT,
  ROAD_RIGHT,
} from './types'

export function updatePlayer(state: GameState, input: InputState, dt: number): void {
  const player = state.player

  if (input.touchTargetX !== null) {
    const diff = input.touchTargetX - player.x
    const maxStep = PLAYER_MOVE_SPEED * 1.8 * dt
    player.x += Math.max(-maxStep, Math.min(maxStep, diff))
  } else {
    let direction = 0
    if (input.leftHeld) direction -= 1
    if (input.rightHeld) direction += 1
    player.x += direction * PLAYER_MOVE_SPEED * dt
  }

  const halfWidth = player.w / 2
  player.x = Math.max(ROAD_LEFT + halfWidth, Math.min(ROAD_RIGHT - halfWidth, player.x))

  // Jump: launch only when grounded; integrate vertical motion under gravity.
  const grounded = player.jumpHeight === 0 && player.jumpVel === 0
  if (input.jumpQueued && grounded) {
    player.jumpVel = JUMP_VELOCITY
  }
  input.jumpQueued = false

  if (player.jumpVel !== 0 || player.jumpHeight > 0) {
    player.jumpVel -= JUMP_GRAVITY * dt
    player.jumpHeight += player.jumpVel * dt
    if (player.jumpHeight <= 0) {
      player.jumpHeight = 0
      player.jumpVel = 0
    }
  }

  if (player.invulnerableFor > 0) {
    player.invulnerableFor = Math.max(0, player.invulnerableFor - dt)
  }
}
