import './overlay.css'
import { GameState, STARTING_LIVES, TRACK_LENGTH } from '../game/types'
import { t } from '../i18n/strings'

let container: HTMLDivElement | null = null
const heartSpans: HTMLSpanElement[] = []
let progressFill: HTMLDivElement | null = null
let scoreSpan: HTMLSpanElement | null = null
let bestSpan: HTMLSpanElement | null = null

let lastLives = -1
let lastProgress = -1
let lastScore = -1
let lastBest = -1

export function initHud(onExit: () => void): void {
  if (container) return

  container = document.createElement('div')
  container.className = 'hud-container'

  const homeBtn = document.createElement('button')
  homeBtn.className = 'hud-home'
  homeBtn.textContent = '🏠'
  homeBtn.setAttribute('aria-label', t('hud.menu'))
  homeBtn.addEventListener('click', onExit)
  container.appendChild(homeBtn)

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

  bestSpan = document.createElement('span')
  bestSpan.className = 'hud-best'
  bestSpan.textContent = `${t('hud.best')}: 0`

  container.appendChild(heartsEl)
  container.appendChild(progressTrack)
  container.appendChild(scoreSpan)
  container.appendChild(bestSpan)
  document.body.appendChild(container)
}

export function updateHud(state: GameState, best: number): void {
  if (!container) return

  if (best !== lastBest) {
    lastBest = best
    if (bestSpan) {
      bestSpan.textContent = `${t('hud.best')}: ${best}`
    }
  }

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
