export const GAME_WIDTH = 480
export const GAME_HEIGHT = 800
export const ROAD_LEFT = 60
export const ROAD_RIGHT = GAME_WIDTH - 60
export const PLAYER_SCREEN_Y = 620
export const TRACK_LENGTH = 9000
export const BASE_SPEED = 240
export const PLAYER_MOVE_SPEED = 340
export const STARTING_LIVES = 3
export const DEATH_PAUSE_SECONDS = 1.5
export const INVULNERABLE_SECONDS = 2

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

export type ObstacleKind = 'stall' | 'wall'

export interface Obstacle {
  kind: ObstacleKind
  x: number
  trackY: number
  w: number
  h: number
}

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
  obstacles: Obstacle[]
  distance: number
  speed: number
  lives: number
  score: number
  deathPauseFor: number
  elapsed: number
}

export function createInputState(): InputState {
  return { leftHeld: false, rightHeld: false, touchTargetX: null }
}

export function createGameState(obstacles: Obstacle[]): GameState {
  return {
    phase: 'running',
    player: { x: GAME_WIDTH / 2, w: 36, h: 48, invulnerableFor: 0 },
    obstacles,
    distance: 0,
    speed: BASE_SPEED,
    lives: STARTING_LIVES,
    score: 0,
    deathPauseFor: 0,
    elapsed: 0,
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
