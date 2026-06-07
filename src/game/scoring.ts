import { GameState } from './types'

export const DEATH_PENALTY_RATIO = 0.15

export function applyDeathPenalty(state: GameState): void {
  state.score = Math.max(0, Math.round(state.score - DEATH_PENALTY_RATIO * state.maxScore))
}

export function computeStars(score: number, maxScore: number, finished: boolean): number {
  if (!finished) return 0
  if (maxScore === 0) return 5

  const ratio = score / maxScore

  if (ratio >= 0.90) return 5
  if (ratio >= 0.75) return 4
  if (ratio >= 0.55) return 3
  if (ratio >= 0.35) return 2
  return 1
}
