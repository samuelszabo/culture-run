/*
 * Tokyo night — dense neon-lit city environment for the Japan level.
 * Scenery only; no game-logic imports.
 */
import * as THREE from 'three'
import {
  ROAD_WORLD_WIDTH,
  TRACK_Z_START,
  TRACK_LENGTH_WORLD,
  TRACK_Z_CENTER,
  toWorldZ,
} from '../world'
import { TREE_DENSITY } from '../quality'

const ROAD_HALF = ROAD_WORLD_WIDTH / 2

const NEON_PALETTE: number[] = [0xff2d95, 0x00e5ff, 0xff00ff, 0xffe600, 0x39ff14, 0xbf00ff]
const BUILDING_DARKS: number[] = [0x080810, 0x0a0a14, 0x0c0c1a, 0x0b0b16]

interface WinPos {
  x: number
  y: number
  z: number
}

function makeLCG(seed: number): () => number {
  let s = seed
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Road surface ─────────────────────────────────────────────────────────────

function buildRoad(parent: THREE.Object3D): void {
  const roadGeo = new THREE.BoxGeometry(ROAD_WORLD_WIDTH + 0.4, 0.18, TRACK_LENGTH_WORLD)
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x0d0d18 })
  const road = new THREE.Mesh(roadGeo, roadMat)
  road.position.set(0, -0.09, TRACK_Z_CENTER)
  parent.add(road)

  const groundGeo = new THREE.PlaneGeometry(200, TRACK_LENGTH_WORLD + 20)
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x06060e })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, -0.2, TRACK_Z_CENTER)
  parent.add(ground)

  const dashSpacing = 2.4
  const dashCount = Math.floor(TRACK_LENGTH_WORLD / dashSpacing)
  const dashGeo = new THREE.BoxGeometry(0.06, 0.02, 1.0)
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffe600 })
  const dashMesh = new THREE.InstancedMesh(dashGeo, dashMat, dashCount)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < dashCount; i++) {
    dummy.position.set(0, 0.01, TRACK_Z_START - i * dashSpacing - dashSpacing / 2)
    dummy.updateMatrix()
    dashMesh.setMatrixAt(i, dummy.matrix)
  }
  dashMesh.instanceMatrix.needsUpdate = true
  parent.add(dashMesh)
}

// ─── Near city buildings with neon windows ────────────────────────────────────

function buildCityBuildings(parent: THREE.Object3D): void {
  const rng = makeLCG(2025)
  const winRng = makeLCG(3141)
  const buildingCount = Math.max(1, Math.round(88 * TREE_DENSITY))

  const windowsByColor: WinPos[][] = NEON_PALETTE.map(() => [])
  const winGeo = new THREE.BoxGeometry(0.05, 0.28, 0.28)
  const dummy = new THREE.Object3D()

  for (let i = 0; i < buildingCount; i++) {
    const side = i % 2 === 0 ? 1 : -1
    const bw = 1.5 + rng() * 3.0
    const offset = bw / 2 + 0.5 + rng() * 9.0
    const bx = side * (ROAD_HALF + offset)
    const bz =
      TRACK_Z_START -
      (i / buildingCount) * TRACK_LENGTH_WORLD -
      rng() * (TRACK_LENGTH_WORLD / buildingCount) * 0.4
    const bh = 6 + rng() * 22
    const bd = 3.0 + rng() * 6.0

    const bodyGeo = new THREE.BoxGeometry(bw, bh, bd)
    const bodyMat = new THREE.MeshLambertMaterial({
      color: BUILDING_DARKS[Math.floor(rng() * BUILDING_DARKS.length)],
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(bx, bh / 2, bz)
    parent.add(body)

    const faceX = bx - side * (bw / 2 + 0.04)
    const colorIdx = Math.floor(winRng() * NEON_PALETTE.length)
    const rows = Math.max(2, Math.floor(bh / 1.8))
    const cols = Math.max(1, Math.floor(bd / 1.5))
    const rowSpacing = bh / (rows + 1)
    const colSpacing = bd / (cols + 1)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (winRng() < 0.65) {
          windowsByColor[colorIdx].push({
            x: faceX,
            y: rowSpacing * (r + 1),
            z: bz - bd / 2 + colSpacing * (c + 1),
          })
        }
      }
    }

    if (rng() > 0.45) {
      const signColor = NEON_PALETTE[Math.floor(rng() * NEON_PALETTE.length)]
      const signH = 0.35 + rng() * 0.5
      const signW = bd * (0.4 + rng() * 0.5)
      const signGeo = new THREE.BoxGeometry(0.1, signH, signW)
      const signMat = new THREE.MeshBasicMaterial({ color: signColor })
      const sign = new THREE.Mesh(signGeo, signMat)
      sign.position.set(faceX, bh * (0.3 + rng() * 0.55), bz)
      parent.add(sign)
    }
  }

  for (let ci = 0; ci < NEON_PALETTE.length; ci++) {
    const positions = windowsByColor[ci]
    if (positions.length === 0) continue
    const mat = new THREE.MeshBasicMaterial({ color: NEON_PALETTE[ci] })
    const im = new THREE.InstancedMesh(winGeo, mat, positions.length)
    for (let j = 0; j < positions.length; j++) {
      dummy.position.set(positions[j].x, positions[j].y, positions[j].z)
      dummy.updateMatrix()
      im.setMatrixAt(j, dummy.matrix)
    }
    im.instanceMatrix.needsUpdate = true
    parent.add(im)
  }
}

// ─── Distant skyline silhouette band ──────────────────────────────────────────

function buildDistantSkyline(parent: THREE.Object3D): void {
  const rng = makeLCG(777)
  const count = Math.max(1, Math.round(110 * TREE_DENSITY))
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x050510 })
  const winGeo = new THREE.BoxGeometry(0.06, 0.24, 0.24)
  const dummy = new THREE.Object3D()
  const windowsByColor: WinPos[][] = NEON_PALETTE.map(() => [])

  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const dist = 16 + rng() * 50
    const bx = side * (ROAD_HALF + dist)
    const bz = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const bw = 1.0 + rng() * 2.5
    const bh = 8 + rng() * 28
    const bd = 2.0 + rng() * 5.0

    const geo = new THREE.BoxGeometry(bw, bh, bd)
    const mesh = new THREE.Mesh(geo, darkMat)
    mesh.position.set(bx, -0.1 + bh / 2, bz)
    parent.add(mesh)

    const winCount = Math.floor(rng() * 5) + 1
    const ci = Math.floor(rng() * NEON_PALETTE.length)
    const faceX = bx - side * (bw / 2 + 0.04)
    for (let w = 0; w < winCount; w++) {
      windowsByColor[ci].push({
        x: faceX,
        y: rng() * bh * 0.8 + bh * 0.1,
        z: bz + (rng() - 0.5) * bd * 0.8,
      })
    }
  }

  for (let ci = 0; ci < NEON_PALETTE.length; ci++) {
    const positions = windowsByColor[ci]
    if (positions.length === 0) continue
    const mat = new THREE.MeshBasicMaterial({ color: NEON_PALETTE[ci] })
    const im = new THREE.InstancedMesh(winGeo, mat, positions.length)
    for (let j = 0; j < positions.length; j++) {
      dummy.position.set(positions[j].x, positions[j].y, positions[j].z)
      dummy.updateMatrix()
      im.setMatrixAt(j, dummy.matrix)
    }
    im.instanceMatrix.needsUpdate = true
    parent.add(im)
  }
}

// ─── Street lamps ─────────────────────────────────────────────────────────────

function buildStreetLamps(parent: THREE.Object3D): void {
  const lampSpacing = 6.0
  const lampCount = Math.floor(TRACK_LENGTH_WORLD / lampSpacing)
  const totalLamps = lampCount * 2

  const poleGeo = new THREE.BoxGeometry(0.08, 2.4, 0.08)
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e })
  const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, totalLamps)

  const headGeo = new THREE.SphereGeometry(0.14, 5, 4)
  const headMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff })
  const headMesh = new THREE.InstancedMesh(headGeo, headMat, totalLamps)

  const dummy = new THREE.Object3D()
  const LAMP_X = ROAD_HALF + 0.4
  let idx = 0

  for (let i = 0; i < lampCount; i++) {
    const z = TRACK_Z_START - i * lampSpacing - lampSpacing / 2
    for (const lx of [-LAMP_X, LAMP_X]) {
      dummy.position.set(lx, 1.2, z)
      dummy.updateMatrix()
      poleMesh.setMatrixAt(idx, dummy.matrix)
      dummy.position.set(lx, 2.52, z)
      dummy.updateMatrix()
      headMesh.setMatrixAt(idx, dummy.matrix)
      idx++
    }
  }

  poleMesh.instanceMatrix.needsUpdate = true
  headMesh.instanceMatrix.needsUpdate = true
  parent.add(poleMesh)
  parent.add(headMesh)
}

// ─── Large glowing billboards ─────────────────────────────────────────────────

function buildBillboards(parent: THREE.Object3D): void {
  const rng = makeLCG(555)
  const trackYs = [2000, 5000, 8500, 12000, 15500, 18500]

  for (const ty of trackYs) {
    const z = toWorldZ(ty)
    const side = rng() > 0.5 ? 1 : -1
    const bx = side * (ROAD_HALF + 4.0 + rng() * 4.0)
    const bh = 2.0 + rng() * 3.0
    const bw = bh * (1.5 + rng() * 0.8)
    const color = NEON_PALETTE[Math.floor(rng() * NEON_PALETTE.length)]

    const poleGeo = new THREE.BoxGeometry(0.12, 4.0, 0.12)
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(bx, 2.0, z)
    parent.add(pole)

    const boardGeo = new THREE.BoxGeometry(0.15, bh, bw)
    const boardMat = new THREE.MeshBasicMaterial({ color })
    const board = new THREE.Mesh(boardGeo, boardMat)
    board.position.set(bx, 4.0 + bh / 2, z)
    parent.add(board)
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildTokyoNeonEnvironment(parent: THREE.Object3D): void {
  buildRoad(parent)
  buildDistantSkyline(parent)
  buildCityBuildings(parent)
  buildStreetLamps(parent)
  buildBillboards(parent)
}
