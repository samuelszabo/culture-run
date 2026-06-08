import { InputState } from '../game/types'

// Upward flick (px) from the gesture's start that triggers a jump.
const SWIPE_UP_THRESHOLD = 40

export function attachTouch(
  canvas: HTMLCanvasElement,
  input: InputState,
  screenToGameX: (clientX: number) => number
): void {
  let activePointerId: number | null = null
  let startY = 0
  let jumpedThisGesture = false

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return
    activePointerId = event.pointerId
    canvas.setPointerCapture(event.pointerId)
    input.touchTargetX = screenToGameX(event.clientX)
    startY = event.clientY
    jumpedThisGesture = false
    event.preventDefault()
  })

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointerId) return
    input.touchTargetX = screenToGameX(event.clientX)
    if (!jumpedThisGesture && startY - event.clientY > SWIPE_UP_THRESHOLD) {
      input.jumpQueued = true
      jumpedThisGesture = true
    }
    event.preventDefault()
  })

  canvas.addEventListener('pointerup', (event) => {
    if (event.pointerId !== activePointerId) return
    activePointerId = null
    input.touchTargetX = null
  })

  canvas.addEventListener('pointercancel', (event) => {
    if (event.pointerId !== activePointerId) return
    activePointerId = null
    input.touchTargetX = null
  })
}
