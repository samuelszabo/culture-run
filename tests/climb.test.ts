import { describe, it, expect } from 'vitest'
import { CLIMB_LANES, createGameState, createInputState, Obstacle } from '../src/game/types'
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

  it('tapping up reaches the top and resumes the run at the gate', () => {
    const g = gs()
    enterClimb(g, GATE)
    const input = createInputState()
    for (let i = 0; i < 4000 && g.phase === 'climbing'; i++) {
      input.climbQueued = true
      updateClimb(g, input, DT)
    }
    expect(g.phase).toBe('running')
    expect(g.distance).toBe(GATE.trackY)
    expect(g.player.x).toBe(GATE.x)
  })

  it('lateral input steps between lanes, clamped to range', () => {
    const g = gs()
    enterClimb(g, GATE)
    const input = createInputState()
    for (let i = 0; i < 40; i++) { input.climbLane = -1; updateClimb(g, input, DT) }
    expect(g.climb.lane).toBe(0)
    for (let i = 0; i < 40; i++) { input.climbLane = 1; updateClimb(g, input, DT) }
    expect(g.climb.lane).toBe(CLIMB_LANES - 1)
  })
})
