import { GameState, GamePhase, collectibleBox, playerBox, GAME_WIDTH } from '../game/types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

const particles: Particle[] = []
const seenCollected = new Set<object>()
let prevPhase: GamePhase = 'running'

function spawnBurst(
  cx: number,
  cy: number,
  count: number,
  colors: string[],
  speed: number,
  life: number,
  gravityBias: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2)
    const s = speed * (0.5 + Math.random() * 0.5)
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s - gravityBias,
      life,
      maxLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 3,
    })
  }
}

const TEA_COLORS = ['#4caf50', '#81c784', '#ffd700', '#ffecb3']
const BAOZI_COLORS = ['#f5e6c8', '#e8d5a3', '#ffd700', '#fffde7']
const NOODLES_COLORS = ['#ff8c00', '#ffa040', '#ffd700', '#ffe0a0']
const DEATH_COLORS = ['#9e9e9e', '#bdbdbd', '#eeeeee', '#ffffff']
const CONFETTI_COLORS = ['#f44336', '#ffd700', '#4caf50', '#2196f3', '#e91e63', '#ff9800']

export function updateParticles(state: GameState, dt: number): void {
  const currentPhase = state.phase

  if (currentPhase === 'running' || currentPhase === 'dying') {
    for (const c of state.collectibles) {
      if (c.collected && !seenCollected.has(c)) {
        seenCollected.add(c)
        const box = collectibleBox(c, state.distance)
        const cx = box.x + box.w / 2
        const cy = box.y + box.h / 2
        const count = 8 + Math.floor(Math.random() * 5)
        let colors: string[]
        if (c.kind === 'tea') colors = TEA_COLORS
        else if (c.kind === 'baozi') colors = BAOZI_COLORS
        else colors = NOODLES_COLORS
        spawnBurst(cx, cy, count, colors, 120, 0.5, 60)
      }
    }
  }

  if (prevPhase === 'running' && currentPhase === 'dying') {
    const box = playerBox(state.player)
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    spawnBurst(cx, cy, 12 + Math.floor(Math.random() * 5), DEATH_COLORS, 80, 0.7, 30)
  }

  if (prevPhase !== 'finished' && currentPhase === 'finished') {
    const count = 60 + Math.floor(Math.random() * 21)
    for (let i = 0; i < count; i++) {
      const life = 2.5 + Math.random() * 1.0
      particles.push({
        x: Math.random() * GAME_WIDTH,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 40,
        vy: 60 + Math.random() * 60,
        life,
        maxLife: life,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 4,
      })
    }
  }

  prevPhase = currentPhase

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 200 * dt
    p.life -= dt
    if (p.life <= 0) {
      particles[i] = particles[particles.length - 1]
      particles.pop()
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    const hex = p.color
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`
    ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size)
  }
}

export function resetParticles(): void {
  particles.length = 0
  seenCollected.clear()
  prevPhase = 'running'
}
