import * as THREE from 'three'
import { CLIMB_HEIGHT, CLIMB_LANES, CLIMB_ROCK_POOL, GameState } from '../game/types'
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
  rocks: THREE.Mesh[]
  scene: THREE.Scene
  geos: THREE.BufferGeometry[]
  mats: THREE.Material[]
}

const WOOD_RAIL = 0x8b6340
const WOOD_RUNG = 0xa9744f
const ROCK_COLOR = 0x6b6258

// World height the full ladder spans, plus margins above/below the visible window.
const HEIGHT_WORLD = CLIMB_HEIGHT * CLIMB_WORLD_PER_PX
const RUNG_SPACING = 0.5
const LOCAL_Y_MIN = -3
const LOCAL_Y_MAX = HEIGHT_WORLD + 7
const LANE_HALF = ((CLIMB_LANES - 1) / 2) * CLIMB_LANE_WORLD_DX
const RAIL_X = LANE_HALF + 0.35

function laneWorldDX(lane: number): number {
  return (lane - (CLIMB_LANES - 1) / 2) * CLIMB_LANE_WORLD_DX
}

export function createClimbView(scene: THREE.Scene): ClimbView {
  const geos: THREE.BufferGeometry[] = []
  const mats: THREE.Material[] = []
  const root = new THREE.Group()
  root.visible = false

  // ── Ladder (rails + rungs), scrolled vertically by climb progress ──
  const ladder = new THREE.Group()
  const span = LOCAL_Y_MAX - LOCAL_Y_MIN
  const centerY = (LOCAL_Y_MIN + LOCAL_Y_MAX) / 2

  const railGeo = new THREE.BoxGeometry(0.12, span, 0.12)
  const railMat = new THREE.MeshLambertMaterial({ color: WOOD_RAIL })
  geos.push(railGeo)
  mats.push(railMat)
  for (const sx of [-RAIL_X, RAIL_X]) {
    const rail = new THREE.Mesh(railGeo, railMat)
    rail.position.set(sx, centerY, 0)
    ladder.add(rail)
  }

  const rungGeo = new THREE.BoxGeometry(RAIL_X * 2, 0.09, 0.1)
  const rungMat = new THREE.MeshLambertMaterial({ color: WOOD_RUNG })
  geos.push(rungGeo)
  mats.push(rungMat)
  const rungCount = Math.ceil(span / RUNG_SPACING)
  for (let i = 0; i <= rungCount; i++) {
    const rung = new THREE.Mesh(rungGeo, rungMat)
    rung.position.set(0, LOCAL_Y_MIN + i * RUNG_SPACING, 0)
    ladder.add(rung)
  }
  root.add(ladder)

  // ── Falling rock pool ──
  const rockGeo = new THREE.IcosahedronGeometry(0.26, 0)
  const rockMat = new THREE.MeshLambertMaterial({ color: ROCK_COLOR, flatShading: true })
  geos.push(rockGeo)
  mats.push(rockMat)
  const rocks: THREE.Mesh[] = []
  for (let i = 0; i < CLIMB_ROCK_POOL; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat)
    rock.visible = false
    root.add(rock)
    rocks.push(rock)
  }

  scene.add(root)
  return { root, ladder, rocks, scene, geos, mats }
}

export function updateClimbView(view: ClimbView, state: GameState): void {
  if (state.phase !== 'climbing') {
    view.root.visible = false
    return
  }
  const c = state.climb
  view.root.visible = true

  const gx = toWorldX(c.gapCenter)
  const gz = toWorldZ(c.gateTrackY)
  const scrollY = c.progress * CLIMB_WORLD_PER_PX

  // Slide the whole ladder down as the player climbs (player stays fixed in view).
  view.ladder.position.set(gx, CLIMB_PLAYER_WORLD_Y - scrollY, gz)

  for (let i = 0; i < view.rocks.length; i++) {
    const mesh = view.rocks[i]
    const r = c.rocks[i]
    if (!r || !r.active) {
      mesh.visible = false
      continue
    }
    mesh.visible = true
    mesh.position.set(
      gx + laneWorldDX(r.lane),
      CLIMB_PLAYER_WORLD_Y + (r.y - c.progress) * CLIMB_WORLD_PER_PX,
      gz + 0.18,
    )
    mesh.rotation.x = state.elapsed * 3 + i
    mesh.rotation.z = state.elapsed * 2 + i
  }
}

export function disposeClimbView(view: ClimbView): void {
  view.scene.remove(view.root)
  for (const g of view.geos) g.dispose()
  for (const m of view.mats) m.dispose()
}
