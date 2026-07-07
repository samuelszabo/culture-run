/*
 * Egypt desert — sunny daytime environment for the pyramids level.
 * Static scenery only; no game-logic imports. The sky/fog/lighting live in
 * scene.ts (warm desert noon); here we only build meshes: a sandstone track,
 * great pyramids, the Sphinx, obelisks, palms and low distant dunes. Landmarks
 * are placed near their trigger track positions so captions line up.
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

const SAND_ROAD = 0xd9c08a
const SAND_GROUND = 0xe3caa0
const STONE_LIGHT = 0xcaa96a
const STONE_SUNLIT = 0xd8b877
const STONE_DARK = 0xb2915a
const PALM_TRUNK = 0x8a6a3a
const PALM_FROND = 0x4f7a2e

function makeLCG(seed: number): () => number {
  let s = seed
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Track surface + desert floor ─────────────────────────────────────────────

function buildRoad(parent: THREE.Object3D): void {
  const roadGeo = new THREE.BoxGeometry(ROAD_WORLD_WIDTH + 0.4, 0.18, TRACK_LENGTH_WORLD)
  const roadMat = new THREE.MeshLambertMaterial({ color: SAND_ROAD })
  const road = new THREE.Mesh(roadGeo, roadMat)
  road.position.set(0, -0.09, TRACK_Z_CENTER)
  parent.add(road)

  const groundGeo = new THREE.PlaneGeometry(240, TRACK_LENGTH_WORLD + 40)
  const groundMat = new THREE.MeshLambertMaterial({ color: SAND_GROUND })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, -0.2, TRACK_Z_CENTER)
  parent.add(ground)

  const edgeGeo = new THREE.BoxGeometry(0.12, 0.02, TRACK_LENGTH_WORLD)
  const edgeMat = new THREE.MeshLambertMaterial({ color: STONE_DARK })
  for (const ex of [-ROAD_HALF, ROAD_HALF]) {
    const edge = new THREE.Mesh(edgeGeo, edgeMat)
    edge.position.set(ex, 0.01, TRACK_Z_CENTER)
    parent.add(edge)
  }
}

// ─── Pyramids (4-sided cones) set back off the track ──────────────────────────

function makePyramid(size: number, height: number): THREE.Group {
  const group = new THREE.Group()
  const geo = new THREE.ConeGeometry(size, height, 4)
  const litMat = new THREE.MeshLambertMaterial({ color: STONE_SUNLIT, flatShading: true })
  const shadeMat = new THREE.MeshLambertMaterial({ color: STONE_LIGHT, flatShading: true })
  const base = new THREE.Mesh(geo, shadeMat)
  base.position.y = height / 2
  base.rotation.y = Math.PI / 4
  group.add(base)

  const capGeo = new THREE.ConeGeometry(size * 0.18, height * 0.16, 4)
  const cap = new THREE.Mesh(capGeo, litMat)
  cap.position.y = height - height * 0.08
  cap.rotation.y = Math.PI / 4
  group.add(cap)
  return group
}

function buildPyramids(parent: THREE.Object3D): void {
  const rng = makeLCG(0xa1121)

  const cluster: Array<[number, number, number]> = [
    [-ROAD_HALF - 9, 7.5, toWorldZ(4200)],
    [-ROAD_HALF - 20, 11, toWorldZ(3400)],
    [ROAD_HALF + 12, 6, toWorldZ(3900)],
  ]
  for (const [x, h, z] of cluster) {
    const p = makePyramid(h * 0.95, h)
    p.position.set(x, -0.2, z)
    parent.add(p)
  }

  const scatter = Math.max(4, Math.round(10 * TREE_DENSITY))
  for (let i = 0; i < scatter; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const dist = 14 + rng() * 40
    const x = side * (ROAD_HALF + dist)
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const h = 4 + rng() * 9
    const p = makePyramid(h * 0.95, h)
    p.position.set(x, -0.2, z)
    parent.add(p)
  }
}

// ─── Sphinx beside the track ──────────────────────────────────────────────────

function buildSphinx(parent: THREE.Object3D): void {
  const group = new THREE.Group()
  const stoneMat = new THREE.MeshLambertMaterial({ color: STONE_LIGHT, flatShading: true })
  const headdressMat = new THREE.MeshLambertMaterial({ color: 0xb98e46, flatShading: true })

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 9.5), stoneMat)
  body.position.set(0, 0.8, 0)
  group.add(body)

  const chest = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 2.2), stoneMat)
  chest.position.set(0, 1.0, -4.0)
  group.add(chest)

  const pawGeo = new THREE.BoxGeometry(0.8, 0.8, 3.0)
  for (const px of [-1.0, 1.0]) {
    const paw = new THREE.Mesh(pawGeo, stoneMat)
    paw.position.set(px, 0.4, -5.4)
    group.add(paw)
  }

  const neck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.2), stoneMat)
  neck.position.set(0, 2.6, -4.4)
  group.add(neck)

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), stoneMat)
  head.position.set(0, 3.7, -4.6)
  group.add(head)

  const headdress = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 1.4), headdressMat)
  headdress.position.set(0, 3.9, -4.0)
  group.add(headdress)

  const face = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.3), stoneMat)
  face.position.set(0, 3.6, -5.55)
  group.add(face)

  group.position.set(-ROAD_HALF - 8.5, -0.2, toWorldZ(10000))
  group.rotation.y = 0.5
  parent.add(group)
}

// ─── Obelisks (tapered columns with a pyramidion cap) ─────────────────────────

function makeObelisk(height: number): THREE.Group {
  const group = new THREE.Group()
  const shaftMat = new THREE.MeshLambertMaterial({ color: 0xc39a58, flatShading: true })
  const capMat = new THREE.MeshLambertMaterial({ color: 0xe8c06a, flatShading: true })

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.05, height * 0.09, height, 4), shaftMat)
  shaft.position.y = height / 2
  shaft.rotation.y = Math.PI / 4
  group.add(shaft)

  const cap = new THREE.Mesh(new THREE.ConeGeometry(height * 0.07, height * 0.14, 4), capMat)
  cap.position.y = height + height * 0.05
  cap.rotation.y = Math.PI / 4
  group.add(cap)
  return group
}

function buildObelisks(parent: THREE.Object3D): void {
  const rng = makeLCG(0xb2233)

  for (const side of [-1, 1]) {
    const o = makeObelisk(7)
    o.position.set(side * (ROAD_HALF + 4.5), -0.2, toWorldZ(15500))
    parent.add(o)
  }

  const scatter = Math.max(2, Math.round(5 * TREE_DENSITY))
  for (let i = 0; i < scatter; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const x = side * (ROAD_HALF + 6 + rng() * 20)
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const o = makeObelisk(4 + rng() * 4)
    o.position.set(x, -0.2, z)
    parent.add(o)
  }
}

// ─── Palm trees along both sides ──────────────────────────────────────────────

function buildPalms(parent: THREE.Object3D): void {
  const rng = makeLCG(0xc3344)
  const count = Math.max(6, Math.round(60 * TREE_DENSITY))

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 2.4, 6)
  const trunkMat = new THREE.MeshLambertMaterial({ color: PALM_TRUNK })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, count)

  const frondGeo = new THREE.BoxGeometry(1.8, 0.08, 0.5)
  const frondMat = new THREE.MeshLambertMaterial({ color: PALM_FROND })
  const frondMesh = new THREE.InstancedMesh(frondGeo, frondMat, count * 5)

  const dummy = new THREE.Object3D()
  let fi = 0
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? 1 : -1
    const x = side * (ROAD_HALF + 1.6 + rng() * 16)
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const scale = 0.8 + rng() * 0.7

    dummy.position.set(x, 1.2 * scale - 0.2, z)
    dummy.scale.setScalar(scale)
    dummy.rotation.set(0, rng() * Math.PI, 0)
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)

    const topY = 2.4 * scale - 0.2
    for (let f = 0; f < 5; f++) {
      const a = (f / 5) * Math.PI * 2 + rng() * 0.3
      dummy.position.set(x + Math.cos(a) * 0.7 * scale, topY, z + Math.sin(a) * 0.7 * scale)
      dummy.scale.setScalar(scale)
      dummy.rotation.set(0.35, a, 0)
      dummy.updateMatrix()
      frondMesh.setMatrixAt(fi++, dummy.matrix)
    }
  }
  trunkMesh.instanceMatrix.needsUpdate = true
  frondMesh.count = fi
  frondMesh.instanceMatrix.needsUpdate = true
  parent.add(trunkMesh)
  parent.add(frondMesh)
}

// ─── Low distant dunes for depth ──────────────────────────────────────────────

function buildDunes(parent: THREE.Object3D): void {
  const rng = makeLCG(0xd4455)
  const count = Math.max(6, Math.round(28 * TREE_DENSITY))

  const duneGeo = new THREE.SphereGeometry(6, 8, 5)
  const duneMat = new THREE.MeshLambertMaterial({ color: 0xd6bd8e, flatShading: true })
  const duneMesh = new THREE.InstancedMesh(duneGeo, duneMat, count)
  const dummy = new THREE.Object3D()

  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const x = side * (ROAD_HALF + 30 + rng() * 60)
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    dummy.position.set(x, -3.5 - rng() * 2, z)
    dummy.scale.set(1.5 + rng() * 2.5, 0.4 + rng() * 0.3, 1.5 + rng() * 2.5)
    dummy.rotation.set(0, rng() * Math.PI, 0)
    dummy.updateMatrix()
    duneMesh.setMatrixAt(i, dummy.matrix)
  }
  duneMesh.instanceMatrix.needsUpdate = true
  parent.add(duneMesh)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildEgyptPyramidsEnvironment(parent: THREE.Object3D): void {
  buildRoad(parent)
  buildDunes(parent)
  buildPyramids(parent)
  buildSphinx(parent)
  buildObelisks(parent)
  buildPalms(parent)
}
