import { describe, it, expect } from 'vitest'
import {
  CLIMB_LANES,
  CLIMB_MAX_ACTIVE_ROCKS,
  STARTING_LIVES,
  createGameState,
  createInputState,
  Obstacle,
} from '../src/game/types'
import { enterClimb, updateClimb } from '../src/game/climb'

const GATE: Obstacle = { kind: 'ladder', x: 240, trackY: 5000, w: 160, h: 10, harmless: true, climb: true }
const gs = () => createGameState([], [], 'boy', [], true)
const DT = 1 / 60

describe('climb mini-game', () => {
  it('enterClimb freezes the run and arms the ladder', () => {
    const g = gs()
    enterClimb(g, GATE)
    expect(g.phase).toBe('climbing')
    expect(g.climb.active).toBe(true)
    expect(g.distance).toBe(GATE.trackY)
    expect(g.climb.progress).toBe(0)
  })

  it('never has more than LANES-1 rocks active, so a lane is always open', () => {
    const g = gs()
    enterClimb(g, GATE)
    const input = createInputState()
    let maxActive = 0
    for (let i = 0; i < 3000 && g.phase === 'climbing'; i++) {
      input.climbQueued = i % 2 === 0
      updateClimb(g, input, DT)
      maxActive = Math.max(maxActive, g.climb.rocks.filter((r) => r.active).length)
    }
    expect(maxActive).toBeLessThanOrEqual(CLIMB_MAX_ACTIVE_ROCKS)
    expect(CLIMB_MAX_ACTIVE_ROCKS).toBeLessThanOrEqual(CLIMB_LANES - 1)
  })

  it('a dodging player reaches the top without losing a life', () => {
    const g = gs()
    enterClimb(g, GATE)
    const input = createInputState()
    for (let i = 0; i < 8000 && g.phase === 'climbing'; i++) {
      const c = g.climb
      const threat = c.rocks.find(
        (r) => r.active && r.lane === c.lane && r.y >= c.progress && r.y - c.progress < 320,
      )
      if (threat) {
        for (let L = 0; L < CLIMB_LANES; L++) {
          if (L === c.lane) continue
          const busy = c.rocks.some((r) => r.active && r.lane === L && Math.abs(r.y - c.progress) < 320)
          if (!busy) { input.climbLane = L < c.lane ? -1 : 1; break }
        }
        input.climbQueued = false
      } else {
        input.climbLane = 0
        input.climbQueued = i % 2 === 0
      }
      updateClimb(g, input, DT)
    }
    expect(g.phase).toBe('running')
    expect(g.lives).toBe(STARTING_LIVES)
    expect(g.distance).toBe(GATE.trackY)
    expect(g.player.x).toBe(GATE.x)
  })

  it('a rock in the player lane costs a life and knocks them down', () => {
    const g = gs()
    enterClimb(g, GATE)
    g.climb.progress = 400
    const c = g.climb
    c.rocks[0].active = true
    c.rocks[0].lane = c.lane
    c.rocks[0].y = c.progress
    c.rocks[0].speed = 0
    updateClimb(g, createInputState(), DT)
    expect(g.lives).toBe(STARTING_LIVES - 1)
    expect(g.climb.progress).toBeLessThan(400)
  })
})
