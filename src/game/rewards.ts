import { RewardId } from './types'

export interface Reward {
  id: RewardId
  nameKey: string
  hintKey: string
  // Which country's wardrobe this reward belongs to.
  country: string
  levelId?: string
  scoreThreshold?: number
  // false = unlock only (e.g. a playable character); not shown with an equip toggle.
  equippable?: boolean
}

export const REWARDS: Reward[] = [
  // ── Čína ───────────────────────────────────────────────────
  {
    id: 'dragon-tail',
    nameKey: 'reward.dragon-tail',
    hintKey: 'reward.dragon-tail.hint',
    country: 'china',
    levelId: 'china-wall',
  },
  {
    id: 'labubu',
    nameKey: 'reward.labubu',
    hintKey: 'reward.labubu.hint',
    country: 'china',
    scoreThreshold: 1010,
  },
  {
    id: 'cat-pet',
    nameKey: 'reward.cat-pet',
    hintKey: 'reward.cat-pet.hint',
    country: 'china',
    scoreThreshold: 810,
  },
  // ── Slovenský raj ──────────────────────────────────────────
  {
    id: 'bear-cub',
    nameKey: 'reward.bear-cub',
    hintKey: 'reward.bear-cub.hint',
    country: 'slovakia',
    levelId: 'slovak-paradise',
  },
  {
    id: 'squirrel',
    nameKey: 'reward.squirrel',
    hintKey: 'reward.squirrel.hint',
    country: 'slovakia',
    scoreThreshold: 750,
  },
  {
    id: 'kroj',
    nameKey: 'reward.kroj',
    hintKey: 'reward.kroj.hint',
    country: 'slovakia',
    scoreThreshold: 950,
  },
  {
    id: 'playable-bear',
    nameKey: 'reward.playable-bear',
    hintKey: 'reward.playable-bear.hint',
    country: 'slovakia',
    scoreThreshold: 1050,
    equippable: false,
  },
  // ── Dubaj — Burj Khalifa ───────────────────────────────────
  {
    id: 'falcon-pet',
    nameKey: 'reward.falcon-pet',
    hintKey: 'reward.falcon-pet.hint',
    country: 'dubai',
    levelId: 'burj-khalifa',
  },
  {
    id: 'rainbow-wings',
    nameKey: 'reward.rainbow-wings',
    hintKey: 'reward.rainbow-wings.hint',
    country: 'dubai',
    scoreThreshold: 750,
  },
  {
    id: 'rainbow-tail',
    nameKey: 'reward.rainbow-tail',
    hintKey: 'reward.rainbow-tail.hint',
    country: 'dubai',
    scoreThreshold: 950,
  },
  {
    id: 'playable-unicorn',
    nameKey: 'reward.playable-unicorn',
    hintKey: 'reward.playable-unicorn.hint',
    country: 'dubai',
    scoreThreshold: 1050,
    equippable: false,
  },
  // ── Japonsko — Tokio v noci ────────────────────────────────
  {
    id: 'neko-pet',
    nameKey: 'reward.neko-pet',
    hintKey: 'reward.neko-pet.hint',
    country: 'japan',
    levelId: 'tokyo-neon',
  },
  {
    id: 'kitsune-pet',
    nameKey: 'reward.kitsune-pet',
    hintKey: 'reward.kitsune-pet.hint',
    country: 'japan',
    scoreThreshold: 810,
  },
  {
    id: 'playable-ninja',
    nameKey: 'reward.playable-ninja',
    hintKey: 'reward.playable-ninja.hint',
    country: 'japan',
    scoreThreshold: 1050,
    equippable: false,
  },
  // ── Egypt — Pyramídy ───────────────────────────────────────
  {
    id: 'pharaoh-collar',
    nameKey: 'reward.pharaoh-collar',
    hintKey: 'reward.pharaoh-collar.hint',
    country: 'egypt',
    levelId: 'egypt-pyramids',
  },
  {
    id: 'scarab-pet',
    nameKey: 'reward.scarab-pet',
    hintKey: 'reward.scarab-pet.hint',
    country: 'egypt',
    scoreThreshold: 810,
  },
  {
    id: 'playable-pharaoh',
    nameKey: 'reward.playable-pharaoh',
    hintKey: 'reward.playable-pharaoh.hint',
    country: 'egypt',
    scoreThreshold: 1050,
    equippable: false,
  },
]
