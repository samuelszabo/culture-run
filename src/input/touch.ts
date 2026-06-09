import { InputState } from '../game/types'

// Upward flick (px) from the gesture's start that triggers a jump (running).
const SWIPE_UP_THRESHOLD = 40
// Horizontal drag (px) per ladder-lane step while climbing.
const LANE_NOTCH = 55
// Max finger travel (px) for a touch to count as a tap = one climb-up.
const TAP_MOVE_MAX = 18

export function attachTouch(
  canvas: HTMLCanvasElement,
  input: InputState,
  screenToGameX: (clientX: number) => number,
  isClimbing: () => boolean = () => false,
): void {
  let activePointerId: number | null = null
  let startX = 0
  let startY = 0
  let laneBaseX = 0
  let maxMove = 0
  let jumpedThisGesture = false
  // Captured at pointerdown so a gesture keeps one mode even if phase flips.
  let climbGesture = false

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary) return
    activePointerId = event.pointerId
    canvas.setPointerCapture(event.pointerId)
    startX = event.clientX
    startY = event.clientY
    laneBaseX = event.clientX
    maxMove = 0
    jumpedThisGesture = false
    climbGesture = isClimbing()
    if (!climbGesture) input.touchTargetX = screenToGameX(event.clientX)
    event.preventDefault()
  })

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    maxMove = Math.max(maxMove, Math.abs(dx) + Math.abs(dy))

    if (climbGesture) {
      // Horizontal drag steps ladder lanes in notches; no finger-follow.
      const ndx = event.clientX - laneBaseX
      if (Math.abs(ndx) >= LANE_NOTCH) {
        input.climbLane = ndx < 0 ? -1 : 1
        laneBaseX += (ndx < 0 ? -1 : 1) * LANE_NOTCH
      }
    } else {
      input.touchTargetX = screenToGameX(event.clientX)
      if (!jumpedThisGesture && startY - event.clientY > SWIPE_UP_THRESHOLD) {
        input.jumpQueued = true
        jumpedThisGesture = true
      }
    }
    event.preventDefault()
  })

  canvas.addEventListener('pointerup', (event) => {
    if (event.pointerId !== activePointerId) return
    activePointerId = null
    if (climbGesture) {
      // A tap (little movement) climbs one rung.
      if (maxMove < TAP_MOVE_MAX) input.climbQueued = true
    } else {
      input.touchTargetX = null
    }
  })

  canvas.addEventListener('pointercancel', (event) => {
    if (event.pointerId !== activePointerId) return
    activePointerId = null
    if (!climbGesture) input.touchTargetX = null
  })
}
