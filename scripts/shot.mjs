// Visual-debug helper: boots the preview, jumps straight to a target via the
// dev deep-links (see main.ts devBoot), optionally drives the keyboard, then
// screenshots and prints console / page errors. Runs in the Claude docker image
// (Dockerfile.claude ships Chromium + the global `playwright` module).
//
// Usage:
//   node scripts/shot.mjs                          # Slovak run, 2.5s in
//   TARGET=china node scripts/shot.mjs
//   TARGET=climb TAPS=10 SHOTS=4 node scripts/shot.mjs   # climb, tapping up
//   TARGET=slovak DIST=9000 node scripts/shot.mjs        # jump to a distance
//   TARGET=home node scripts/shot.mjs
//   KEYS=ArrowLeft,ArrowUp,ArrowRight TARGET=climb node scripts/shot.mjs
//
// Env: TARGET home|china|slovak|climb · OUT path · WAIT ms · SHOTS n · INTERVAL ms
//      TAPS n (ArrowUp presses spread over the run) · KEYS csv (pressed once each)
//      DIST n (dev ?d=) · CHAR boy|girl|cat|bear · PORT (4173) · URL (skip server)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const TARGET = process.env.TARGET ?? 'slovak'
const OUT = process.env.OUT ?? `/tmp/shot-${TARGET}.png`
const WAIT = Number(process.env.WAIT ?? 2500)
const SHOTS = Number(process.env.SHOTS ?? 1)
const INTERVAL = Number(process.env.INTERVAL ?? 1500)
const TAPS = Number(process.env.TAPS ?? (TARGET === 'climb' ? 8 : 0))
const KEYS = (process.env.KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
const DIST = process.env.DIST
const CHAR = process.env.CHAR ?? (TARGET === 'climb' ? 'bear' : 'boy')
const PORT = Number(process.env.PORT ?? 4173)
const BASE = process.env.URL ?? `http://localhost:${PORT}/`

// Build the dev deep-link query for the target.
function targetUrl() {
  const q = new URLSearchParams()
  if (TARGET === 'home') return BASE
  q.set('env', TARGET === 'china' ? 'china' : 'slovak')
  q.set('char', CHAR)
  if (TARGET === 'climb') q.set('climb', '1')
  else if (DIST) q.set('d', DIST)
  return BASE + '?' + q.toString()
}

let server = null
async function ensureServer() {
  if (process.env.URL) return
  server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(), stdio: 'ignore',
  })
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(BASE); if (r.ok) return } catch {}
    await sleep(250)
  }
  throw new Error('preview server did not start')
}

async function main() {
  await ensureServer()
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage({ viewport: { width: 480, height: 820 } })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message))

  await page.goto(targetUrl())
  await sleep(700)
  await page.bringToFront()

  for (const k of KEYS) { await page.keyboard.press(k); await sleep(180) }

  const total = Math.max(WAIT, 1)
  const tapEvery = TAPS > 0 ? total / TAPS : 0
  let nextShot = SHOTS > 1 ? 0 : Infinity
  let shotIdx = 0
  for (let t = 0; t <= total; t += 100) {
    if (TAPS > 0 && tapEvery > 0 && t > 0 && Math.floor(t / tapEvery) > Math.floor((t - 100) / tapEvery)) {
      await page.keyboard.press('ArrowUp')
    }
    if (t >= nextShot && shotIdx < SHOTS && SHOTS > 1) {
      const out = OUT.replace(/\.png$/, `-${shotIdx + 1}.png`)
      await page.screenshot({ path: out })
      console.log('shot →', out)
      shotIdx++
      nextShot += INTERVAL
    }
    await sleep(100)
  }
  if (SHOTS === 1) {
    await page.screenshot({ path: OUT })
    console.log('shot →', OUT)
  }

  console.log('console errors:', errors.length ? errors.slice(0, 12) : 'none')
  await browser.close()
}

try {
  await main()
} finally {
  if (server) server.kill('SIGTERM')
}
