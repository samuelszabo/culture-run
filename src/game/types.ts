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

// Jump physics, in track-space px (vertical axis, separate from the 2D
// collision plane). Apex ≈ JUMP_VELOCITY² / (2·JUMP_GRAVITY) ≈ 81px.
export const JUMP_VELOCITY = 540
export const JUMP_GRAVITY = 1800
// Airborne above this height clears a jumpable obstacle.
export const JUMP_CLEAR_HEIGHT = 26

export type Character = 'boy' | 'girl' | 'cat' | 'bear' | 'unicorn'

export type RewardId =
  | 'dragon-tail'
  | 'labubu'
  | 'cat-pet'
  | 'bear-cub'
  | 'kroj'
  | 'squirrel'
  | 'playable-bear'
  | 'falcon-pet'
  | 'rainbow-wings'
  | 'rainbow-tail'
  | 'playable-unicorn'

export interface SaveData {
  version: number
  character: Character | null
  unlockedRewards: RewardId[]
  equippedRewards: RewardId[]
  bestScores: Record<string, { score: number; stars: number }>
  settings: { sound: boolean; language: string }
  album: { foods: string[]; landmarks: string[] }
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
  jumpQueued: boolean
  // Ladder-climb mini-game (Slovak Paradise): edge-triggered ascend + discrete
  // lateral lane step (-1 left / +1 right / 0 none).
  climbQueued: boolean
  climbLane: number
}

export type ObstacleKind =
  | 'stall'
  | 'wall'
  | 'walker'
  | 'carrier'
  | 'firecracker'
  | 'gorge-wall'
  | 'ladder'
  // Dubaj (beh v oblakoch): medzera v oblakovej ceste — smrteľná iba na zemi,
  // preskoč ju skokom. Špička mrakodrapu — vysoká prekážka na uhýbanie.
  | 'cloud-gap'
  | 'tower-top'

// Low, ground-level obstacles the player can leap over. Tall barriers
// (stalls/walls/gorge rock faces) and pedestrians (walkers/carriers) must
// still be dodged. Ladders are decorative gap markers (harmless). A cloud-gap
// behaves like a jumpable hazard inverted: harmless while airborne, deadly on
// the ground — you must be in a jump as it passes underfoot.
export function isJumpable(kind: ObstacleKind): boolean {
  return kind === 'firecracker' || kind === 'cloud-gap'
}

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
  // Designated ladder section: reaching it starts the climb mini-game.
  climb?: boolean
}

export type CollectibleKind =
  | 'noodles'
  | 'baozi'
  | 'tea'
  | 'halusky'
  | 'pstruh'
  | 'cucoriedky'
  | 'dubai-choc'
  | 'datle'
  | 'luqaimat'

export interface Collectible {
  kind: CollectibleKind
  x: number
  trackY: number
  points: number
  collected: boolean
}

export const COLLECTIBLE_SIZE = 28

// ── Ladder-climb mini-game tunables ───────────────────────────────────────
// A calm vertical climb in its own coordinate frame (lanes 0..N-1, vertical
// "climb px" 0..CLIMB_HEIGHT). The run freezes while climbing; tap to ascend
// to the grassy top. No falling rocks — reaching the top always succeeds.
export const CLIMB_LANES = 3
export const CLIMB_HEIGHT = 1400           // climb-space px to the top (~16 taps)
export const CLIMB_STEP = 90               // px gained per tap/press
export const CLIMB_TAP_COOLDOWN = 0.13     // s between accepted ascends
export const CLIMB_LANE_COOLDOWN = 0.12    // s between accepted lateral steps
export const CLIMB_EXIT_INVULN = 0.7       // s grace after reaching the top

export type GamePhase = 'running' | 'climbing' | 'dying' | 'finished' | 'gameover'

export interface ClimbState {
  active: boolean
  gateTrackY: number  // distance to resume at after the climb
  gapCenter: number   // track-space x to restore on exit
  height: number
  progress: number    // 0..height, how high the player has climbed
  lane: number        // 0..CLIMB_LANES-1
  climbCooldown: number
  laneCooldown: number
}

function createClimbState(): ClimbState {
  return {
    active: false,
    gateTrackY: 0,
    gapCenter: GAME_WIDTH / 2,
    height: CLIMB_HEIGHT,
    progress: 0,
    lane: Math.floor(CLIMB_LANES / 2),
    climbCooldown: 0,
    laneCooldown: 0,
  }
}

export interface Player {
  x: number
  w: number
  h: number
  invulnerableFor: number
  jumpHeight: number
  jumpVel: number
}

export interface GameState {
  phase: GamePhase
  player: Player
  character: Character
  equipped: RewardId[]
  obstacles: Obstacle[]
  collectibles: Collectible[]
  maxScore: number
  // When true a chasing bear renders behind the player and "catches" them on
  // game over (Slovak Paradise). Purely a render-side flag — lives/scoring are
  // unchanged from the standard model.
  chaser: boolean
  distance: number
  speed: number
  lives: number
  score: number
  deathPauseFor: number
  elapsed: number
  endedAt: number | null
  newRewards: RewardId[]
  lastCollected: { kind: string; seq: number }
  climb: ClimbState
}

export function createInputState(): InputState {
  return {
    leftHeld: false,
    rightHeld: false,
    touchTargetX: null,
    jumpQueued: false,
    climbQueued: false,
    climbLane: 0,
  }
}

export function createGameState(
  obstacles: Obstacle[],
  collectibles: Collectible[],
  character: Character,
  equipped: RewardId[],
  chaser: boolean = false,
): GameState {
  return {
    phase: 'running',
    player: { x: GAME_WIDTH / 2, w: 36, h: 48, invulnerableFor: 0, jumpHeight: 0, jumpVel: 0 },
    character,
    equipped,
    obstacles,
    collectibles,
    maxScore: collectibles.reduce((sum, c) => sum + c.points, 0),
    chaser,
    distance: 0,
    speed: BASE_SPEED,
    lives: STARTING_LIVES,
    score: 0,
    deathPauseFor: 0,
    elapsed: 0,
    endedAt: null,
    newRewards: [],
    lastCollected: { kind: '', seq: 0 },
    climb: createClimbState(),
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
