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
  // Dubai: a flat hole punched through the cloud road — jump it. Low so it
  // reads as a gap in the surface rather than a wall.
  'cloud-gap': 0.3,
  // Dubai: a skyscraper top poking up through the clouds — tall lateral dodge.
  'tower-top': 2.8,
  // Tokyo: a parked car blocking a lane — low enough to read as a vehicle, tall
  // enough to force a lateral dodge (not jumpable).
  car: 1.0,
  // Egypt: a standing camel — tall lateral dodge.
  camel: 1.8,
  // Egypt: a stacked sandstone block — chest-high lateral dodge.
  'stone-block': 1.1,
}

export const CAMERA_HEIGHT = 3.4
export const CAMERA_BACK = 5.5
export const CAMERA_LOOK_AHEAD = 7
export const CAMERA_LOOK_HEIGHT = 0.9
export const CAMERA_LATERAL_FOLLOW = 0.45

// ── Ladder-climb render mapping ───────────────────────────────────────────
// Lateral spacing between the 3 ladder lanes, in world X.
export const CLIMB_LANE_WORLD_DX = 0.6
// World Y gained per 1 climb-space px (CLIMB_STEP=90px → ~0.5 world per rung).
export const CLIMB_WORLD_PER_PX = 0.5 / 90
// Player sits at this fixed world height during the climb; rungs/rocks scroll.
export const CLIMB_PLAYER_WORLD_Y = 1.0
// Camera framing while climbing: behind, low, looking up the ladder.
export const CLIMB_CAM_BACK = 4.2
export const CLIMB_CAM_HEIGHT = 0.6
export const CLIMB_CAM_LOOK_UP = 3.2
export const CLIMB_CAM_LOOK_AHEAD = 1.5

// Gentle rolling height (world units, range ~0..0.5) of the Slovak stone trail
// at a given trackY. The player, camera and trackside scenery all ride this so
// the boulder path visibly rises and dips underfoot.
export function slovakPathHeight(trackY: number): number {
  return (
    0.35 * (0.5 + 0.5 * Math.sin(trackY * 0.0016)) +
    0.15 * (0.5 + 0.5 * Math.sin(trackY * 0.0037 + 1.3))
  )
}

// Gentle airy bob (world units, range ~0..0.3) for the Dubai cloud road. Purely
// cosmetic — exported so entities.ts may give floating items a soft drift. The
// obstacle collision plane stays at y=0; this is never wired into camera/player.
export function cloudHeight(trackY: number): number {
  return 0.15 * (0.5 + 0.5 * Math.sin(trackY * 0.0021 + 0.7))
}

export function playerWorldPosition(playerX: number, distance: number): { x: number; z: number } {
  return { x: toWorldX(playerX), z: toWorldZ(distance) }
}

export function obstacleWorldPosition(obstacle: Obstacle): { x: number; z: number } {
  return { x: toWorldX(obstacle.x), z: toWorldZ(obstacle.trackY) }
}
