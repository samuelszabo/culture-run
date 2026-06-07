import { SaveData, RewardId } from '../game/types'
import { REWARDS } from '../game/rewards'

const STORAGE_KEY = 'cultureRun.save'

function defaultSave(): SaveData {
  return {
    version: 2,
    character: null,
    unlockedRewards: [],
    equippedRewards: [],
    bestScores: {},
    settings: { sound: true, language: 'sk' },
    album: { foods: [], landmarks: [] },
  }
}

function migrateToV2(save: SaveData): SaveData {
  if (!save.album) {
    save.album = { foods: [], landmarks: [] }
  }
  save.version = 2
  return save
}

function migrateRewardIds(save: SaveData): SaveData {
  const rename = (ids: RewardId[]) =>
    ids.map((id) => ((id as string) === 'sparkly-tail' ? 'dragon-tail' : id))
  save.unlockedRewards = rename(save.unlockedRewards)
  save.equippedRewards = rename(save.equippedRewards)
  if (save.bestScores['china-bridge'] && !save.bestScores['china-wall']) {
    save.bestScores['china-wall'] = save.bestScores['china-bridge']
    delete save.bestScores['china-bridge']
  }
  return save
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultSave()
    const parsed = JSON.parse(raw) as SaveData
    if (typeof parsed !== 'object' || parsed === null) return defaultSave()
    if (parsed.version === 1) {
      return migrateRewardIds(migrateToV2(parsed))
    }
    if (parsed.version === 2) {
      return migrateRewardIds(migrateToV2(parsed))
    }
    return defaultSave()
  } catch {
    return defaultSave()
  }
}

export function persistSave(save: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
}

export function recordCollectedFood(save: SaveData, kind: string): boolean {
  if (save.album.foods.includes(kind)) return false
  save.album.foods.push(kind)
  persistSave(save)
  return true
}

export function recordSeenLandmark(save: SaveData, id: string): boolean {
  if (save.album.landmarks.includes(id)) return false
  save.album.landmarks.push(id)
  persistSave(save)
  return true
}

export function recordLevelResult(save: SaveData, levelId: string, score: number, stars: number): RewardId[] {
  return recordLevelResultWithStars(save, levelId, score, stars)
}

export function recordLevelResultWithStars(save: SaveData, levelId: string, score: number, stars: number): RewardId[] {
  // Najlepšie skóre a najlepšie hviezdičky sa sledujú nezávisle — bonus z kvízu
  // môže prekonať skóre 5★ behu, ale nesmie znížiť zobrazené hviezdičky.
  const existing = save.bestScores[levelId]
  if (!existing || score > existing.score) {
    save.bestScores[levelId] = { score, stars: Math.max(existing?.stars ?? 0, stars) }
  } else if (stars > existing.stars) {
    existing.stars = stars
  }

  const newlyUnlocked: RewardId[] = []

  for (const reward of REWARDS) {
    if (save.unlockedRewards.includes(reward.id)) continue
    const earnedByLevel = reward.levelId === levelId && stars === 5
    const earnedByScore = reward.scoreThreshold !== undefined && score >= reward.scoreThreshold
    if (earnedByLevel || earnedByScore) {
      save.unlockedRewards.push(reward.id)
      save.equippedRewards.push(reward.id)
      newlyUnlocked.push(reward.id)
    }
  }

  persistSave(save)
  return newlyUnlocked
}
