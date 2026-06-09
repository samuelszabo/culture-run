import { describe, it, expect } from 'vitest'
import { createBurjKhalifaLevel } from '../src/levels/burj-khalifa'
import { Level } from '../src/levels/china-wall'
import { updatePlayer } from '../src/game/player'
import { findCollision } from '../src/game/collision'
import {
  BASE_SPEED,
  JUMP_CLEAR_HEIGHT,
  ROAD_LEFT,
  ROAD_RIGHT,
  TRACK_LENGTH,
  createGameState,
  createInputState,
  isJumpable,
} from '../src/game/types'

const maxScore = (l: Level) => l.collectibles.reduce((s, c) => s + c.points, 0)

describe('Burj Khalifa (Dubai) level data', () => {
  const lvl = createBurjKhalifaLevel()

  it('max score matches the tuned cross-level balance (1080)', () => {
    expect(maxScore(lvl)).toBe(1080)
  })

  it('collectibles use only Dubai food kinds', () => {
    for (const c of lvl.collectibles) {
      expect(['dubai-choc', 'datle', 'luqaimat']).toContain(c.kind)
    }
  })

  it('cloud-gaps span the full road, are jumpable and deadly', () => {
    const gaps = lvl.obstacles.filter((o) => o.kind === 'cloud-gap')
    expect(gaps.length).toBeGreaterThan(15)
    for (const g of gaps) {
      expect(g.w).toBe(ROAD_RIGHT - ROAD_LEFT)
      expect(g.harmless).toBeFalsy()
      expect(isJumpable(g.kind)).toBe(true)
    }
  })

  it('tower-tops are solid dodge obstacles that leave a passable lane', () => {
    const towers = lvl.obstacles.filter((o) => o.kind === 'tower-top')
    expect(towers.length).toBeGreaterThan(0)
    for (const tw of towers) {
      expect(tw.harmless).toBeFalsy()
      expect(isJumpable(tw.kind)).toBe(false)
      const lane = ROAD_RIGHT - ROAD_LEFT - tw.w
      expect(lane).toBeGreaterThanOrEqual(150)
    }
  })

  // The new mechanic's real risk is solvability: prove a clean (0-death) run is
  // achievable by driving the actual player/collision code with an expert
  // controller that jumps each gap and steers into the open lane past towers.
  it('is clearable with zero deaths (expert simulation)', () => {
    const level = createBurjKhalifaLevel()
    const state = createGameState(level.obstacles, level.collectibles, 'unicorn', [])
    const input = createInputState()
    const center = (ROAD_LEFT + ROAD_RIGHT) / 2
    const dt = 1 / 60

    const gaps = level.obstacles
      .filter((o) => o.kind === 'cloud-gap')
      .sort((a, b) => a.trackY - b.trackY)
    const towers = level.obstacles.filter((o) => o.kind === 'tower-top')

    let deaths = 0
    let guard = 0
    while (state.distance < TRACK_LENGTH && guard++ < 100000) {
      state.speed = BASE_SPEED * (1 + 0.3 * Math.min(1, state.distance / TRACK_LENGTH))

      // Steer: hug the open lane when a tower is approaching, else run centre.
      // Hold the open lane until the tower is fully behind us — its collision
      // window reaches ~one body-length past the player, so releasing early
      // (drifting back to centre) would clip the tail of the tower.
      let targetX = center
      for (const tw of towers) {
        const ahead = tw.trackY - state.distance
        if (ahead > -(tw.h + 40) && ahead < 360) {
          targetX = tw.x < center ? ROAD_RIGHT - 60 : ROAD_LEFT + 60
          break
        }
      }
      input.touchTargetX = targetX

      // Jump: fire as the next gap nears so the player is airborne-clear
      // (jumpHeight ≥ JUMP_CLEAR_HEIGHT) while the gap passes underfoot.
      const grounded = state.player.jumpHeight === 0 && state.player.jumpVel === 0
      input.jumpQueued = false
      if (grounded) {
        for (const g of gaps) {
          const ahead = g.trackY - state.distance
          if (ahead > 0 && ahead < 72) {
            input.jumpQueued = true
            break
          }
        }
      }

      updatePlayer(state, input, dt)
      state.distance += state.speed * dt

      if (findCollision(state) !== null) {
        deaths++
        // Survive and continue so a single mistimed frame doesn't mask the rest.
        state.player.invulnerableFor = 0.5
      }
      if (state.player.invulnerableFor > 0) {
        state.player.invulnerableFor = Math.max(0, state.player.invulnerableFor - dt)
      }
    }

    expect(state.distance).toBeGreaterThanOrEqual(TRACK_LENGTH)
    expect(JUMP_CLEAR_HEIGHT).toBeGreaterThan(0)
    expect(deaths).toBe(0)
  })
})
