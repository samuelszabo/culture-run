export const GAME_WIDTH = 480
export const GAME_HEIGHT = 800
export const ROAD_LEFT = 60
export const ROAD_RIGHT = GAME_WIDTH - 60
export const PLAYER_SCREEN_Y = 620
export const TRACK_LENGTH = 20000
export const BASE_SPEED = 240
export const PLAYER_MOVE_SPEED = 340
export const STARTING_LIVES = 3
export const DEATH_PAUSE_SECONDS = 1.5
export const INVULNERABLE_SECONDS = 2

export type Character = 'boy' | 'girl'

export type RewardId = 'dragon-tail' | 'labubu'

export interface SaveData {
  version: number
  character: Character | null
  unlockedRewards: RewardId[]
  equippedRewards: RewardId[]
  bestScores: Record<string, { score: number; stars: number }>
  settings: { sound: boolean; language: string }
}

export interface AABB {
  x: number
  y: number
  w: number
  h: number
}

export interface InputState {
  leftHeld: boolean
  rightHeld: boolean
  touchTargetX: number | null
}

export type ObstacleKind = 'stall' | 'wall' | 'walker' | 'carrier' | 'firecracker'

export interface Obstacle {
  kind: ObstacleKind
  x: number
  trackY: number
  w: number
  h: number
  vx?: number
  minX?: number
  maxX?: number
  harmless?: boolean
  warning?: boolean
  timer?: number
}

export type CollectibleKind = 'noodles' | 'baozi' | 'tea'

export interface Collectible {
  kind: CollectibleKind
  x: number
  trackY: number
  points: number
  collected: boolean
}

export const COLLECTIBLE_SIZE = 28

export type GamePhase = 'running' | 'dying' | 'finished' | 'gameover'

export interface Player {
  x: number
  w: number
  h: number
  invulnerableFor: number
}

export interface GameState {
  phase: GamePhase
  player: Player
  character: Character
  equipped: RewardId[]
  obstacles: Obstacle[]
  collectibles: Collectible[]
  maxScore: number
  distance: number
  speed: number
  lives: number
  score: number
  deathPauseFor: number
  elapsed: number
  endedAt: number | null
  newRewards: RewardId[]
}

export function createInputState(): InputState {
  return { leftHeld: false, rightHeld: false, touchTargetX: null }
}

export function createGameState(
  obstacles: Obstacle[],
  collectibles: Collectible[],
  character: Character,
  equipped: RewardId[],
): GameState {
  return {
    phase: 'running',
    player: { x: GAME_WIDTH / 2, w: 36, h: 48, invulnerableFor: 0 },
    character,
    equipped,
    obstacles,
    collectibles,
    maxScore: collectibles.reduce((sum, c) => sum + c.points, 0),
    distance: 0,
    speed: BASE_SPEED,
    lives: STARTING_LIVES,
    score: 0,
    deathPauseFor: 0,
    elapsed: 0,
    endedAt: null,
    newRewards: [],
  }
}

export function playerBox(player: Player): AABB {
  return {
    x: player.x - player.w / 2,
    y: PLAYER_SCREEN_Y - player.h,
    w: player.w,
    h: player.h,
  }
}

export function obstacleScreenY(obstacle: Obstacle, distance: number): number {
  return PLAYER_SCREEN_Y - (obstacle.trackY - distance)
}

export function obstacleBox(obstacle: Obstacle, distance: number): AABB {
  return {
    x: obstacle.x - obstacle.w / 2,
    y: obstacleScreenY(obstacle, distance) - obstacle.h,
    w: obstacle.w,
    h: obstacle.h,
  }
}

export function collectibleBox(collectible: Collectible, distance: number): AABB {
  return {
    x: collectible.x - COLLECTIBLE_SIZE / 2,
    y: PLAYER_SCREEN_Y - (collectible.trackY - distance) - COLLECTIBLE_SIZE / 2,
    w: COLLECTIBLE_SIZE,
    h: COLLECTIBLE_SIZE,
  }
}
