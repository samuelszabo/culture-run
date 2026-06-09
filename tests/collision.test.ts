import { describe, it, expect } from 'vitest'
import { intersects } from '../src/game/collision'

describe('intersects (AABB)', () => {
  it('detects overlapping boxes', () => {
    expect(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true)
  })

  it('rejects separated boxes', () => {
    expect(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 })).toBe(false)
  })

  it('treats edge-touching as non-overlapping', () => {
    expect(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false)
  })
})
