import './overlay.css'
import { QUIZZES, QuizQuestion } from '../game/quiz'
import { t } from '../i18n/strings'

export interface QuizCallbacks {
  onDone(bonusEarned: number, newRewards: string[]): void
}

let overlay: HTMLDivElement | null = null

export function isQuizOpen(): boolean {
  return overlay !== null
}

export function hasQuizForLevel(levelId: string): boolean {
  return levelId in QUIZZES && QUIZZES[levelId].length > 0
}

/** Pick 2 random questions from the pool (without replacement). */
function pickQuestions(levelId: string): QuizQuestion[] {
  const pool = QUIZZES[levelId].slice()
  if (pool.length <= 2) return pool
  // Fisher-Yates partial shuffle to get 2
  for (let i = 0; i < 2; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 2)
}

export function showQuiz(
  levelId: string,
  callbacks: QuizCallbacks,
  onRecordBonus: (bonus: number) => string[],
): void {
  hideQuiz()

  const questions = pickQuestions(levelId)
  let currentIndex = 0
  let totalBonus = 0

  overlay = document.createElement('div')
  overlay.className = 'quiz-overlay'

  function renderQuestion(): void {
    if (!overlay) return
    overlay.innerHTML = ''

    const q = questions[currentIndex]

    const titleEl = document.createElement('div')
    titleEl.className = 'quiz-title'
    titleEl.textContent = t('quiz.title')
    overlay.appendChild(titleEl)

    const progressEl = document.createElement('div')
    progressEl.className = 'quiz-progress'
    progressEl.textContent = `${currentIndex + 1} / ${questions.length}`
    overlay.appendChild(progressEl)

    const questionEl = document.createElement('div')
    questionEl.className = 'quiz-question'
    questionEl.textContent = t(q.questionKey)
    overlay.appendChild(questionEl)

    const feedbackEl = document.createElement('div')
    feedbackEl.className = 'quiz-feedback'
    feedbackEl.setAttribute('aria-live', 'polite')
    overlay.appendChild(feedbackEl)

    const optionsEl = document.createElement('div')
    optionsEl.className = 'quiz-options'

    let answered = false

    q.optionKeys.forEach((optKey, idx) => {
      const btn = document.createElement('button')
      btn.className = 'quiz-option-btn'
      btn.textContent = t(optKey)

      btn.addEventListener('click', () => {
        if (answered) return
        answered = true

        const correct = idx === q.correctIndex

        // Highlight all buttons
        q.optionKeys.forEach((_, i) => {
          const b = optionsEl.children[i] as HTMLButtonElement
          b.disabled = true
          if (i === q.correctIndex) {
            b.classList.add('quiz-option-btn--correct')
          } else if (i === idx && !correct) {
            b.classList.add('quiz-option-btn--wrong')
          }
        })

        feedbackEl.textContent = correct ? t('quiz.correct') : t('quiz.wrong')
        feedbackEl.className = `quiz-feedback quiz-feedback--${correct ? 'correct' : 'wrong'}`

        if (correct) {
          totalBonus += q.bonus
        }

        // Continue button after answer
        const continueBtn = document.createElement('button')
        continueBtn.className = 'quiz-continue-btn'
        continueBtn.textContent = t('quiz.continue')
        continueBtn.addEventListener('click', () => {
          currentIndex++
          if (currentIndex < questions.length) {
            renderQuestion()
          } else {
            renderSummary()
          }
        })
        overlay!.appendChild(continueBtn)
      })

      optionsEl.appendChild(btn)
    })

    overlay.appendChild(optionsEl)
    document.body.appendChild(overlay)
  }

  function renderSummary(): void {
    if (!overlay) return
    overlay.innerHTML = ''

    const newRewards = onRecordBonus(totalBonus)

    const titleEl = document.createElement('div')
    titleEl.className = 'quiz-title'
    titleEl.textContent = t('quiz.done')
    overlay.appendChild(titleEl)

    const bonusEl = document.createElement('div')
    bonusEl.className = 'quiz-summary-bonus'
    bonusEl.textContent = `${t('quiz.bonus')}: +${totalBonus}`
    overlay.appendChild(bonusEl)

    if (newRewards.length > 0) {
      const rewardEl = document.createElement('div')
      rewardEl.className = 'quiz-summary-reward'

      const rewardTitle = document.createElement('div')
      rewardTitle.className = 'quiz-summary-reward-title'
      rewardTitle.textContent = t('reward.unlocked')
      rewardEl.appendChild(rewardTitle)

      const rewardName = document.createElement('div')
      rewardName.className = 'quiz-summary-reward-name'
      rewardName.textContent = newRewards.join(', ')
      rewardEl.appendChild(rewardName)

      overlay.appendChild(rewardEl)
    }

    const doneBtn = document.createElement('button')
    doneBtn.className = 'quiz-done-btn'
    doneBtn.textContent = t('quiz.continue')
    doneBtn.addEventListener('click', () => {
      hideQuiz()
      callbacks.onDone(totalBonus, newRewards)
    })
    overlay.appendChild(doneBtn)
  }

  renderQuestion()
}

export function hideQuiz(): void {
  if (overlay) {
    overlay.remove()
    overlay = null
  }
}
