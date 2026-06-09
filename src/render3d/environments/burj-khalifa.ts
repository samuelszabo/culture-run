import * as THREE from 'three'
import {
  ROAD_WORLD_WIDTH,
  TRACK_Z_START,
  TRACK_Z_END,
  TRACK_LENGTH_WORLD,
  TRACK_Z_CENTER,
  toWorldZ,
} from '../world'
import { QUALITY_TIER, TREE_DENSITY } from '../quality'

// ─── Palette ────────────────────────────────────────────────────────────────
const CLOUD_WHITE = 0xffffff
const CLOUD_SHADOW = 0xdfe9f4
const SUN_COLOR = 0xffe3a0
const SKYLINE_COLOR = 0x7fa8c8
const SKYLINE_FAR = 0x9bb9d2

// Rainbow band colours (red→violet), used for the arcs.
const RAINBOW_COLORS = [0xff4d4d, 0xff9a3d, 0xffe23d, 0x4dd24d, 0x3da0ff, 0x4d5dd2, 0x9a4dd2]

// Where the cloud road sits laterally + how far the cloud sea spreads.
const ROAD_HALF = ROAD_WORLD_WIDTH / 2

// ─── LCG helper (deterministic puff layout) ──────────────────────────────────
function makeLCG(seed: number): () => number {
  let s = seed
  return (): number => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── 1. Cloud road — the billowy running surface under the player ────────────
// A continuous band of flattened puffs at y≈0 spanning the whole track. The
// cloud-gap obstacles render holes ON TOP of this, so the band stays unbroken.
function buildCloudRoad(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(2024)

  // Flat base slab so the road never shows sky through the puff gaps.
  const baseGeo = new THREE.BoxGeometry(ROAD_WORLD_WIDTH + 0.6, 0.2, TRACK_LENGTH_WORLD)
  const baseMat = new THREE.MeshLambertMaterial({ color: CLOUD_SHADOW })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.set(0, -0.12, TRACK_Z_CENTER)
  parent.add(base)

  // Billowy puffs packed across the road surface.
  const puffGeo = new THREE.SphereGeometry(0.55, QUALITY_TIER === 'low' ? 5 : 7, QUALITY_TIER === 'low' ? 4 : 5)
  const puffMat = new THREE.MeshLambertMaterial({ color: CLOUD_WHITE, flatShading: true })
  const stepZ = QUALITY_TIER === 'low' ? 1.4 : 0.9
  const rows = Math.max(1, Math.floor((TRACK_LENGTH_WORLD / stepZ) * density))
  const cols = 5
  const count = rows * cols
  const im = new THREE.InstancedMesh(puffGeo, puffMat, count)
  const dummy = new THREE.Object3D()
  let i = 0
  for (let r = 0; r < rows && i < count; r++) {
    const z = TRACK_Z_START - r * stepZ - stepZ / 2
    for (let c = 0; c < cols && i < count; c++) {
      const x = -ROAD_HALF + (ROAD_WORLD_WIDTH / (cols - 1)) * c + (rng() - 0.5) * 0.5
      const s = 0.8 + rng() * 0.7
      dummy.position.set(x, -0.02 + rng() * 0.06, z + (rng() - 0.5) * 0.6)
      dummy.scale.set(s, s * 0.5, s)
      dummy.rotation.y = rng() * Math.PI * 2
      dummy.updateMatrix()
      im.setMatrixAt(i++, dummy.matrix)
    }
  }
  im.instanceMatrix.needsUpdate = true
  parent.add(im)
}

// ─── 2. Cloud sea — side banks receding into the distance both sides ─────────
function buildCloudSea(parent: THREE.Object3D, density: number): void {
  const rng = makeLCG(777)

  // Flat hazy sea plane slightly below the road so the road reads as floating.
  const seaGeo = new THREE.PlaneGeometry(400, TRACK_LENGTH_WORLD + 80)
  const seaMat = new THREE.MeshLambertMaterial({ color: CLOUD_SHADOW })
  const sea = new THREE.Mesh(seaGeo, seaMat)
  sea.rotation.x = -Math.PI / 2
  sea.position.set(0, -1.6, TRACK_Z_CENTER)
  parent.add(sea)

  // Lumpy cloud banks on both sides, beyond the road, rising as fluffy mounds.
  const count = Math.max(1, Math.round(220 * density))
  const geo = new THREE.SphereGeometry(1, QUALITY_TIER === 'low' ? 5 : 6, QUALITY_TIER === 'low' ? 4 : 5)
  const mat = new THREE.MeshLambertMaterial({ color: CLOUD_WHITE, flatShading: true })
  const im = new THREE.InstancedMesh(geo, mat, count)
  im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  for (let n = 0; n < count; n++) {
    const side = rng() > 0.5 ? 1 : -1
    const z = TRACK_Z_START - rng() * TRACK_LENGTH_WORLD
    const x = side * (ROAD_HALF + 2.0 + rng() * 70)
    const r = 1.2 + rng() * 3.5
    dummy.position.set(x, -1.4 + rng() * 1.2, z)
    dummy.scale.set(r, r * (0.45 + rng() * 0.25), r)
    dummy.rotation.y = rng() * Math.PI * 2
    dummy.updateMatrix()
    im.setMatrixAt(n, dummy.matrix)
    // Slightly bluer tint for farther puffs so the sea reads with depth.
    const shade = 0.88 + rng() * 0.12
    color.setRGB(shade, shade, Math.min(1, shade + 0.04))
    im.setColorAt(n, color)
  }
  im.instanceMatrix.needsUpdate = true
  im.instanceColor!.needsUpdate = true
  parent.add(im)
}

// ─── 3. Big low golden sun + distant skyline silhouettes ─────────────────────
function buildSunAndSkyline(parent: THREE.Object3D): void {
  const rng = makeLCG(88)

  // Big amber sun low on the horizon, far ahead down the track.
  const sunGeo = new THREE.CircleGeometry(22, 32)
  const sunMat = new THREE.MeshBasicMaterial({ color: SUN_COLOR })
  const sun = new THREE.Mesh(sunGeo, sunMat)
  sun.position.set(-30, 14, TRACK_Z_END - 90)
  parent.add(sun)

  // Soft glow halo around the sun.
  const glowGeo = new THREE.CircleGeometry(34, 32)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffeec0, transparent: true, opacity: 0.4 })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.set(-30, 14, TRACK_Z_END - 92)
  parent.add(glow)

  // Distant skyscraper tops poking above the cloud sea near the horizon, on
  // both far sides of the track. Tall thin silhouettes.
  const nearMat = new THREE.MeshLambertMaterial({ color: SKYLINE_COLOR, flatShading: true })
  const farMat = new THREE.MeshLambertMaterial({ color: SKYLINE_FAR, flatShading: true })
  const towerCount = 26
  for (let i = 0; i < towerCount; i++) {
    const far = rng() > 0.5
    const side = rng() > 0.5 ? 1 : -1
    const dist = far ? 70 + rng() * 40 : 38 + rng() * 28
    const x = side * dist
    const z = TRACK_Z_START - rng() * (TRACK_LENGTH_WORLD + 40)
    const h = (far ? 6 : 10) + rng() * (far ? 10 : 16)
    const w = 1.0 + rng() * 2.2
    const geo = new THREE.BoxGeometry(w, h, w)
    const tower = new THREE.Mesh(geo, far ? farMat : nearMat)
    // Sit base below the cloud line so only the top shows above the sea.
    tower.position.set(x, -1.6 + h / 2 - 1.5, z)
    parent.add(tower)
  }
}

// ─── 4. Rainbow arcs spanning the track at a few intervals ───────────────────
function buildRainbows(parent: THREE.Object3D): void {
  // Place several arcs down the track. Each is 7 concentric half-torus bands.
  const arcTrackYs = [2500, 7000, 12000, 17000]
  const radius = ROAD_HALF + 3.5
  const segs = QUALITY_TIER === 'low' ? 16 : 28

  for (const ty of arcTrackYs) {
    const z = toWorldZ(ty)
    const group = new THREE.Group()
    group.position.set(0, -1.0, z)
    // Arc plane stands vertical, spanning across the track (X-Y plane).
    for (let band = 0; band < RAINBOW_COLORS.length; band++) {
      const r = radius + band * 0.28
      const geo = new THREE.TorusGeometry(r, 0.13, 5, segs, Math.PI)
      const mat = new THREE.MeshBasicMaterial({
        color: RAINBOW_COLORS[band],
        transparent: true,
        opacity: 0.85,
      })
      const arc = new THREE.Mesh(geo, mat)
      // TorusGeometry's half-sweep opens along +X; no rotation needed for a
      // vertical arch in the X-Y plane spanning the road.
      group.add(arc)
    }
    parent.add(group)
  }
}

// ─── 5. Landmark helpers (poking up through the cloud line) ───────────────────

// Burj Khalifa — the hero: a very tall slender tiered tapered spire with a
// glassy body and a fine needle on top.
function buildBurjKhalifa(parent: THREE.Object3D, x: number, z: number): void {
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x9fc6dc, flatShading: true })
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xbcd9ea })

  const group = new THREE.Group()
  // Sink the base below the cloud line so only the upper tiers show.
  group.position.set(x, -3.0, z)
  parent.add(group)

  const tiers = 7
  let y = 0
  for (let i = 0; i < tiers; i++) {
    const w = 3.2 - i * 0.36
    const h = 2.6
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), glassMat)
    body.position.set(0, y + h / 2, 0)
    body.rotation.y = i * 0.32
    group.add(body)
    // Thin setback trim slab between tiers.
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.15, w * 0.96), trimMat)
    trim.position.set(0, y + h, 0)
    trim.rotation.y = i * 0.32
    group.add(trim)
    y += h
  }

  // Tall slender needle on top.
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.22, 5.0, 6), trimMat)
  needle.position.set(0, y + 2.5, 0)
  group.add(needle)
}

// Burj Al Arab — the sail-shaped hotel: a tall curved triangular sail
// silhouette on a slim mast.
function buildBurjAlArab(parent: THREE.Object3D, x: number, z: number): void {
  const sailMat = new THREE.MeshLambertMaterial({ color: 0xf4f8fc, flatShading: true, side: THREE.DoubleSide })
  const mastMat = new THREE.MeshLambertMaterial({ color: 0xcdd9e2 })

  const group = new THREE.Group()
  group.position.set(x, -2.2, z)
  parent.add(group)

  // Two leaning masts forming the spine of the sail.
  const mastF = new THREE.Mesh(new THREE.BoxGeometry(0.5, 13, 0.5), mastMat)
  mastF.position.set(-0.7, 6.5, 0)
  mastF.rotation.z = 0.1
  group.add(mastF)
  const mastB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 13, 0.5), mastMat)
  mastB.position.set(0.7, 6.5, 0)
  mastB.rotation.z = -0.1
  group.add(mastB)

  // Billowing sail — a tall thin triangle (cone with 3 sides, squashed).
  const sailGeo = new THREE.ConeGeometry(3.6, 12.5, 3)
  const sail = new THREE.Mesh(sailGeo, sailMat)
  sail.scale.set(1, 1, 0.25)
  sail.position.set(0, 6.8, -0.4)
  sail.rotation.y = Math.PI / 6
  group.add(sail)

  // Slim crown mast above.
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.1, 2.4, 5), mastMat)
  crown.position.set(0, 13.5, 0)
  group.add(crown)
}

// Dubai Frame — a giant golden rectangular picture frame: two tall posts joined
// by a top (and partial bottom) bar.
function buildDubaiFrame(parent: THREE.Object3D, x: number, z: number): void {
  const goldMat = new THREE.MeshLambertMaterial({ color: 0xe0a92e, flatShading: true })

  const group = new THREE.Group()
  group.position.set(x, -2.0, z)
  parent.add(group)

  const postH = 12
  const postW = 1.2
  const span = 7.5

  for (const sx of [-span / 2, span / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(postW, postH, postW), goldMat)
    post.position.set(sx, postH / 2, 0)
    group.add(post)
  }

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(span + postW, postW, postW), goldMat)
  topBar.position.set(0, postH, 0)
  group.add(topBar)

  // Short bottom bar segment just above the cloud line.
  const botBar = new THREE.Mesh(new THREE.BoxGeometry(span + postW, postW, postW), goldMat)
  botBar.position.set(0, 2.4, 0)
  group.add(botBar)
}

// ─── Landmark positions (trackY) — fixed by the level design ─────────────────
const LANDMARK_TRACK_Y = {
  burjKhalifa: 4000,
  burjAlArab: 10000,
  dubaiFrame: 15500,
}

function buildLandmarks(parent: THREE.Object3D): void {
  buildBurjKhalifa(parent, -(ROAD_HALF + 5.5), toWorldZ(LANDMARK_TRACK_Y.burjKhalifa))
  buildBurjAlArab(parent, ROAD_HALF + 6.0, toWorldZ(LANDMARK_TRACK_Y.burjAlArab))
  buildDubaiFrame(parent, -(ROAD_HALF + 6.5), toWorldZ(LANDMARK_TRACK_Y.dubaiFrame))
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildBurjKhalifaEnvironment(parent: THREE.Object3D): void {
  buildCloudSea(parent, TREE_DENSITY)
  buildCloudRoad(parent, TREE_DENSITY)
  buildSunAndSkyline(parent)
  buildRainbows(parent)
  buildLandmarks(parent)
}
