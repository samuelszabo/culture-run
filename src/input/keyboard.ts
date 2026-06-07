import { InputState } from '../game/types'

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA'])
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD'])

export function attachKeyboard(input: InputState): void {
  window.addEventListener('keydown', (event) => {
    if (LEFT_KEYS.has(event.code)) input.leftHeld = true
    if (RIGHT_KEYS.has(event.code)) input.rightHeld = true
  })

  window.addEventListener('keyup', (event) => {
    if (LEFT_KEYS.has(event.code)) input.leftHeld = false
    if (RIGHT_KEYS.has(event.code)) input.rightHeld = false
  })
}
