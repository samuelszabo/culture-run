import './cards.css'
import { t } from '../i18n/strings'
import { LevelDef } from '../levels/registry'

export function showPreLevelCard(level: LevelDef, onStart: () => void): void {
  const overlay = document.createElement('div')
  overlay.className = 'card-overlay'

  const inner = document.createElement('div')
  inner.className = 'card-inner'

  const flag = document.createElement('div')
  flag.className = 'card-flag'
  flag.textContent = level.flag

  const title = document.createElement('h2')
  title.className = 'card-title'
  title.textContent = t(level.cardTitleKey)

  const fact = document.createElement('p')
  fact.className = 'card-fact'
  fact.textContent = t(level.cardFactKey)

  const startBtn = document.createElement('button')
  startBtn.className = 'card-start-btn'
  startBtn.textContent = t('card.start')
  startBtn.addEventListener('click', () => {
    overlay.remove()
    onStart()
  })

  inner.appendChild(flag)
  inner.appendChild(title)
  inner.appendChild(fact)
  inner.appendChild(startBtn)
  overlay.appendChild(inner)
  document.body.appendChild(overlay)
}
