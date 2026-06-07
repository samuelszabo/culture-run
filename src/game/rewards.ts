import { RewardId } from './types'

export interface Reward {
  id: RewardId
  nameKey: string
  hintKey: string
  levelId?: string
  scoreThreshold?: number
}

export const REWARDS: Reward[] = [
  {
    id: 'dragon-tail',
    nameKey: 'reward.dragon-tail',
    hintKey: 'reward.dragon-tail.hint',
    levelId: 'china-wall',
  },
  {
    id: 'labubu',
    nameKey: 'reward.labubu',
    hintKey: 'reward.labubu.hint',
    scoreThreshold: 1010,
  },
  {
    id: 'cat-pet',
    nameKey: 'reward.cat-pet',
    hintKey: 'reward.cat-pet.hint',
    scoreThreshold: 810,
  },
]
