import * as THREE from 'three'
import {
  UNIT,
  ROAD_WORLD_WIDTH,
  TRACK_Z_START,
  TRACK_LENGTH_WORLD,
  TRACK_Z_CENTER,
} from '../world'
import { TREE_DENSITY, QUALITY_TIER } from '../quality'
import { getLevel } from '../../levels/registry'

// ─── Palette ────────────────────────────────────────────────────────────────
const PATH_COLOR        = 0x8a7a5a   // earthy stone/dirt
const TERRAIN_DIRT      = 0x6f5c3f   // trough/lowland dirt
const TERRAIN_GRASS_LO  = 0x3f6b2f   // lower hillside grass
const TERRAIN_GRASS_HI  = 0x4a7a38   // brighter mid-grass
const TERRAIN_ROCK      = 0x6b6258   // high/steep rock
const CLIFF_STRATA_A    = 0x6b6258   // warm grey rock
const CLIFF_STRATA_B    = 0x5a5048   // darker rock crevice
const CLIFF_STRATA_C    = 0x7a6e63   // lighter rock face
const CLIFF_STRATA_D    = 0x4e4840   // very dark shadow band
const WATER_COLOR       = 0x6fa8c0   // gorge brook blue
const SPLASH_COLOR      = 0xd8eef5   // waterfall white-blue
const TRUNK_COLOR       = 0x4a3520   // dark conifer trunk
const FOLIAGE_COLORS    = [0x2f5d34, 0x35663a, 0x29502f, 0x3d6e40]
const BUSH_COLORS       = [0x3a6b2a, 0x2f5a24, 0x437030, 0x3d6530]
const BOULDER_COLOR_A   = 0x7a7268
const BOULDER_COLOR_B   = 0x60584f
const SCREE_COLOR       = 0x726860   // small loose rock fragments
const MOUNTAIN_COLOR    = 0x6e8a7a   // cool grey-green
const LANDMARK_ROCK     = 0x6a6258
const LANDMARK_DARK     = 0x4e4840
const WOOD_COLOR        = 0x8b6340   // ladder/rung wood
const SKY_HORIZON       = 0xbcd6df   // matches fog / sky bg
const SKY_ZENITH        = 0x7ab0c8   // deeper blue at top

const DECK_WIDTH  = ROAD_WORLD_WIDTH + 0.4
// Outside edge of the road (railing inner face) — scenery must start beyond this
const RAILING_X   = ROAD_WORLD_WIDTH / 2 + 0.35

// ─── Water animation handle (exported so scene.ts can animate per-frame) ────
export interface WaterEntry {
  geo: THREE.BufferGeometry
  /** Snapshot of base Y per vertex taken at build time */
  baseY: Float32Array
}

export interface SlovakWaterHandle {
  streamEntries: WaterEntry[]
  waterfallEntries: WaterEntry[]
}

// ─── LCG helpers ─────────────────────────────────────────────────────────────
function makeLCG(seed: number): () => number {
  let s = seed
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Value noise (deterministic, no dependencies) ───────────────────────────
// Simple 1D lattice value noise used to displace terrain heights.
function valueNoise2D(x: number, z: number, seed: number): number {
  // hash two integers into a float in [0,1]
  function hash2(ix: number, iz: number): number {
    let h = (ix * 374761393 + iz * 668265263 + seed) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h = h ^ (h >>> 16)
    return ((h >>> 0) / 0xffffffff)
  }
  const ix0 = Math.floor(x)
  const iz0 = Math.floor(z)
  const fx = x - ix0
  const fz = z - iz0
  // smooth step
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  const v00 = hash2(ix0,     iz0)
  const v10 = hash2(ix0 + 1, iz0)
  const v01 = hash2(ix0,     iz0 + 1)
  const v11 = hash2(ix0 + 1, iz0 + 1)
  return v00 + (v10 - v00) * ux + (v01 - v00) * uz + (v11 - v10 - v01 + v00) * ux * uz
}

function fbm2D(x: number, z: number, seed: number, octaves: number): number {
  let v = 0, amp = 0.5, freq = 1.0, max = 0
  for (let o = 0; o < octaves; o++) {
    v += valueNoise2D(x * freq, z * freq, seed + o * 7919) * amp
    max += amp
    amp *= 0.5
    freq *= 2.1
  }
  return v / max
}

// ─── Colour helpers ───────────────────────────────────────────────────────────
function hexToRGB01(hex: number): [number, number, number] {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255]
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const tc = Math.max(0, Math.min(1, t))
  return [a[0] + (b[0] - a[0]) * tc, a[1] + (b[1] - a[1]) * tc, a[2] + (b[2] - a[2]) * tc]
}

// ─── 1. Path / ground strip ──────────────────────────────────────────────────
function buildPath(parent: THREE.Object3D): void {
  const geo = new THREE.BoxGeometry(DECK_WIDTH, 0.18, TRACK_LENGTH_WORLD)
  const mat = new THREE.MeshLambertMaterial({ color: PATH_COLOR })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, -0.09, TRACK_Z_CENTER)
  parent.add(mesh)
}

// ─── 2. Rolling vertex-colored canyon terrain ────────────────────────────────
function buildTerrain(parent: THREE.Object3D): void {
  const isHigh = QUALITY_TIER !== 'low'
  const segX = isHigh ? 48 : 24
  const segZ = isHigh ? 140 : 80
  const totalW = 160
  const totalD = TRACK_LENGTH_WORLD + 40

  const geo = new THREE.PlaneGeometry(totalW, totalD, segX, segZ)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const vCount = pos.count

  // Canyon corridor half-width in world units (keep flat near road)
  const corridorHW = ROAD_WORLD_WIDTH / 2 + 2.0

  // Vertex colours
  const colArr = new Float32Array(vCount * 3)
  const colDirt = hexToRGB01(TERRAIN_DIRT)
  const colGrassLo = hexToRGB01(TERRAIN_GRASS_LO)
  const colGrassHi = hexToRGB01(TERRAIN_GRASS_HI)
  const colRock = hexToRGB01(TERRAIN_ROCK)

  for (let i = 0; i < vCount; i++) {
    const wx = pos.getX(i)
    const wz = pos.getZ(i)

    // Noise-based base height
    const noiseVal = fbm2D(wx * 0.18, wz * 0.06, 3701, isHigh ? 4 : 3)

    // Canyon trough: clamp low near path, ramp up laterally
    const absX = Math.abs(wx)
    const lateralT = Math.max(0, (absX - corridorHW) / 6.0)   // 0 at corridor edge → 1 at +6u
    const clampedT = Math.min(1, lateralT)
    const canyonRamp = clampedT * clampedT * 6.0               // quadratic ramp, up to 6u tall

    const h = canyonRamp * noiseVal + canyonRamp * 0.4 - 1.3   // base at -1.3

    pos.setY(i, h)

    // Color by height + slope proxy (lateralT as cliff-steepness proxy)
    let c: [number, number, number]
    if (lateralT < 0.05) {
      c = colDirt
    } else if (lateralT < 0.4) {
      c = lerpColor(colDirt, colGrassLo, (lateralT - 0.05) / 0.35)
    } else if (lateralT < 0.75) {
      c = lerpColor(colGrassLo, colGrassHi, (lateralT - 0.4) / 0.35)
    } else {
      c = lerpColor(colGrassHi, colRock, Math.min(1, (lateralT - 0.75) / 0.35))
    }
    // Darken very steep/high spots
    const heightT = Math.max(0, Math.min(1, (h + 1.3) / 5.0))
    if (heightT > 0.6) c = lerpColor(c, colRock, (heightT - 0.6) / 0.4)

    colArr[i * 3]     = c[0]
    colArr[i * 3 + 1] = c[1]
    colArr[i * 3 + 2] = c[2]
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
  geo.computeVertexNormals()

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, 0, TRACK_Z_CENTER)
  parent.add(mesh)
}

// ─── 3. Gorge cliff walls — single instanced mesh with vertex-color strata ────
function buildCliffWalls(parent: THREE.Object3D): void {
  const rng = makeLCG(7)

  const slabSpacing = 1.8
  const countPerSide = Math.floor(TRACK_LENGTH_WORLD / slabSpacing)

  // Build ONE banded slab base geometry (subdivided box, flatShading, vertex colors)
  // Subdivisions give us horizontal strata bands + slight silhouette variation.
  const SUBDIV_Y = 6  // strata bands
  const baseGeo = new THREE.BoxGeometry(1, 1, 1, 1, SUBDIV_Y, 1)

  // Assign strata vertex colors
  const strataColors: [number, number, number][] = [
    hexToRGB01(CLIFF_STRATA_A),
    hexToRGB01(CLIFF_STRATA_B),
    hexToRGB01(CLIFF_STRATA_C),
    hexToRGB01(CLIFF_STRATA_D),
  ]
  const bPos = baseGeo.attributes.position as THREE.BufferAttribute
  const bCount = bPos.count
  const bColArr = new Float32Array(bCount * 3)
  for (let i = 0; i < bCount; i++) {
    const vy = bPos.getY(i)  // in [-0.5, 0.5] (unit box)
    // 4 bands cycling through strata colours
    const band = Math.floor((vy + 0.5) * SUBDIV_Y) % strataColors.length
    const sc = strataColors[Math.abs(band) % strataColors.length]
    bColArr[i * 3]     = sc[0]
    bColArr[i * 3 + 1] = sc[1]
    bColArr[i * 3 + 2] = sc[2]
  }
  baseGeo.setAttribute('color', new THREE.BufferAttribute(bColArr, 3))
  baseGeo.computeVertexNormals()

  const totalSlabs = countPerSide * 2
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
  const im = new THREE.InstancedMesh(baseGeo, mat, totalSlabs)

  const dummy = new THREE.Object3D()
  let idx = 0
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < countPerSide; i++) {
      const z = TRACK_Z_START - i * slabSpacing - slabSpacing / 2
      const height  = 4.0 + rng() * 4.0
      const depth   = slabSpacing * 0.95 + rng() * 0.1
      const width   = 0.9 + rng() * 0.6
      const xOffset = RAILING_X + width / 2 + rng() * 0.4
      dummy.position.set(side * xOffset, height / 2 - 0.2, z)
      dummy.scale.set(width, height, depth)
      dummy.rotation.set(0, rng() * 0.08 - 0.04, 0)  // slight yaw variation
      dummy.updateMatrix()
      im.setMatrixAt(idx++, dummy.matrix)
    }
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 3b. Scree — loose rocks at cliff feet ───────────────────────────────────
function buildScree(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(53)
  const count = Math.max(1, Math.round(120 * density))
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = new THREE.MeshLambertMaterial({ color: SCREE_COLOR, flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const xBase = side * (RAILING_X + 0.3 + rng() * 1.2)
    const scale = 0.1 + rng() * 0.3
    dummy.position.set(xBase, scale * 0.4 - 0.8, z)
    dummy.scale.setScalar(scale)
    dummy.rotation.set(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 4. Stream / water strip (animated via SlovakWaterHandle) ────────────────
function buildStream(parent: THREE.Object3D, handle: SlovakWaterHandle): void {
  const streamWidth = 0.5
  const streamX = RAILING_X + streamWidth / 2 + 0.05
  const streamY = -0.08

  function makeStreamPlane(width: number, x: number): void {
    // Subdivided plane in XZ — we animate Y vertices per-frame on high tier
    const geo = new THREE.PlaneGeometry(width, TRACK_LENGTH_WORLD, 1, 64)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position as THREE.BufferAttribute
    const vCount = pos.count
    const baseYArr = new Float32Array(vCount)
    const colArr = new Float32Array(vCount * 3)
    const [wr, wg, wb] = hexToRGB01(WATER_COLOR)
    for (let i = 0; i < vCount; i++) {
      baseYArr[i] = streamY
      pos.setY(i, streamY)
      colArr[i * 3]     = wr * 0.85
      colArr[i * 3 + 1] = wg * 0.85
      colArr[i * 3 + 2] = wb * 0.85
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
    geo.computeVertexNormals()

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, 0, TRACK_Z_CENTER)
    parent.add(mesh)

    handle.streamEntries.push({ geo, baseY: baseYArr })
  }

  makeStreamPlane(streamWidth, streamX)
  // Mirror a narrower channel on the left
  makeStreamPlane(0.3, -(RAILING_X + 0.3 / 2 + 0.05))
}

// ─── 5. Trees — instanceColor variation ──────────────────────────────────────
function buildTrees(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(19)

  const treeSlots = Math.max(1, Math.round(90 * density))
  const positions: Array<{ x: number; z: number; s: number }> = []

  for (let iz = 0; iz < treeSlots; iz++) {
    const z = TRACK_Z_START - iz * (TRACK_LENGTH_WORLD / treeSlots) - 1.5
    // Bias density just beyond railing, thin outward
    const sideA = iz % 2 === 0 ? -1 : 1
    // Inner ring (dense, close to railing)
    const xA = sideA * (RAILING_X + 1.2 + rng() * 4.0)
    positions.push({ x: xA, z, s: 0.65 + rng() * 0.75 })
    // Outer ring
    const xB = -sideA * (RAILING_X + 1.5 + rng() * 8.0)
    positions.push({ x: xB, z: z - 2.5 * rng(), s: 0.6 + rng() * 0.8 })
    // Extra occasional far tree
    if (rng() > 0.5) {
      const xC = sideA * (RAILING_X + 4 + rng() * 12)
      positions.push({ x: xC, z: z - 4 * rng(), s: 0.5 + rng() * 0.6 })
    }
  }

  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.16, 1.0, 5)
  const trunkMat = new THREE.MeshLambertMaterial({ color: TRUNK_COLOR })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length)

  // Single foliage cone instanced mesh; use instanceColor for variety
  const foliageGeoA = new THREE.ConeGeometry(0.7, 1.8, 6)
  const foliageMatA = new THREE.MeshLambertMaterial({ flatShading: true })
  const foliageMeshA = new THREE.InstancedMesh(foliageGeoA, foliageMatA, positions.length)
  foliageMeshA.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(positions.length * 3), 3,
  )

  // Second foliage tier
  const foliageGeoB = new THREE.ConeGeometry(0.5, 1.3, 6)
  const foliageMatB = new THREE.MeshLambertMaterial({ flatShading: true })
  const foliageMeshB = new THREE.InstancedMesh(foliageGeoB, foliageMatB, positions.length)
  foliageMeshB.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(positions.length * 3), 3,
  )

  const dummy = new THREE.Object3D()
  const colorObj = new THREE.Color()
  const groundY = -1.1

  for (let i = 0; i < positions.length; i++) {
    const t = positions[i]
    const fc = FOLIAGE_COLORS[i % FOLIAGE_COLORS.length]
    colorObj.setHex(fc)

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
    foliageMeshA.setColorAt(i, colorObj)

    // Upper foliage tier (slightly different hue)
    const fc2 = FOLIAGE_COLORS[(i + 2) % FOLIAGE_COLORS.length]
    colorObj.setHex(fc2)
    dummy.position.set(t.x, groundY + 1.0 * t.s + 0.9 * t.s + 1.0 * t.s, t.z)
    dummy.scale.set(t.s * 0.85, t.s * 0.85, t.s * 0.85)
    dummy.updateMatrix()
    foliageMeshB.setMatrixAt(i, dummy.matrix)
    foliageMeshB.setColorAt(i, colorObj)
  }

  trunkMesh.instanceMatrix.needsUpdate = true
  foliageMeshA.instanceMatrix.needsUpdate = true
  foliageMeshA.instanceColor!.needsUpdate = true
  foliageMeshB.instanceMatrix.needsUpdate = true
  foliageMeshB.instanceColor!.needsUpdate = true

  parent.add(trunkMesh)
  parent.add(foliageMeshA)
  parent.add(foliageMeshB)
}

// ─── 5b. Bushes ───────────────────────────────────────────────────────────────
function buildBushes(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(61)
  const count = Math.max(1, Math.round(80 * density))

  // Squashed icosahedron
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const mat = new THREE.MeshLambertMaterial({ flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)

  const colorObj = new THREE.Color()
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const x = side * (RAILING_X + 0.6 + rng() * 5.0)
    const sx = 0.3 + rng() * 0.5
    const sy = sx * (0.45 + rng() * 0.35)  // squash vertically
    const sz = 0.3 + rng() * 0.5
    dummy.position.set(x, -0.9 + sy, z)
    dummy.scale.set(sx, sy, sz)
    dummy.rotation.y = rng() * Math.PI * 2
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
    colorObj.setHex(BUSH_COLORS[i % BUSH_COLORS.length])
    im.setColorAt(i, colorObj)
  }
  im.instanceMatrix.needsUpdate = true
  im.instanceColor!.needsUpdate = true
  parent.add(im)
}

// ─── 5c. Grass tufts (high tier only) ────────────────────────────────────────
function buildGrassTufts(parent: THREE.Object3D, density: number): void {
  if (QUALITY_TIER === 'low') return
  const rng = makeLCG(79)
  const count = Math.max(1, Math.round(200 * density))

  // Tiny cone cluster to suggest grass blades
  const geo = new THREE.ConeGeometry(0.12, 0.35, 4)
  const mat = new THREE.MeshLambertMaterial({ color: 0x5a7a30, flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    // Along path margins and trough edges
    const x = side * (RAILING_X * (0.3 + rng() * 0.8))
    dummy.position.set(x, -1.05, z)
    dummy.scale.set(1, 0.8 + rng() * 0.5, 1)
    dummy.rotation.set(0, rng() * Math.PI * 2, (rng() - 0.5) * 0.3)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 6. Boulders / scattered rocks ───────────────────────────────────────────
function buildBoulders(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(31)

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

  function spawnBoulders(defs: typeof boulderDefsA, color: number): void {
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

// ─── 8. Sky dome ─────────────────────────────────────────────────────────────
function buildSkyDome(parent: THREE.Object3D): void {
  const isHigh = QUALITY_TIER !== 'low'
  const segs = isHigh ? 16 : 8
  const geo = new THREE.SphereGeometry(200, segs, isHigh ? 10 : 6)

  // Vertex color gradient: horizon = SKY_HORIZON, zenith = SKY_ZENITH
  const pos = geo.attributes.position as THREE.BufferAttribute
  const vCount = pos.count
  const colArr = new Float32Array(vCount * 3)
  const cHorizon = hexToRGB01(SKY_HORIZON)
  const cZenith  = hexToRGB01(SKY_ZENITH)
  for (let i = 0; i < vCount; i++) {
    const y = pos.getY(i)
    // y in [-200, 200]; map [0..200] → [0..1]
    const t = Math.max(0, y / 200)
    const c = lerpColor(cHorizon, cZenith, t)
    colArr[i * 3]     = c[0]
    colArr[i * 3 + 1] = c[1]
    colArr[i * 3 + 2] = c[2]
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))

  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
  const mesh = new THREE.Mesh(geo, mat)
  parent.add(mesh)
}

// ─── 9. Landmark helpers ──────────────────────────────────────────────────────

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

  // Handrail posts near the gorge
  const postMat = new THREE.MeshLambertMaterial({ color: WOOD_COLOR })
  const postGeo = new THREE.BoxGeometry(0.08, 0.7, 0.08)
  for (let p = 0; p < 4; p++) {
    const px = archX - 1.5 + p * 1.0
    const post = new THREE.Mesh(postGeo, postMat)
    post.position.set(px, 0.35, z - 0.9)
    parent.add(post)
  }
  const railTopGeo = new THREE.BoxGeometry(3.5, 0.06, 0.07)
  const railTop = new THREE.Mesh(railTopGeo, postMat)
  railTop.position.set(archX, 0.73, z - 0.9)
  parent.add(railTop)
}

/**
 * 'waterfall' landmark — tall cliff face with animated water sheet.
 * Returns waterfall geometry entry for animation.
 */
function buildLandmarkWaterfall(
  parent: THREE.Object3D,
  z: number,
  handle: SlovakWaterHandle,
): void {
  const rockMat    = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat    = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const splashMat  = new THREE.MeshLambertMaterial({ color: SPLASH_COLOR, transparent: true, opacity: 0.75 })

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

  // Animated water sheet — subdivided vertical plane
  const wfGeo = new THREE.PlaneGeometry(1.2, 9.0, 1, 18)
  // Build vertex colors (initial state)
  const wfPos = wfGeo.attributes.position as THREE.BufferAttribute
  const wfCount = wfPos.count
  const wfColArr = new Float32Array(wfCount * 3)
  for (let i = 0; i < wfCount; i++) {
    wfColArr[i * 3]     = 0.85
    wfColArr[i * 3 + 1] = 0.94
    wfColArr[i * 3 + 2] = 1.0
  }
  wfGeo.setAttribute('color', new THREE.BufferAttribute(wfColArr, 3))
  const wfMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
  })
  const wfMesh = new THREE.Mesh(wfGeo, wfMat)
  wfMesh.position.set(wfX - 0.1, 5.0, z - 0.95)
  parent.add(wfMesh)

  // Save baseY for waterfall (all Y values from PlaneGeometry)
  const wfBaseY = new Float32Array(wfCount)
  for (let i = 0; i < wfCount; i++) wfBaseY[i] = wfPos.getY(i)
  handle.waterfallEntries.push({ geo: wfGeo, baseY: wfBaseY })

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
  const capMat   = new THREE.MeshLambertMaterial({ color: CLIFF_STRATA_C, flatShading: true })

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

// ─── 10. Landmarks dispatcher ─────────────────────────────────────────────────
function buildLandmarks(parent: THREE.Object3D, handle: SlovakWaterHandle): void {
  for (const lm of getLevel('slovak-paradise').landmarks) {
    const worldZ = -lm.trackY / UNIT
    if (lm.id === 'gorge')          buildLandmarkGorge(parent, worldZ)
    else if (lm.id === 'waterfall') buildLandmarkWaterfall(parent, worldZ, handle)
    else if (lm.id === 'viewpoint') buildLandmarkViewpoint(parent, worldZ)
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildSlovakParadiseEnvironment(parent: THREE.Object3D): SlovakWaterHandle {
  const handle: SlovakWaterHandle = { streamEntries: [], waterfallEntries: [] }

  buildSkyDome(parent)
  buildTerrain(parent)
  buildPath(parent)
  buildStream(parent, handle)
  buildCliffWalls(parent)
  buildScree(parent, TREE_DENSITY)
  buildBoulders(parent, TREE_DENSITY)
  buildTrees(parent, TREE_DENSITY)
  buildBushes(parent, TREE_DENSITY)
  buildGrassTufts(parent, TREE_DENSITY)
  buildMountains(parent)
  buildLandmarks(parent, handle)

  return handle
}
