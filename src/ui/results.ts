import { GameState, GAME_WIDTH, GAME_HEIGHT, AABB } from '../game/types'
import { t } from '../i18n/strings'
import { computeStars } from '../game/scoring'
import { REWARDS } from '../game/rewards'

const STAR_SIZE = 48
const STAR_GAP = 10
const STARS_COUNT = 5

const STAR_POP_DURATION = 0.15
const STAR_DELAYS = Array.from({ length: STARS_COUNT }, (_, i) => 0.5 + i * 0.35)

export const RESULTS_RESTART_RECT: AABB = { x: 60, y: 620, w: 160, h: 64 }
export const RESULTS_HOME_RECT: AABB = { x: 260, y: 620, w: 160, h: 64 }

function drawPixelStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  filled: boolean,
  scale: number = 1,
): void {
  const size = STAR_SIZE * scale
  const s = size / 8
  const offsetX = x - (size - STAR_SIZE) / 2
  const offsetY = y - (size - STAR_SIZE) / 2

  ctx.fillStyle = filled ? (scale > 1 ? '#ffe066' : '#f7c325') : '#666666'

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
    ctx.fillRect(offsetX + px * s, offsetY + py * s, s, s)
  }
}

function drawButton(ctx: CanvasRenderingContext2D, rect: AABB, label: string): void {
  ctx.fillStyle = '#333333'
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)

  ctx.fillStyle = '#f7c325'
  ctx.fillRect(rect.x, rect.y, rect.w, 3)
  ctx.fillRect(rect.x, rect.y + rect.h - 3, rect.w, 3)
  ctx.fillRect(rect.x, rect.y, 3, rect.h)
  ctx.fillRect(rect.x + rect.w - 3, rect.y, 3, rect.h)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2)
}

function drawRewardBanner(ctx: CanvasRenderingContext2D, rewardIds: string[]): void {
  const bannerX = 40
  const bannerY = 490
  const bannerW = GAME_WIDTH - 80
  const bannerH = 100

  ctx.fillStyle = '#1a1a00'
  ctx.fillRect(bannerX, bannerY, bannerW, bannerH)

  ctx.fillStyle = '#f7c325'
  ctx.fillRect(bannerX, bannerY, bannerW, 4)
  ctx.fillRect(bannerX, bannerY + bannerH - 4, bannerW, 4)
  ctx.fillRect(bannerX, bannerY, 4, bannerH)
  ctx.fillRect(bannerX + bannerW - 4, bannerY, 4, bannerH)

  ctx.fillStyle = '#f7c325'
  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(t('reward.unlocked'), GAME_WIDTH / 2, bannerY + 30)

  const names = rewardIds.map((id) => {
    const reward = REWARDS.find((r) => r.id === id)
    return reward ? t(reward.nameKey) : id
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px monospace'
  ctx.fillText(names.join(', '), GAME_WIDTH / 2, bannerY + 65)
}

function drawFactText(ctx: CanvasRenderingContext2D, text: string): void {
  const maxWidth = 360
  const fontSize = 13
  const lineHeight = 18
  const startY = 545

  ctx.font = `${fontSize}px monospace`
  ctx.fillStyle = '#aaaaaa'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current !== '') {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const totalH = lines.length * lineHeight
  const y = startY + (600 - startY - totalH) / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], GAME_WIDTH / 2, y + i * lineHeight)
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
  const sinceEnd = state.endedAt === null ? Number.POSITIVE_INFINITY : state.elapsed - state.endedAt
  const totalStarsWidth = STARS_COUNT * STAR_SIZE + (STARS_COUNT - 1) * STAR_GAP
  const starsStartX = (GAME_WIDTH - totalStarsWidth) / 2
  const starsY = 300

  let allFilledStarsLit = true

  for (let i = 0; i < STARS_COUNT; i++) {
    const delay = STAR_DELAYS[i]
    const isLit = i < filledStars && sinceEnd > delay
    if (i < filledStars && !isLit) allFilledStarsLit = false

    const sinceLight = sinceEnd - delay
    const inPop = isLit && sinceLight < STAR_POP_DURATION
    const scale = inPop ? 1 + 0.3 * (1 - sinceLight / STAR_POP_DURATION) : 1

    drawPixelStar(ctx, starsStartX + i * (STAR_SIZE + STAR_GAP), starsY, isLit, scale)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${t('hud.score')}: ${state.score} / ${state.maxScore}`, GAME_WIDTH / 2, 420)

  if (state.newRewards.length > 0 && allFilledStarsLit) {
    drawRewardBanner(ctx, state.newRewards)
  }

  if (finished && state.newRewards.length === 0) {
    drawFactText(ctx, t('results.fact.china-bridge'))
  }

  drawButton(ctx, RESULTS_RESTART_RECT, t('results.restart'))
  drawButton(ctx, RESULTS_HOME_RECT, t('results.home'))
}
