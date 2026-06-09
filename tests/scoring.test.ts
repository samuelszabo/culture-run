import { describe, it, expect } from 'vitest'
import { computeStars, applyDeathPenalty } from '../src/game/scoring'
import { createGameState } from '../src/game/types'

describe('computeStars', () => {
  it('returns 0 when the run did not finish', () => {
    expect(computeStars(1000, 1000, false)).toBe(0)
  })

  it('returns 5 when there is nothing to collect', () => {
    expect(computeStars(0, 0, true)).toBe(5)
  })

  it('maps ratio thresholds to stars', () => {
    expect(computeStars(900, 1000, true)).toBe(5) // 0.90
    expect(computeStars(750, 1000, true)).toBe(4) // 0.75
    expect(computeStars(550, 1000, true)).toBe(3) // 0.55
    expect(computeStars(350, 1000, true)).toBe(2) // 0.35
    expect(computeStars(100, 1000, true)).toBe(1)
  })

  it('one death (max 85%) mathematically excludes 5 stars', () => {
    expect(computeStars(850, 1000, true)).toBeLessThan(5)
  })
})

describe('applyDeathPenalty', () => {
  it('subtracts 15% of max score, floored at 0', () => {
    const s = createGameState([], [{ kind: 'tea', x: 0, trackY: 0, points: 1000, collected: false }], 'boy', [])
    s.score = 500
    applyDeathPenalty(s)
    expect(s.score).toBe(350)

    s.score = 100
    applyDeathPenalty(s)
    expect(s.score).toBe(0)
  })
})
