# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — typecheck (`tsc --noEmit`) then `vite build` to `dist/`
- `npm run typecheck` — typecheck only
- `npm run preview` — serve the production build
- `npm test` — run the Vitest unit suite (`tests/**/*.test.ts`); `npm run test:watch` to watch

Vitest covers the **pure game logic** (scoring/stars, lives + death cycle, climb-mini-game fairness, level data/balance, AABB) in `tests/` — no DOM/WebGL. Tests live outside `src` so `tsc` ignores them. Rendering and feel are still verified visually (see Docker section's `scripts/shot.mjs`). When changing gameplay tunables, run `npm test` — e.g. the Slovak level's max score is asserted at 1080 because reward thresholds depend on it.

## Commits

- **Do not mention Claude / AI in commit messages or PR bodies** — no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" line.
- Use Conventional Commits. Commit and push after each completed phase or user request.

## Deployment

Hosted on **Cloudflare Pages** (https://culture-run.pages.dev/). `vite.config.ts` sets `base: './'` so the build runs from any path. There is no CI workflow — Cloudflare builds from the repo.

## Architecture

Culture Run is a 3D browser runner (Subway-Surfers-style camera) built on **Three.js + Vite + TypeScript**, no game engine. The original 2D Canvas design in `docs/technical-requirements.md` is **historical** — the live game is 3D (`docs/redesign-3d.md` is the current design). The 2D version lives in git tag `v1-2d`.

The central design rule: **game logic is fully decoupled from rendering.** `src/game/*` is pure simulation with no Three.js imports; `src/render3d/*` reads `GameState` each frame and syncs meshes to it. This let the 2D→3D port replace only the render layer.

### Coordinate system (the key contract)

Game logic works in 2D **track space** — the legacy Canvas coordinates that never changed:
- `x` ∈ `[ROAD_LEFT=60, ROAD_RIGHT=420]` (horizontal lane position), origin at `GAME_WIDTH/2 = 240`
- `trackY` ∈ `[0, TRACK_LENGTH=20000]` (distance down the track)
- Collisions are 2D AABB in this space (`game/collision.ts`, `game/types.ts` `*Box` helpers) — correct for a runner even in 3D.

`render3d/world.ts` is the **single source of truth** for projecting track space into Three.js world space: `worldX = (x − 240) / UNIT`, `worldZ = −trackY / UNIT`, `UNIT = 50`. Scenery sits at fixed world positions; the **player and camera move forward** (−z) as `state.distance` grows. Any new rendering code must go through the `toWorldX/toWorldZ/toWorldSize` helpers, never hardcode the conversion.

### Game loop

`game/loop.ts` runs a **fixed-timestep accumulator** (60 Hz `update`, decoupled `render`). `main.ts` is the orchestrator wiring it all together:
- `update(dt)` advances simulation only (speed ramps with distance, movers, player, collisions, pickups, landmark triggers, end-of-run scoring/quiz). Phases: `running → dying → finished | gameover`.
- `render()` pushes `GameState` into the stage, entity pool, player mesh, and DOM HUD.

`main.ts` also owns screen flow (home → pre-level card → game → results → optional quiz) and the single mutable `save` object.

### Module map

- `src/game/` — simulation: `types.ts` (all constants + `GameState` + AABB helpers), `player`, `movers`, `obstacles`, `collectibles`, `collision`, `scoring` (stars), `lives`, `rewards`, `album`, `quiz`.
- `src/levels/` — a level is **data**: arrays of obstacles/collectibles at track positions (`china-wall.ts` is the only level; `LEVEL_ID = 'china-wall'`).
- `src/render3d/` — `world.ts` (coord contract), `scene.ts` (static environment: bridge/deck, railings, lanterns, terrain, trees, mountains, landmark meshes built from primitives + `LANDMARKS` trigger positions), `entities.ts` (pooled obstacle/collectible meshes synced from state), `player3d.ts` (character + equipped cosmetics), `models.ts` (GLTFLoader for CC0 `.glb` food models in `public/models/`), `quality.ts` (startup device-tier detection driving DPR cap, antialias, fog distance, tree density — `quality` constants are read at scene-build time).
- `src/ui/` — DOM/CSS overlays above the canvas (not drawn in WebGL): `screens`, `hud-dom`, `results-dom`, `quiz-dom`, `cards`, `collect-toast`, `landmark-caption`, `album` views. Localization-friendly by being HTML.
- `src/input/` — `keyboard.ts` (←→/AD) and `touch.ts` (finger-follow horizontal drag). Both mutate a shared `InputState`.
- `src/i18n/` — `t('key')` looks up `sk.json`. **No hardcoded user-facing strings** — every string goes through `t()`. Only Slovak (`sk.json`) exists; structure is ready for more locales.
- `src/storage/save.ts` — single `localStorage` key, JSON with `version` for migrations. Holds character, unlocked/equipped rewards, best scores per level, and the educational album (seen foods + landmarks).

### Educational layer

Facts shown to players (food names on pickup, landmark captions, album facts, quiz questions) **must be factually correct** — keep them general and verifiable, never invent data.

## Conventions

- No runtime dependencies beyond Three.js; avoid adding libraries for things a small amount of code can do.
- Avoid allocations in the per-frame hot path (the codebase uses instanced meshes and object pooling for this reason).
- Add new gameplay tunables as named constants in `game/types.ts`; add new world/render constants in `render3d/world.ts` or `render3d/quality.ts`.

## Docker

`make claude` / `Dockerfile.claude` run Claude Code in a container mounting the repo — for the maintainer's automated workflow, not part of the app build.

The image ships headless Chromium + Playwright for visual debugging. `node scripts/shot.mjs` boots the preview, drives the menu to a target, screenshots it, and prints console errors — e.g. `TARGET=climb node scripts/shot.mjs` or `TARGET=china OUT=/tmp/cn.png node scripts/shot.mjs` (env: `TARGET` home|china|slovak|climb, `OUT`, `WAIT`, `SHOTS`, `INTERVAL`, `CHAR`). Read the resulting PNG to inspect the running game.
