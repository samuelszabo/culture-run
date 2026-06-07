import { GameState, playerBox } from '../game/types'

export function drawCosmetics(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.phase !== 'running' && state.phase !== 'dying') return
  if (state.equipped.length === 0) return
  if (state.player.invulnerableFor > 0 && Math.floor(state.elapsed * 10) % 2 === 0) return

  const box = playerBox(state.player)

  if (state.equipped.includes('dragon-tail')) {
    drawDragonTail(ctx, box, state.elapsed, state.distance)
  }

  if (state.equipped.includes('labubu')) {
    drawLabubu(ctx, box)
  }
}

function drawDragonTail(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  elapsed: number,
  distance: number,
): void {
  const segments = 9
  const segmentGap = 9
  const centerX = box.x + box.w / 2
  const startY = box.y + box.h + 6

  for (let i = segments - 1; i >= 0; i--) {
    const t = i / (segments - 1)
    const wave = Math.sin(elapsed * 4 + distance * 0.02 + i * 0.7) * (3 + i * 1.2)
    const x = centerX + wave
    const y = startY + i * segmentGap
    const size = Math.round(16 - t * 9)

    ctx.fillStyle = i % 2 === 0 ? '#e8192c' : '#f7c325'
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size)

    if (i > 0 && i % 2 === 0) {
      ctx.fillStyle = '#2ecc71'
      ctx.fillRect(Math.round(x - 2), Math.round(y - size / 2 - 4), 4, 4)
    }
  }

  const headWave = Math.sin(elapsed * 4 + distance * 0.02) * 3
  const headX = centerX + headWave
  const headY = startY

  ctx.fillStyle = '#f7c325'
  ctx.fillRect(Math.round(headX - 9), headY - 12, 3, 7)
  ctx.fillRect(Math.round(headX + 6), headY - 12, 3, 7)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(Math.round(headX - 5), headY - 4, 3, 3)
  ctx.fillRect(Math.round(headX + 2), headY - 4, 3, 3)
}

function drawLabubu(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
): void {
  const headTop = box.y
  const headCenterX = box.x + box.w / 2

  const earWidth = 8
  const earHeight = 18
  const innerEarWidth = 4
  const innerEarHeight = 11

  ctx.fillStyle = '#f5f0e0'
  ctx.fillRect(headCenterX - 12 - earWidth, headTop - earHeight, earWidth, earHeight)
  ctx.fillRect(headCenterX + 12, headTop - earHeight, earWidth, earHeight)

  ctx.fillStyle = '#f4a0b0'
  ctx.fillRect(
    headCenterX - 12 - earWidth + 2,
    headTop - earHeight + 3,
    innerEarWidth,
    innerEarHeight,
  )
  ctx.fillRect(headCenterX + 12 + 2, headTop - earHeight + 3, innerEarWidth, innerEarHeight)

  const teethY = box.y + box.h * 0.38
  const teethCount = 5
  const toothW = 4
  const toothH = 3
  const teethStartX = headCenterX - (teethCount * toothW) / 2

  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < teethCount; i++) {
    ctx.fillRect(teethStartX + i * toothW, teethY, toothW - 1, toothH)
  }
}
