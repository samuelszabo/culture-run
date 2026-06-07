import { collectPickups } from './game/collectibles'
import { findCollision } from './game/collision'
import { killPlayer, updateDying } from './game/lives'
import { startLoop } from './game/loop'
import { updateMovers } from './game/movers'
import { updatePlayer } from './game/player'
import { applyDeathPenalty } from './game/scoring'
import {
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
import { drawMovers } from './render/movers'
import { createRenderer, drawPlayer, drawWorld } from './render/renderer'
import { drawHud } from './ui/hud'
import { drawResults } from './ui/results'

const canvas = document.getElementById('game') as HTMLCanvasElement
const renderer = createRenderer(canvas)
const input = createInputState()

function newGame(): GameState {
  const level = createChinaBridgeLevel()
  return createGameState(level.obstacles, level.collectibles)
}

let state = newGame()

attachKeyboard(input)
attachTouch(canvas, input, renderer.screenToGameX)

function restart(): void {
  state = newGame()
  input.touchTargetX = null
}

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return
  if (state.phase === 'finished' || state.phase === 'gameover') restart()
})

canvas.addEventListener('pointerdown', () => {
  if (state.phase === 'finished' || state.phase === 'gameover') restart()
})

function update(dt: number): void {
  state.elapsed += dt

  if (state.phase === 'dying') {
    updateDying(state, dt)
    return
  }

  if (state.phase !== 'running') return

  state.speed = BASE_SPEED * (1 + 0.3 * Math.min(1, state.distance / TRACK_LENGTH))
  state.distance += state.speed * dt
  updateMovers(state, dt)
  updatePlayer(state, input, dt)
  collectPickups(state)

  if (findCollision(state)) {
    killPlayer(state)
    applyDeathPenalty(state)
    return
  }

  if (state.distance >= TRACK_LENGTH) {
    state.phase = 'finished'
  }
}

function render(): void {
  renderer.beginFrame()
  drawWorld(renderer.ctx, state)
  drawCollectibles(renderer.ctx, state)
  drawMovers(renderer.ctx, state)
  drawPlayer(renderer.ctx, state)
  drawHud(renderer.ctx, state)
  drawResults(renderer.ctx, state)
  renderer.endFrame()
}

startLoop(update, render)
