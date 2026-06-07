import { RewardId } from './types'

export interface Reward {
  id: RewardId
  nameKey: string
  levelId: string | null
}

export const REWARDS: Reward[] = [
  { id: 'dragon-tail', nameKey: 'reward.dragon-tail', levelId: 'china-bridge' },
  { id: 'labubu', nameKey: 'reward.labubu', levelId: null },
]

export function rewardForLevel(levelId: string): Reward | undefined {
  return REWARDS.find((reward) => reward.levelId === levelId)
}
