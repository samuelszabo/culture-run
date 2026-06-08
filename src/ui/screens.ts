import './screens.css'
import { SaveData, Character, RewardId } from '../game/types'
import { REWARDS } from '../game/rewards'
import { ALBUM_ENTRIES } from '../game/album'
import { COUNTRY_LEVEL, getLevel } from '../levels/registry'
import { t } from '../i18n/strings'

export interface ScreensCallbacks {
  onStartGame(levelId: string): void
}

type Screen = 'home' | 'character' | 'country' | 'area' | 'wardrobe' | 'album'

let ui: HTMLElement
let save: SaveData
let persist: () => void
let callbacks: ScreensCallbacks
let selectedCountry = 'china'

const REWARD_ICONS: Record<RewardId, string> = {
  'dragon-tail': '🐉',
  'labubu': '👾',
  'cat-pet': '🐈',
  'bear-cub': '🧸',
  'kroj': '👗',
  'squirrel': '🐿️',
  'playable-bear': '🐻',
}

// Characters that always exist vs. those gated behind a reward unlock.
const BASE_CHARACTERS: Character[] = ['boy', 'girl', 'cat']

function isCharacterUnlocked(ch: Character): boolean {
  if (ch === 'bear') return save.unlockedRewards.includes('playable-bear')
  return true
}

function availableCharacters(): Character[] {
  const list: Character[] = [...BASE_CHARACTERS]
  if (isCharacterUnlocked('bear')) list.push('bear')
  return list
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
    case 'album': renderAlbum(); break
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

  const albumBtn = button('btn btn-secondary', t('menu.album'))
  albumBtn.addEventListener('click', () => renderScreen('album'))
  actions.appendChild(albumBtn)

  wrap.appendChild(actions)
  ui.appendChild(wrap)
}

function renderCharacter(): void {
  const wrap = div('screen screen-character')

  const title = el('h2', 'screen-title')
  title.textContent = t('character.title')
  wrap.appendChild(title)

  const grid = div('character-grid')

  for (const ch of BASE_CHARACTERS) grid.appendChild(characterCard(ch))
  // Bear is shown as a locked teaser until the playable-bear reward is earned.
  grid.appendChild(characterCard('bear'))

  wrap.appendChild(grid)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('home'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function createCharacterFigure(character: Character): HTMLDivElement {
  const figure = div(`character-figure character-figure--${character}`)
  figure.appendChild(div('char-head'))
  figure.appendChild(div('char-body'))
  figure.appendChild(div('char-legs'))

  if (character === 'girl') {
    figure.appendChild(div('braid braid-left'))
    figure.appendChild(div('braid braid-right'))
  }

  if (character === 'cat') {
    figure.appendChild(div('cat-ear cat-ear--left'))
    figure.appendChild(div('cat-ear cat-ear--right'))
    figure.appendChild(div('cat-tail'))
  }

  if (character === 'bear') {
    figure.appendChild(div('bear-ear bear-ear--left'))
    figure.appendChild(div('bear-ear bear-ear--right'))
    figure.appendChild(div('bear-snout'))
  }

  return figure
}

function characterCard(character: Character): HTMLElement {
  const card = div('character-card')
  const unlocked = isCharacterUnlocked(character)

  const label = el('span', 'character-label')
  label.textContent = t(`character.${character}`)

  card.appendChild(createCharacterFigure(character))
  card.appendChild(label)

  if (!unlocked) {
    card.classList.add('character-card--locked')
    const lock = el('span', 'lock-icon')
    lock.textContent = '🔒'
    card.appendChild(lock)
    return card
  }

  card.setAttribute('role', 'button')
  card.setAttribute('tabindex', '0')

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
    { key: 'slovakia', flag: '🇸🇰', unlocked: true },
    { key: 'japan', flag: '🇯🇵', unlocked: false },
    { key: 'italy', flag: '🇮🇹', unlocked: false },
    { key: 'egypt', flag: '🇪🇬', unlocked: false },
    { key: 'france', flag: '🇫🇷', unlocked: false },
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
      const openArea = () => {
        selectedCountry = country.key
        renderScreen('area')
      }
      card.setAttribute('role', 'button')
      card.setAttribute('tabindex', '0')
      card.addEventListener('click', openArea)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openArea()
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

  const levelId = COUNTRY_LEVEL[selectedCountry] ?? 'china-wall'
  const level = getLevel(levelId)

  const card = div('area-card')

  const areaName = el('h3', 'area-name')
  areaName.textContent = t(level.areaNameKey)
  card.appendChild(areaName)

  const info = el('p', 'area-info')
  info.textContent = t(level.areaInfoKey)
  card.appendChild(info)

  const playBtn = button('btn btn-primary', t('menu.play'))
  playBtn.addEventListener('click', () => {
    hideScreens()
    callbacks.onStartGame(levelId)
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
  preview.appendChild(createCharacterFigure(wardrobeCharacter))
  wrap.appendChild(preview)

  const characterLabel = el('h3', 'screen-title')
  characterLabel.textContent = t('wardrobe.character')
  wrap.appendChild(characterLabel)

  const characterSwitcher = div('wardrobe-character-switcher')
  for (const ch of availableCharacters()) {
    const miniCard = div(`wardrobe-mini-card${ch === wardrobeCharacter ? ' wardrobe-mini-card--active' : ''}`)
    miniCard.setAttribute('role', 'button')
    miniCard.setAttribute('tabindex', '0')
    miniCard.setAttribute('aria-pressed', String(ch === wardrobeCharacter))
    const miniFigure = createCharacterFigure(ch)
    miniFigure.classList.add('character-figure--mini')
    miniCard.appendChild(miniFigure)
    const miniLabel = el('span', 'wardrobe-mini-label')
    miniLabel.textContent = t(`character.${ch}`)
    miniCard.appendChild(miniLabel)
    const selectCh = () => {
      save.character = ch
      persist()
      renderScreen('wardrobe')
    }
    miniCard.addEventListener('click', selectCh)
    miniCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') selectCh()
    })
    characterSwitcher.appendChild(miniCard)
  }
  wrap.appendChild(characterSwitcher)

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

    if (!unlocked) {
      const lock = el('span', 'lock-icon')
      lock.textContent = '🔒'
      item.appendChild(lock)

      const hint = el('span', 'reward-hint')
      hint.textContent = t(reward.hintKey)
      item.appendChild(hint)
    } else if (reward.equippable === false) {
      // Character-unlock rewards (e.g. playable bear): no equip toggle.
      const status = el('span', 'reward-hint')
      status.textContent = t('wardrobe.unlocked')
      item.appendChild(status)
    } else {
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
    }

    list.appendChild(item)
  }

  wrap.appendChild(list)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('home'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function renderAlbum(): void {
  const wrap = div('screen screen-album')

  const title = el('h2', 'screen-title')
  title.textContent = t('album.title')
  wrap.appendChild(title)

  const subtitle = el('p', 'album-subtitle')
  subtitle.textContent = t('album.subtitle')
  wrap.appendChild(subtitle)

  const foods = ALBUM_ENTRIES.filter(e => e.category === 'food')
  const landmarks = ALBUM_ENTRIES.filter(e => e.category === 'landmark')

  const foodSection = div('album-section')
  const foodGrid = div('album-grid')
  for (const entry of foods) {
    const unlocked = save.album.foods.includes(entry.id)
    foodGrid.appendChild(albumTile(entry.icon, t(entry.nameKey), t(entry.factKey), unlocked))
  }
  foodSection.appendChild(foodGrid)
  wrap.appendChild(foodSection)

  const landmarkSection = div('album-section')
  const landmarkGrid = div('album-grid')
  for (const entry of landmarks) {
    const unlocked = save.album.landmarks.includes(entry.id)
    landmarkGrid.appendChild(albumTile(entry.icon, t(entry.nameKey), t(entry.factKey), unlocked))
  }
  landmarkSection.appendChild(landmarkGrid)
  wrap.appendChild(landmarkSection)

  const backBtn = button('btn btn-back', t('common.back'))
  backBtn.addEventListener('click', () => renderScreen('home'))
  wrap.appendChild(backBtn)

  ui.appendChild(wrap)
}

function albumTile(icon: string, name: string, fact: string, unlocked: boolean): HTMLDivElement {
  const tile = div(`album-tile${unlocked ? ' album-tile--unlocked' : ' album-tile--locked'}`)

  const iconEl = el('span', 'album-tile-icon')
  iconEl.textContent = unlocked ? icon : '?'
  tile.appendChild(iconEl)

  const nameEl = el('span', 'album-tile-name')
  nameEl.textContent = unlocked ? name : t('album.locked.hint')
  tile.appendChild(nameEl)

  if (unlocked) {
    const factEl = el('p', 'album-tile-fact')
    factEl.textContent = fact
    tile.appendChild(factEl)
  }

  return tile
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
