import { GAME_WIDTH, Obstacle, ObstacleKind, ROAD_LEFT, ROAD_RIGHT } from '../game/types'

export const UNIT = 50

export function toWorldX(trackX: number): number {
  return (trackX - GAME_WIDTH / 2) / UNIT
}

export function toWorldZ(trackY: number): number {
  return -trackY / UNIT
}

export function toWorldSize(trackPx: number): number {
  return trackPx / UNIT
}

export const ROAD_WORLD_LEFT = toWorldX(ROAD_LEFT)
export const ROAD_WORLD_RIGHT = toWorldX(ROAD_RIGHT)
export const ROAD_WORLD_WIDTH = ROAD_WORLD_RIGHT - ROAD_WORLD_LEFT

// Track extent in world Z. Scenery for every environment is laid out along this
// span (player runs from TRACK_Z_START toward TRACK_Z_END).
export const TRACK_Z_START = 10
export const TRACK_Z_END = -410
export const TRACK_LENGTH_WORLD = TRACK_Z_START - TRACK_Z_END
export const TRACK_Z_CENTER = (TRACK_Z_START + TRACK_Z_END) / 2

export const PLAYER_WORLD_HEIGHT = 1.3
export const COLLECTIBLE_WORLD_SIZE = 0.5

export const OBSTACLE_WORLD_HEIGHTS: Record<ObstacleKind, number> = {
  stall: 1.5,
  wall: 0.8,
  walker: 1.4,
  carrier: 1.5,
  firecracker: 0.6,
  // Tall rock faces forming the gorge walls; the gap between them is the ladder lane.
  'gorge-wall': 1.7,
  // Decorative ladder set into a gorge gap (harmless marker).
  ladder: 1.6,
}

export const CAMERA_HEIGHT = 3.4
export const CAMERA_BACK = 5.5
export const CAMERA_LOOK_AHEAD = 7
export const CAMERA_LOOK_HEIGHT = 0.9
export const CAMERA_LATERAL_FOLLOW = 0.45

export function playerWorldPosition(playerX: number, distance: number): { x: number; z: number } {
  return { x: toWorldX(playerX), z: toWorldZ(distance) }
}

export function obstacleWorldPosition(obstacle: Obstacle): { x: number; z: number } {
  return { x: toWorldX(obstacle.x), z: toWorldZ(obstacle.trackY) }
}
