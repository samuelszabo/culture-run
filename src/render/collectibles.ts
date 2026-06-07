import { COLLECTIBLE_SIZE, CollectibleKind, GameState, collectibleBox } from '../game/types'

function drawNoodles(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = size
  ctx.fillStyle = '#c0392b'
  ctx.fillRect(x, y, s, s)

  ctx.fillStyle = '#e74c3c'
  ctx.fillRect(x + 2, y + 2, s - 4, s - 10)

  ctx.fillStyle = '#f39c12'
  ctx.fillRect(x + 4, y + 6, s - 8, 3)
  ctx.fillRect(x + 3, y + 11, s - 6, 3)
  ctx.fillRect(x + 5, y + 16, s - 10, 3)

  ctx.fillStyle = '#7f1c0a'
  ctx.fillRect(x, y, s, 2)
  ctx.fillRect(x, y + s - 2, s, 2)
  ctx.fillRect(x, y, 2, s)
  ctx.fillRect(x + s - 2, y, 2, s)
}

function drawBaozi(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = size
  ctx.fillStyle = '#f0e6c8'
  ctx.fillRect(x + 2, y + 4, s - 4, s - 6)
  ctx.fillRect(x + 4, y + 2, s - 8, s - 4)

  ctx.fillStyle = '#e8d5a3'
  ctx.fillRect(x + 6, y + 6, s - 12, s - 12)

  ctx.fillStyle = '#d4b896'
  ctx.fillRect(x + 10, y + 4, 4, 2)
  ctx.fillRect(x + 8, y + 6, 2, 3)
  ctx.fillRect(x + s - 10, y + 4, 4, 2)

  ctx.fillStyle = '#8a6f4e'
  ctx.fillRect(x, y + 4, 2, s - 6)
  ctx.fillRect(x + s - 2, y + 4, 2, s - 6)
  ctx.fillRect(x + 4, y, s - 8, 2)
  ctx.fillRect(x + 4, y + s - 2, s - 8, 2)
  ctx.fillRect(x + 2, y + 2, 2, 2)
  ctx.fillRect(x + s - 4, y + 2, 2, 2)
}

function drawTea(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = size
  ctx.fillStyle = '#795548'
  ctx.fillRect(x + 2, y + 4, s - 6, s - 6)
  ctx.fillRect(x + s - 4, y + 8, 4, 8)

  ctx.fillStyle = '#4caf50'
  ctx.fillRect(x + 4, y + 6, s - 10, s - 10)

  ctx.fillStyle = '#81c784'
  ctx.fillRect(x + 5, y + 8, 4, 3)
  ctx.fillRect(x + 5, y + 13, 3, 3)

  ctx.fillStyle = '#a8e6cf'
  ctx.fillRect(x + 4, y + 4, 4, 2)

  ctx.fillStyle = '#3e2723'
  ctx.fillRect(x + 2, y + 4, s - 6, 2)
  ctx.fillRect(x + 2, y + s - 2, s - 6, 2)
  ctx.fillRect(x + 2, y + 4, 2, s - 6)
  ctx.fillRect(x + s - 6, y + 4, 2, s - 6)
}

const drawFns: Record<CollectibleKind, (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void> = {
  noodles: drawNoodles,
  baozi: drawBaozi,
  tea: drawTea,
}

export function drawCollectibles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const c of state.collectibles) {
    if (c.collected) continue
    const box = collectibleBox(c, state.distance)
    if (box.y + box.h < -50 || box.y > 850) continue

    const x = Math.round(box.x)
    const y = Math.round(box.y)
    const size = COLLECTIBLE_SIZE

    drawFns[c.kind](ctx, x, y, size)
  }
}
