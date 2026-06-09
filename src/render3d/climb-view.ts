import * as THREE from 'three'
import { CLIMB_HEIGHT, CLIMB_LANES, GameState } from '../game/types'
import {
  CLIMB_LANE_WORLD_DX,
  CLIMB_PLAYER_WORLD_Y,
  CLIMB_WORLD_PER_PX,
  toWorldX,
  toWorldZ,
} from './world'

export interface ClimbView {
  root: THREE.Group
  ladder: THREE.Group
  scene: THREE.Scene
  geos: THREE.BufferGeometry[]
  mats: THREE.Material[]
}

const WOOD_RAIL = 0x8a5a32
const WOOD_RUNG = 0xb07b46
const ROCK_COLOR = 0x847a6c
const ROCK_DARK = 0x615847
const ROCK_LIGHT = 0x988a78
const MOSS_COLOR = 0x4a7a34
const VINE_COLOR = 0x3d6b2c
const LEAF_COLOR = 0x5a8c3a
const TORCH_WOOD = 0x5a4030
const TORCH_FLAME = 0xff8a2a
const LEDGE_GRASS = 0x4f8a36

// World height the full ladder spans, plus margins above/below the visible window.
const HEIGHT_WORLD = CLIMB_HEIGHT * CLIMB_WORLD_PER_PX
const RUNG_SPACING = 0.46
const LOCAL_Y_MIN = -3
// Rock face reaches a little above the grassy top so daylight opens past it.
const LOCAL_Y_MAX = HEIGHT_WORLD + 1.6
// The ladder itself ends at the grassy top ledge (the climb goal).
const LADDER_TOP = HEIGHT_WORLD
const LANE_HALF = ((CLIMB_LANES - 1) / 2) * CLIMB_LANE_WORLD_DX
const RAIL_X = LANE_HALF + 0.4
const WALL_HALF_W = RAIL_X + 1.1

function lcg(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function add(
  group: THREE.Group,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  geos.push(geo)
  mats.push(mat)
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  group.add(m)
  return m
}

// The rock face BEHIND the ladder, dressed with NON-periodic features (ledges,
// moss, vines, a torch) so the climb visibly scrolls — a uniform ladder alone
// reads as static because each tap advances exactly one rung.
function buildRockFace(
  ladder: THREE.Group,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): void {
  const span = LOCAL_Y_MAX - LOCAL_Y_MIN
  const centerY = (LOCAL_Y_MIN + LOCAL_Y_MAX) / 2

  // Base wall slab (vertex-coloured strata) at the back.
  const wallGeo = new THREE.BoxGeometry(WALL_HALF_W * 2, span, 0.5, 1, 24, 1)
  const wpos = wallGeo.attributes.position as THREE.BufferAttribute
  const wcol = new Float32Array(wpos.count * 3)
  const cA = new THREE.Color(ROCK_COLOR)
  const cB = new THREE.Color(ROCK_DARK)
  const cC = new THREE.Color(ROCK_LIGHT)
  for (let i = 0; i < wpos.count; i++) {
    const band = Math.sin(wpos.getY(i) * 1.7) * 0.5 + 0.5
    const c = band < 0.33 ? cB : band < 0.66 ? cA : cC
    wcol[i * 3] = c.r
    wcol[i * 3 + 1] = c.g
    wcol[i * 3 + 2] = c.b
  }
  wallGeo.setAttribute('color', new THREE.BufferAttribute(wcol, 3))
  // Emissive lift so the camera-facing wall isn't black in the dim climb framing.
  const wallMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x363023 })
  add(ladder, wallGeo, wallMat, geos, mats, 0, centerY, -0.55)

  // Shared materials for the scattered features (kept few for draw calls).
  const ledgeMat = new THREE.MeshLambertMaterial({ color: ROCK_LIGHT, flatShading: true })
  const mossMat = new THREE.MeshLambertMaterial({ color: MOSS_COLOR, flatShading: true })
  const vineMat = new THREE.MeshLambertMaterial({ color: VINE_COLOR })
  const leafMat = new THREE.MeshLambertMaterial({ color: LEAF_COLOR, flatShading: true })
  mats.push(ledgeMat, mossMat, vineMat, leafMat)

  const rnd = lcg(20260609)
  // Jutting ledges + moss patches at irregular heights → obvious vertical motion.
  for (let y = LOCAL_Y_MIN + 1; y < LOCAL_Y_MAX - 1; y += 0.6 + rnd() * 0.9) {
    const side = rnd() < 0.5 ? -1 : 1
    const x = side * (RAIL_X + 0.35 + rnd() * 0.5)
    if (rnd() < 0.6) {
      const w = 0.5 + rnd() * 0.7
      const lg = new THREE.BoxGeometry(w, 0.18 + rnd() * 0.14, 0.5)
      geos.push(lg)
      const ledge = new THREE.Mesh(lg, ledgeMat)
      ledge.position.set(x, y, -0.3)
      ledge.rotation.z = (rnd() - 0.5) * 0.2
      ladder.add(ledge)
      // moss cap on the ledge
      const mg = new THREE.BoxGeometry(w * 0.8, 0.07, 0.45)
      geos.push(mg)
      const moss = new THREE.Mesh(mg, mossMat)
      moss.position.set(x, y + 0.12, -0.28)
      ladder.add(moss)
    } else {
      const s = 0.2 + rnd() * 0.35
      const mg = new THREE.BoxGeometry(s, s, 0.12)
      geos.push(mg)
      const moss = new THREE.Mesh(mg, mossMat)
      moss.position.set(x, y, -0.28)
      ladder.add(moss)
    }
  }

  // A couple of hanging vines with leaves.
  for (let v = 0; v < 3; v++) {
    const x = (rnd() - 0.5) * (RAIL_X * 1.6)
    const top = LOCAL_Y_MIN + 2 + rnd() * (span - 5)
    const len = 1.5 + rnd() * 2.5
    const vg = new THREE.BoxGeometry(0.05, len, 0.05)
    geos.push(vg)
    const vine = new THREE.Mesh(vg, vineMat)
    vine.position.set(x, top - len / 2, -0.26)
    ladder.add(vine)
    for (let l = 0; l < 4; l++) {
      const lg = new THREE.BoxGeometry(0.16, 0.05, 0.1)
      geos.push(lg)
      const leaf = new THREE.Mesh(lg, leafMat)
      leaf.position.set(x + (l % 2 ? 0.1 : -0.1), top - 0.3 - l * (len / 4), -0.25)
      ladder.add(leaf)
    }
  }

  // A wall torch (warm point of interest that scrolls by).
  const torchY = LOCAL_Y_MIN + 4 + rnd() * (span - 8)
  const tx = RAIL_X + 0.5
  add(ladder, new THREE.BoxGeometry(0.08, 0.5, 0.08), new THREE.MeshLambertMaterial({ color: TORCH_WOOD }), geos, mats, tx, torchY, -0.2)
  const flameMat = new THREE.MeshBasicMaterial({ color: TORCH_FLAME })
  mats.push(flameMat)
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), flameMat)
  geos.push(flame.geometry)
  flame.position.set(tx, torchY + 0.35, -0.2)
  ladder.add(flame)

  // Top exit ledge — the grassy goal scrolls into view as the climb completes.
  const exitMat = new THREE.MeshLambertMaterial({ color: LEDGE_GRASS, flatShading: true })
  add(ladder, new THREE.BoxGeometry(WALL_HALF_W * 2, 0.4, 1.4), exitMat, geos, mats, 0, HEIGHT_WORLD + 0.2, -0.1)
}

export function createClimbView(scene: THREE.Scene): ClimbView {
  const geos: THREE.BufferGeometry[] = []
  const mats: THREE.Material[] = []
  const root = new THREE.Group()
  root.visible = false

  const ladder = new THREE.Group()
  buildRockFace(ladder, geos, mats)

  // Rails + rungs in front of the rock face — they end at the grassy top ledge.
  const ladderSpan = LADDER_TOP - LOCAL_Y_MIN
  const ladderCenter = (LOCAL_Y_MIN + LADDER_TOP) / 2
  const railGeo = new THREE.BoxGeometry(0.14, ladderSpan, 0.14)
  const railMat = new THREE.MeshLambertMaterial({ color: WOOD_RAIL })
  geos.push(railGeo)
  mats.push(railMat)
  for (const sx of [-RAIL_X, RAIL_X]) {
    const rail = new THREE.Mesh(railGeo, railMat)
    rail.position.set(sx, ladderCenter, 0)
    ladder.add(rail)
  }
  const rungGeo = new THREE.BoxGeometry(RAIL_X * 2, 0.1, 0.12)
  const rungMat = new THREE.MeshLambertMaterial({ color: WOOD_RUNG })
  geos.push(rungGeo)
  mats.push(rungMat)
  const rungCount = Math.ceil(ladderSpan / RUNG_SPACING)
  for (let i = 0; i <= rungCount; i++) {
    const rung = new THREE.Mesh(rungGeo, rungMat)
    rung.position.set(0, LOCAL_Y_MIN + i * RUNG_SPACING, 0)
    ladder.add(rung)
  }
  root.add(ladder)

  scene.add(root)
  return { root, ladder, scene, geos, mats }
}

export function updateClimbView(view: ClimbView, state: GameState): void {
  // Visible throughout the climb, including the death-pause of a mid-climb hit.
  const inClimb = state.climb.active && state.phase !== 'finished' && state.phase !== 'gameover'
  if (!inClimb) {
    view.root.visible = false
    return
  }
  const c = state.climb
  view.root.visible = true

  const gx = toWorldX(c.gapCenter)
  const gz = toWorldZ(c.gateTrackY)
  const scrollY = c.progress * CLIMB_WORLD_PER_PX

  // Slide the whole ladder + rock face down as the player climbs.
  view.ladder.position.set(gx, CLIMB_PLAYER_WORLD_Y - scrollY, gz)
}

export function disposeClimbView(view: ClimbView): void {
  view.scene.remove(view.root)
  for (const g of view.geos) g.dispose()
  for (const m of view.mats) m.dispose()
}
