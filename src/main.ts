import { collectPickups } from './game/collectibles'
import { enterClimb, updateClimb } from './game/climb'
import { findCollision } from './game/collision'
import { killPlayer, updateDying } from './game/lives'
import { startLoop } from './game/loop'
import { updateMovers } from './game/movers'
import { updatePlayer } from './game/player'
import { applyDeathPenalty, computeStars } from './game/scoring'
import {
  BASE_SPEED,
  Character,
  GameState,
  Obstacle,
  ROAD_LEFT,
  ROAD_RIGHT,
  TRACK_LENGTH,
  createGameState,
  createInputState,
} from './game/types'
import { t } from './i18n/strings'
import { attachKeyboard } from './input/keyboard'
import { attachTouch } from './input/touch'
import { getLevel } from './levels/registry'
import { ClimbView, createClimbView, disposeClimbView, updateClimbView } from './render3d/climb-view'
import { EntityPool, createEntities, disposeEntities, updateEntities } from './render3d/entities'
import { Player3D, createPlayer3D, disposePlayer3D, updatePlayer3D } from './render3d/player3d'
import { createStage, renderStage, setEnvironment, updateStage } from './render3d/scene'
import { loadSave, persistSave, recordCollectedFood, recordLevelResult, recordLevelResultWithStars, recordSeenLandmark } from './storage/save'
import { showPreLevelCard } from './ui/cards'
import { hideHud, initHud, showHud, updateHud } from './ui/hud-dom'
import { hideActionButton, initActionButton, updateActionButton } from './ui/action-button'
import { hideLandmarkCaption, showLandmarkCaption } from './ui/landmark-caption'
import { hideCollectToast, showCollectToast } from './ui/collect-toast'
import { hideResults, showResults } from './ui/results-dom'
import { hideScreens, initScreens, showHome } from './ui/screens'
import { hasQuizForLevel, hideQuiz, isQuizOpen, showQuiz } from './ui/quiz-dom'
import { REWARDS } from './game/rewards'

let currentLevelId = 'china-wall'

const canvas = document.getElementById('game') as HTMLCanvasElement
const stage = createStage(canvas)
const input = createInputState()
const save = loadSave()

let state: GameState | null = null
let entities: EntityPool | null = null
let player3d: Player3D | null = null
let climbView: ClimbView | null = null
let climbGates: Obstacle[] = []
let triggeredClimbs = new Set<number>()
let resultsShown = false
let landmarksShown = new Set<string>()
let lastToastSeq = 0
let quizTakenThisRun = false
let quizBonusEarned = 0
let currentRunStars = 0

const LANDMARK_TRIGGER_AHEAD = 1800

function bestScore(): number {
  return save.bestScores[currentLevelId]?.score ?? 0
}

function newGame(): GameState {
  const def = getLevel(currentLevelId)
  const level = def.createLevel()
  return createGameState(
    level.obstacles,
    level.collectibles,
    save.character ?? 'boy',
    [...save.equippedRewards],
    def.chaser,
  )
}

function disposeWorld(): void {
  if (entities) disposeEntities(entities)
  if (player3d) disposePlayer3D(player3d)
  if (climbView) disposeClimbView(climbView)
  entities = null
  player3d = null
  climbView = null
}

function startGame(): void {
  hideScreens()
  hideResults()
  hideQuiz()
  hideLandmarkCaption()
  disposeWorld()
  setEnvironment(stage, getLevel(currentLevelId).environmentId)
  state = newGame()
  entities = createEntities(stage.scene, state)
  player3d = createPlayer3D(stage.scene, state)
  climbView = createClimbView(stage.scene)
  climbGates = state.obstacles
    .filter((o) => o.kind === 'ladder' && o.climb)
    .sort((a, b) => a.trackY - b.trackY)
  triggeredClimbs = new Set()
  resultsShown = false
  quizTakenThisRun = false
  quizBonusEarned = 0
  currentRunStars = 0
  landmarksShown = new Set()
  lastToastSeq = 0
  input.touchTargetX = null
  input.jumpQueued = false
  input.climbQueued = false
  input.climbLane = 0
  showHud()
}

function goHome(): void {
  disposeWorld()
  state = null
  hideResults()
  hideQuiz()
  hideLandmarkCaption()
  hideCollectToast()
  hideHud()
  hideActionButton()
  showHome()
}

function screenToGameX(clientX: number): number {
  return ROAD_LEFT + (clientX / window.innerWidth) * (ROAD_RIGHT - ROAD_LEFT)
}

initHud(goHome)
hideHud()
initScreens(save, () => persistSave(save), {
  onStartGame: (levelId: string) => {
    currentLevelId = levelId
    showPreLevelCard(getLevel(levelId), startGame)
  },
})
attachKeyboard(input)
const isClimbingNow = () => (state ? state.phase === 'climbing' : false)
attachTouch(canvas, input, screenToGameX, isClimbingNow)
initActionButton(input, isClimbingNow)
showHome()

// Dev-only deep links for fast visual debugging — stripped from production
// builds via the import.meta.env.DEV guard below.
//   ?env=slovak|china (or ?level=<id>), ?char=bear, ?d=<distance>, ?climb
function devBoot(): void {
  const q = new URLSearchParams(location.search)
  const envShort = q.get('env')
  const level =
    q.get('level') ??
    (envShort === 'slovak'
      ? 'slovak-paradise'
      : envShort === 'china'
        ? 'china-wall'
        : envShort === 'dubai'
          ? 'burj-khalifa'
          : envShort === 'tokyo' || envShort === 'japan'
            ? 'tokyo-neon'
            : null)
  const char = q.get('char')
  const d = q.get('d')
  const climb = q.has('climb')
  if (!level && !char && d === null && !climb) return

  if (char) save.character = char as Character
  currentLevelId = level ?? (climb ? 'slovak-paradise' : currentLevelId)
  startGame()
  if (!state) return

  if (climb && climbGates.length > 0) {
    triggeredClimbs.add(climbGates[0].trackY)
    enterClimb(state, climbGates[0])
  } else if (d !== null) {
    const dist = Math.max(0, Math.min(TRACK_LENGTH - 1, Number(d) || 0))
    // Don't re-trigger climb gates we've "skipped past" when jumping ahead.
    for (const g of climbGates) if (g.trackY <= dist) triggeredClimbs.add(g.trackY)
    state.distance = dist
  }
}

if (import.meta.env.DEV) devBoot()

function gameEnded(): boolean {
  return state !== null && (state.phase === 'finished' || state.phase === 'gameover')
}

window.addEventListener('keydown', (event) => {
  if (!gameEnded()) return
  if (isQuizOpen()) return
  if (event.code === 'Space') startGame()
  if (event.code === 'Escape') goHome()
})

// The first not-yet-triggered climb gate the player has reached, if any.
function nextClimbGate(distance: number): Obstacle | null {
  for (const gate of climbGates) {
    if (triggeredClimbs.has(gate.trackY)) continue
    return distance >= gate.trackY ? gate : null
  }
  return null
}

function update(dt: number): void {
  if (!state) return

  state.elapsed += dt

  if (state.phase === 'dying') {
    updateDying(state, dt)
  } else if (state.phase === 'climbing') {
    updateClimb(state, input, dt)
  } else if (state.phase === 'running') {
    state.speed = BASE_SPEED * (1 + 0.3 * Math.min(1, state.distance / TRACK_LENGTH))
    state.distance += state.speed * dt

    const gate = nextClimbGate(state.distance)
    if (gate) {
      triggeredClimbs.add(gate.trackY)
      enterClimb(state, gate)
      showLandmarkCaption('climb.title', 'climb.hint')
    } else {
      updateMovers(state, dt)
      updatePlayer(state, input, dt)
      collectPickups(state)

      if (findCollision(state)) {
        killPlayer(state)
        applyDeathPenalty(state)
      } else if (state.distance >= TRACK_LENGTH) {
        state.phase = 'finished'
      }

      for (const landmark of getLevel(currentLevelId).landmarks) {
        if (landmarksShown.has(landmark.id)) continue
        if (state.distance >= landmark.trackY - LANDMARK_TRIGGER_AHEAD) {
          landmarksShown.add(landmark.id)
          showLandmarkCaption(landmark.nameKey, landmark.factKey)
          recordSeenLandmark(save, landmark.id)
        }
      }

      // Climb-only input flags never carry into the run.
      input.climbQueued = false
      input.climbLane = 0
    }
  }

  if (gameEnded() && state.endedAt === null) {
    state.endedAt = state.elapsed
    currentRunStars = computeStars(state.score, state.maxScore, state.phase === 'finished')
    state.newRewards = recordLevelResult(save, currentLevelId, state.score, currentRunStars)
  }

  if (gameEnded() && !resultsShown) {
    resultsShown = true
    hideLandmarkCaption()
    hideCollectToast()

    const finished = state.phase === 'finished'
    const quizAvailable = finished && !quizTakenThisRun && hasQuizForLevel(currentLevelId)

    const capturedState = state

    function openQuiz(): void {
      quizTakenThisRun = true
      showQuiz(
        currentLevelId,
        {
          onDone(bonus, _newRewardIds) {
            quizBonusEarned = bonus
            // Re-show results with bonus line; quiz button is gone (quizTakenThisRun=true)
            showResults(
              capturedState,
              { onRestart: startGame, onHome: goHome },
              quizBonusEarned,
              bestScore(),
              getLevel(currentLevelId).resultsFactKey,
            )
          },
        },
        (bonus) => {
          // Record the bonus-inflated score; stars are the original base-run stars (unchanged)
          const newlyUnlocked = recordLevelResultWithStars(
            save,
            currentLevelId,
            capturedState.score + bonus,
            currentRunStars,
          )
          // Return human-readable reward names for quiz summary display
          return newlyUnlocked.map((id) => {
            const reward = REWARDS.find((r) => r.id === id)
            return reward ? t(reward.nameKey) : id
          })
        },
      )
    }

    showResults(
      state,
      {
        onRestart: startGame,
        onHome: goHome,
        onQuiz: quizAvailable ? openQuiz : undefined,
      },
      undefined,
      bestScore(),
      getLevel(currentLevelId).resultsFactKey,
    )
  }
}

function render(): void {
  if (state) {
    updateStage(stage, state)
    if (entities) updateEntities(entities, state)
    if (player3d) updatePlayer3D(player3d, state)
    if (climbView) updateClimbView(climbView, state)
    updateHud(state, bestScore())
    const playing = state.phase === 'running' || state.phase === 'climbing'
    updateActionButton(playing && !resultsShown, state.phase === 'climbing')
    if (state.lastCollected.seq !== lastToastSeq && state.lastCollected.kind !== '') {
      lastToastSeq = state.lastCollected.seq
      showCollectToast(t('food.' + state.lastCollected.kind + '.name'))
      recordCollectedFood(save, state.lastCollected.kind)
    }
  }
  renderStage(stage)
}

startLoop(update, render)
