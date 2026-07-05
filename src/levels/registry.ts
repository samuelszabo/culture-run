import { Character } from '../game/types'
import { Level, createChinaWallLevel } from './china-wall'
import { Landmark } from './landmark'
import { SLOVAK_PARADISE_LANDMARKS, createSlovakParadiseLevel } from './slovak-paradise'
import { BURJ_KHALIFA_LANDMARKS, createBurjKhalifaLevel } from './burj-khalifa'
import { TOKYO_NEON_LANDMARKS, createTokyoNeonLevel } from './tokyo-neon'

// China landmarks live here (registry) rather than in the render layer so the
// game loop can trigger captions without importing render3d.
const CHINA_WALL_LANDMARKS: Landmark[] = [
  { id: 'watchtower', trackY: 4000, nameKey: 'landmark.watchtower', factKey: 'landmark.watchtower.fact' },
  { id: 'pagoda', trackY: 10000, nameKey: 'landmark.pagoda', factKey: 'landmark.pagoda.fact' },
  { id: 'lion', trackY: 15500, nameKey: 'landmark.lion', factKey: 'landmark.lion.fact' },
]

export interface LevelDef {
  id: string
  countryKey: string
  flag: string
  // Which render environment to activate (see render3d/scene.ts).
  environmentId: string
  // When true a chasing bear renders behind the player (Slovak Paradise).
  chaser: boolean
  createLevel(): Level
  landmarks: Landmark[]
  areaNameKey: string
  areaInfoKey: string
  cardTitleKey: string
  cardFactKey: string
  resultsFactKey: string
}

export const LEVELS: Record<string, LevelDef> = {
  'china-wall': {
    id: 'china-wall',
    countryKey: 'china',
    flag: '🇨🇳',
    environmentId: 'china-wall',
    chaser: false,
    createLevel: createChinaWallLevel,
    landmarks: CHINA_WALL_LANDMARKS,
    areaNameKey: 'area.china-wall',
    areaInfoKey: 'area.china-wall.info',
    cardTitleKey: 'card.china-wall.title',
    cardFactKey: 'card.china-wall.fact',
    resultsFactKey: 'results.fact.china-wall',
  },
  'slovak-paradise': {
    id: 'slovak-paradise',
    countryKey: 'slovakia',
    flag: '🇸🇰',
    environmentId: 'slovak-paradise',
    chaser: true,
    createLevel: createSlovakParadiseLevel,
    landmarks: SLOVAK_PARADISE_LANDMARKS,
    areaNameKey: 'area.slovak-paradise',
    areaInfoKey: 'area.slovak-paradise.info',
    cardTitleKey: 'card.slovak-paradise.title',
    cardFactKey: 'card.slovak-paradise.fact',
    resultsFactKey: 'results.fact.slovak-paradise',
  },
  'burj-khalifa': {
    id: 'burj-khalifa',
    countryKey: 'dubai',
    flag: '🇦🇪',
    environmentId: 'burj-khalifa',
    chaser: false,
    createLevel: createBurjKhalifaLevel,
    landmarks: BURJ_KHALIFA_LANDMARKS,
    areaNameKey: 'area.burj-khalifa',
    areaInfoKey: 'area.burj-khalifa.info',
    cardTitleKey: 'card.burj-khalifa.title',
    cardFactKey: 'card.burj-khalifa.fact',
    resultsFactKey: 'results.fact.burj-khalifa',
  },
  'tokyo-neon': {
    id: 'tokyo-neon',
    countryKey: 'japan',
    flag: '🇯🇵',
    environmentId: 'tokyo-neon',
    chaser: false,
    createLevel: createTokyoNeonLevel,
    landmarks: TOKYO_NEON_LANDMARKS,
    areaNameKey: 'area.tokyo-neon',
    areaInfoKey: 'area.tokyo-neon.info',
    cardTitleKey: 'card.tokyo-neon.title',
    cardFactKey: 'card.tokyo-neon.fact',
    resultsFactKey: 'results.fact.tokyo-neon',
  },
}

export function getLevel(id: string): LevelDef {
  return LEVELS[id] ?? LEVELS['china-wall']
}

// Maps a country key to its (single, for now) level id.
export const COUNTRY_LEVEL: Record<string, string> = {
  china: 'china-wall',
  slovakia: 'slovak-paradise',
  dubai: 'burj-khalifa',
  japan: 'tokyo-neon',
}

// Characters offered in each country's wardrobe. The bear is the Slovak-themed
// playable character (shown locked there until earned); boy/girl/cat are the
// base characters. China deliberately offers only the base trio.
export const COUNTRY_CHARACTERS: Record<string, Character[]> = {
  china: ['boy', 'girl', 'cat'],
  slovakia: ['boy', 'girl', 'cat', 'bear'],
  dubai: ['boy', 'girl', 'cat', 'unicorn'],
  japan: ['boy', 'girl', 'cat', 'ninja'],
}
