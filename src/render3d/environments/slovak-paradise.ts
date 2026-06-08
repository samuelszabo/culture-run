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

// ─── Palette ────────────────────────────────────────────────────────────────
const PATH_COLOR        = 0x8a7a5a   // earthy stone/dirt
const TERRAIN_COLOR     = 0x3f6b2f   // dark forest floor green
const CLIFF_COLOR_A     = 0x6b6258   // warm grey rock
const CLIFF_COLOR_B     = 0x5a5048   // darker rock crevice
const CLIFF_COLOR_C     = 0x7a6e63   // lighter rock face
const WATER_COLOR       = 0x6fa8c0   // gorge brook blue
const SPLASH_COLOR      = 0xd8eef5   // waterfall white-blue
const TRUNK_COLOR       = 0x4a3520   // dark conifer trunk
const FOLIAGE_COLOR_A   = 0x2f5d34   // deep pine green
const FOLIAGE_COLOR_B   = 0x35663a   // slightly lighter pine
const BOULDER_COLOR_A   = 0x7a7268
const BOULDER_COLOR_B   = 0x60584f
const MOUNTAIN_COLOR    = 0x6e8a7a   // cool grey-green
const LANDMARK_ROCK     = 0x6a6258
const LANDMARK_DARK     = 0x4e4840
const WOOD_COLOR        = 0x8b6340   // ladder/rung wood

const DECK_WIDTH  = ROAD_WORLD_WIDTH + 0.4
// Outside edge of the road (railing inner face) — scenery must start beyond this
const RAILING_X   = ROAD_WORLD_WIDTH / 2 + 0.35

// ─── 1. Path / ground strip ──────────────────────────────────────────────────
function buildPath(parent: THREE.Object3D): void {
  const geo = new THREE.BoxGeometry(DECK_WIDTH, 0.18, TRACK_LENGTH_WORLD)
  const mat = new THREE.MeshLambertMaterial({ color: PATH_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, -0.09, TRACK_Z_CENTER)
  parent.add(mesh)
}

// ─── 2. Ground terrain plane ─────────────────────────────────────────────────
function buildTerrain(parent: THREE.Object3D): void {
  const geo = new THREE.PlaneGeometry(160, TRACK_LENGTH_WORLD + 40)
  const mat = new THREE.MeshLambertMaterial({ color: TERRAIN_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(0, -1.3, TRACK_Z_CENTER)
  parent.add(mesh)
}

// ─── 3. Gorge cliff walls ─────────────────────────────────────────────────────
// A series of tall rock slabs along both sides of the track.
function buildCliffWalls(parent: THREE.Object3D): void {
  // Deterministic pseudo-RNG so we get the same cliffs every build
  let seed = 7
  function rng(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }

  const matA = new THREE.MeshLambertMaterial({ color: CLIFF_COLOR_A, flatShading: true })
  const matB = new THREE.MeshLambertMaterial({ color: CLIFF_COLOR_B, flatShading: true })
  const matC = new THREE.MeshLambertMaterial({ color: CLIFF_COLOR_C, flatShading: true })

  // Slab spacing along Z; use separate instanced meshes per colour for proper shading
  const slabSpacing = 1.8
  const countPerSide = Math.floor(TRACK_LENGTH_WORLD / slabSpacing)

  // We'll build three separate instanced meshes (one per colour variant)
  // Each slab alternates colour deterministically
  const slabsA: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }> = []
  const slabsB: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }> = []
  const slabsC: Array<{ x: number; y: number; z: number; sx: number; sy: number; sz: number }> = []

  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < countPerSide; i++) {
      const z = TRACK_Z_START - i * slabSpacing - slabSpacing / 2
      const height    = 4.0 + rng() * 4.0           // 4–8 units tall
      const depth     = slabSpacing * 0.95 + rng() * 0.1
      const width     = 0.9 + rng() * 0.6            // varied thickness
      const xOffset   = RAILING_X + width / 2 + rng() * 0.4
      const yOffset   = height / 2 - 0.2             // base flush with ground

      const slab = { x: side * xOffset, y: yOffset, z, sx: width, sy: height, sz: depth }
      const variant = Math.floor(rng() * 3)
      if (variant === 0) slabsA.push(slab)
      else if (variant === 1) slabsB.push(slab)
      else slabsC.push(slab)
    }
  }

  function spawnSlabs(
    slabs: typeof slabsA,
    mat: THREE.MeshLambertMaterial,
  ): void {
    if (slabs.length === 0) return
    const unitGeo = new THREE.BoxGeometry(1, 1, 1)
    const im = new THREE.InstancedMesh(unitGeo, mat, slabs.length)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < slabs.length; i++) {
      const s = slabs[i]
      dummy.position.set(s.x, s.y, s.z)
      dummy.scale.set(s.sx, s.sy, s.sz)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }
    im.instanceMatrix.needsUpdate = true
    parent.add(im)
  }

  spawnSlabs(slabsA, matA)
  spawnSlabs(slabsB, matB)
  spawnSlabs(slabsC, matC)
}

// ─── 4. Stream / water strip ─────────────────────────────────────────────────
// A thin water channel on the right side of the path, between path and cliff.
function buildStream(parent: THREE.Object3D): void {
  const streamWidth = 0.5
  const streamX = RAILING_X + streamWidth / 2 + 0.05
  const geo = new THREE.BoxGeometry(streamWidth, 0.06, TRACK_LENGTH_WORLD)
  const mat = new THREE.MeshLambertMaterial({ color: WATER_COLOR, transparent: true, opacity: 0.82 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(streamX, -0.08, TRACK_Z_CENTER)
  parent.add(mesh)

  // Mirror a narrower stream on the left too (gorge channels both sides)
  const leftWidth = 0.3
  const leftX = -(RAILING_X + leftWidth / 2 + 0.05)
  const geoL = new THREE.BoxGeometry(leftWidth, 0.06, TRACK_LENGTH_WORLD)
  const meshL = new THREE.Mesh(geoL, mat)
  meshL.position.set(leftX, -0.08, TRACK_Z_CENTER)
  parent.add(meshL)
}

// ─── 5. Trees (dense conifer forest) ─────────────────────────────────────────
function buildTrees(parent: THREE.Object3D, density: number): void {
  let seed = 19
  function rng(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }

  const treeSlots = Math.max(1, Math.round(90 * density))
  const positions: Array<{ x: number; z: number; s: number }> = []

  for (let iz = 0; iz < treeSlots; iz++) {
    const z = TRACK_Z_START - iz * (TRACK_LENGTH_WORLD / treeSlots) - 1.5
    // Two trees per slot, both sides
    const sideA = iz % 2 === 0 ? -1 : 1
    const xA = sideA * (RAILING_X + 1.8 + rng() * 9)
    positions.push({ x: xA, z, s: 0.65 + rng() * 0.75 })
    const xB = -sideA * (RAILING_X + 1.8 + rng() * 11)
    positions.push({ x: xB, z: z - 2.5 * rng(), s: 0.6 + rng() * 0.8 })
    // Extra third tree further back occasionally
    if (rng() > 0.5) {
      const xC = sideA * (RAILING_X + 3 + rng() * 14)
      positions.push({ x: xC, z: z - 4 * rng(), s: 0.5 + rng() * 0.6 })
    }
  }

  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.16, 1.0, 5)
  const trunkMat = new THREE.MeshLambertMaterial({ color: TRUNK_COLOR })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length)

  const foliageGeoA = new THREE.ConeGeometry(0.7, 1.8, 6)
  const foliageMatA = new THREE.MeshLambertMaterial({ color: FOLIAGE_COLOR_A, flatShading: true })
  const foliageMeshA = new THREE.InstancedMesh(foliageGeoA, foliageMatA, positions.length)

  // Second foliage tier (slightly smaller, offset up)
  const foliageGeoB = new THREE.ConeGeometry(0.5, 1.3, 6)
  const foliageMatB = new THREE.MeshLambertMaterial({ color: FOLIAGE_COLOR_B, flatShading: true })
  const foliageMeshB = new THREE.InstancedMesh(foliageGeoB, foliageMatB, positions.length)

  const dummy = new THREE.Object3D()
  const groundY = -1.1

  for (let i = 0; i < positions.length; i++) {
    const t = positions[i]
    // Trunk
    dummy.position.set(t.x, groundY + 0.5 * t.s, t.z)
    dummy.scale.set(t.s, t.s, t.s)
    dummy.rotation.y = i * 1.7
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)
    // Lower foliage cone
    dummy.position.set(t.x, groundY + 1.0 * t.s + 0.9 * t.s, t.z)
    dummy.updateMatrix()
    foliageMeshA.setMatrixAt(i, dummy.matrix)
    // Upper foliage tier
    dummy.position.set(t.x, groundY + 1.0 * t.s + 0.9 * t.s + 1.0 * t.s, t.z)
    dummy.scale.set(t.s * 0.85, t.s * 0.85, t.s * 0.85)
    dummy.updateMatrix()
    foliageMeshB.setMatrixAt(i, dummy.matrix)
  }

  trunkMesh.instanceMatrix.needsUpdate = true
  foliageMeshA.instanceMatrix.needsUpdate = true
  foliageMeshB.instanceMatrix.needsUpdate = true
  parent.add(trunkMesh)
  parent.add(foliageMeshA)
  parent.add(foliageMeshB)
}

// ─── 6. Boulders / scattered rocks ───────────────────────────────────────────
function buildBoulders(parent: THREE.Object3D, density: number): void {
  let seed = 31
  function rng(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    return (seed >>> 0) / 0xffffffff
  }

  const count = Math.max(1, Math.round(50 * density))
  const boulderDefsA: Array<{ x: number; y: number; z: number; r: number }> = []
  const boulderDefsB: Array<{ x: number; y: number; z: number; r: number }> = []

  for (let i = 0; i < count; i++) {
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const side = rng() > 0.5 ? 1 : -1
    const x = side * (RAILING_X + 0.4 + rng() * 2.5)
    const r = 0.25 + rng() * 0.5
    const def = { x, y: r * 0.5 - 0.15, z, r }
    if (rng() > 0.4) boulderDefsA.push(def)
    else boulderDefsB.push(def)
  }

  function spawnBoulders(
    defs: typeof boulderDefsA,
    color: number,
  ): void {
    if (defs.length === 0) return
    const geo = new THREE.IcosahedronGeometry(1, 0)
    const mat = new THREE.MeshLambertMaterial({ color, flatShading: true })
    const im = new THREE.InstancedMesh(geo, mat, defs.length)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i]
      dummy.position.set(d.x, d.y, d.z)
      dummy.scale.setScalar(d.r)
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }
    im.instanceMatrix.needsUpdate = true
    parent.add(im)
  }

  spawnBoulders(boulderDefsA, BOULDER_COLOR_A)
  spawnBoulders(boulderDefsB, BOULDER_COLOR_B)
}

// ─── 7. Distant mountains ─────────────────────────────────────────────────────
function buildMountains(parent: THREE.Object3D): void {
  const mountainDefs = [
    { x: -20, z:  -30, scale: 1.1 },
    { x: -28, z: -110, scale: 1.5 },
    { x:  22, z:  -70, scale: 1.2 },
    { x:  30, z: -190, scale: 1.7 },
    { x: -19, z: -260, scale: 1.0 },
    { x:  24, z: -310, scale: 1.4 },
    { x: -24, z: -370, scale: 1.3 },
    { x:  20, z: -400, scale: 0.9 },
    // Secondary layer — further back
    { x: -35, z:  -80, scale: 2.0 },
    { x:  38, z: -150, scale: 2.2 },
    { x: -33, z: -280, scale: 1.9 },
    { x:  36, z: -350, scale: 2.1 },
  ]
  const mat = new THREE.MeshLambertMaterial({ color: MOUNTAIN_COLOR, flatShading: true })
  for (const def of mountainDefs) {
    const geo = new THREE.ConeGeometry(4.5 * def.scale, 9 * def.scale, 6)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(def.x, 3.5 * def.scale - 1.3, def.z)
    parent.add(mesh)
  }
}

// ─── 8. Landmark helpers ──────────────────────────────────────────────────────

/**
 * 'gorge' landmark — dramatic rock arch / cleft with a wooden ladder leaning.
 * Placed to the LEFT side of the track.
 */
function buildLandmarkGorge(parent: THREE.Object3D, z: number): void {
  const rockMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const woodMat  = new THREE.MeshLambertMaterial({ color: WOOD_COLOR })

  const archX = -(RAILING_X + 2.5)

  // Left pillar
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7.0, 1.4), rockMat)
  leftPillar.position.set(archX - 1.0, 3.5, z)
  parent.add(leftPillar)

  // Right pillar
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.0, 1.4), rockMat)
  rightPillar.position.set(archX + 1.0, 3.0, z)
  parent.add(rightPillar)

  // Keystone / arch lintel
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 1.2), darkMat)
  lintel.position.set(archX, 6.8, z)
  parent.add(lintel)

  // Overhang crag (irregular overhang rock)
  const crag = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.9), rockMat)
  crag.position.set(archX + 0.3, 7.5, z - 0.2)
  parent.add(crag)

  // Wooden ladder — two rails + 5 rungs, leaning against the right cliff face
  const railGeo = new THREE.BoxGeometry(0.1, 4.0, 0.1)
  const leanTilt = 0.22  // slight lean angle (radians)
  const ladderX = archX + 0.9

  const railL = new THREE.Mesh(railGeo, woodMat)
  railL.position.set(ladderX - 0.25, 2.0, z - 0.5)
  railL.rotation.z = leanTilt
  parent.add(railL)

  const railR = new THREE.Mesh(railGeo, woodMat)
  railR.position.set(ladderX + 0.25, 2.0, z - 0.5)
  railR.rotation.z = leanTilt
  parent.add(railR)

  const rungGeo = new THREE.BoxGeometry(0.5, 0.08, 0.08)
  for (let r = 0; r < 5; r++) {
    const rung = new THREE.Mesh(rungGeo, woodMat)
    rung.position.set(ladderX, 0.5 + r * 0.75, z - 0.5)
    rung.rotation.z = leanTilt
    parent.add(rung)
  }
}

/**
 * 'waterfall' landmark — tall cliff face with white-blue water sheet cascading
 * down, and a shallow splash pool at the base. Placed to the RIGHT.
 */
function buildLandmarkWaterfall(parent: THREE.Object3D, z: number): void {
  const rockMat    = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat    = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const waterMat   = new THREE.MeshLambertMaterial({ color: SPLASH_COLOR, transparent: true, opacity: 0.85 })
  const splashMat  = new THREE.MeshLambertMaterial({ color: SPLASH_COLOR, transparent: true, opacity: 0.7 })

  const wfX = RAILING_X + 2.8

  // Main cliff face — very tall
  const cliff = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10.0, 1.8), rockMat)
  cliff.position.set(wfX, 5.0, z)
  parent.add(cliff)

  // Ledge step mid-cliff
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.2), darkMat)
  ledge.position.set(wfX - 0.3, 6.5, z - 0.7)
  parent.add(ledge)

  // Cliff top cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.0, 2.2), rockMat)
  cap.position.set(wfX, 10.5, z)
  parent.add(cap)

  // Water sheet — tall thin box in front of cliff face
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9.0, 0.12), waterMat)
  water.position.set(wfX - 0.1, 5.0, z - 0.95)
  parent.add(water)

  // Splash pool at base
  const pool = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), splashMat)
  pool.position.set(wfX - 0.1, 0.06, z - 0.8)
  parent.add(pool)

  // Small side boulders framing the fall
  const boulderMat = new THREE.MeshLambertMaterial({ color: BOULDER_COLOR_A, flatShading: true })
  const b1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), boulderMat)
  b1.position.set(wfX - 1.2, 0.3, z - 0.6)
  parent.add(b1)
  const b2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), boulderMat)
  b2.position.set(wfX + 1.0, 0.2, z - 0.5)
  parent.add(b2)
}

/**
 * 'viewpoint' landmark — Tomášovský výhľad: a jutting rock outcrop/platform
 * high up to the LEFT, evoking the famous cliff viewpoint.
 */
function buildLandmarkViewpoint(parent: THREE.Object3D, z: number): void {
  const rockMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const capMat   = new THREE.MeshLambertMaterial({ color: CLIFF_COLOR_C, flatShading: true })

  const vpX = -(RAILING_X + 3.5)

  // Tall base column rising from ground
  const column = new THREE.Mesh(new THREE.BoxGeometry(2.8, 8.0, 2.4), rockMat)
  column.position.set(vpX, 4.0, z)
  parent.add(column)

  // The jutting overhang platform — wider than column, pushed forward
  const platform = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 3.0), capMat)
  platform.position.set(vpX + 0.5, 8.35, z - 0.5)
  parent.add(platform)

  // Rock face behind platform (connects to cliff wall)
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.0, 1.4), darkMat)
  back.position.set(vpX - 0.2, 9.5, z + 0.5)
  parent.add(back)

  // Rough crag cap on top
  const crag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), rockMat)
  crag.position.set(vpX + 0.2, 11.3, z + 0.3)
  parent.add(crag)

  // Lip edge detail (dark strip at front of platform)
  const lip = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 0.18), darkMat)
  lip.position.set(vpX + 0.5, 8.6, z - 2.0)
  parent.add(lip)

  // A couple of rocks at the base of the column
  const smallRockMat = new THREE.MeshLambertMaterial({ color: BOULDER_COLOR_B, flatShading: true })
  const r1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), smallRockMat)
  r1.position.set(vpX + 1.6, 0.3, z - 0.8)
  parent.add(r1)
  const r2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), smallRockMat)
  r2.position.set(vpX - 1.4, 0.2, z + 0.6)
  parent.add(r2)
}

// ─── 9. Landmarks dispatcher ──────────────────────────────────────────────────
function buildLandmarks(parent: THREE.Object3D): void {
  for (const lm of getLevel('slovak-paradise').landmarks) {
    const worldZ = -lm.trackY / UNIT
    if (lm.id === 'gorge')      buildLandmarkGorge(parent, worldZ)
    else if (lm.id === 'waterfall') buildLandmarkWaterfall(parent, worldZ)
    else if (lm.id === 'viewpoint') buildLandmarkViewpoint(parent, worldZ)
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildSlovakParadiseEnvironment(parent: THREE.Object3D): void {
  buildTerrain(parent)
  buildPath(parent)
  buildStream(parent)
  buildCliffWalls(parent)
  buildBoulders(parent, TREE_DENSITY)
  buildTrees(parent, TREE_DENSITY)
  buildMountains(parent)
  buildLandmarks(parent)
}
