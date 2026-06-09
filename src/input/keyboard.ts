import { InputState } from '../game/types'

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA'])
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD'])
const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW'])

export function attachKeyboard(input: InputState): void {
  window.addEventListener('keydown', (event) => {
    if (LEFT_KEYS.has(event.code)) input.leftHeld = true
    if (RIGHT_KEYS.has(event.code)) input.rightHeld = true
    if (JUMP_KEYS.has(event.code)) {
      // Same keys jump while running and climb-up while on a ladder; the active
      // phase consumes the matching flag and clears it.
      input.jumpQueued = true
      input.climbQueued = true
      event.preventDefault()
    }
  })

  window.addEventListener('keyup', (event) => {
    if (LEFT_KEYS.has(event.code)) input.leftHeld = false
    if (RIGHT_KEYS.has(event.code)) input.rightHeld = false
  })
}
