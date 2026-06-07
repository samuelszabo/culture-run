import './screens.css'
import { SaveData, Character, RewardId } from '../game/types'
import { REWARDS } from '../game/rewards'
import { t } from '../i18n/strings'

export interface ScreensCallbacks {
  onStartGame(): void
}

type Screen = 'home' | 'character' | 'country' | 'area' | 'wardrobe'

let ui: HTMLElement
let save: SaveData
let persist: () => void
let callbacks: ScreensCallbacks

const REWARD_ICONS: Record<RewardId, string> = {
  'dragon-tail': '🐉',
  'labubu': '👾',
}

export function initScreens(
  saveData: SaveData,
  persistFn: () => void,
  cbs: ScreensCallbacks,
): void {
  save = saveData
  persist = persistFn
  callbacks = cbs
  ui = document.getElementById('ui')!
}

export function showHome(): void {
  ui.style.display = 'flex'
  renderScreen('home')
}

export function hideScreens(): void {
  ui.style.display = 'none'
  ui.innerHTML = ''
}

function renderScreen(screen: Screen): void {
  ui.innerHTML = ''
  switch (screen) {
    case 'home': renderHome(); break
    case 'character': renderCharacter(); break
    case 'country': renderCountry(); break
    case 'area': renderArea(); break
    case 'wardrobe': renderWardrobe(); break
  }
}

function renderHome(): void {
  const wrap = div('screen screen-home')

  const title = el('h1', 'game-title')
  title.textContent = t('game.title')
  wrap.appendChild(title)

  const actions = div('button-group')

  const playBtn = button('btn btn-primary', t('menu.play'))
  playBtn.addEventListener('click', () => {
    if (save.character === null) {
      renderScreen('character')
    } else {
      renderScreen('country')
    }
  })
  actions.appendChild(playBtn)

  const wardrobeBtn = button('btn btn-secondary', t('menu.wardrobe'))
  wardrobeBtn.addEventListener('click', () => renderScreen('wardrobe'))
  actions.appendChild(wardrobeBtn)

  wrap.appendChild(actions)
  ui.appendChild(wrap)
}

function renderCharacter(): void {
  const wrap = div('screen screen-character')

  const title = el('h2', 'screen-title')
  title.textContent = t('character.title')
  wrap.appendChild(title)

  const grid = div('character-grid')

  grid.appendChild(characterCard('boy'))
  grid.appendChild(characterCard('girl'))

  wrap.appendChild(grid)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('home'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function characterCard(character: Character): HTMLElement {
  const card = div('character-card')
  card.setAttribute('role', 'button')
  card.setAttribute('tabindex', '0')

  const figure = div(`character-figure character-figure--${character}`)
  const head = div('char-head')
  figure.appendChild(head)
  const body = div('char-body')
  figure.appendChild(body)
  const legs = div('char-legs')
  figure.appendChild(legs)

  if (character === 'girl') {
    const braidLeft = div('braid braid-left')
    const braidRight = div('braid braid-right')
    figure.appendChild(braidLeft)
    figure.appendChild(braidRight)
  }

  const label = el('span', 'character-label')
  label.textContent = t(`character.${character}`)

  card.appendChild(figure)
  card.appendChild(label)

  const selectCharacter = () => {
    save.character = character
    persist()
    renderScreen('country')
  }

  card.addEventListener('click', selectCharacter)
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') selectCharacter()
  })

  return card
}

function renderCountry(): void {
  const wrap = div('screen screen-country')

  const title = el('h2', 'screen-title')
  title.textContent = t('country.title')
  wrap.appendChild(title)

  const grid = div('country-grid')

  const countries: Array<{ key: string; flag: string; unlocked: boolean }> = [
    { key: 'china', flag: '🇨🇳', unlocked: true },
    { key: 'japan', flag: '🇯🇵', unlocked: false },
    { key: 'italy', flag: '🇮🇹', unlocked: false },
    { key: 'egypt', flag: '🇪🇬', unlocked: false },
    { key: 'france', flag: '🇫🇷', unlocked: false },
    { key: 'slovakia', flag: '🇸🇰', unlocked: false },
  ]

  for (const country of countries) {
    const card = div(`country-card${country.unlocked ? ' country-card--unlocked' : ' country-card--locked'}`)

    const flag = el('span', 'country-flag')
    flag.textContent = country.flag
    card.appendChild(flag)

    const name = el('span', 'country-name')
    name.textContent = t(`country.${country.key}`)
    card.appendChild(name)

    if (!country.unlocked) {
      const lock = el('span', 'lock-icon')
      lock.textContent = '🔒'
      card.appendChild(lock)

      const soon = el('span', 'country-soon')
      soon.textContent = t('country.soon')
      card.appendChild(soon)
    } else {
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.addEventListener('click', () => renderScreen('area'))
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') renderScreen('area')
      })
    }

    grid.appendChild(card)
  }

  wrap.appendChild(grid)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('home'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function renderArea(): void {
  const wrap = div('screen screen-area')

  const title = el('h2', 'screen-title')
  title.textContent = t('area.title')
  wrap.appendChild(title)

  const card = div('area-card')

  const areaName = el('h3', 'area-name')
  areaName.textContent = t('area.china-bridge')
  card.appendChild(areaName)

  const info = el('p', 'area-info')
  info.textContent = t('area.china-bridge.info')
  card.appendChild(info)

  const playBtn = button('btn btn-primary', t('menu.play'))
  playBtn.addEventListener('click', () => {
    hideScreens()
    callbacks.onStartGame()
  })
  card.appendChild(playBtn)

  wrap.appendChild(card)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('country'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function renderWardrobe(): void {
  const wrap = div('screen screen-wardrobe')

  const title = el('h2', 'screen-title')
  title.textContent = t('wardrobe.title')
  wrap.appendChild(title)

  const preview = div('wardrobe-preview')
  const wardrobeCharacter = save.character ?? 'boy'
  const figure = div(`character-figure character-figure--${wardrobeCharacter}`)
  const head = div('char-head')
  figure.appendChild(head)
  const body = div('char-body')
  figure.appendChild(body)
  const legs = div('char-legs')
  figure.appendChild(legs)

  if (wardrobeCharacter === 'girl') {
    figure.appendChild(div('braid braid-left'))
    figure.appendChild(div('braid braid-right'))
  }

  preview.appendChild(figure)
  wrap.appendChild(preview)

  const list = div('reward-list')

  for (const reward of REWARDS) {
    const unlocked = save.unlockedRewards.includes(reward.id)
    const item = div(`reward-item${unlocked ? ' reward-item--unlocked' : ' reward-item--locked'}`)

    const icon = el('span', 'reward-icon')
    icon.textContent = REWARD_ICONS[reward.id]
    item.appendChild(icon)

    const name = el('span', 'reward-name')
    name.textContent = t(reward.nameKey)
    item.appendChild(name)

    if (unlocked) {
      const equipped = save.equippedRewards.includes(reward.id)
      const toggle = el('button', 'reward-toggle') as HTMLButtonElement
      toggle.textContent = equipped ? '✓' : '○'
      toggle.setAttribute('aria-pressed', String(equipped))
      toggle.addEventListener('click', () => {
        const idx = save.equippedRewards.indexOf(reward.id)
        if (idx >= 0) {
          save.equippedRewards.splice(idx, 1)
        } else {
          save.equippedRewards.push(reward.id)
        }
        persist()
        renderScreen('wardrobe')
      })
      item.appendChild(toggle)
    } else {
      const lock = el('span', 'lock-icon')
      lock.textContent = '🔒'
      item.appendChild(lock)

      const hint = el('span', 'reward-hint')
      hint.textContent = t('wardrobe.lockedHint')
      item.appendChild(hint)
    }

    list.appendChild(item)
  }

  wrap.appendChild(list)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('home'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function div(className: string): HTMLDivElement {
  const d = document.createElement('div')
  d.className = className
  return d
}

function el(tag: string, className: string): HTMLElement {
  const e = document.createElement(tag)
  e.className = className
  return e
}

function button(className: string, text: string): HTMLButtonElement {
  const b = document.createElement('button')
  b.className = className
  b.textContent = text
  return b
}
