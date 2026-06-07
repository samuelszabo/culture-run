import { GameState, DEATH_PAUSE_SECONDS, INVULNERABLE_SECONDS } from './types'

export function killPlayer(state: GameState): void {
  state.phase = 'dying'
  state.deathPauseFor = DEATH_PAUSE_SECONDS
  state.lives -= 1
}

export function updateDying(state: GameState, dt: number): void {
  state.deathPauseFor -= dt
  if (state.deathPauseFor > 0) return

  if (state.lives <= 0) {
    state.phase = 'gameover'
  } else {
    state.phase = 'running'
    state.player.invulnerableFor = INVULNERABLE_SECONDS
  }
}
