import { SaveData, RewardId } from '../game/types'
import { rewardForLevel } from '../game/rewards'

const STORAGE_KEY = 'cultureRun.save'

function defaultSave(): SaveData {
  return {
    version: 1,
    character: null,
    unlockedRewards: [],
    equippedRewards: [],
    bestScores: {},
    settings: { sound: true, language: 'sk' },
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultSave()
    const parsed = JSON.parse(raw) as SaveData
    if (parsed.version !== 1) return defaultSave()
    return migrateRewardIds(parsed)
  } catch {
    return defaultSave()
  }
}

function migrateRewardIds(save: SaveData): SaveData {
  const rename = (ids: RewardId[]) =>
    ids.map((id) => ((id as string) === 'sparkly-tail' ? 'dragon-tail' : id))
  save.unlockedRewards = rename(save.unlockedRewards)
  save.equippedRewards = rename(save.equippedRewards)
  return save
}

export function persistSave(save: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
}

export function recordLevelResult(save: SaveData, levelId: string, score: number, stars: number): RewardId[] {
  const existing = save.bestScores[levelId]
  if (!existing || score > existing.score) {
    save.bestScores[levelId] = { score, stars }
  }

  const newlyUnlocked: RewardId[] = []

  if (stars === 5) {
    const reward = rewardForLevel(levelId)
    if (reward && !save.unlockedRewards.includes(reward.id)) {
      save.unlockedRewards.push(reward.id)
      save.equippedRewards.push(reward.id)
      newlyUnlocked.push(reward.id)
    }
  }

  persistSave(save)
  return newlyUnlocked
}
