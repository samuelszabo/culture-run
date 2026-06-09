import {
  CLIMB_EXIT_INVULN,
  CLIMB_HEIGHT,
  CLIMB_LANE_COOLDOWN,
  CLIMB_LANES,
  CLIMB_STEP,
  CLIMB_TAP_COOLDOWN,
  GameState,
  InputState,
  Obstacle,
} from './types'

/** Begin the climb at a designated ladder gate. Freezes the forward run. */
export function enterClimb(state: GameState, gate: Obstacle): void {
  const c = state.climb
  c.active = true
  c.gateTrackY = gate.trackY
  c.gapCenter = gate.x
  c.height = CLIMB_HEIGHT
  c.progress = 0
  c.lane = Math.floor(CLIMB_LANES / 2)
  c.climbCooldown = 0
  c.laneCooldown = 0

  state.phase = 'climbing'
  state.distance = gate.trackY
  // cancel any in-flight jump so the run resumes grounded
  state.player.jumpHeight = 0
  state.player.jumpVel = 0
}

/** Resume the forward run at the top of the ladder. */
function exitClimb(state: GameState): void {
  state.climb.active = false
  state.phase = 'running'
  state.player.x = state.climb.gapCenter
  state.player.invulnerableFor = CLIMB_EXIT_INVULN
}

/** One fixed-timestep step of the climb mini-game (tap to ascend, slide lanes). */
export function updateClimb(state: GameState, input: InputState, dt: number): void {
  const c = state.climb

  // ── Lateral lane step (edge or held) ──
  c.laneCooldown -= dt
  let dir = input.climbLane
  if (dir === 0) {
    if (input.leftHeld) dir = -1
    else if (input.rightHeld) dir = 1
  }
  if (c.laneCooldown <= 0 && dir !== 0) {
    const next = Math.max(0, Math.min(CLIMB_LANES - 1, c.lane + (dir < 0 ? -1 : 1)))
    if (next !== c.lane) {
      c.lane = next
      c.laneCooldown = CLIMB_LANE_COOLDOWN
    }
  }
  input.climbLane = 0

  // ── Ascend ──
  c.climbCooldown -= dt
  if (input.climbQueued && c.climbCooldown <= 0) {
    c.progress = Math.min(c.height, c.progress + CLIMB_STEP)
    c.climbCooldown = CLIMB_TAP_COOLDOWN
  }
  input.climbQueued = false

  if (state.player.invulnerableFor > 0) {
    state.player.invulnerableFor = Math.max(0, state.player.invulnerableFor - dt)
  }

  // Reached the top → back to running.
  if (c.progress >= c.height) {
    exitClimb(state)
  }
}
