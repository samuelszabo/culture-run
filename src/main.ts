import { findCollision } from './game/collision'
import { killPlayer, updateDying } from './game/lives'
import { startLoop } from './game/loop'
import { createBridgeObstacles } from './game/obstacles'
import { updatePlayer } from './game/player'
import {
  BASE_SPEED,
  GameState,
  TRACK_LENGTH,
  createGameState,
  createInputState,
} from './game/types'
import { attachKeyboard } from './input/keyboard'
import { attachTouch } from './input/touch'
import { createRenderer, drawWorld } from './render/renderer'
import { drawHud, drawPhaseOverlay } from './ui/hud'

const canvas = document.getElementById('game') as HTMLCanvasElement
const renderer = createRenderer(canvas)
const input = createInputState()
let state: GameState = createGameState(createBridgeObstacles())

attachKeyboard(input)
attachTouch(canvas, input, renderer.screenToGameX)

function restart(): void {
  state = createGameState(createBridgeObstacles())
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
  updatePlayer(state, input, dt)

  if (findCollision(state)) {
    killPlayer(state)
    return
  }

  if (state.distance >= TRACK_LENGTH) {
    state.phase = 'finished'
  }
}

function render(): void {
  renderer.beginFrame()
  drawWorld(renderer.ctx, state)
  drawHud(renderer.ctx, state)
  drawPhaseOverlay(renderer.ctx, state)
  renderer.endFrame()
}

startLoop(update, render)
