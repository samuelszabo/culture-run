import * as THREE from 'three'
import {
  UNIT,
  ROAD_WORLD_WIDTH,
  TRACK_Z_START,
  TRACK_LENGTH_WORLD,
  TRACK_Z_CENTER,
} from '../world'
import { TREE_DENSITY } from '../quality'
import { getLevel } from '../../levels/registry'

const STONE_COLOR = 0xc8b89a
const SEAM_COLOR = 0x9a8c78
const RAILING_COLOR = 0xb0a090
const POST_COLOR = 0xc0b0a0
const TERRAIN_COLOR = 0x4a8a3a
const TREE_TRUNK_COLOR = 0x6b4226
const TREE_FOLIAGE_COLOR = 0x2d7a2d
const LANTERN_RED = 0xdd2222
const LANTERN_GOLD = 0xffd060
const TOWER_STONE = 0xa09888
const TOWER_DARK = 0x7a7060
const MOUNTAIN_COLOR = 0x8aaa7a

const DECK_WIDTH = ROAD_WORLD_WIDTH + 0.4
const RAILING_X = ROAD_WORLD_WIDTH / 2 + 0.2 + 0.15

function buildDeck(parent: THREE.Object3D): void {
  const geo = new THREE.BoxGeometry(DECK_WIDTH, 0.18, TRACK_LENGTH_WORLD)
  const mat = new THREE.MeshLambertMaterial({ color: STONE_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, -0.09, TRACK_Z_CENTER)
  parent.add(mesh)
}

function buildSeams(parent: THREE.Object3D): void {
  const seamSpacing = 1.6
  const seamCount = Math.floor(TRACK_LENGTH_WORLD / seamSpacing)
  const geo = new THREE.BoxGeometry(DECK_WIDTH + 0.02, 0.025, 0.06)
  const mat = new THREE.MeshLambertMaterial({ color: SEAM_COLOR })
  const mesh = new THREE.InstancedMesh(geo, mat, seamCount)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < seamCount; i++) {
    const z = TRACK_Z_START - i * seamSpacing - seamSpacing / 2
    dummy.position.set(0, 0.0, z)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  parent.add(mesh)
}

function buildRailings(parent: THREE.Object3D): void {
  const wallGeo = new THREE.BoxGeometry(0.3, 0.55, TRACK_LENGTH_WORLD)
  const wallMat = new THREE.MeshLambertMaterial({ color: RAILING_COLOR })

  const leftWall = new THREE.Mesh(wallGeo, wallMat)
  leftWall.position.set(-RAILING_X, 0.275, TRACK_Z_CENTER)
  parent.add(leftWall)

  const rightWall = new THREE.Mesh(wallGeo, wallMat)
  rightWall.position.set(RAILING_X, 0.275, TRACK_Z_CENTER)
  parent.add(rightWall)
}

function buildPosts(parent: THREE.Object3D): void {
  const postSpacing = 2.4
  const postCount = Math.floor(TRACK_LENGTH_WORLD / postSpacing)
  const totalPosts = postCount * 2
  const geo = new THREE.BoxGeometry(0.22, 0.85, 0.22)
  const mat = new THREE.MeshLambertMaterial({ color: POST_COLOR })
  const mesh = new THREE.InstancedMesh(geo, mat, totalPosts)
  const dummy = new THREE.Object3D()
  let idx = 0
  for (let i = 0; i < postCount; i++) {
    const z = TRACK_Z_START - i * postSpacing - postSpacing / 2
    dummy.position.set(-RAILING_X, 0.425, z)
    dummy.updateMatrix()
    mesh.setMatrixAt(idx++, dummy.matrix)
    dummy.position.set(RAILING_X, 0.425, z)
    dummy.updateMatrix()
    mesh.setMatrixAt(idx++, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  parent.add(mesh)
}

function buildLanterns(parent: THREE.Object3D): void {
  const lanternSpacing = 8
  const lanternCount = Math.floor(TRACK_LENGTH_WORLD / lanternSpacing)

  const sphereGeo = new THREE.SphereGeometry(0.22, 6, 5)
  const sphereMat = new THREE.MeshLambertMaterial({ color: LANTERN_RED, flatShading: true })
  const sphereMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, lanternCount)

  const bandGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.07, 6)
  const bandMat = new THREE.MeshLambertMaterial({ color: LANTERN_GOLD, flatShading: true })
  const bandMesh = new THREE.InstancedMesh(bandGeo, bandMat, lanternCount)

  const dummy = new THREE.Object3D()
  for (let i = 0; i < lanternCount; i++) {
    const z = TRACK_Z_START - i * lanternSpacing - lanternSpacing / 2
    const side = i % 2 === 0 ? -RAILING_X : RAILING_X
    dummy.position.set(side, 1.05, z)
    dummy.updateMatrix()
    sphereMesh.setMatrixAt(i, dummy.matrix)
    bandMesh.setMatrixAt(i, dummy.matrix)
  }
  sphereMesh.instanceMatrix.needsUpdate = true
  bandMesh.instanceMatrix.needsUpdate = true
  parent.add(sphereMesh)
  parent.add(bandMesh)
}

function buildTerrain(parent: THREE.Object3D): void {
  const geo = new THREE.PlaneGeometry(160, TRACK_LENGTH_WORLD + 40)
  const mat = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(0, -1.2, TRACK_Z_CENTER)
  parent.add(mesh)

  const hillDefs = [
    { x: -17, z: -60,  rx: 7, ry: 3.5, rz: 12 },
    { x:  19, z: -140, rx: 8, ry: 4,   rz: 14 },
    { x: -18, z: -220, rx: 7, ry: 3,   rz: 11 },
    { x:  18, z: -300, rx: 7, ry: 4.5, rz: 13 },
    { x: -17, z: -370, rx: 7, ry: 3.2, rz: 10 },
  ]
  const hillMat = new THREE.MeshLambertMaterial({ color: 0x3d7a30, flatShading: true })
  for (const h of hillDefs) {
    const hGeo = new THREE.SphereGeometry(1, 6, 4)
    const hMesh = new THREE.Mesh(hGeo, hillMat)
    hMesh.scale.set(h.rx, h.ry, h.rz)
    hMesh.position.set(h.x, -1.2 + h.ry * 0.3, h.z)
    parent.add(hMesh)
  }
}

function buildTrees(parent: THREE.Object3D, density: number = 1.0): void {
  const treePositions: Array<{ x: number; z: number; s: number }> = []
  const rng = { v: 42 }
  function rand(): number {
    rng.v = (rng.v * 1664525 + 1013904223) & 0xffffffff
    return (rng.v >>> 0) / 0xffffffff
  }

  const treeSlots = Math.max(1, Math.round(80 * density))
  for (let iz = 0; iz < treeSlots; iz++) {
    const z = TRACK_Z_START - iz * (TRACK_LENGTH_WORLD / treeSlots) - 2
    const side = iz % 2 === 0 ? -1 : 1
    const x = side * (RAILING_X + 2.5 + rand() * 8)
    treePositions.push({ x, z, s: 0.7 + rand() * 0.7 })
    const x2 = -side * (RAILING_X + 2.5 + rand() * 10)
    treePositions.push({ x: x2, z: z - 2, s: 0.6 + rand() * 0.8 })
  }

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.9, 5)
  const trunkMat = new THREE.MeshLambertMaterial({ color: TREE_TRUNK_COLOR })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length)

  const foliageGeo = new THREE.ConeGeometry(0.75, 1.6, 5)
  const foliageMat = new THREE.MeshLambertMaterial({ color: TREE_FOLIAGE_COLOR, flatShading: true })
  const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, treePositions.length)

  const dummy = new THREE.Object3D()
  for (let i = 0; i < treePositions.length; i++) {
    const t = treePositions[i]
    dummy.position.set(t.x, -1.2 + 0.45 * t.s, t.z)
    dummy.scale.set(t.s, t.s, t.s)
    dummy.rotation.y = i * 1.3
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(t.x, -1.2 + 0.9 * t.s + 0.8 * t.s, t.z)
    dummy.updateMatrix()
    foliageMesh.setMatrixAt(i, dummy.matrix)
  }
  trunkMesh.instanceMatrix.needsUpdate = true
  foliageMesh.instanceMatrix.needsUpdate = true
  parent.add(trunkMesh)
  parent.add(foliageMesh)
}

function buildMountains(parent: THREE.Object3D): void {
  const mountainDefs = [
    { x: -18, z: -50, scale: 1.0 },
    { x: -24, z: -130, scale: 1.4 },
    { x: 20, z: -90, scale: 1.1 },
    { x: 26, z: -200, scale: 1.6 },
    { x: -16, z: -270, scale: 0.9 },
    { x: 22, z: -310, scale: 1.3 },
    { x: -22, z: -360, scale: 1.2 },
    { x: 18, z: -390, scale: 0.85 },
  ]
  const mat = new THREE.MeshLambertMaterial({ color: MOUNTAIN_COLOR, flatShading: true })
  for (const def of mountainDefs) {
    const geo = new THREE.ConeGeometry(4.5 * def.scale, 9 * def.scale, 5)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(def.x, 3 * def.scale - 1.2, def.z)
    parent.add(mesh)
  }
}

function buildMerlons(parent: THREE.Object3D): void {
  const merlonSpacing = 2.4
  const merlonCount = Math.floor(TRACK_LENGTH_WORLD / merlonSpacing)
  const totalMerlons = merlonCount * 2
  const geo = new THREE.BoxGeometry(0.28, 0.38, 0.28)
  const mat = new THREE.MeshLambertMaterial({ color: POST_COLOR })
  const mesh = new THREE.InstancedMesh(geo, mat, totalMerlons)
  const dummy = new THREE.Object3D()
  let idx = 0
  for (let i = 0; i < merlonCount; i++) {
    const z = TRACK_Z_START - i * merlonSpacing - merlonSpacing / 2
    dummy.position.set(-RAILING_X, 0.74, z)
    dummy.updateMatrix()
    mesh.setMatrixAt(idx++, dummy.matrix)
    dummy.position.set(RAILING_X, 0.74, z)
    dummy.updateMatrix()
    mesh.setMatrixAt(idx++, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  parent.add(mesh)
}

function buildWatchtower(parent: THREE.Object3D, x: number, z: number): void {
  const baseGeo = new THREE.BoxGeometry(2.8, 3.2, 2.8)
  const baseMat = new THREE.MeshLambertMaterial({ color: TOWER_STONE })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.set(x, 1.6, z)
  parent.add(base)

  const overhangGeo = new THREE.BoxGeometry(3.4, 0.3, 3.4)
  const overhangMat = new THREE.MeshLambertMaterial({ color: TOWER_DARK })
  const overhang = new THREE.Mesh(overhangGeo, overhangMat)
  overhang.position.set(x, 3.35, z)
  parent.add(overhang)

  const parapet = [
    { dx: -1.2, dz: 0 },
    { dx: 1.2, dz: 0 },
    { dx: 0, dz: -1.2 },
    { dx: 0, dz: 1.2 },
  ]
  const merlonGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55)
  const merlonMat = new THREE.MeshLambertMaterial({ color: TOWER_STONE })
  for (const p of parapet) {
    const m = new THREE.Mesh(merlonGeo, merlonMat)
    m.position.set(x + p.dx, 3.78, z + p.dz)
    parent.add(m)
  }

  const archGeo = new THREE.BoxGeometry(0.7, 1.1, 0.4)
  const archMat = new THREE.MeshLambertMaterial({ color: TOWER_DARK })
  const arch = new THREE.Mesh(archGeo, archMat)
  arch.position.set(x, 0.95, z + 1.4)
  parent.add(arch)
}

function buildWatchtowers(parent: THREE.Object3D): void {
  buildWatchtower(parent, -10, -120)
  buildWatchtower(parent, 10, -250)
  buildWatchtower(parent, -10, -355)
}

function buildLandmarkWatchtower(parent: THREE.Object3D, x: number, z: number): void {
  const stoneMat = new THREE.MeshLambertMaterial({ color: TOWER_STONE })
  const darkMat = new THREE.MeshLambertMaterial({ color: TOWER_DARK })

  const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.0, 4.2), stoneMat)
  base.position.set(x, 2.5, z)
  parent.add(base)

  const overhang = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 5.2), darkMat)
  overhang.position.set(x, 5.2, z)
  parent.add(overhang)

  const top = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 4.4), stoneMat)
  top.position.set(x, 5.8, z)
  parent.add(top)

  const merlonOffsets = [
    { dx: -1.6, dz: -1.6 }, { dx: 0, dz: -1.6 }, { dx: 1.6, dz: -1.6 },
    { dx: -1.6, dz: 0 },                           { dx: 1.6, dz: 0 },
    { dx: -1.6, dz: 1.6 }, { dx: 0, dz: 1.6 },  { dx: 1.6, dz: 1.6 },
  ]
  const merlonGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7)
  for (const o of merlonOffsets) {
    const m = new THREE.Mesh(merlonGeo, stoneMat)
    m.position.set(x + o.dx, 6.75, z + o.dz)
    parent.add(m)
  }

  const archGeo = new THREE.BoxGeometry(1.1, 1.8, 0.5)
  const arch = new THREE.Mesh(archGeo, darkMat)
  arch.position.set(x, 1.4, z + 2.1)
  parent.add(arch)
}

function buildLandmarkPagoda(parent: THREE.Object3D, x: number, z: number): void {
  const redMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 })
  const goldMat = new THREE.MeshLambertMaterial({ color: 0xeebb00, flatShading: true })
  const goldMat2 = new THREE.MeshLambertMaterial({ color: 0xeebb00 })

  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.scale.setScalar(1.15)
  parent.add(group)

  const levels = 5
  for (let i = 0; i < levels; i++) {
    const w = 2.8 - i * 0.38
    const yBase = i * 1.15

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, w), redMat)
    body.position.set(0, yBase + 0.4, 0)
    group.add(body)

    const eaveW = w + 0.7
    const eave = new THREE.Mesh(new THREE.BoxGeometry(eaveW, 0.12, eaveW), goldMat)
    eave.position.set(0, yBase + 0.86, 0)
    group.add(eave)

    const roofGeo = new THREE.ConeGeometry((w + 0.4) / 2, 0.55, 4)
    const roof = new THREE.Mesh(roofGeo, goldMat)
    roof.rotation.y = Math.PI / 4
    roof.position.set(0, yBase + 0.86 + 0.06 + 0.275, 0)
    group.add(roof)
  }

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4), goldMat2)
  spire.position.set(0, levels * 1.15 + 0.4, 0)
  group.add(spire)
}

function buildOneLion(parent: THREE.Object3D, lx: number, z: number, withBall: boolean): void {
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xb0a888, flatShading: true })
  const darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x888070, flatShading: true })

  const group = new THREE.Group()
  group.position.set(lx, 0, z)
  group.scale.setScalar(1.6)
  parent.add(group)

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 1.1), darkStoneMat)
  pedestal.position.set(0, 0.375, 0)
  group.add(pedestal)

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.75, 1.3), stoneMat)
  body.position.set(0, 1.13, 0)
  group.add(body)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.65), stoneMat)
  head.position.set(0, 1.85, 0.2)
  group.add(head)

  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.3), darkStoneMat)
  mane.position.set(0, 1.8, 0.55)
  group.add(mane)

  if (withBall) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 5, 4), stoneMat)
    ball.position.set(-0.3, 0.8, 0.5)
    group.add(ball)
  }
}

function buildLandmarks(parent: THREE.Object3D): void {
  for (const lm of getLevel('china-wall').landmarks) {
    const worldZ = -lm.trackY / UNIT
    if (lm.id === 'watchtower') buildLandmarkWatchtower(parent, -7, worldZ)
    else if (lm.id === 'pagoda') buildLandmarkPagoda(parent, 6, worldZ)
    else {
      buildOneLion(parent, -4.6, worldZ, false)
      buildOneLion(parent, 4.6, worldZ, true)
    }
  }
}

export function buildChinaWallEnvironment(parent: THREE.Object3D): void {
  buildDeck(parent)
  buildSeams(parent)
  buildRailings(parent)
  buildPosts(parent)
  buildMerlons(parent)
  buildLanterns(parent)
  buildTerrain(parent)
  buildTrees(parent, TREE_DENSITY)
  buildMountains(parent)
  buildWatchtowers(parent)
  buildLandmarks(parent)
}
