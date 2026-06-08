import * as THREE from 'three'
import { Collectible, CollectibleKind, GameState, Obstacle, ObstacleKind } from '../game/types'
import { COLLECTIBLE_WORLD_SIZE, OBSTACLE_WORLD_HEIGHTS, obstacleWorldPosition, toWorldSize, toWorldX, toWorldZ } from './world'
import { loadModel } from './models'
import { ANIM_CULL_DISTANCE } from './quality'

interface ObstacleEntry {
  obstacle: Obstacle
  group: THREE.Group
  normal: THREE.Object3D | null
  warning: THREE.Object3D | null
  blast: THREE.Object3D | null
}

interface CollectibleEntry {
  collectible: Collectible
  group: THREE.Group
  baseY: number
}

export interface EntityPool {
  scene: THREE.Scene
  obstacles: ObstacleEntry[]
  collectibles: CollectibleEntry[]
  geometries: THREE.BufferGeometry[]
  materials: THREE.Material[]
  disposed: boolean
}

const CULL_DISTANCE = 3500

function makeStall(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const height = OBSTACLE_WORLD_HEIGHTS.stall
  const depth = toWorldSize(40)

  const bodyGeo = new THREE.BoxGeometry(width, height * 0.7, depth)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 })
  geos.push(bodyGeo)
  mats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = height * 0.35
  group.add(body)

  const roofGeo = new THREE.BoxGeometry(width * 1.15, height * 0.18, depth * 1.1)
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xffc72c })
  geos.push(roofGeo)
  mats.push(roofMat)
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.y = height * 0.7 + height * 0.09
  group.add(roof)

  return group
}

function makeWall(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const height = OBSTACLE_WORLD_HEIGHTS.wall

  const wallGeo = new THREE.BoxGeometry(width, height, toWorldSize(30))
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x888888 })
  geos.push(wallGeo)
  mats.push(wallMat)
  const wall = new THREE.Mesh(wallGeo, wallMat)
  wall.position.y = height / 2
  group.add(wall)

  return group
}

function makeWalker(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()

  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xe05c00 })
  geos.push(bodyGeo)
  mats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.65
  group.add(body)

  const headGeo = new THREE.SphereGeometry(0.2, 8, 6)
  const headMat = new THREE.MeshLambertMaterial({ color: 0xf5c07a })
  geos.push(headGeo)
  mats.push(headMat)
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.2
  group.add(head)

  const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6)
  const legMat = new THREE.MeshLambertMaterial({ color: 0x336699 })
  geos.push(legGeo)
  mats.push(legMat)
  const legL = new THREE.Mesh(legGeo, legMat)
  legL.position.set(-0.1, 0.25, 0)
  group.add(legL)
  const legR = new THREE.Mesh(legGeo, legMat)
  legR.position.set(0.1, 0.25, 0)
  group.add(legR)

  return group
}

function makeCarrier(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()

  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a7c59 })
  geos.push(bodyGeo)
  mats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.65
  group.add(body)

  const headGeo = new THREE.SphereGeometry(0.2, 8, 6)
  const headMat = new THREE.MeshLambertMaterial({ color: 0xf5c07a })
  geos.push(headGeo)
  mats.push(headMat)
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 1.2
  group.add(head)

  const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6)
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c })
  geos.push(poleGeo)
  mats.push(poleMat)
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.rotation.z = Math.PI / 2
  pole.position.y = 1.05
  group.add(pole)

  const basketGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8)
  const basketMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c })
  geos.push(basketGeo)
  mats.push(basketMat)
  const basketL = new THREE.Mesh(basketGeo, basketMat)
  basketL.position.set(-0.55, 0.9, 0)
  group.add(basketL)
  const basketR = new THREE.Mesh(basketGeo, basketMat)
  basketR.position.set(0.55, 0.9, 0)
  group.add(basketR)

  return group
}

function makeFirecracker(geos: THREE.BufferGeometry[], mats: THREE.Material[]): { group: THREE.Group; normal: THREE.Object3D; warning: THREE.Object3D; blast: THREE.Object3D } {
  const group = new THREE.Group()
  const height = OBSTACLE_WORLD_HEIGHTS.firecracker

  const normalGroup = new THREE.Group()
  const bodyGeo = new THREE.CylinderGeometry(0.14, 0.14, height, 10)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xdd1111 })
  geos.push(bodyGeo)
  mats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = height / 2
  normalGroup.add(body)

  const fuseGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4)
  const fuseMat = new THREE.MeshLambertMaterial({ color: 0x555555 })
  geos.push(fuseGeo)
  mats.push(fuseMat)
  const fuse = new THREE.Mesh(fuseGeo, fuseMat)
  fuse.position.y = height + 0.1
  normalGroup.add(fuse)

  group.add(normalGroup)

  const warnGroup = new THREE.Group()
  const warnBody = new THREE.Mesh(bodyGeo, bodyMat)
  warnBody.position.y = height / 2
  warnGroup.add(warnBody)

  const glowGeo = new THREE.SphereGeometry(0.3, 8, 6)
  const glowMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, transparent: true, opacity: 0.65 })
  geos.push(glowGeo)
  mats.push(glowMat)
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.y = height / 2
  warnGroup.add(glow)
  warnGroup.visible = false
  group.add(warnGroup)

  const blastGroup = new THREE.Group()
  const blastGeo = new THREE.SphereGeometry(0.55, 10, 8)
  const blastMat = new THREE.MeshLambertMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 })
  geos.push(blastGeo)
  mats.push(blastMat)
  const blastMesh = new THREE.Mesh(blastGeo, blastMat)
  blastMesh.position.y = height / 2
  blastGroup.add(blastMesh)
  blastGroup.visible = false
  group.add(blastGroup)

  return { group, normal: normalGroup, warning: warnGroup, blast: blastGroup }
}

function makeNoodles(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const bowlGeo = new THREE.CylinderGeometry(s * 0.5, s * 0.4, s * 0.35, 12)
  const bowlMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  geos.push(bowlGeo)
  mats.push(bowlMat)
  const bowl = new THREE.Mesh(bowlGeo, bowlMat)
  group.add(bowl)

  const noodleMat = new THREE.MeshLambertMaterial({ color: 0xffe0a0 })
  mats.push(noodleMat)
  const noodleGeo = new THREE.CylinderGeometry(0.025, 0.025, s * 0.25, 5)
  geos.push(noodleGeo)
  for (let i = 0; i < 5; i++) {
    const n = new THREE.Mesh(noodleGeo, noodleMat)
    const angle = (i / 5) * Math.PI * 2
    n.position.set(Math.cos(angle) * 0.12, s * 0.22, Math.sin(angle) * 0.12)
    group.add(n)
  }

  return group
}

function makeBaozi(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const baoGeo = new THREE.SphereGeometry(s * 0.42, 10, 8)
  const baoMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 })
  geos.push(baoGeo)
  mats.push(baoMat)
  const bao = new THREE.Mesh(baoGeo, baoMat)
  bao.scale.y = 0.72
  group.add(bao)

  const creaseMat = new THREE.MeshLambertMaterial({ color: 0xddd8cc })
  mats.push(creaseMat)
  const creaseGeo = new THREE.TorusGeometry(s * 0.12, 0.018, 4, 8)
  geos.push(creaseGeo)
  const crease = new THREE.Mesh(creaseGeo, creaseMat)
  crease.position.y = s * 0.28
  crease.rotation.x = Math.PI / 2
  group.add(crease)

  return group
}

function makeTea(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const cupGeo = new THREE.CylinderGeometry(s * 0.32, s * 0.26, s * 0.45, 12)
  const cupMat = new THREE.MeshLambertMaterial({ color: 0x4a7c40 })
  geos.push(cupGeo)
  mats.push(cupMat)
  const cup = new THREE.Mesh(cupGeo, cupMat)
  group.add(cup)

  const handleGeo = new THREE.BoxGeometry(s * 0.1, s * 0.25, s * 0.06)
  const handleMat = new THREE.MeshLambertMaterial({ color: 0x3a6030 })
  geos.push(handleGeo)
  mats.push(handleMat)
  const handle = new THREE.Mesh(handleGeo, handleMat)
  handle.position.set(s * 0.38, 0, 0)
  group.add(handle)

  return group
}

function buildObstacleEntry(
  obstacle: Obstacle,
  scene: THREE.Scene,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): ObstacleEntry {
  const width = toWorldSize(obstacle.w)
  const kind: ObstacleKind = obstacle.kind

  let group: THREE.Group
  let normal: THREE.Object3D | null = null
  let warning: THREE.Object3D | null = null
  let blast: THREE.Object3D | null = null

  if (kind === 'firecracker') {
    const result = makeFirecracker(geos, mats)
    group = result.group
    normal = result.normal
    warning = result.warning
    blast = result.blast
  } else if (kind === 'stall') {
    group = makeStall(width, geos, mats)
  } else if (kind === 'wall') {
    group = makeWall(width, geos, mats)
  } else if (kind === 'walker') {
    group = makeWalker(geos, mats)
  } else {
    group = makeCarrier(geos, mats)
  }

  const pos = obstacleWorldPosition(obstacle)
  group.position.set(pos.x, 0, pos.z)
  scene.add(group)

  return { obstacle, group, normal, warning, blast }
}

function normalizeModel(model: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  model.scale.setScalar(COLLECTIBLE_WORLD_SIZE / maxDim)
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
  model.position.set(-center.x, -center.y, -center.z)
}

// The CC0 Kenney models reference a shared `colormap.png` atlas that isn't
// bundled, so they would render flat-white. Re-colour them in code with
// realistic food colours instead. Single-mesh vessels (bowl, cup) get a
// height-based two-tone (vessel below, contents above); the multi-part steamer
// is coloured per node name.
type FoodPaint =
  | { mode: 'twoTone'; vessel: number; contents: number; frac: number }
  | { mode: 'byNode'; colors: Record<string, number>; fallback: number }

// Only the China foods load Kenney models that need re-colouring; Slovak foods
// are procedural geometry, so this map is partial.
const FOOD_PAINT: Partial<Record<CollectibleKind, FoodPaint>> = {
  // White ceramic bowl with warm noodle broth on top.
  noodles: { mode: 'twoTone', vessel: 0xf2efe9, contents: 0xe6b25a, frac: 0.6 },
  // Pale celadon cup with green tea.
  tea: { mode: 'twoTone', vessel: 0xa7c083, contents: 0x6f8f3f, frac: 0.78 },
  // Woven bamboo steamer; lid slightly lighter than the basket layers.
  baozi: { mode: 'byNode', colors: { lid: 0xd9be8a }, fallback: 0xc8a973 },
}

function paintTwoTone(
  mesh: THREE.Mesh,
  vessel: number,
  contents: number,
  frac: number,
  mats: THREE.Material[],
): void {
  const geo = mesh.geometry
  geo.computeBoundingBox()
  const box = geo.boundingBox!
  const threshold = box.min.y + (box.max.y - box.min.y) * frac
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const low = new THREE.Color(vessel)
  const high = new THREE.Color(contents)
  for (let i = 0; i < pos.count; i++) {
    const c = pos.getY(i) >= threshold ? high : low
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true })
  mesh.material = mat
  mats.push(mat)
}

function paintModel(instance: THREE.Group, kind: CollectibleKind, mats: THREE.Material[]): void {
  const paint = FOOD_PAINT[kind]
  if (!paint) return
  instance.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    if (paint.mode === 'twoTone') {
      paintTwoTone(obj, paint.vessel, paint.contents, paint.frac, mats)
    } else {
      const color = paint.colors[obj.name] ?? paint.fallback
      const mat = new THREE.MeshLambertMaterial({ color })
      obj.material = mat
      mats.push(mat)
    }
  })
}

function swapCollectibleModel(pool: EntityPool, kind: CollectibleKind, model: THREE.Group): void {
  for (const entry of pool.collectibles) {
    if (entry.collectible.kind !== kind) continue
    const instance = model.clone()
    normalizeModel(instance)
    paintModel(instance, kind, pool.materials)
    entry.group.clear()
    entry.group.add(instance)
  }
}

function buildCollectibleEntry(
  collectible: Collectible,
  scene: THREE.Scene,
  geos: THREE.BufferGeometry[],
  mats: THREE.Material[],
): CollectibleEntry {
  const baseY = COLLECTIBLE_WORLD_SIZE * 0.5 + 0.5

  let group: THREE.Group
  if (collectible.kind === 'noodles') {
    group = makeNoodles(geos, mats)
  } else if (collectible.kind === 'baozi') {
    group = makeBaozi(geos, mats)
  } else {
    group = makeTea(geos, mats)
  }

  const x = toWorldX(collectible.x)
  const z = toWorldZ(collectible.trackY)
  group.position.set(x, baseY, z)
  scene.add(group)

  return { collectible, group, baseY }
}

export function createEntities(scene: THREE.Scene, state: GameState): EntityPool {
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []

  const obstacles: ObstacleEntry[] = state.obstacles.map((obstacle) =>
    buildObstacleEntry(obstacle, scene, geometries, materials),
  )

  const collectibles: CollectibleEntry[] = state.collectibles.map((collectible) =>
    buildCollectibleEntry(collectible, scene, geometries, materials),
  )

  const pool: EntityPool = { scene, obstacles, collectibles, geometries, materials, disposed: false }

  // Only these China foods have GLB models; they are both ModelName and CollectibleKind.
  const kinds = ['noodles', 'baozi', 'tea'] as const
  for (const kind of kinds) {
    loadModel(kind).then((model) => {
      if (!model || pool.disposed) return
      swapCollectibleModel(pool, kind, model)
    })
  }

  return pool
}

export function updateEntities(pool: EntityPool, state: GameState): void {
  // Pre-compute blink state once — used by any visible firecracker in warning mode
  const warningBlink = Math.floor(state.elapsed * 8) % 2 === 0

  for (const entry of pool.obstacles) {
    const o = entry.obstacle
    const distanceDelta = Math.abs(o.trackY - state.distance)

    if (distanceDelta > CULL_DISTANCE) {
      entry.group.visible = false
      continue
    }

    entry.group.visible = true
    const pos = obstacleWorldPosition(o)
    entry.group.position.x = pos.x
    entry.group.position.z = pos.z

    if (o.kind === 'firecracker' && entry.normal && entry.warning && entry.blast) {
      // Only update blink state when the obstacle is within the animated/visible range
      if (distanceDelta <= ANIM_CULL_DISTANCE) {
        if (o.warning) {
          entry.normal.visible = false
          entry.blast.visible = false
          entry.warning.visible = warningBlink
        } else if (o.harmless === false) {
          entry.normal.visible = false
          entry.warning.visible = false
          entry.blast.visible = true
        } else {
          entry.normal.visible = true
          entry.warning.visible = false
          entry.blast.visible = false
        }
      }
    }
  }

  for (let i = 0; i < pool.collectibles.length; i++) {
    const entry = pool.collectibles[i]
    const c = entry.collectible
    const distanceDelta = Math.abs(c.trackY - state.distance)

    const withinRange = distanceDelta <= CULL_DISTANCE
    entry.group.visible = withinRange && !c.collected

    // Animate (bob + spin) only within camera-visible range (≤ fog end distance).
    // Items beyond that are hidden by fog anyway; skipping saves sin/float work per frame.
    if (entry.group.visible && distanceDelta <= ANIM_CULL_DISTANCE) {
      entry.group.position.y = entry.baseY + Math.sin(state.elapsed * 3 + i) * 0.08
      entry.group.rotation.y = state.elapsed * 1.2 + i
    }
  }
}

export function disposeEntities(pool: EntityPool): void {
  pool.disposed = true
  for (const entry of pool.obstacles) {
    pool.scene.remove(entry.group)
  }
  for (const entry of pool.collectibles) {
    pool.scene.remove(entry.group)
  }
  for (const geo of pool.geometries) {
    geo.dispose()
  }
  for (const mat of pool.materials) {
    mat.dispose()
  }
}
