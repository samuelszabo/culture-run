import './overlay.css'
import { GameState, STARTING_LIVES, TRACK_LENGTH } from '../game/types'
import { t } from '../i18n/strings'

let container: HTMLDivElement | null = null
const heartSpans: HTMLSpanElement[] = []
let progressFill: HTMLDivElement | null = null
let scoreSpan: HTMLSpanElement | null = null

let lastLives = -1
let lastProgress = -1
let lastScore = -1

export function initHud(): void {
  if (container) return

  container = document.createElement('div')
  container.className = 'hud-container'

  const heartsEl = document.createElement('div')
  heartsEl.className = 'hud-hearts'
  for (let i = 0; i < STARTING_LIVES; i++) {
    const heart = document.createElement('span')
    heart.className = 'hud-heart hud-heart--full'
    heart.textContent = '♥'
    heartSpans.push(heart)
    heartsEl.appendChild(heart)
  }

  const progressTrack = document.createElement('div')
  progressTrack.className = 'hud-progress'
  progressFill = document.createElement('div')
  progressFill.className = 'hud-progress-fill'
  progressFill.style.width = '0%'
  progressTrack.appendChild(progressFill)

  scoreSpan = document.createElement('span')
  scoreSpan.className = 'hud-score'
  scoreSpan.textContent = `${t('hud.score')}: 0`

  container.appendChild(heartsEl)
  container.appendChild(progressTrack)
  container.appendChild(scoreSpan)
  document.body.appendChild(container)
}

export function updateHud(state: GameState): void {
  if (!container) return

  if (state.lives !== lastLives) {
    lastLives = state.lives
    for (let i = 0; i < heartSpans.length; i++) {
      const filled = i < state.lives
      heartSpans[i].className = `hud-heart ${filled ? 'hud-heart--full' : 'hud-heart--empty'}`
    }
  }

  const progress = Math.round(Math.min(1, state.distance / TRACK_LENGTH) * 1000) / 1000
  if (progress !== lastProgress) {
    lastProgress = progress
    if (progressFill) {
      progressFill.style.width = `${progress * 100}%`
    }
  }

  if (state.score !== lastScore) {
    lastScore = state.score
    if (scoreSpan) {
      scoreSpan.textContent = `${t('hud.score')}: ${state.score}`
    }
  }
}

export function showHud(): void {
  if (container) {
    container.style.display = ''
  }
}

export function hideHud(): void {
  if (container) {
    container.style.display = 'none'
  }
}
