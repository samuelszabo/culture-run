import * as THREE from 'three'
import {
  ROAD_WORLD_WIDTH,
  TRACK_LENGTH_WORLD,
  TRACK_Z_CENTER,
} from '../world'

// NOTE: placeholder scenery. The full Slovenský raj environment (gorge cliffs,
// ladders set into the gates, waterfall, dense forest, Tomášovský výhľad
// landmark) is built by a follow-up pass. This keeps the level playable.

const PATH_COLOR = 0x8a7a5a
const TERRAIN_COLOR = 0x3f6b2f

const DECK_WIDTH = ROAD_WORLD_WIDTH + 0.4

function buildPath(parent: THREE.Object3D): void {
  const geo = new THREE.BoxGeometry(DECK_WIDTH, 0.18, TRACK_LENGTH_WORLD)
  const mat = new THREE.MeshLambertMaterial({ color: PATH_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, -0.09, TRACK_Z_CENTER)
  parent.add(mesh)
}

function buildTerrain(parent: THREE.Object3D): void {
  const geo = new THREE.PlaneGeometry(160, TRACK_LENGTH_WORLD + 40)
  const mat = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(0, -1.2, TRACK_Z_CENTER)
  parent.add(mesh)
}

export function buildSlovakParadiseEnvironment(parent: THREE.Object3D): void {
  buildPath(parent)
  buildTerrain(parent)
}
