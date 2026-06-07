import { GameState, GAME_HEIGHT, GAME_WIDTH, STARTING_LIVES, TRACK_LENGTH } from '../game/types'
import { t } from '../i18n/strings'

const HEART_SIZE = 20
const HEART_GAP = 6
const HUD_PADDING = 12

const BAR_WIDTH = 160
const BAR_HEIGHT = 14
const BAR_Y = HUD_PADDING

export function drawHud(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawHearts(ctx, state.lives)
  drawProgressBar(ctx, state.distance)
  drawScore(ctx, state.score)
}

function drawHearts(ctx: CanvasRenderingContext2D, lives: number): void {
  for (let i = 0; i < STARTING_LIVES; i++) {
    const x = HUD_PADDING + i * (HEART_SIZE + HEART_GAP)
    const y = HUD_PADDING
    drawPixelHeart(ctx, x, y, i < lives)
  }
}

function drawPixelHeart(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean): void {
  const s = HEART_SIZE / 8

  ctx.fillStyle = filled ? '#e8192c' : '#888888'

  const pixels = [
    [1, 0], [2, 0], [4, 0], [5, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
    [1, 4], [2, 4], [3, 4], [4, 4], [5, 4],
    [2, 5], [3, 5], [4, 5],
    [3, 6],
  ]

  for (const [px, py] of pixels) {
    ctx.fillRect(x + px * s, y + py * s, s, s)
  }
}

function drawProgressBar(ctx: CanvasRenderingContext2D, distance: number): void {
  const barX = (GAME_WIDTH - BAR_WIDTH) / 2
  const progress = Math.min(1, distance / TRACK_LENGTH)

  ctx.fillStyle = '#444444'
  ctx.fillRect(barX, BAR_Y, BAR_WIDTH, BAR_HEIGHT)

  ctx.fillStyle = '#f7c325'
  ctx.fillRect(barX, BAR_Y, Math.round(BAR_WIDTH * progress), BAR_HEIGHT)

  ctx.fillStyle = '#000000'
  ctx.fillRect(barX, BAR_Y, BAR_WIDTH, 2)
  ctx.fillRect(barX, BAR_Y + BAR_HEIGHT - 2, BAR_WIDTH, 2)
  ctx.fillRect(barX, BAR_Y, 2, BAR_HEIGHT)
  ctx.fillRect(barX + BAR_WIDTH - 2, BAR_Y, 2, BAR_HEIGHT)
}

function drawScore(ctx: CanvasRenderingContext2D, score: number): void {
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(`${t('hud.score')}: ${score}`, GAME_WIDTH - HUD_PADDING, HUD_PADDING)
}

export function drawPhaseOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.phase !== 'finished' && state.phase !== 'gameover') return

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const mainText = state.phase === 'finished' ? t('game.finished') : t('game.over')
  const mainColor = state.phase === 'finished' ? '#f7c325' : '#e8192c'

  ctx.fillStyle = mainColor
  ctx.font = 'bold 64px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(mainText, GAME_WIDTH / 2, 340)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(t('game.restart'), GAME_WIDTH / 2, 430)
}
