import { collectPickups } from './game/collectibles'
import { findCollision } from './game/collision'
import { killPlayer, updateDying } from './game/lives'
import { startLoop } from './game/loop'
import { updateMovers } from './game/movers'
import { updatePlayer } from './game/player'
import { applyDeathPenalty, computeStars } from './game/scoring'
import {
  BASE_SPEED,
  GameState,
  ROAD_LEFT,
  ROAD_RIGHT,
  TRACK_LENGTH,
  createGameState,
  createInputState,
} from './game/types'
import { attachKeyboard } from './input/keyboard'
import { attachTouch } from './input/touch'
import { createChinaBridgeLevel } from './levels/china-bridge'
import { EntityPool, createEntities, disposeEntities, updateEntities } from './render3d/entities'
import { Player3D, createPlayer3D, disposePlayer3D, updatePlayer3D } from './render3d/player3d'
import { createStage, renderStage, updateStage } from './render3d/scene'
import { loadSave, persistSave, recordLevelResult } from './storage/save'
import { showPreLevelCard } from './ui/cards'
import { hideHud, initHud, showHud, updateHud } from './ui/hud-dom'
import { hideResults, showResults } from './ui/results-dom'
import { hideScreens, initScreens, showHome } from './ui/screens'

const LEVEL_ID = 'china-bridge'

const canvas = document.getElementById('game') as HTMLCanvasElement
const stage = createStage(canvas)
const input = createInputState()
const save = loadSave()

let state: GameState | null = null
let entities: EntityPool | null = null
let player3d: Player3D | null = null
let resultsShown = false

function newGame(): GameState {
  const level = createChinaBridgeLevel()
  return createGameState(level.obstacles, level.collectibles, save.character ?? 'boy', [
    ...save.equippedRewards,
  ])
}

function disposeWorld(): void {
  if (entities) disposeEntities(entities)
  if (player3d) disposePlayer3D(player3d)
  entities = null
  player3d = null
}

function startGame(): void {
  hideScreens()
  hideResults()
  disposeWorld()
  state = newGame()
  entities = createEntities(stage.scene, state)
  player3d = createPlayer3D(stage.scene, state)
  resultsShown = false
  input.touchTargetX = null
  showHud()
}

function goHome(): void {
  disposeWorld()
  state = null
  hideResults()
  hideHud()
  showHome()
}

function screenToGameX(clientX: number): number {
  return ROAD_LEFT + (clientX / window.innerWidth) * (ROAD_RIGHT - ROAD_LEFT)
}

initHud()
hideHud()
initScreens(save, () => persistSave(save), {
  onStartGame: () => showPreLevelCard(startGame),
})
attachKeyboard(input)
attachTouch(canvas, input, screenToGameX)
showHome()

function gameEnded(): boolean {
  return state !== null && (state.phase === 'finished' || state.phase === 'gameover')
}

window.addEventListener('keydown', (event) => {
  if (!gameEnded()) return
  if (event.code === 'Space') startGame()
  if (event.code === 'Escape') goHome()
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

  if (gameEnded() && !resultsShown) {
    resultsShown = true
    showResults(state, { onRestart: startGame, onHome: goHome })
  }
}

function render(): void {
  if (state) {
    updateStage(stage, state)
    if (entities) updateEntities(entities, state)
    if (player3d) updatePlayer3D(player3d, state)
    updateHud(state)
  }
  renderStage(stage)
}

startLoop(update, render)
