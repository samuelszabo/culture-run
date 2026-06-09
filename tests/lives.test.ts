import { describe, it, expect } from 'vitest'
import { createGameState, STARTING_LIVES, DEATH_PAUSE_SECONDS } from '../src/game/types'
import { killPlayer, updateDying } from '../src/game/lives'

const fresh = () => createGameState([], [], 'boy', [])

describe('lives / death cycle', () => {
  it('killPlayer enters the dying pause and drops a life', () => {
    const g = fresh()
    killPlayer(g)
    expect(g.phase).toBe('dying')
    expect(g.lives).toBe(STARTING_LIVES - 1)
    expect(g.deathPauseFor).toBeCloseTo(DEATH_PAUSE_SECONDS)
  })

  it('resumes running after the pause while lives remain', () => {
    const g = fresh()
    killPlayer(g)
    updateDying(g, DEATH_PAUSE_SECONDS + 0.1)
    expect(g.phase).toBe('running')
    expect(g.player.invulnerableFor).toBeGreaterThan(0)
  })

  it('ends the game when out of lives', () => {
    const g = fresh()
    g.lives = 1
    killPlayer(g)
    updateDying(g, DEATH_PAUSE_SECONDS + 0.1)
    expect(g.phase).toBe('gameover')
  })

  it('resumes the climb (not the run) when a death happens mid-climb', () => {
    const g = fresh()
    g.climb.active = true
    killPlayer(g)
    updateDying(g, DEATH_PAUSE_SECONDS + 0.1)
    expect(g.phase).toBe('climbing')
  })
})
