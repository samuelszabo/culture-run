import './overlay.css'
import { InputState } from '../game/types'
import { t } from '../i18n/strings'

// A big thumb-friendly on-screen button shown ONLY on touch devices. It is
// context-aware: while running it queues a jump, while climbing it queues one
// rung up — so jumping/climbing no longer rely on a swipe-up flick (awkward to
// do while finger-steering). On desktop the button is never created.
let btn: HTMLButtonElement | null = null
let lastClimbing: boolean | null = null

const isTouch =
  typeof window !== 'undefined' &&
  ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0)

export function initActionButton(input: InputState, isClimbing: () => boolean): void {
  if (btn || !isTouch) return

  btn = document.createElement('button')
  btn.className = 'action-button'
  btn.style.display = 'none'
  btn.textContent = t('action.jump')

  const press = (event: Event) => {
    // Don't let the tap also reach the canvas (which would steer the player).
    event.preventDefault()
    event.stopPropagation()
    if (isClimbing()) input.climbQueued = true
    else input.jumpQueued = true
  }
  btn.addEventListener('pointerdown', press)
  btn.addEventListener('contextmenu', (e) => e.preventDefault())

  document.body.appendChild(btn)
}

// Drive visibility + label from the game loop. No-op on desktop.
export function updateActionButton(show: boolean, climbing: boolean): void {
  if (!btn) return
  btn.style.display = show ? '' : 'none'
  if (climbing !== lastClimbing) {
    lastClimbing = climbing
    btn.textContent = climbing ? t('action.climb') : t('action.jump')
  }
}

export function hideActionButton(): void {
  if (btn) btn.style.display = 'none'
}
