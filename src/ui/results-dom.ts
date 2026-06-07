import { GameState } from '../game/types'
import { t } from '../i18n/strings'
import { computeStars } from '../game/scoring'
import { REWARDS } from '../game/rewards'

const STARS_COUNT = 5

let overlay: HTMLDivElement | null = null

export interface ResultsCallbacks {
  onRestart(): void
  onHome(): void
  onQuiz?(): void
}

export function showResults(
  state: GameState,
  callbacks: ResultsCallbacks,
  quizBonus?: number,
): void {
  hideResults()

  overlay = document.createElement('div')
  overlay.className = 'results-overlay'

  const finished = state.phase === 'finished'

  const title = document.createElement('div')
  title.className = `results-title ${finished ? 'results-title--finished' : 'results-title--gameover'}`
  title.textContent = finished ? t('game.finished') : t('game.over')

  const starsRow = document.createElement('div')
  starsRow.className = 'results-stars'
  const filledStars = computeStars(state.score, state.maxScore, finished)

  for (let i = 0; i < STARS_COUNT; i++) {
    const star = document.createElement('span')
    if (i < filledStars) {
      star.className = 'results-star results-star--filled'
      star.style.animationDelay = `${0.5 + i * 0.35}s`
    } else {
      star.className = 'results-star'
    }
    star.textContent = '★'
    starsRow.appendChild(star)
  }

  const scoreEl = document.createElement('div')
  scoreEl.className = 'results-score'
  scoreEl.textContent = `${t('hud.score')}: ${state.score} / ${state.maxScore}`

  overlay.appendChild(title)
  overlay.appendChild(starsRow)
  overlay.appendChild(scoreEl)

  // Quiz bonus line (shown after quiz is completed)
  if (quizBonus !== undefined && quizBonus > 0) {
    const bonusEl = document.createElement('div')
    bonusEl.className = 'results-quiz-bonus'
    bonusEl.textContent = `${t('quiz.bonus')}: +${quizBonus}`
    overlay.appendChild(bonusEl)
  }

  if (state.newRewards.length > 0) {
    const banner = document.createElement('div')
    banner.className = 'results-reward'

    const bannerTitle = document.createElement('div')
    bannerTitle.className = 'results-reward-title'
    bannerTitle.textContent = t('reward.unlocked')

    const names = state.newRewards.map((id) => {
      const reward = REWARDS.find((r) => r.id === id)
      return reward ? t(reward.nameKey) : id
    })

    const bannerName = document.createElement('div')
    bannerName.className = 'results-reward-name'
    bannerName.textContent = names.join(', ')

    banner.appendChild(bannerTitle)
    banner.appendChild(bannerName)
    overlay.appendChild(banner)
  } else if (finished) {
    const fact = document.createElement('div')
    fact.className = 'results-fact'
    fact.textContent = t('results.fact.china-wall')
    overlay.appendChild(fact)
  }

  const buttons = document.createElement('div')
  buttons.className = 'results-buttons'

  // Quiz button — only when finished, quiz exists, and not yet taken this run
  if (finished && callbacks.onQuiz) {
    const quizBtn = document.createElement('button')
    quizBtn.className = 'results-btn results-btn--quiz'
    quizBtn.textContent = t('quiz.start')
    quizBtn.addEventListener('click', () => {
      hideResults()
      callbacks.onQuiz!()
    })
    buttons.appendChild(quizBtn)
  }

  const restartBtn = document.createElement('button')
  restartBtn.className = 'results-btn results-btn--restart'
  restartBtn.textContent = t('results.restart')
  restartBtn.addEventListener('click', () => {
    hideResults()
    callbacks.onRestart()
  })

  const homeBtn = document.createElement('button')
  homeBtn.className = 'results-btn results-btn--home'
  homeBtn.textContent = t('results.home')
  homeBtn.addEventListener('click', () => {
    hideResults()
    callbacks.onHome()
  })

  buttons.appendChild(restartBtn)
  buttons.appendChild(homeBtn)
  overlay.appendChild(buttons)

  document.body.appendChild(overlay)
}

export function hideResults(): void {
  if (overlay) {
    overlay.remove()
    overlay = null
  }
}
