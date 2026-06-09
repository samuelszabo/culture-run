import { describe, it, expect } from 'vitest'
import { createSlovakParadiseLevel } from '../src/levels/slovak-paradise'
import { createChinaWallLevel } from '../src/levels/china-wall'
import { Level } from '../src/levels/china-wall'

const maxScore = (l: Level) => l.collectibles.reduce((s, c) => s + c.points, 0)

describe('Slovak Paradise level data', () => {
  const lvl = createSlovakParadiseLevel()

  it('max score matches the tuned balance and China parity (1080)', () => {
    expect(maxScore(lvl)).toBe(1080)
    expect(maxScore(createChinaWallLevel())).toBe(1080)
  })

  it('flags exactly 3 climb sections', () => {
    const climbs = lvl.obstacles.filter((o) => o.kind === 'ladder' && o.climb)
    expect(climbs.length).toBe(3)
  })

  it('ladders are harmless and gorge walls are solid', () => {
    for (const o of lvl.obstacles) {
      if (o.kind === 'ladder') expect(o.harmless).toBe(true)
      if (o.kind === 'gorge-wall') expect(o.harmless).toBeFalsy()
    }
  })

  it('collectibles use only Slovak food kinds', () => {
    for (const c of lvl.collectibles) {
      expect(['halusky', 'pstruh', 'cucoriedky']).toContain(c.kind)
    }
  })
})
