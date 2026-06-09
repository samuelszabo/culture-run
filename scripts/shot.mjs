// Visual-debug helper: boots the production preview, drives the menu to a
// target screen/level, screenshots it, and prints any console / page errors.
// Runs inside the Claude docker image (see Dockerfile.claude — Chromium + the
// global `playwright` module are preinstalled).
//
// Usage:
//   node scripts/shot.mjs                      # Slovak run, 2.5s in
//   TARGET=china OUT=/tmp/cn.png node scripts/shot.mjs
//   TARGET=climb WAIT=15000 node scripts/shot.mjs   # catch the first climb
//   TARGET=slovak SHOTS=6 INTERVAL=2500 node scripts/shot.mjs  # timelapse
//   TARGET=home node scripts/shot.mjs
//
// Env: TARGET home|china|slovak|climb  OUT path  WAIT ms  SHOTS n  INTERVAL ms
//      CHAR boy|girl|cat|bear  PORT (default 4173)  URL (skip auto-server)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const TARGET = process.env.TARGET ?? 'slovak'
const OUT = process.env.OUT ?? `/tmp/shot-${TARGET}.png`
const WAIT = Number(process.env.WAIT ?? (TARGET === 'climb' ? 15000 : 2500))
const SHOTS = Number(process.env.SHOTS ?? 1)
const INTERVAL = Number(process.env.INTERVAL ?? 2000)
const CHAR = process.env.CHAR ?? (TARGET === 'climb' ? 'bear' : 'boy')
const PORT = Number(process.env.PORT ?? 4173)
const URL = process.env.URL ?? `http://localhost:${PORT}/`

const SAVE = {
  version: 2,
  character: CHAR,
  unlockedRewards: ['dragon-tail', 'labubu', 'cat-pet', 'bear-cub', 'kroj', 'squirrel', 'playable-bear'],
  equippedRewards: TARGET === 'climb' ? ['bear-cub', 'squirrel', 'kroj'] : [],
  bestScores: {},
  settings: { sound: true, language: 'sk' },
  album: { foods: [], landmarks: [] },
}

let server = null
async function ensureServer() {
  if (process.env.URL) return // caller manages the server
  server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(), stdio: 'ignore',
  })
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(URL); if (r.ok) return } catch {}
    await sleep(250)
  }
  throw new Error('preview server did not start')
}

async function clickByText(page, selector, re) {
  for (const el of await page.$$(selector)) {
    if (re.test(await el.innerText())) { await el.click(); return true }
  }
  return false
}

async function main() {
  await ensureServer()
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] })
  const page = await browser.newPage({ viewport: { width: 480, height: 820 } })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message))
  await page.addInitScript((s) => localStorage.setItem('cultureRun.save', s), JSON.stringify(SAVE))

  await page.goto(URL)
  await sleep(600)

  if (TARGET !== 'home') {
    await page.click('.btn-primary')                 // Play → country
    await sleep(400)
    const country = TARGET === 'china' ? /Čína/i : /Slovensko/i
    await clickByText(page, '.country-card--unlocked', country)
    await sleep(400)
    await page.click('.btn-primary')                 // area → Play
    await sleep(300)
    await page.click('.card-start-btn')              // pre-level card → Start
  }

  for (let i = 0; i < SHOTS; i++) {
    await sleep(i === 0 ? WAIT : INTERVAL)
    const out = SHOTS === 1 ? OUT : OUT.replace(/\.png$/, `-${i + 1}.png`)
    await page.screenshot({ path: out })
    console.log('shot →', out)
  }

  console.log('console errors:', errors.length ? errors.slice(0, 12) : 'none')
  await browser.close()
}

try {
  await main()
} finally {
  if (server) server.kill('SIGTERM')
}
