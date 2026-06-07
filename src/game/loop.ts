const STEP = 1 / 60
const MAX_FRAME = 0.25

export function startLoop(update: (dt: number) => void, render: () => void): void {
  let last = performance.now()
  let accumulator = 0

  function frame(now: number): void {
    accumulator += Math.min((now - last) / 1000, MAX_FRAME)
    last = now
    while (accumulator >= STEP) {
      update(STEP)
      accumulator -= STEP
    }
    render()
    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
