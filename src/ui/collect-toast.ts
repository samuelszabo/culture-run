import './overlay.css'

let toast: HTMLDivElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function ensureToast(): HTMLDivElement {
  if (toast) return toast
  toast = document.createElement('div')
  toast.className = 'collect-toast'
  toast.setAttribute('aria-live', 'polite')
  document.body.appendChild(toast)
  return toast
}

export function showCollectToast(name: string): void {
  const el = ensureToast()

  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  el.textContent = name
  el.classList.remove('collect-toast--hidden')
  el.classList.add('collect-toast--visible')

  hideTimer = setTimeout(() => {
    hideCollectToast()
  }, 1100)
}

export function hideCollectToast(): void {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (toast) {
    toast.classList.remove('collect-toast--visible')
    toast.classList.add('collect-toast--hidden')
  }
}
