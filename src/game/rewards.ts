import { RewardId } from './types'

export interface Reward {
  id: RewardId
  nameKey: string
  hintKey: string
  levelId?: string
  scoreThreshold?: number
  // false = unlock only (e.g. a playable character); not shown with an equip toggle.
  equippable?: boolean
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
  // ── Slovenský raj ──────────────────────────────────────────
  {
    id: 'bear-cub',
    nameKey: 'reward.bear-cub',
    hintKey: 'reward.bear-cub.hint',
    levelId: 'slovak-paradise',
  },
  {
    id: 'squirrel',
    nameKey: 'reward.squirrel',
    hintKey: 'reward.squirrel.hint',
    scoreThreshold: 750,
  },
  {
    id: 'kroj',
    nameKey: 'reward.kroj',
    hintKey: 'reward.kroj.hint',
    scoreThreshold: 950,
  },
  {
    id: 'playable-bear',
    nameKey: 'reward.playable-bear',
    hintKey: 'reward.playable-bear.hint',
    scoreThreshold: 1050,
    equippable: false,
  },
]
