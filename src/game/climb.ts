import {
  CLIMB_DESPAWN_BELOW,
  CLIMB_EXIT_INVULN,
  CLIMB_HEIGHT,
  CLIMB_HIT_BAND,
  CLIMB_KNOCKDOWN,
  CLIMB_LANE_COOLDOWN,
  CLIMB_LANES,
  CLIMB_MAX_ACTIVE_ROCKS,
  CLIMB_ROCK_SPEED_MAX,
  CLIMB_ROCK_SPEED_MIN,
  CLIMB_SPAWN_AHEAD,
  CLIMB_SPAWN_INTERVAL,
  CLIMB_SPAWN_INTERVAL_MIN,
  CLIMB_STEP,
  CLIMB_TAP_COOLDOWN,
  ClimbState,
  GameState,
  InputState,
  Obstacle,
} from './types'
import { killPlayer } from './lives'
import { applyDeathPenalty } from './scoring'

/** Begin the climb at a designated ladder gate. Freezes the forward run. */
export function enterClimb(state: GameState, gate: Obstacle): void {
  const c = state.climb
  c.active = true
  c.gateTrackY = gate.trackY
  c.gapCenter = gate.x
  c.height = CLIMB_HEIGHT
  c.progress = 0
  c.lane = Math.floor(CLIMB_LANES / 2)
  c.spawnTimer = 0.7 // brief grace before the first rock
  c.climbCooldown = 0
  c.laneCooldown = 0
  for (const r of c.rocks) r.active = false

  state.phase = 'climbing'
  state.distance = gate.trackY
  // cancel any in-flight jump so the run resumes grounded
  state.player.jumpHeight = 0
  state.player.jumpVel = 0
}

/** Resume the forward run at the top of the ladder. */
function exitClimb(state: GameState): void {
  const c = state.climb
  c.active = false
  for (const r of c.rocks) r.active = false
  state.phase = 'running'
  state.player.x = c.gapCenter
  state.player.invulnerableFor = CLIMB_EXIT_INVULN
}

function spawnInterval(c: ClimbState): number {
  const t = Math.min(1, c.progress / c.height)
  return CLIMB_SPAWN_INTERVAL + (CLIMB_SPAWN_INTERVAL_MIN - CLIMB_SPAWN_INTERVAL) * t
}

// Reusable scratch so spawning allocates nothing per frame.
const laneFree: boolean[] = new Array(CLIMB_LANES).fill(true)

function spawnRock(c: ClimbState): void {
  let active = 0
  for (const r of c.rocks) if (r.active) active++
  if (active >= CLIMB_MAX_ACTIVE_ROCKS) return

  // A rock may target ANY lane (including the player's — that's the challenge),
  // but never a lane that already has an active rock. With at most LANES-1 rocks
  // live, at least one lane is always open, so a hit is always avoidable.
  for (let i = 0; i < CLIMB_LANES; i++) laneFree[i] = true
  for (const r of c.rocks) if (r.active) laneFree[r.lane] = false

  let choices = 0
  for (let i = 0; i < CLIMB_LANES; i++) if (laneFree[i]) choices++
  if (choices === 0) return

  let pick = Math.floor(Math.random() * choices)
  let lane = 0
  for (let i = 0; i < CLIMB_LANES; i++) {
    if (!laneFree[i]) continue
    if (pick === 0) { lane = i; break }
    pick--
  }

  const rock = c.rocks.find((r) => !r.active)
  if (!rock) return
  rock.active = true
  rock.lane = lane
  rock.y = c.progress + CLIMB_SPAWN_AHEAD
  rock.speed = CLIMB_ROCK_SPEED_MIN + Math.random() * (CLIMB_ROCK_SPEED_MAX - CLIMB_ROCK_SPEED_MIN)
}

/** One fixed-timestep step of the climb mini-game. */
export function updateClimb(state: GameState, input: InputState, dt: number): void {
  const c = state.climb
  const player = state.player

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

  if (player.invulnerableFor > 0) {
    player.invulnerableFor = Math.max(0, player.invulnerableFor - dt)
  }

  // Reached the top → back to running.
  if (c.progress >= c.height) {
    exitClimb(state)
    return
  }

  // ── Spawn falling rocks ──
  c.spawnTimer -= dt
  if (c.spawnTimer <= 0) {
    spawnRock(c)
    c.spawnTimer = spawnInterval(c)
  }

  // ── Advance rocks + collide ──
  const invuln = player.invulnerableFor > 0
  for (const rock of c.rocks) {
    if (!rock.active) continue
    rock.y -= rock.speed * dt
    if (rock.y < c.progress - CLIMB_DESPAWN_BELOW) {
      rock.active = false
      continue
    }
    if (!invuln && rock.lane === c.lane && Math.abs(rock.y - c.progress) < CLIMB_HIT_BAND) {
      // Hit: clear the ladder, slip down a little, lose a life (bear closes in).
      for (const rr of c.rocks) rr.active = false
      c.progress = Math.max(0, c.progress - CLIMB_KNOCKDOWN)
      killPlayer(state)
      applyDeathPenalty(state)
      return
    }
  }
}
