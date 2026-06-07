import { GameState, playerBox } from '../game/types'

export function drawCosmetics(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.phase !== 'running' && state.phase !== 'dying') return
  if (state.equipped.length === 0) return
  if (state.player.invulnerableFor > 0 && Math.floor(state.elapsed * 10) % 2 === 0) return

  const box = playerBox(state.player)

  if (state.equipped.includes('sparkly-tail')) {
    drawSparklyTail(ctx, box, state.elapsed, state.distance)
  }

  if (state.equipped.includes('labubu')) {
    drawLabubu(ctx, box)
  }
}

function drawSparklyTail(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  elapsed: number,
  distance: number,
): void {
  const particleCount = 13
  const tailLength = 70
  const centerX = box.x + box.w / 2
  const tailStartY = box.y + box.h

  const colors = ['#f5c518', '#ff69b4', '#40e0d0']

  for (let i = 0; i < particleCount; i++) {
    const t = i / (particleCount - 1)
    const py = tailStartY + t * tailLength

    const wave = Math.sin(elapsed * 3 + distance * 0.02 + i * 0.9) * (4 + i * 0.4)
    const px = centerX + wave

    const size = Math.max(1, Math.round(4 - t * 3))
    const twinkle = 0.5 + 0.5 * Math.cos(elapsed * 6 + distance * 0.03 + i * 1.3)
    const alpha = twinkle * (1 - t * 0.6)

    const colorIndex = (i + Math.floor(elapsed * 2 + distance * 0.01)) % colors.length
    const color = colors[colorIndex]

    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`
    ctx.fillRect(Math.round(px - size / 2), Math.round(py - size / 2), size, size)
  }
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
