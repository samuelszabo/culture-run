import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GameState,
  PLAYER_SCREEN_Y,
  TRACK_LENGTH,
  obstacleBox,
  playerBox,
} from '../game/types'

export interface Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  screenToGameX(clientX: number): number
  screenToGameY(clientY: number): number
  beginFrame(): void
  endFrame(): void
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const maybeCtx = canvas.getContext('2d')
  if (!maybeCtx) throw new Error('Canvas 2D context unavailable')
  const ctx = maybeCtx

  let scale = 1
  let offsetX = 0
  let offsetY = 0

  function resize(): void {
    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight
    scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT)
    offsetX = (width - GAME_WIDTH * scale) / 2
    offsetY = (height - GAME_HEIGHT * scale) / 2
    canvas.width = Math.round(GAME_WIDTH * scale * dpr)
    canvas.height = Math.round(GAME_HEIGHT * scale * dpr)
    canvas.style.width = `${GAME_WIDTH * scale}px`
    canvas.style.height = `${GAME_HEIGHT * scale}px`
    canvas.style.left = `${offsetX}px`
    canvas.style.top = `${offsetY}px`
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
  }

  window.addEventListener('resize', resize)
  resize()

  return {
    canvas,
    ctx,
    screenToGameX(clientX: number): number {
      return (clientX - offsetX) / scale
    },
    screenToGameY(clientY: number): number {
      return (clientY - offsetY) / scale
    },
    beginFrame(): void {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    },
    endFrame(): void {},
  }
}

const OBSTACLE_COLORS: Record<string, string> = {
  stall: '#c0392b',
  wall: '#7f8c8d',
}

export function drawWorld(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawRoad(ctx, state.distance)
  drawFinishLine(ctx, state.distance)
  drawObstacles(ctx, state)
}

function drawFinishLine(ctx: CanvasRenderingContext2D, distance: number): void {
  const y = PLAYER_SCREEN_Y - (TRACK_LENGTH - distance)
  if (y < -40 || y > GAME_HEIGHT + 40) return
  const tile = 20
  for (let i = 0; (i * tile) < GAME_WIDTH - 120; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#222222'
    ctx.fillRect(60 + i * tile, y - 20, Math.min(tile, GAME_WIDTH - 120 - i * tile), 10)
    ctx.fillStyle = i % 2 === 0 ? '#222222' : '#ffffff'
    ctx.fillRect(60 + i * tile, y - 10, Math.min(tile, GAME_WIDTH - 120 - i * tile), 10)
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, distance: number): void {
  ctx.fillStyle = '#2c5f2d'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.fillStyle = '#b8a88a'
  ctx.fillRect(50, 0, GAME_WIDTH - 100, GAME_HEIGHT)

  ctx.fillStyle = '#8d7b5e'
  ctx.fillRect(50, 0, 10, GAME_HEIGHT)
  ctx.fillRect(GAME_WIDTH - 60, 0, 10, GAME_HEIGHT)

  ctx.fillStyle = '#a89878'
  const tileHeight = 80
  const scroll = distance % tileHeight
  for (let y = -tileHeight + scroll; y < GAME_HEIGHT; y += tileHeight) {
    ctx.fillRect(60, y, GAME_WIDTH - 120, 3)
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const obstacle of state.obstacles) {
    if (obstacle.kind !== 'stall' && obstacle.kind !== 'wall') continue
    const box = obstacleBox(obstacle, state.distance)
    if (box.y + box.h < -50 || box.y > GAME_HEIGHT + 50) continue
    ctx.fillStyle = OBSTACLE_COLORS[obstacle.kind] ?? '#555'
    ctx.fillRect(box.x, box.y, box.w, box.h)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fillRect(box.x, box.y + box.h - 6, box.w, 6)
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const player = state.player
  const blinking = player.invulnerableFor > 0 && Math.floor(state.elapsed * 10) % 2 === 0
  if (blinking) return

  const box = playerBox(player)
  const girl = state.character === 'girl'

  ctx.fillStyle = '#f4c542'
  ctx.fillRect(box.x, box.y, box.w, box.h * 0.4)

  if (girl) {
    ctx.fillStyle = '#8d5524'
    ctx.fillRect(box.x - 6, box.y + 2, 6, box.h * 0.3)
    ctx.fillRect(box.x + box.w, box.y + 2, 6, box.h * 0.3)
  }

  ctx.fillStyle = girl ? '#e75480' : '#3498db'
  ctx.fillRect(box.x, box.y + box.h * 0.4, box.w, box.h * 0.35)

  ctx.fillStyle = '#2c3e50'
  const legPhase = Math.floor(state.distance / 20) % 2
  const legWidth = box.w * 0.3
  const legY = box.y + box.h * 0.75
  const legH = box.h * 0.25
  if (state.phase === 'running') {
    ctx.fillRect(box.x + box.w * 0.1, legY + (legPhase === 0 ? 0 : 4), legWidth, legH - (legPhase === 0 ? 0 : 4))
    ctx.fillRect(box.x + box.w * 0.6, legY + (legPhase === 1 ? 0 : 4), legWidth, legH - (legPhase === 1 ? 0 : 4))
  } else {
    ctx.fillRect(box.x + box.w * 0.1, legY, legWidth, legH)
    ctx.fillRect(box.x + box.w * 0.6, legY, legWidth, legH)
  }
}
