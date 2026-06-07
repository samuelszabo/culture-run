import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ROAD_LEFT,
  ROAD_RIGHT,
  PLAYER_SCREEN_Y,
  GameState,
} from '../game/types'

const BRIDGE_LEFT = ROAD_LEFT - 10
const BRIDGE_RIGHT = ROAD_RIGHT + 10
const RAILING_WIDTH = 10
const TILE_HEIGHT = 80
const WATER_SPEED = 0.4
const RIPPLE_PERIOD = 60
const RIPPLE_HEIGHT = 3
const POST_PERIOD = 120
const POST_WIDTH = 10
const POST_HEIGHT = 28
const LANTERN_PERIOD = 400
const LANTERN_RADIUS = 7
const LANTERN_TASSEL_W = 3
const LANTERN_TASSEL_H = 10
const DECO_PERIOD = 750
const DECO_KINDS = 4

export function drawBackground(ctx: CanvasRenderingContext2D, state: GameState): void {
  const d = state.distance

  drawWater(ctx, d)
  drawWaterDecorations(ctx, d)
  drawBridgeDeck(ctx, d)
  drawRailingPosts(ctx, d)
  drawLanterns(ctx, d)
}

function drawWater(ctx: CanvasRenderingContext2D, distance: number): void {
  ctx.fillStyle = '#2e6e5e'
  ctx.fillRect(0, 0, BRIDGE_LEFT, GAME_HEIGHT)
  ctx.fillRect(BRIDGE_RIGHT, 0, GAME_WIDTH - BRIDGE_RIGHT, GAME_HEIGHT)

  const waterOffset = (distance * WATER_SPEED) % RIPPLE_PERIOD
  const rippleLower = Math.ceil((-waterOffset) / RIPPLE_PERIOD)
  const rippleUpper = Math.floor((GAME_HEIGHT - waterOffset) / RIPPLE_PERIOD)

  for (let n = rippleLower; n <= rippleUpper; n++) {
    const y = n * RIPPLE_PERIOD + waterOffset
    if (y < -RIPPLE_HEIGHT || y > GAME_HEIGHT + RIPPLE_HEIGHT) continue

    ctx.fillStyle = '#3d8a72'
    ctx.fillRect(0, y, BRIDGE_LEFT - 2, RIPPLE_HEIGHT)
    ctx.fillRect(BRIDGE_RIGHT + 2, y, GAME_WIDTH - BRIDGE_RIGHT - 2, RIPPLE_HEIGHT)
  }
}

function drawWaterDecorations(ctx: CanvasRenderingContext2D, distance: number): void {
  const decoOffset = distance * WATER_SPEED
  const lower = Math.ceil((decoOffset - GAME_HEIGHT - 80) / DECO_PERIOD)
  const upper = Math.floor((decoOffset + 80) / DECO_PERIOD)

  for (let n = lower; n <= upper; n++) {
    const y = PLAYER_SCREEN_Y - n * DECO_PERIOD + decoOffset
    if (y < -80 || y > GAME_HEIGHT + 80) continue

    const kind = ((n % DECO_KINDS) + DECO_KINDS) % DECO_KINDS
    const side = ((n % 2) + 2) % 2

    if (side === 0) {
      drawWaterElement(ctx, kind, 10, y)
    } else {
      drawWaterElement(ctx, kind, BRIDGE_RIGHT + 10, y)
    }
  }
}

function drawWaterElement(
  ctx: CanvasRenderingContext2D,
  kind: number,
  x: number,
  y: number,
): void {
  if (kind === 0) {
    ctx.fillStyle = '#4caf84'
    ctx.fillRect(x, y, 18, 10)
    ctx.fillStyle = '#3d8a6a'
    ctx.fillRect(x + 4, y + 3, 10, 4)
  } else if (kind === 1) {
    ctx.fillStyle = '#7a6a5a'
    ctx.fillRect(x, y, 12, 8)
    ctx.fillStyle = '#5a4e42'
    ctx.fillRect(x + 2, y - 4, 8, 5)
  } else if (kind === 2) {
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(x + 2, y, 20, 8)
    ctx.fillStyle = '#7f8c8d'
    ctx.fillRect(x, y + 2, 4, 14)
    ctx.fillRect(x + 22, y + 2, 4, 14)
  } else {
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(x + 6, y - 14, 8, 14)
    ctx.fillStyle = '#b8960c'
    ctx.fillRect(x + 4, y - 18, 12, 6)
    ctx.fillRect(x + 4, y, 12, 6)
    ctx.fillRect(x + 2, y - 14, 16, 14)
    ctx.fillStyle = '#f39c12'
    ctx.fillRect(x + 8, y + 6, 4, 8)
  }
}

function drawBridgeDeck(ctx: CanvasRenderingContext2D, distance: number): void {
  ctx.fillStyle = '#b8a88a'
  ctx.fillRect(BRIDGE_LEFT, 0, BRIDGE_RIGHT - BRIDGE_LEFT, GAME_HEIGHT)

  const scroll = distance % TILE_HEIGHT
  ctx.fillStyle = '#a89878'
  for (let y = -TILE_HEIGHT + scroll; y < GAME_HEIGHT; y += TILE_HEIGHT) {
    ctx.fillRect(ROAD_LEFT, y, ROAD_RIGHT - ROAD_LEFT, 3)
  }
}

function drawRailingPosts(ctx: CanvasRenderingContext2D, distance: number): void {
  ctx.fillStyle = '#8d7b5e'
  ctx.fillRect(BRIDGE_LEFT, 0, RAILING_WIDTH, GAME_HEIGHT)
  ctx.fillRect(ROAD_RIGHT, 0, RAILING_WIDTH, GAME_HEIGHT)

  const lower = Math.ceil((distance - GAME_HEIGHT - POST_HEIGHT) / POST_PERIOD)
  const upper = Math.floor((distance + POST_HEIGHT) / POST_PERIOD)

  for (let n = lower; n <= upper; n++) {
    const y = PLAYER_SCREEN_Y - n * POST_PERIOD + distance
    if (y < -POST_HEIGHT || y > GAME_HEIGHT + POST_HEIGHT) continue

    ctx.fillStyle = '#6b5c46'
    ctx.fillRect(BRIDGE_LEFT, y - POST_HEIGHT, POST_WIDTH, POST_HEIGHT)
    ctx.fillRect(ROAD_RIGHT, y - POST_HEIGHT, POST_WIDTH, POST_HEIGHT)
  }
}

function drawLanterns(ctx: CanvasRenderingContext2D, distance: number): void {
  const lower = Math.ceil((distance - GAME_HEIGHT - 40) / LANTERN_PERIOD)
  const upper = Math.floor((distance + 40) / LANTERN_PERIOD)

  for (let n = lower; n <= upper; n++) {
    const y = PLAYER_SCREEN_Y - n * LANTERN_PERIOD + distance
    if (y < -40 || y > GAME_HEIGHT + 40) continue

    const side = ((n % 2) + 2) % 2

    if (side === 0) {
      drawLantern(ctx, BRIDGE_LEFT - LANTERN_RADIUS - 2, y)
    } else {
      drawLantern(ctx, BRIDGE_RIGHT + LANTERN_RADIUS + 2, y)
    }
  }
}

function drawLantern(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillStyle = '#c0392b'
  ctx.fillRect(
    cx - LANTERN_RADIUS,
    cy - LANTERN_RADIUS,
    LANTERN_RADIUS * 2,
    LANTERN_RADIUS * 2,
  )

  ctx.fillStyle = '#f39c12'
  ctx.fillRect(cx - 2, cy - LANTERN_RADIUS - 4, 4, 5)

  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(
    cx - LANTERN_TASSEL_W,
    cy + LANTERN_RADIUS,
    LANTERN_TASSEL_W * 2,
    LANTERN_TASSEL_H,
  )

  ctx.fillStyle = '#e67e22'
  ctx.fillRect(cx - LANTERN_RADIUS, cy - 1, LANTERN_RADIUS * 2, 2)
}
