import { collectPickups } from './game/collectibles'
import { findCollision } from './game/collision'
import { killPlayer, updateDying } from './game/lives'
import { startLoop } from './game/loop'
import { updateMovers } from './game/movers'
import { updatePlayer } from './game/player'
import { applyDeathPenalty, computeStars } from './game/scoring'
import {
  AABB,
  BASE_SPEED,
  GameState,
  TRACK_LENGTH,
  createGameState,
  createInputState,
} from './game/types'
import { attachKeyboard } from './input/keyboard'
import { attachTouch } from './input/touch'
import { createChinaBridgeLevel } from './levels/china-bridge'
import { drawCollectibles } from './render/collectibles'
import { drawCosmetics } from './render/cosmetics'
import { drawMovers } from './render/movers'
import { drawParticles, resetParticles, updateParticles } from './render/particles'
import { createRenderer, drawPlayer, drawWorld } from './render/renderer'
import { loadSave, persistSave, recordLevelResult } from './storage/save'
import { showPreLevelCard } from './ui/cards'
import { drawHud } from './ui/hud'
import { RESULTS_HOME_RECT, RESULTS_RESTART_RECT, drawResults } from './ui/results'
import { hideScreens, initScreens, showHome } from './ui/screens'

const LEVEL_ID = 'china-bridge'

const canvas = document.getElementById('game') as HTMLCanvasElement
const renderer = createRenderer(canvas)
const input = createInputState()
const save = loadSave()

let state: GameState | null = null

function newGame(): GameState {
  const level = createChinaBridgeLevel()
  return createGameState(level.obstacles, level.collectibles, save.character ?? 'boy', [
    ...save.equippedRewards,
  ])
}

function startGame(): void {
  hideScreens()
  resetParticles()
  state = newGame()
  input.touchTargetX = null
}

function goHome(): void {
  state = null
  showHome()
}

initScreens(save, () => persistSave(save), {
  onStartGame: () => showPreLevelCard(startGame),
})
attachKeyboard(input)
attachTouch(canvas, input, renderer.screenToGameX)
showHome()

function gameEnded(): boolean {
  return state !== null && (state.phase === 'finished' || state.phase === 'gameover')
}

function inRect(x: number, y: number, rect: AABB): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}

window.addEventListener('keydown', (event) => {
  if (!gameEnded()) return
  if (event.code === 'Space') startGame()
  if (event.code === 'Escape') goHome()
})

canvas.addEventListener('pointerdown', (event) => {
  if (!gameEnded()) return
  const x = renderer.screenToGameX(event.clientX)
  const y = renderer.screenToGameY(event.clientY)
  if (inRect(x, y, RESULTS_RESTART_RECT)) startGame()
  if (inRect(x, y, RESULTS_HOME_RECT)) goHome()
})

function update(dt: number): void {
  if (!state) return

  state.elapsed += dt

  if (state.phase === 'dying') {
    updateDying(state, dt)
  } else if (state.phase === 'running') {
    state.speed = BASE_SPEED * (1 + 0.3 * Math.min(1, state.distance / TRACK_LENGTH))
    state.distance += state.speed * dt
    updateMovers(state, dt)
    updatePlayer(state, input, dt)
    collectPickups(state)

    if (findCollision(state)) {
      killPlayer(state)
      applyDeathPenalty(state)
    } else if (state.distance >= TRACK_LENGTH) {
      state.phase = 'finished'
    }
  }

  if (gameEnded() && state.endedAt === null) {
    state.endedAt = state.elapsed
    const stars = computeStars(state.score, state.maxScore, state.phase === 'finished')
    state.newRewards = recordLevelResult(save, LEVEL_ID, state.score, stars)
  }

  updateParticles(state, dt)
}

function render(): void {
  renderer.beginFrame()
  if (state) {
    drawWorld(renderer.ctx, state)
    drawCollectibles(renderer.ctx, state)
    drawMovers(renderer.ctx, state)
    drawPlayer(renderer.ctx, state)
    drawCosmetics(renderer.ctx, state)
    drawParticles(renderer.ctx)
    drawHud(renderer.ctx, state)
    drawResults(renderer.ctx, state)
  }
  renderer.endFrame()
}

startLoop(update, render)
