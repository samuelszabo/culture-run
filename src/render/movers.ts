import { GameState, GAME_HEIGHT, obstacleBox } from '../game/types'

export function drawMovers(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const obstacle of state.obstacles) {
    if (
      obstacle.kind !== 'walker' &&
      obstacle.kind !== 'carrier' &&
      obstacle.kind !== 'firecracker'
    ) {
      continue
    }
    const box = obstacleBox(obstacle, state.distance)
    if (box.y + box.h < -50 || box.y > GAME_HEIGHT + 50) continue

    if (obstacle.kind === 'walker') {
      drawWalker(ctx, box.x, box.y, box.w, box.h)
    } else if (obstacle.kind === 'carrier') {
      drawCarrier(ctx, box.x, box.y, box.w, box.h)
    } else if (obstacle.kind === 'firecracker') {
      drawFirecracker(ctx, box.x, box.y, box.w, box.h, obstacle.warning ?? false, obstacle.harmless !== false, state.elapsed)
    }
  }
}

function drawWalker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const headSize = Math.round(w * 0.55)
  const headX = x + (w - headSize) / 2
  ctx.fillStyle = '#e8a87c'
  ctx.fillRect(headX, y, headSize, headSize)

  ctx.fillStyle = '#e74c3c'
  const bodyY = y + headSize
  const bodyH = Math.round(h * 0.45)
  ctx.fillRect(x + 2, bodyY, w - 4, bodyH)

  ctx.fillStyle = '#922b21'
  const legW = Math.round(w * 0.28)
  const legY = bodyY + bodyH
  const legH = h - headSize - bodyH
  ctx.fillRect(x + 2, legY, legW, legH)
  ctx.fillRect(x + w - 2 - legW, legY, legW, legH)
}

function drawCarrier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const basketW = Math.round(w * 0.22)
  const basketH = Math.round(h * 0.4)
  const basketY = y + Math.round(h * 0.3)

  ctx.fillStyle = '#d4850a'
  ctx.fillRect(x, basketY, basketW, basketH)
  ctx.fillRect(x + w - basketW, basketY, basketW, basketH)

  ctx.fillStyle = '#8b4513'
  ctx.fillRect(x + basketW, basketY - 4, w - basketW * 2, 4)
  ctx.fillRect(x + w - basketW, basketY - 4, w - basketW * 2, 4)

  const personX = x + basketW + 2
  const personW = w - basketW * 2 - 4
  const headSize = Math.round(personW * 0.7)
  const headX = personX + (personW - headSize) / 2

  ctx.fillStyle = '#e8a87c'
  ctx.fillRect(headX, y, headSize, headSize)

  ctx.fillStyle = '#27ae60'
  const bodyY = y + headSize
  const bodyH = Math.round(h * 0.4)
  ctx.fillRect(personX, bodyY, personW, bodyH)

  ctx.fillStyle = '#1a5e35'
  const legW = Math.round(personW * 0.35)
  const legY = bodyY + bodyH
  const legH = h - headSize - bodyH
  ctx.fillRect(personX, legY, legW, legH)
  ctx.fillRect(personX + personW - legW, legY, legW, legH)
}

function drawFirecracker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  warning: boolean,
  harmless: boolean,
  elapsed: number
): void {
  const exploding = !harmless

  if (exploding) {
    const burstR = w * 1.2
    const cx = x + w / 2
    const cy = y + h / 2

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, burstR)
    gradient.addColorStop(0, '#fff176')
    gradient.addColorStop(0.4, '#ff8c00')
    gradient.addColorStop(1, 'rgba(255, 60, 0, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, burstR, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff4500'
    const rays = 8
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2
      const rx = cx + Math.cos(angle) * burstR * 0.85
      const ry = cy + Math.sin(angle) * burstR * 0.85
      ctx.fillRect(rx - 3, ry - 3, 6, 6)
    }
    return
  }

  if (warning) {
    const blink = Math.floor(elapsed * 8) % 2 === 0
    const glowColor = blink ? 'rgba(255, 200, 0, 0.6)' : 'rgba(255, 60, 0, 0.5)'
    const cx = x + w / 2
    const cy = y + h / 2
    const glowR = w * 0.9
    const gradient = ctx.createRadialGradient(cx, cy, w * 0.3, cx, cy, glowR)
    gradient.addColorStop(0, glowColor)
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#c0392b'
  ctx.fillRect(x + 4, y + 6, w - 8, h - 6)

  ctx.fillStyle = '#922b21'
  ctx.fillRect(x + 4, y + 6, w - 8, 4)

  ctx.fillStyle = '#f39c12'
  const dotSize = 5
  ctx.fillRect(x + 4 + 3, y + 6 + 8, dotSize, dotSize)
  ctx.fillRect(x + 4 + 13, y + 6 + 8, dotSize, dotSize)
  ctx.fillRect(x + 4 + 8, y + 6 + 16, dotSize, dotSize)
  ctx.fillRect(x + 4 + 3, y + 6 + 22, dotSize, dotSize)
  ctx.fillRect(x + 4 + 13, y + 6 + 22, dotSize, dotSize)

  ctx.fillStyle = '#f1c40f'
  ctx.fillRect(x + w / 2 - 2, y, 4, 8)
}
