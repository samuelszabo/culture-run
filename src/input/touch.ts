import { InputState } from '../game/types'

export function attachTouch(
  canvas: HTMLCanvasElement,
  input: InputState,
  screenToGameX: (clientX: number) => number
): void {
  let activePointerId: number | null = null

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return
    activePointerId = event.pointerId
    canvas.setPointerCapture(event.pointerId)
    input.touchTargetX = screenToGameX(event.clientX)
    event.preventDefault()
  })

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointerId) return
    input.touchTargetX = screenToGameX(event.clientX)
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
