import * as THREE from 'three'
import { Collectible, CollectibleKind, GameState, Obstacle, ObstacleKind } from '../game/types'
import { COLLECTIBLE_WORLD_SIZE, OBSTACLE_WORLD_HEIGHTS, obstacleWorldPosition, slovakPathHeight, toWorldSize, toWorldX, toWorldZ } from './world'
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

function makeGorgeWall(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const height = OBSTACLE_WORLD_HEIGHTS['gorge-wall']
  const depth = toWorldSize(35)

  const mainGeo = new THREE.BoxGeometry(width, height, depth)
  const mainMat = new THREE.MeshLambertMaterial({ color: 0x6b6258, flatShading: true })
  geos.push(mainGeo)
  mats.push(mainMat)
  const main = new THREE.Mesh(mainGeo, mainMat)
  main.position.y = height / 2
  group.add(main)

  const jut1Geo = new THREE.BoxGeometry(width * 0.55, height * 0.6, depth * 0.5)
  const jut1Mat = new THREE.MeshLambertMaterial({ color: 0x5a5048, flatShading: true })
  geos.push(jut1Geo)
  mats.push(jut1Mat)
  const jut1 = new THREE.Mesh(jut1Geo, jut1Mat)
  jut1.position.set(width * 0.18, height * 0.7 + height * 0.3, depth * 0.1)
  group.add(jut1)

  const jut2Geo = new THREE.BoxGeometry(width * 0.35, height * 0.35, depth * 0.4)
  const jut2Mat = new THREE.MeshLambertMaterial({ color: 0x6b6258, flatShading: true })
  geos.push(jut2Geo)
  mats.push(jut2Mat)
  const jut2 = new THREE.Mesh(jut2Geo, jut2Mat)
  jut2.position.set(-width * 0.22, height * 0.85 + height * 0.175, -depth * 0.15)
  group.add(jut2)

  return group
}

function makeLadder(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const ladderWidth = Math.min(width, 0.8)
  const length = toWorldSize(90)
  const railH = 0.06
  const railThick = 0.05

  const railMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c })
  mats.push(railMat)

  const railGeo = new THREE.BoxGeometry(railThick, railThick, length)
  geos.push(railGeo)
  const railL = new THREE.Mesh(railGeo, railMat)
  railL.position.set(-ladderWidth * 0.4, railH, 0)
  group.add(railL)
  const railR = new THREE.Mesh(railGeo, railMat)
  railR.position.set(ladderWidth * 0.4, railH, 0)
  group.add(railR)

  const rungMat = new THREE.MeshLambertMaterial({ color: 0xa9744f })
  mats.push(rungMat)
  const rungGeo = new THREE.BoxGeometry(ladderWidth * 0.8, railThick, railThick)
  geos.push(rungGeo)
  const rungCount = 6
  for (let i = 0; i < rungCount; i++) {
    const rung = new THREE.Mesh(rungGeo, rungMat)
    const zPos = -length / 2 + (length / (rungCount - 1)) * i
    rung.position.set(0, railH, zPos)
    group.add(rung)
  }

  return group
}

// A designated climb section: a tall standing ladder against a rock backdrop,
// framed by a wooden arch with a banner and a bright up-arrow, so the player
// clearly sees "you climb up here" before the run hands over to the mini-game.
function makeClimbGate(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const w = Math.min(Math.max(width * 0.7, 0.8), 1.2)
  const H = 2.6

  const backMat = new THREE.MeshLambertMaterial({ color: 0x6a6258, flatShading: true })
  mats.push(backMat)
  const backGeo = new THREE.BoxGeometry(width + 0.2, H + 0.4, 0.3)
  geos.push(backGeo)
  const back = new THREE.Mesh(backGeo, backMat)
  back.position.set(0, (H + 0.4) / 2 - 0.2, -0.4)
  group.add(back)

  const railMat = new THREE.MeshLambertMaterial({ color: 0x8a5a32 })
  mats.push(railMat)
  const railGeo = new THREE.BoxGeometry(0.1, H, 0.1)
  geos.push(railGeo)
  for (const sx of [-w * 0.4, w * 0.4]) {
    const rail = new THREE.Mesh(railGeo, railMat)
    rail.position.set(sx, H / 2, -0.18)
    group.add(rail)
  }
  const rungMat = new THREE.MeshLambertMaterial({ color: 0xb07b46 })
  mats.push(rungMat)
  const rungGeo = new THREE.BoxGeometry(w * 0.9, 0.08, 0.08)
  geos.push(rungGeo)
  const rungN = 7
  for (let i = 0; i < rungN; i++) {
    const rung = new THREE.Mesh(rungGeo, rungMat)
    rung.position.set(0, 0.25 + i * ((H - 0.4) / (rungN - 1)), -0.18)
    group.add(rung)
  }

  // Wooden arch frame.
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2a })
  mats.push(woodMat)
  const postGeo = new THREE.BoxGeometry(0.12, H + 0.3, 0.12)
  geos.push(postGeo)
  for (const sx of [-(width / 2 + 0.1), width / 2 + 0.1]) {
    const post = new THREE.Mesh(postGeo, woodMat)
    post.position.set(sx, (H + 0.3) / 2, 0.1)
    group.add(post)
  }
  const beamGeo = new THREE.BoxGeometry(width + 0.4, 0.16, 0.16)
  geos.push(beamGeo)
  const beam = new THREE.Mesh(beamGeo, woodMat)
  beam.position.set(0, H + 0.25, 0.1)
  group.add(beam)

  const bannerMat = new THREE.MeshLambertMaterial({ color: 0xd11e2a })
  mats.push(bannerMat)
  const bannerGeo = new THREE.BoxGeometry(width * 0.6, 0.4, 0.03)
  geos.push(bannerGeo)
  const banner = new THREE.Mesh(bannerGeo, bannerMat)
  banner.position.set(0, H + 0.02, 0.14)
  group.add(banner)

  // Bright up-arrow (unlit so it pops regardless of lighting).
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd23f })
  mats.push(arrowMat)
  const shaftGeo = new THREE.BoxGeometry(0.16, 0.5, 0.05)
  geos.push(shaftGeo)
  const shaft = new THREE.Mesh(shaftGeo, arrowMat)
  shaft.position.set(0, H + 0.95, 0.22)
  group.add(shaft)
  const headGeo = new THREE.ConeGeometry(0.28, 0.42, 4)
  geos.push(headGeo)
  const head = new THREE.Mesh(headGeo, arrowMat)
  head.position.set(0, H + 1.3, 0.22)
  group.add(head)

  return group
}

// A hole in the cloud road the player must jump. A dark sky/void quad sits flush
// with the surface (with a hint of a distant lower cloud far below), ringed by
// bright white cloud-lip puffs on the near and far edges so it reads instantly
// as "gap — jump here". Built around the local origin; width spans the road.
function makeCloudGap(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const depth = toWorldSize(30)

  // Void floor — slightly darker than the warm sky so it reads as a drop.
  const voidGeo = new THREE.PlaneGeometry(width, depth)
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x4a78a8 })
  geos.push(voidGeo)
  mats.push(voidMat)
  const voidPlane = new THREE.Mesh(voidGeo, voidMat)
  voidPlane.rotation.x = -Math.PI / 2
  voidPlane.position.y = 0.01
  group.add(voidPlane)

  // A faint lower cloud far below, glimpsed through the hole.
  const farGeo = new THREE.PlaneGeometry(width * 0.7, depth * 0.6)
  const farMat = new THREE.MeshBasicMaterial({ color: 0xbcd2e6, transparent: true, opacity: 0.6 })
  geos.push(farGeo)
  mats.push(farMat)
  const far = new THREE.Mesh(farGeo, farMat)
  far.rotation.x = -Math.PI / 2
  far.position.y = -1.4
  group.add(far)

  // Bright cloud-lip puffs lining the near and far rims of the hole.
  const lipGeo = new THREE.SphereGeometry(0.32, 7, 5)
  const lipMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
  geos.push(lipGeo)
  mats.push(lipMat)
  const puffsPerRim = Math.max(3, Math.round(width / 0.7))
  for (const rimZ of [-depth / 2, depth / 2]) {
    for (let i = 0; i < puffsPerRim; i++) {
      const t = puffsPerRim === 1 ? 0.5 : i / (puffsPerRim - 1)
      const px = -width / 2 + t * width
      const puff = new THREE.Mesh(lipGeo, lipMat)
      puff.position.set(px, 0.06, rimZ)
      puff.scale.set(1, 0.55, 0.8)
      group.add(puff)
    }
  }

  return group
}

// A glassy skyscraper top poking up through the clouds — a tall tapered tower
// with rows of little window dots and a slender spire. Lateral-dodge obstacle.
function makeTowerTop(width: number, geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const height = OBSTACLE_WORLD_HEIGHTS['tower-top']
  const baseW = Math.min(width, toWorldSize(150))
  const topW = baseW * 0.55
  const depthB = baseW * 0.9
  const depthT = topW * 0.9

  // Tapered glass body — a cylinder with 4 sides reads as a faceted tower.
  const bodyGeo = new THREE.CylinderGeometry(topW * 0.5, baseW * 0.5, height, 4)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4f8fb5, flatShading: true })
  geos.push(bodyGeo)
  mats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.rotation.y = Math.PI / 4
  body.position.y = height / 2
  group.add(body)

  // Window dots — bright little squares in rows up the front faces.
  const winMat = new THREE.MeshBasicMaterial({ color: 0xd8f0ff })
  mats.push(winMat)
  const winGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02)
  geos.push(winGeo)
  const rows = 7
  const cols = 3
  for (let r = 0; r < rows; r++) {
    const fy = (r + 0.5) / rows
    const wWidth = baseW + (topW - baseW) * fy
    const y = fy * height
    for (let c = 0; c < cols; c++) {
      const fx = c / (cols - 1) - 0.5
      const x = fx * wWidth * 0.6
      const zEdge = (wWidth * 0.45) * (depthB / baseW)
      const front = new THREE.Mesh(winGeo, winMat)
      front.position.set(x, y, zEdge)
      group.add(front)
      const back = new THREE.Mesh(winGeo, winMat)
      back.position.set(x, y, -zEdge)
      group.add(back)
    }
  }

  // Roof slab + spire.
  const roofGeo = new THREE.BoxGeometry(topW * 0.8, 0.12, depthT * 0.8)
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x3a7090 })
  geos.push(roofGeo)
  mats.push(roofMat)
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.y = height + 0.06
  group.add(roof)

  const spireGeo = new THREE.CylinderGeometry(0.015, 0.05, height * 0.28, 5)
  const spireMat = new THREE.MeshLambertMaterial({ color: 0xc9d6dd })
  geos.push(spireGeo)
  mats.push(spireMat)
  const spire = new THREE.Mesh(spireGeo, spireMat)
  spire.position.y = height + height * 0.14
  group.add(spire)

  return group
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

function makeHalusky(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const bowlGeo = new THREE.CylinderGeometry(s * 0.48, s * 0.38, s * 0.3, 12)
  const bowlMat = new THREE.MeshLambertMaterial({ color: 0xf2efe9 })
  geos.push(bowlGeo)
  mats.push(bowlMat)
  const bowl = new THREE.Mesh(bowlGeo, bowlMat)
  bowl.position.y = -s * 0.05
  group.add(bowl)

  const dumplingMat = new THREE.MeshLambertMaterial({ color: 0xe9dca8 })
  mats.push(dumplingMat)
  const dumplingGeo = new THREE.SphereGeometry(s * 0.1, 6, 5)
  geos.push(dumplingGeo)
  const dumplingCount = 5
  for (let i = 0; i < dumplingCount; i++) {
    const d = new THREE.Mesh(dumplingGeo, dumplingMat)
    const angle = (i / dumplingCount) * Math.PI * 2
    d.position.set(Math.cos(angle) * s * 0.22, s * 0.13, Math.sin(angle) * s * 0.22)
    group.add(d)
  }

  const herbMat = new THREE.MeshLambertMaterial({ color: 0x4a7c40 })
  mats.push(herbMat)
  const herbGeo = new THREE.BoxGeometry(s * 0.06, s * 0.04, s * 0.06)
  geos.push(herbGeo)
  for (let i = 0; i < 2; i++) {
    const h = new THREE.Mesh(herbGeo, herbMat)
    h.position.set((i === 0 ? 1 : -1) * s * 0.1, s * 0.2, s * 0.05)
    group.add(h)
  }

  return group
}

function makePstruh(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const bodyGeo = new THREE.SphereGeometry(s * 0.3, 8, 6)
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8a9a7a })
  geos.push(bodyGeo)
  mats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.scale.set(1.5, 0.55, 0.65)
  group.add(body)

  const tailGeo = new THREE.ConeGeometry(s * 0.18, s * 0.28, 4)
  const tailMat = new THREE.MeshLambertMaterial({ color: 0xb8c0bc })
  geos.push(tailGeo)
  mats.push(tailMat)
  const tail = new THREE.Mesh(tailGeo, tailMat)
  tail.rotation.z = -Math.PI / 2
  tail.position.set(-s * 0.52, 0, 0)
  group.add(tail)

  const stripeGeo = new THREE.BoxGeometry(s * 0.6, s * 0.06, s * 0.08)
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xc97a6a })
  geos.push(stripeGeo)
  mats.push(stripeMat)
  const stripe = new THREE.Mesh(stripeGeo, stripeMat)
  stripe.position.set(s * 0.1, s * 0.05, s * 0.18)
  group.add(stripe)

  const eyeGeo = new THREE.SphereGeometry(s * 0.04, 5, 4)
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 })
  geos.push(eyeGeo)
  mats.push(eyeMat)
  const eye = new THREE.Mesh(eyeGeo, eyeMat)
  eye.position.set(s * 0.38, s * 0.08, s * 0.16)
  group.add(eye)

  return group
}

function makeCucoriedky(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const leafGeo = new THREE.BoxGeometry(s * 0.8, s * 0.05, s * 0.7)
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3d7a30 })
  geos.push(leafGeo)
  mats.push(leafMat)
  const leaf = new THREE.Mesh(leafGeo, leafMat)
  leaf.position.y = -s * 0.2
  group.add(leaf)

  const berryMat = new THREE.MeshLambertMaterial({ color: 0x3a4a8c })
  mats.push(berryMat)
  const berryGeo = new THREE.SphereGeometry(s * 0.12, 6, 5)
  geos.push(berryGeo)
  const berryPositions = [
    [0, 0, 0], [-s * 0.2, 0, s * 0.1], [s * 0.18, 0, -s * 0.12],
    [-s * 0.1, s * 0.12, -s * 0.15], [s * 0.08, s * 0.1, s * 0.16],
    [s * 0.22, s * 0.05, s * 0.08],
  ]
  for (const [bx, by, bz] of berryPositions) {
    const b = new THREE.Mesh(berryGeo, berryMat)
    b.position.set(bx, by - s * 0.08, bz)
    group.add(b)
  }

  return group
}

// Dubai pistachio-kunafa chocolate bar — a brown segmented slab with a
// pistachio-green filling layer peeking out and a drizzle on top.
function makeDubaiChoc(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const barGeo = new THREE.BoxGeometry(s * 0.85, s * 0.28, s * 0.5)
  const barMat = new THREE.MeshLambertMaterial({ color: 0x5a3a22 })
  geos.push(barGeo)
  mats.push(barMat)
  const bar = new THREE.Mesh(barGeo, barMat)
  group.add(bar)

  // Pistachio-green filling shown as a cross-section band through the middle.
  const fillGeo = new THREE.BoxGeometry(s * 0.86, s * 0.1, s * 0.52)
  const fillMat = new THREE.MeshLambertMaterial({ color: 0x86b34a })
  geos.push(fillGeo)
  mats.push(fillMat)
  const fill = new THREE.Mesh(fillGeo, fillMat)
  fill.position.y = -s * 0.02
  group.add(fill)

  // Segment grooves on top.
  const grooveMat = new THREE.MeshLambertMaterial({ color: 0x3f2817 })
  mats.push(grooveMat)
  const grooveGeo = new THREE.BoxGeometry(s * 0.04, s * 0.06, s * 0.5)
  geos.push(grooveGeo)
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Mesh(grooveGeo, grooveMat)
    g.position.set(-s * 0.28 + i * s * 0.28, s * 0.15, 0)
    group.add(g)
  }

  // Pistachio drizzle dots on top.
  const drizMat = new THREE.MeshLambertMaterial({ color: 0xa8d860 })
  mats.push(drizMat)
  const drizGeo = new THREE.SphereGeometry(s * 0.05, 5, 4)
  geos.push(drizGeo)
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Mesh(drizGeo, drizMat)
    d.position.set(-s * 0.3 + i * s * 0.2, s * 0.18, (i % 2 === 0 ? 1 : -1) * s * 0.12)
    group.add(d)
  }

  return group
}

// Datle — a cluster of 2-3 glossy brown oblong dates on a small dish.
function makeDatle(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const dishGeo = new THREE.CylinderGeometry(s * 0.46, s * 0.36, s * 0.12, 14)
  const dishMat = new THREE.MeshLambertMaterial({ color: 0xe8ddc8 })
  geos.push(dishGeo)
  mats.push(dishMat)
  const dish = new THREE.Mesh(dishGeo, dishMat)
  dish.position.y = -s * 0.18
  group.add(dish)

  const dateMat = new THREE.MeshLambertMaterial({ color: 0x5b3318 })
  mats.push(dateMat)
  const dateGeo = new THREE.SphereGeometry(s * 0.16, 8, 6)
  geos.push(dateGeo)
  const datePts: Array<[number, number, number]> = [
    [-s * 0.16, 0, s * 0.06],
    [s * 0.17, 0, -s * 0.04],
    [0, s * 0.04, s * 0.18],
  ]
  for (const [px, py, pz] of datePts) {
    const d = new THREE.Mesh(dateGeo, dateMat)
    d.position.set(px, -s * 0.05 + py, pz)
    d.scale.set(0.7, 0.62, 1.5)
    d.rotation.y = px * 2
    group.add(d)
  }

  return group
}

// Luqaimat — a few golden-brown glossy dough balls drizzled with syrup, on a
// tiny plate.
function makeLuqaimat(geos: THREE.BufferGeometry[], mats: THREE.Material[]): THREE.Group {
  const group = new THREE.Group()
  const s = COLLECTIBLE_WORLD_SIZE

  const plateGeo = new THREE.CylinderGeometry(s * 0.46, s * 0.4, s * 0.1, 14)
  const plateMat = new THREE.MeshLambertMaterial({ color: 0xf2ece0 })
  geos.push(plateGeo)
  mats.push(plateMat)
  const plate = new THREE.Mesh(plateGeo, plateMat)
  plate.position.y = -s * 0.2
  group.add(plate)

  const ballMat = new THREE.MeshLambertMaterial({ color: 0xc77f2a })
  mats.push(ballMat)
  const ballGeo = new THREE.SphereGeometry(s * 0.15, 8, 6)
  geos.push(ballGeo)
  const ballPts: Array<[number, number, number]> = [
    [-s * 0.16, 0, -s * 0.1],
    [s * 0.16, 0, -s * 0.08],
    [0, 0, s * 0.16],
    [0, s * 0.18, 0],
  ]
  for (const [px, py, pz] of ballPts) {
    const b = new THREE.Mesh(ballGeo, ballMat)
    b.position.set(px, -s * 0.04 + py, pz)
    group.add(b)
  }

  // Honey-syrup drizzle highlight.
  const syrupMat = new THREE.MeshLambertMaterial({ color: 0xe8a83c })
  mats.push(syrupMat)
  const syrupGeo = new THREE.SphereGeometry(s * 0.04, 5, 4)
  geos.push(syrupGeo)
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(syrupGeo, syrupMat)
    const a = (i / 5) * Math.PI * 2
    d.position.set(Math.cos(a) * s * 0.14, s * 0.12, Math.sin(a) * s * 0.14)
    group.add(d)
  }

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
  } else if (kind === 'gorge-wall') {
    group = makeGorgeWall(width, geos, mats)
  } else if (kind === 'ladder') {
    group = obstacle.climb ? makeClimbGate(width, geos, mats) : makeLadder(width, geos, mats)
  } else if (kind === 'cloud-gap') {
    group = makeCloudGap(width, geos, mats)
  } else if (kind === 'tower-top') {
    group = makeTowerTop(width, geos, mats)
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
  } else if (collectible.kind === 'halusky') {
    group = makeHalusky(geos, mats)
  } else if (collectible.kind === 'pstruh') {
    group = makePstruh(geos, mats)
  } else if (collectible.kind === 'cucoriedky') {
    group = makeCucoriedky(geos, mats)
  } else if (collectible.kind === 'dubai-choc') {
    group = makeDubaiChoc(geos, mats)
  } else if (collectible.kind === 'datle') {
    group = makeDatle(geos, mats)
  } else if (collectible.kind === 'luqaimat') {
    group = makeLuqaimat(geos, mats)
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

    // Hide the climb-gate marker while its mini-game is active — the dedicated
    // climb view renders the ladder there, so the marker would just overlap it.
    if (o.kind === 'ladder' && o.climb && state.climb.active) {
      entry.group.visible = false
      continue
    }

    entry.group.visible = true
    const pos = obstacleWorldPosition(o)
    entry.group.position.x = pos.x
    entry.group.position.z = pos.z
    // Sit on the rolling boulder trail (Slovak level only).
    entry.group.position.y = state.chaser ? slovakPathHeight(o.trackY) : 0

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
      const groundY = state.chaser ? slovakPathHeight(c.trackY) : 0
      entry.group.position.y = groundY + entry.baseY + Math.sin(state.elapsed * 3 + i) * 0.08
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
