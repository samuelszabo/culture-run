import { GameState, GAME_WIDTH, GAME_HEIGHT } from '../game/types'
import { t } from '../i18n/strings'
import { computeStars } from '../game/scoring'

const STAR_SIZE = 48
const STAR_GAP = 10
const STARS_COUNT = 5

function drawPixelStar(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean): void {
  const s = STAR_SIZE / 8

  ctx.fillStyle = filled ? '#f7c325' : '#666666'

  const pixels = [
    [3, 0], [4, 0],
    [2, 1], [3, 1], [4, 1], [5, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
    [2, 4], [3, 4], [4, 4], [5, 4],
    [1, 5], [2, 5], [5, 5], [6, 5],
    [0, 6], [2, 6], [5, 6], [7, 6],
    [0, 7], [7, 7],
  ]

  for (const [px, py] of pixels) {
    ctx.fillRect(x + px * s, y + py * s, s, s)
  }
}

export function drawResults(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.phase !== 'finished' && state.phase !== 'gameover') return

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const finished = state.phase === 'finished'
  const titleText = finished ? t('game.finished') : t('game.over')
  const titleColor = finished ? '#f7c325' : '#e8192c'

  ctx.fillStyle = titleColor
  ctx.font = 'bold 64px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(titleText, GAME_WIDTH / 2, 240)

  const filledStars = computeStars(state.score, state.maxScore, finished)
  const totalStarsWidth = STARS_COUNT * STAR_SIZE + (STARS_COUNT - 1) * STAR_GAP
  const starsStartX = (GAME_WIDTH - totalStarsWidth) / 2
  const starsY = 300

  for (let i = 0; i < STARS_COUNT; i++) {
    drawPixelStar(ctx, starsStartX + i * (STAR_SIZE + STAR_GAP), starsY, i < filledStars)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${t('hud.score')}: ${state.score} / ${state.maxScore}`, GAME_WIDTH / 2, 420)

  ctx.fillStyle = '#aaaaaa'
  ctx.font = 'bold 16px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(t('game.restart'), GAME_WIDTH / 2, 500)
}
