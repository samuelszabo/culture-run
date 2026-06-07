import './overlay.css'
import { t } from '../i18n/strings'

let caption: HTMLDivElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

export function showLandmarkCaption(nameKey: string, factKey: string): void {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  if (caption) {
    caption.remove()
    caption = null
  }

  caption = document.createElement('div')
  caption.className = 'landmark-caption'

  const name = document.createElement('div')
  name.className = 'landmark-caption-name'
  name.textContent = t(nameKey)

  const fact = document.createElement('div')
  fact.className = 'landmark-caption-fact'
  fact.textContent = t(factKey)

  caption.appendChild(name)
  caption.appendChild(fact)
  document.body.appendChild(caption)

  hideTimer = setTimeout(() => {
    hideLandmarkCaption()
  }, 4500)
}

export function hideLandmarkCaption(): void {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (caption) {
    caption.remove()
    caption = null
  }
}
