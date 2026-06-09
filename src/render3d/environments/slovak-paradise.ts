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
const PATH_COLOR        = 0x9a8a6a   // earthy stone/dirt trail
const TERRAIN_DIRT      = 0x5a8a38   // verge — bright grassy green
const TERRAIN_GRASS_LO  = 0x4a8228   // lower hillside grass — saturated green
const TERRAIN_GRASS_HI  = 0x5a9a38   // brighter mid-grass
const TERRAIN_ROCK      = 0x7a7268   // high/steep rock
const CLIFF_STRATA_A    = 0x7a7268   // warm grey rock
const CLIFF_STRATA_B    = 0x6a6258   // darker rock crevice
const CLIFF_STRATA_C    = 0x8a7e73   // lighter rock face
const CLIFF_STRATA_D    = 0x5e5850   // shadow band
const WATER_COLOR       = 0x55c0e8   // vivid gorge brook blue-cyan
const SPLASH_COLOR      = 0xd8eef5   // waterfall white-blue
const TRUNK_COLOR       = 0x3a2810   // dark conifer trunk
const FOLIAGE_COLORS    = [0x2d6830, 0x367a38, 0x265828, 0x427840, 0x3a7035, 0x2e6030]
const BUSH_COLORS       = [0x3a7a28, 0x2f6820, 0x487835, 0x4a7232]
const BOULDER_COLOR_A   = 0x7a7268
const BOULDER_COLOR_B   = 0x60584f
const SCREE_COLOR       = 0x726860
const MOUNTAIN_COLOR_A  = 0x5a7a65   // blue-grey-green near
const MOUNTAIN_COLOR_B  = 0x6e8fa0   // cool blue-grey far
const LANDMARK_ROCK     = 0x6a6258
const LANDMARK_DARK     = 0x4e4840
const WOOD_COLOR        = 0x8b6340
const SKY_HORIZON       = 0xa8cfe0   // matches fog / sky bg
const SKY_ZENITH        = 0x5a9ec8   // deeper blue at top
const MOSS_COLOR        = 0x4a7830   // mossy rock green
const FLOWER_COLORS     = [0xf5e060, 0xe8a030, 0xf0f0f0, 0xd070c0, 0x80c040]
const FERN_COLOR        = 0x3a7228   // deep fern green
const LOG_COLOR         = 0x6b4a2a   // fallen log brown

// Road half-width + railing position (where scenery begins)
const RAILING_X   = ROAD_WORLD_WIDTH / 2 + 0.35
// Cliff setback — cliffs start this far from railing, giving open space
const CLIFF_SETBACK = 3.5
const CLIFF_X_BASE  = RAILING_X + CLIFF_SETBACK

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
function valueNoise2D(x: number, z: number, seed: number): number {
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
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  return hash2(ix0, iz0) + (hash2(ix0 + 1, iz0) - hash2(ix0, iz0)) * ux
    + (hash2(ix0, iz0 + 1) - hash2(ix0, iz0)) * uz
    + (hash2(ix0 + 1, iz0 + 1) - hash2(ix0 + 1, iz0) - hash2(ix0, iz0 + 1) + hash2(ix0, iz0)) * ux * uz
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

// ─── 1. Path / ground strip + green verge ────────────────────────────────────
function buildPath(parent: THREE.Object3D): void {
  const isHigh = QUALITY_TIER !== 'low'
  const w = ROAD_WORLD_WIDTH + 0.4

  // Bumpy earthy trail — a segmented surface displaced with low noise and
  // flat-shaded so the path reads as a rugged, uneven mountain track.
  const segX = isHigh ? 10 : 6
  const segZ = isHigh ? 260 : 130
  const geo = new THREE.PlaneGeometry(w, TRACK_LENGTH_WORLD, segX, segZ)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const col = new Float32Array(pos.count * 3)
  const base = hexToRGB01(PATH_COLOR)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const n = fbm2D(x * 0.9 + 10, z * 0.25, 1337, 3)
    const edge = Math.min(1, Math.abs(x) / (w / 2))
    // ±~0.06 bumps, a touch higher/rutted toward the edges
    pos.setY(i, (n - 0.5) * 0.12 + edge * edge * 0.05)
    const b = 0.82 + (n - 0.5) * 0.5 // mottled brightness
    col[i * 3] = base[0] * b
    col[i * 3 + 1] = base[1] * b
    col[i * 3 + 2] = base[2] * b
  }
  geo.computeVertexNormals()
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }))
  mesh.position.set(0, 0, TRACK_Z_CENTER)
  parent.add(mesh)

  // Thin solid base so the trail edges aren't see-through under the bumps.
  const baseGeo = new THREE.BoxGeometry(w, 0.2, TRACK_LENGTH_WORLD)
  const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshLambertMaterial({ color: PATH_COLOR }))
  baseMesh.position.set(0, -0.13, TRACK_Z_CENTER)
  parent.add(baseMesh)

  // Small embedded pebbles scattered on the trail for texture (instanced, gated).
  if (isHigh) {
    const pebGeo = new THREE.IcosahedronGeometry(0.09, 0)
    const pebMat = new THREE.MeshLambertMaterial({ color: 0x8d8377, flatShading: true })
    const count = 220
    const im = new THREE.InstancedMesh(pebGeo, pebMat, count)
    const d = new THREE.Object3D()
    const rng = makeLCG(909)
    for (let i = 0; i < count; i++) {
      d.position.set((rng() - 0.5) * w * 0.92, 0.03, TRACK_Z_START - rng() * TRACK_LENGTH_WORLD)
      const s = 0.5 + rng() * 0.9
      d.scale.set(s, s * 0.5, s)
      d.rotation.y = rng() * 6.283
      d.updateMatrix()
      im.setMatrixAt(i, d.matrix)
    }
    im.instanceMatrix.needsUpdate = true
    parent.add(im)
  }

  // Green verge strips right alongside the path railing — clearly visible in foreground
  const vergeW = CLIFF_X_BASE - RAILING_X - 0.1
  const vergeGeo = new THREE.BoxGeometry(vergeW, 0.10, TRACK_LENGTH_WORLD)
  const vergeMat = new THREE.MeshLambertMaterial({ color: TERRAIN_DIRT })
  for (const side of [-1, 1] as const) {
    const verge = new THREE.Mesh(vergeGeo, vergeMat)
    verge.position.set(side * (RAILING_X + vergeW / 2 + 0.05), -0.1, TRACK_Z_CENTER)
    parent.add(verge)
  }
}

// ─── 2. Rolling vertex-colored gorge terrain — wider, greener ─────────────────
function buildTerrain(parent: THREE.Object3D): void {
  const isHigh = QUALITY_TIER !== 'low'
  const segX = isHigh ? 56 : 28
  const segZ = isHigh ? 160 : 90
  // Make terrain much wider so it extends behind the cliffs and shows slope
  const totalW = 240
  const totalD = TRACK_LENGTH_WORLD + 60

  const geo = new THREE.PlaneGeometry(totalW, totalD, segX, segZ)
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const vCount = pos.count

  // Keep flat near road, ramp up for slopes beyond cliff setback
  const corridorHW = ROAD_WORLD_WIDTH / 2 + 1.0
  // Where the slope starts rising (beyond cliff base)
  const slopeStart = CLIFF_X_BASE + 1.0
  const slopeWidth = 18.0   // width over which the hill rises

  const colArr = new Float32Array(vCount * 3)
  const colDirt   = hexToRGB01(TERRAIN_DIRT)
  const colGrassLo = hexToRGB01(TERRAIN_GRASS_LO)
  const colGrassHi = hexToRGB01(TERRAIN_GRASS_HI)
  const colRock   = hexToRGB01(TERRAIN_ROCK)

  for (let i = 0; i < vCount; i++) {
    const wx = pos.getX(i)
    const wz = pos.getZ(i)

    const noiseVal = fbm2D(wx * 0.14, wz * 0.05, 3701, isHigh ? 4 : 3)
    const absX = Math.abs(wx)

    let h: number
    let c: [number, number, number]

    if (absX <= corridorHW) {
      // Flat trail verge — slightly below path level, mossy green
      h = -1.1 + noiseVal * 0.10
      c = lerpColor(colGrassLo, colDirt, 0.3 + noiseVal * 0.3)
    } else if (absX <= slopeStart) {
      // Gentle slope from railing to cliff base — lush grassy bank
      const t = (absX - corridorHW) / (slopeStart - corridorHW)
      h = -1.1 + t * 0.7 + noiseVal * 0.25
      c = lerpColor(colGrassLo, colGrassHi, t)
    } else {
      // Forested hillside rising behind cliffs
      const t = Math.min(1, (absX - slopeStart) / slopeWidth)
      const quadT = t * t
      h = -0.5 + quadT * 10.0 * (0.7 + noiseVal * 0.5) + noiseVal * 0.6
      if (h < 2.0) {
        c = lerpColor(colGrassHi, colGrassLo, noiseVal * 0.5)
      } else if (h < 5.0) {
        c = lerpColor(colGrassHi, colRock, (h - 2.0) / 3.0 * 0.4)
      } else {
        c = lerpColor(colRock, hexToRGB01(0x888880), (h - 5.0) / 6.0)
      }
    }

    pos.setY(i, h)
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

// ─── 3. Low gorge cliff walls — shorter, stepped back, varying height ─────────
function buildCliffWalls(parent: THREE.Object3D): void {
  const rng = makeLCG(7)

  const slabSpacing = 2.4
  const countPerSide = Math.floor(TRACK_LENGTH_WORLD / slabSpacing)

  const SUBDIV_Y = 5
  const baseGeo = new THREE.BoxGeometry(1, 1, 1, 1, SUBDIV_Y, 1)

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
    const vy = bPos.getY(i)
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
      // Lots of variation: short boulders (0.8–2.0), with occasional taller (2.5–3.5)
      // More frequent gaps every 6-7 slabs so light and forest peek through
      const gapPhase = i % 7
      const isLowGap  = (gapPhase === 3)   // one very low slab per 7 — gap
      const isTallPeak = (gapPhase === 0 || gapPhase === 6) && rng() > 0.5  // occasional taller rock
      const height = isLowGap
        ? 0.4 + rng() * 0.5                         // very low stub (almost flat)
        : isTallPeak
          ? 2.5 + rng() * 1.2                        // tall rocky peak
          : 0.8 + rng() * 1.4                        // mostly short-medium
      const depth  = slabSpacing * 0.85 + rng() * 0.25
      const width  = 0.8 + rng() * 1.0

      // Vary setback more — some slabs well back, creating visual depth
      const xSetback = CLIFF_X_BASE + rng() * 2.5
      const xOffset  = xSetback + width / 2

      dummy.position.set(side * xOffset, height / 2 - 0.5, z)
      dummy.scale.set(width, height, depth)
      dummy.rotation.set(0, rng() * 0.15 - 0.075, 0)
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
  const count = Math.max(1, Math.round(150 * density))
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = new THREE.MeshLambertMaterial({ color: SCREE_COLOR, flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    // Scree at cliff base and on slope
    const xBase = side * (CLIFF_X_BASE - 0.5 + rng() * 3.0)
    const scale = 0.08 + rng() * 0.25
    dummy.position.set(xBase, scale * 0.3 - 0.9, z)
    dummy.scale.setScalar(scale)
    dummy.rotation.set(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 4. Stream — wide, bright, clearly visible gorge brook ───────────────────
function buildStream(parent: THREE.Object3D, handle: SlovakWaterHandle): void {
  // The stream runs parallel to the path on the LEFT side (wide & prominent)
  // It's a raised flat plane slightly above the terrain Y so camera sees it.
  // We embed it WITH the verge: water is at y = -0.05 (above verge -0.1),
  // showing as a bright band through the green.
  const streamWidth = 2.0
  const streamY = 0.01   // just above ground — clearly visible

  function makeStreamPlane(width: number, x: number, yBase: number): void {
    const geo = new THREE.PlaneGeometry(width, TRACK_LENGTH_WORLD, 2, 80)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position as THREE.BufferAttribute
    const vCount = pos.count
    const baseYArr = new Float32Array(vCount)
    const colArr = new Float32Array(vCount * 3)
    const [wr, wg, wb] = hexToRGB01(WATER_COLOR)
    for (let i = 0; i < vCount; i++) {
      baseYArr[i] = yBase
      pos.setY(i, yBase)
      colArr[i * 3]     = wr
      colArr[i * 3 + 1] = wg
      colArr[i * 3 + 2] = wb
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
    geo.computeVertexNormals()

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, 0, TRACK_Z_CENTER)
    parent.add(mesh)

    handle.streamEntries.push({ geo, baseY: baseYArr })
  }

  // Main stream: LEFT side, just outside railing in the green verge band
  const streamXL = -(RAILING_X + streamWidth / 2 + 0.15)
  makeStreamPlane(streamWidth, streamXL, streamY)

  // Narrow secondary channel on the right side
  const streamXR = RAILING_X + 0.7 / 2 + 0.25
  makeStreamPlane(0.7, streamXR, streamY - 0.02)

  // Mossy bank edges around main stream
  const bankMat = new THREE.MeshLambertMaterial({ color: 0x3a6a20 })
  const bankGeo = new THREE.BoxGeometry(0.25, 0.15, TRACK_LENGTH_WORLD)
  const bankL = new THREE.Mesh(bankGeo, bankMat)
  bankL.position.set(streamXL - streamWidth / 2 - 0.12, 0.0, TRACK_Z_CENTER)
  parent.add(bankL)
  const bankR = new THREE.Mesh(bankGeo, bankMat)
  bankR.position.set(streamXL + streamWidth / 2 + 0.12, 0.0, TRACK_Z_CENTER)
  parent.add(bankR)
}

// ─── 5. Trees — dense forest, on slopes behind cliffs, layered ───────────────
function buildTrees(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(19)
  const isHigh = QUALITY_TIER !== 'low'

  // More trees with better coverage
  const treeSlots = Math.max(1, Math.round(160 * density))
  const positions: Array<{ x: number; z: number; s: number; colorIdx: number }> = []

  for (let iz = 0; iz < treeSlots; iz++) {
    const z = TRACK_Z_START - iz * (TRACK_LENGTH_WORLD / treeSlots) - 1.0

    // Layer 1: just beyond the cliffs on each side (visible even above/around low cliffs)
    for (let layer = 0; layer < 3; layer++) {
      const side = (layer + iz) % 2 === 0 ? 1 : -1
      // Layer at increasing distances: 2, 5, 10 units beyond cliff base
      const xDist = CLIFF_X_BASE + [2.0, 5.5, 11.0][layer] + rng() * 2.5
      const x = side * xDist
      const s = 0.9 + rng() * 1.2   // taller trees, more visible
      positions.push({ x, z: z + (rng() - 0.5) * 3, s, colorIdx: rng() > 0.5 ? 0 : 1 })
    }

    // Extra second-side tree each slot
    if (rng() > 0.35) {
      const side = iz % 2 === 0 ? 1 : -1
      const x = side * (CLIFF_X_BASE + 3.0 + rng() * 14.0)
      positions.push({ x, z: z + (rng() - 0.5) * 4, s: 0.7 + rng() * 1.0, colorIdx: 2 })
    }
  }

  // Cone foliage: three tiers per tree for more mass
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.16, 1.0, 5)
  const trunkMat = new THREE.MeshLambertMaterial({ color: TRUNK_COLOR })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length)

  const coneGeoms = [
    new THREE.ConeGeometry(0.85, 2.0, isHigh ? 7 : 5),  // bottom tier, widest
    new THREE.ConeGeometry(0.65, 1.8, isHigh ? 7 : 5),  // middle tier
    new THREE.ConeGeometry(0.45, 1.5, isHigh ? 6 : 5),  // top tier
  ]
  const coneMats = coneGeoms.map(() => new THREE.MeshLambertMaterial({ flatShading: true }))
  const coneMeshes = coneGeoms.map((geo, gi) => {
    const m = new THREE.InstancedMesh(geo, coneMats[gi], positions.length)
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(positions.length * 3), 3)
    return m
  })

  const dummy = new THREE.Object3D()
  const colorObj = new THREE.Color()

  // Terrain height approximation (trees sit on slope)
  function approxTerrainY(absX: number): number {
    const corridorHW = ROAD_WORLD_WIDTH / 2 + 1.0
    const slopeStart = CLIFF_X_BASE + 1.0
    const slopeWidth = 18.0
    if (absX <= corridorHW) return -1.1
    if (absX <= slopeStart) return -1.1 + (absX - corridorHW) / (slopeStart - corridorHW) * 0.6
    const t = Math.min(1, (absX - slopeStart) / slopeWidth)
    return -0.5 + t * t * 7.0
  }

  for (let i = 0; i < positions.length; i++) {
    const t = positions[i]
    const terrainY = approxTerrainY(Math.abs(t.x))
    const rootY = terrainY - 0.2   // slight embed
    const fc = FOLIAGE_COLORS[i % FOLIAGE_COLORS.length]
    const s = t.s

    // Trunk
    dummy.position.set(t.x, rootY + 0.5 * s, t.z)
    dummy.scale.set(s, s, s)
    dummy.rotation.y = i * 1.7
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)

    // Three cone tiers
    const tierOffsets = [0.8 * s, 1.9 * s, 2.9 * s]
    const tierScales  = [s, s * 0.88, s * 0.74]
    for (let tier = 0; tier < 3; tier++) {
      const fc2 = FOLIAGE_COLORS[(i + tier * 2) % FOLIAGE_COLORS.length]
      colorObj.setHex(fc2)
      dummy.position.set(t.x, rootY + tierOffsets[tier], t.z)
      dummy.scale.setScalar(tierScales[tier])
      dummy.rotation.y = i * 1.7 + tier * 0.5
      dummy.updateMatrix()
      coneMeshes[tier].setMatrixAt(i, dummy.matrix)
      coneMeshes[tier].setColorAt(i, colorObj)
    }
    void fc  // suppress unused warning
  }

  trunkMesh.instanceMatrix.needsUpdate = true
  parent.add(trunkMesh)

  for (const m of coneMeshes) {
    m.instanceMatrix.needsUpdate = true
    m.instanceColor!.needsUpdate = true
    parent.add(m)
  }
}

// ─── 5b. Forested canopy band — a dense billboard-style ridge of treetops ────
// Placed high on the slopes to ensure green is always visible above the cliffs
function buildForestCanopy(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(113)
  // These are just clusters of spheres/cones high on the hillside
  const count = Math.max(1, Math.round(120 * density))
  const geo = new THREE.SphereGeometry(1, 5, 4)
  const mat = new THREE.MeshLambertMaterial({ flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)

  const dummy = new THREE.Object3D()
  const colorObj = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    // Place high on slopes, clearly visible above cliff line
    const xDist = CLIFF_X_BASE + 6.0 + rng() * 20.0
    const x = side * xDist

    const slopeStart = CLIFF_X_BASE + 1.0
    const t = Math.min(1, (xDist - slopeStart) / 18.0)
    const terrainY = -0.5 + t * t * 7.0

    const radius = 1.0 + rng() * 1.2
    colorObj.setHex(FOLIAGE_COLORS[i % FOLIAGE_COLORS.length])

    dummy.position.set(x, terrainY + radius * 0.8 + 1.5, z)
    dummy.scale.set(radius, radius * 1.2, radius)
    dummy.rotation.y = rng() * Math.PI * 2
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
    im.setColorAt(i, colorObj)
  }

  im.instanceMatrix.needsUpdate = true
  im.instanceColor!.needsUpdate = true
  parent.add(im)
}

// ─── 5c. Bushes ───────────────────────────────────────────────────────────────
function buildBushes(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(61)
  const count = Math.max(1, Math.round(120 * density))

  const geo = new THREE.IcosahedronGeometry(1, 1)
  const mat = new THREE.MeshLambertMaterial({ flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)

  const colorObj = new THREE.Color()
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    // Mostly in the path verge and just beyond railings — visible ground cover
    const xNorm = rng()
    const x = side * (RAILING_X * 0.3 + xNorm * (CLIFF_X_BASE + 4.0))
    const sx = 0.25 + rng() * 0.5
    const sy = sx * (0.4 + rng() * 0.35)
    const sz = 0.25 + rng() * 0.5
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

// ─── 5d. Grass tufts — dense near path edges ─────────────────────────────────
function buildGrassTufts(parent: THREE.Object3D, density: number): void {
  if (QUALITY_TIER === 'low') return
  const rng = makeLCG(79)
  const count = Math.max(1, Math.round(300 * density))

  const geo = new THREE.ConeGeometry(0.10, 0.30, 4)
  const mat = new THREE.MeshLambertMaterial({ color: 0x5a8a30, flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    // Spread from railing out to cliff base
    const x = side * (RAILING_X * 0.1 + rng() * (CLIFF_X_BASE + 2.0))
    dummy.position.set(x, -1.0, z)
    dummy.scale.set(1, 0.7 + rng() * 0.6, 1)
    dummy.rotation.set(0, rng() * Math.PI * 2, (rng() - 0.5) * 0.35)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 5e. Ferns — medium-sized ground ferns along the gorge banks ─────────────
function buildFerns(parent: THREE.Object3D, density: number): void {
  if (QUALITY_TIER === 'low') return
  const rng = makeLCG(97)
  const count = Math.max(1, Math.round(100 * density))

  // Simple flat crossed quads suggest fern fronds
  const geo = new THREE.PlaneGeometry(0.6, 0.4)
  const mat = new THREE.MeshLambertMaterial({ color: FERN_COLOR, side: THREE.DoubleSide })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const x = side * (RAILING_X + 0.3 + rng() * (CLIFF_X_BASE + 1.5))
    dummy.position.set(x, -0.88, z)
    dummy.scale.set(0.8 + rng() * 0.6, 0.8 + rng() * 0.5, 1)
    dummy.rotation.set(-Math.PI / 2 + (rng() - 0.5) * 0.6, rng() * Math.PI * 2, 0)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 5f. Wildflowers — tiny colored instanced quads ──────────────────────────
function buildWildflowers(parent: THREE.Object3D, density: number): void {
  if (QUALITY_TIER === 'low') return
  const rng = makeLCG(131)
  const count = Math.max(1, Math.round(180 * density))

  // Use a flat box to suggest a flower head
  const geo = new THREE.BoxGeometry(0.15, 0.15, 0.05)
  const mat = new THREE.MeshLambertMaterial({ flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)

  const dummy = new THREE.Object3D()
  const colorObj = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const x = side * (RAILING_X * 0.3 + rng() * (CLIFF_X_BASE + 1.0))
    dummy.position.set(x, -0.78, z)
    dummy.scale.set(1, 1 + rng() * 0.5, 1)
    dummy.rotation.set(0, rng() * Math.PI * 2, (rng() - 0.5) * 0.2)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
    colorObj.setHex(FLOWER_COLORS[i % FLOWER_COLORS.length])
    im.setColorAt(i, colorObj)
  }
  im.instanceMatrix.needsUpdate = true
  im.instanceColor!.needsUpdate = true
  parent.add(im)
}

// ─── 5g. Fallen logs — mossy logs on the banks ───────────────────────────────
function buildFallenLogs(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(151)
  const count = Math.max(1, Math.round(20 * density))
  const mat = new THREE.MeshLambertMaterial({ color: LOG_COLOR, flatShading: true })

  const dummy = new THREE.Object3D()
  const logGeo = new THREE.CylinderGeometry(0.14, 0.18, 2.0, 6)
  const im = new THREE.InstancedMesh(logGeo, mat, count)

  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const x = side * (CLIFF_X_BASE - 0.5 + rng() * 3.0)
    dummy.position.set(x, -0.88, z)
    dummy.scale.set(1, 1, 1)
    // Logs lie mostly along track axis, sometimes askew
    dummy.rotation.set(Math.PI / 2, 0, (rng() - 0.5) * 0.8)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 5h. Mossy rocks ─────────────────────────────────────────────────────────
function buildMossyRocks(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(167)
  const count = Math.max(1, Math.round(40 * density))
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = new THREE.MeshLambertMaterial({ color: MOSS_COLOR, flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const x = side * (RAILING_X + 0.2 + rng() * (CLIFF_X_BASE + 0.5))
    const scale = 0.15 + rng() * 0.35
    dummy.position.set(x, -0.9 + scale * 0.4, z)
    dummy.scale.set(scale * 1.3, scale * 0.8, scale * 1.1)
    dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI)
    dummy.updateMatrix()
    im.setMatrixAt(i, dummy.matrix)
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 6. Boulders ─────────────────────────────────────────────────────────────
function buildBoulders(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(31)

  const count = Math.max(1, Math.round(60 * density))
  const boulderDefsA: Array<{ x: number; y: number; z: number; r: number }> = []
  const boulderDefsB: Array<{ x: number; y: number; z: number; r: number }> = []

  for (let i = 0; i < count; i++) {
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const side = rng() > 0.5 ? 1 : -1
    const x = side * (RAILING_X + 0.2 + rng() * (CLIFF_X_BASE + 1.5))
    const r = 0.2 + rng() * 0.55
    const def = { x, y: r * 0.4 - 0.2, z, r }
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

// ─── 7. Distant mountains — more layers, bigger, visible above fog line ───────
function buildMountains(parent: THREE.Object3D): void {
  // Near ridge — forest-green peaks just behind slopes
  const nearDefs = [
    { x: -18, z:  -25, scale: 1.0 },
    { x: -26, z:  -90, scale: 1.3 },
    { x:  20, z:  -60, scale: 1.1 },
    { x:  28, z: -160, scale: 1.4 },
    { x: -22, z: -220, scale: 1.2 },
    { x:  26, z: -270, scale: 1.5 },
    { x: -20, z: -330, scale: 1.1 },
    { x:  22, z: -380, scale: 1.3 },
  ]
  // Mid-distance peaks — more neutral grey-green
  const midDefs = [
    { x: -38, z:  -70, scale: 2.0 },
    { x:  42, z: -130, scale: 2.2 },
    { x: -36, z: -240, scale: 1.8 },
    { x:  40, z: -300, scale: 2.1 },
    { x: -40, z: -360, scale: 1.9 },
    { x:  38, z: -410, scale: 2.0 },
  ]
  // Far peaks — cool blue-grey silhouettes
  const farDefs = [
    { x: -55, z:  -50, scale: 2.8 },
    { x:  60, z: -100, scale: 3.0 },
    { x: -58, z: -200, scale: 3.2 },
    { x:  55, z: -300, scale: 2.9 },
    { x: -50, z: -380, scale: 3.1 },
  ]

  function addPeaks(defs: typeof nearDefs, color: number): void {
    const mat = new THREE.MeshLambertMaterial({ color, flatShading: true })
    for (const def of defs) {
      const geo = new THREE.ConeGeometry(5.0 * def.scale, 10 * def.scale, 7)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(def.x, 4 * def.scale, def.z)
      parent.add(mesh)
    }
  }

  addPeaks(nearDefs,  MOUNTAIN_COLOR_A)
  addPeaks(midDefs,   0x6a8070)
  addPeaks(farDefs,   MOUNTAIN_COLOR_B)
}

// ─── 8. Sky dome — richer gradient ───────────────────────────────────────────
function buildSkyDome(parent: THREE.Object3D): void {
  const isHigh = QUALITY_TIER !== 'low'
  const segs = isHigh ? 20 : 10
  const geo = new THREE.SphereGeometry(300, segs, isHigh ? 12 : 7)

  const pos = geo.attributes.position as THREE.BufferAttribute
  const vCount = pos.count
  const colArr = new Float32Array(vCount * 3)
  const cHorizon = hexToRGB01(SKY_HORIZON)
  const cMid     = hexToRGB01(0x78b8d5)
  const cZenith  = hexToRGB01(SKY_ZENITH)
  for (let i = 0; i < vCount; i++) {
    const y = pos.getY(i)
    const t = Math.max(0, y / 300)
    // Three-stop gradient: horizon → mid-sky → zenith
    const c = t < 0.4
      ? lerpColor(cHorizon, cMid, t / 0.4)
      : lerpColor(cMid, cZenith, (t - 0.4) / 0.6)
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

function buildLandmarkGorge(parent: THREE.Object3D, z: number): void {
  const rockMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const woodMat  = new THREE.MeshLambertMaterial({ color: WOOD_COLOR })

  const archX = -(RAILING_X + 2.5)

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, 1.4), rockMat)
  leftPillar.position.set(archX - 1.0, 2.75, z)
  parent.add(leftPillar)

  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.4), rockMat)
  rightPillar.position.set(archX + 1.0, 2.25, z)
  parent.add(rightPillar)

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 1.2), darkMat)
  lintel.position.set(archX, 5.3, z)
  parent.add(lintel)

  const crag = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 0.9), rockMat)
  crag.position.set(archX + 0.3, 6.0, z - 0.2)
  parent.add(crag)

  const railGeo = new THREE.BoxGeometry(0.1, 3.5, 0.1)
  const leanTilt = 0.22
  const ladderX = archX + 0.9

  const railL = new THREE.Mesh(railGeo, woodMat)
  railL.position.set(ladderX - 0.25, 1.75, z - 0.5)
  railL.rotation.z = leanTilt
  parent.add(railL)

  const railR = new THREE.Mesh(railGeo, woodMat)
  railR.position.set(ladderX + 0.25, 1.75, z - 0.5)
  railR.rotation.z = leanTilt
  parent.add(railR)

  const rungGeo = new THREE.BoxGeometry(0.5, 0.08, 0.08)
  for (let r = 0; r < 5; r++) {
    const rung = new THREE.Mesh(rungGeo, woodMat)
    rung.position.set(ladderX, 0.4 + r * 0.65, z - 0.5)
    rung.rotation.z = leanTilt
    parent.add(rung)
  }

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

function buildLandmarkWaterfall(
  parent: THREE.Object3D,
  z: number,
  handle: SlovakWaterHandle,
): void {
  const rockMat    = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat    = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const splashMat  = new THREE.MeshLambertMaterial({ color: SPLASH_COLOR, transparent: true, opacity: 0.75 })

  const wfX = RAILING_X + 2.8

  const cliff = new THREE.Mesh(new THREE.BoxGeometry(3.5, 9.0, 1.8), rockMat)
  cliff.position.set(wfX, 4.5, z)
  parent.add(cliff)

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.2), darkMat)
  ledge.position.set(wfX - 0.3, 6.0, z - 0.7)
  parent.add(ledge)

  const cap = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.0, 2.2), rockMat)
  cap.position.set(wfX, 9.5, z)
  parent.add(cap)

  const wfGeo = new THREE.PlaneGeometry(1.2, 8.5, 1, 18)
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
  wfMesh.position.set(wfX - 0.1, 4.5, z - 0.95)
  parent.add(wfMesh)

  const wfBaseY = new Float32Array(wfCount)
  for (let i = 0; i < wfCount; i++) wfBaseY[i] = wfPos.getY(i)
  handle.waterfallEntries.push({ geo: wfGeo, baseY: wfBaseY })

  const pool = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), splashMat)
  pool.position.set(wfX - 0.1, 0.06, z - 0.8)
  parent.add(pool)

  const boulderMat = new THREE.MeshLambertMaterial({ color: BOULDER_COLOR_A, flatShading: true })
  const b1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), boulderMat)
  b1.position.set(wfX - 1.2, 0.3, z - 0.6)
  parent.add(b1)
  const b2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), boulderMat)
  b2.position.set(wfX + 1.0, 0.2, z - 0.5)
  parent.add(b2)
}

function buildLandmarkViewpoint(parent: THREE.Object3D, z: number): void {
  const rockMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_ROCK, flatShading: true })
  const darkMat  = new THREE.MeshLambertMaterial({ color: LANDMARK_DARK, flatShading: true })
  const capMat   = new THREE.MeshLambertMaterial({ color: CLIFF_STRATA_C, flatShading: true })

  const vpX = -(RAILING_X + 3.5)

  const column = new THREE.Mesh(new THREE.BoxGeometry(2.8, 7.0, 2.4), rockMat)
  column.position.set(vpX, 3.5, z)
  parent.add(column)

  const platform = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 3.0), capMat)
  platform.position.set(vpX + 0.5, 7.35, z - 0.5)
  parent.add(platform)

  const back = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.5, 1.4), darkMat)
  back.position.set(vpX - 0.2, 8.8, z + 0.5)
  parent.add(back)

  const crag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), rockMat)
  crag.position.set(vpX + 0.2, 10.2, z + 0.3)
  parent.add(crag)

  const lip = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 0.18), darkMat)
  lip.position.set(vpX + 0.5, 7.6, z - 2.0)
  parent.add(lip)

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
  buildMossyRocks(parent, TREE_DENSITY)
  buildFallenLogs(parent, TREE_DENSITY)
  buildTrees(parent, TREE_DENSITY)
  buildForestCanopy(parent, TREE_DENSITY)
  buildBushes(parent, TREE_DENSITY)
  buildGrassTufts(parent, TREE_DENSITY)
  buildFerns(parent, TREE_DENSITY)
  buildWildflowers(parent, TREE_DENSITY)
  buildMountains(parent)
  buildLandmarks(parent, handle)

  return handle
}
