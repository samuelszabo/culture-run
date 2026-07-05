import * as THREE from 'three'
import { CLIMB_LANES, GameState, DEATH_PAUSE_SECONDS } from '../game/types'
import {
  CLIMB_LANE_WORLD_DX,
  CLIMB_PLAYER_WORLD_Y,
  playerWorldPosition,
  PLAYER_WORLD_HEIGHT,
  slovakPathHeight,
  toWorldSize,
  toWorldX,
  toWorldZ,
} from './world'

export interface Player3D {
  group: THREE.Group
  body: THREE.Group
  head: THREE.Mesh
  torso: THREE.Mesh
  armLGroup: THREE.Group
  armRGroup: THREE.Group
  legLGroup: THREE.Group
  legRGroup: THREE.Group
  armL: THREE.Mesh
  armR: THREE.Mesh
  legL: THREE.Mesh
  legR: THREE.Mesh
  braidL: THREE.Mesh | null
  braidR: THREE.Mesh | null
  labubuEarL: THREE.Mesh | null
  labubuEarR: THREE.Mesh | null
  labubuEarInnerL: THREE.Mesh | null
  labubuEarInnerR: THREE.Mesh | null
  labubuTeeth: THREE.Mesh[]
  dragonGroup: THREE.Group | null
  dragonSegments: THREE.Mesh[]
  dragonHornL: THREE.Mesh | null
  dragonHornR: THREE.Mesh | null
  dragonEyeL: THREE.Mesh | null
  dragonEyeR: THREE.Mesh | null
  catEarL: THREE.Mesh | null
  catEarR: THREE.Mesh | null
  catSnout: THREE.Mesh | null
  catNose: THREE.Mesh | null
  catTailSegments: THREE.Mesh[]
  catLegs: THREE.Group[]
  catPetGroup: THREE.Group | null
  catPetLegs: THREE.Group[]
  catPetTailSegments: THREE.Mesh[]
  // Bear chaser
  chaserGroup: THREE.Group | null
  chaserLegs: THREE.Group[]
  chaserZOffset: number
  // Bear cub pet
  bearCubGroup: THREE.Group | null
  bearCubLegs: THREE.Group[]
  // Squirrel pet
  squirrelGroup: THREE.Group | null
  squirrelLegs: THREE.Group[]
  squirrelTailSegments: THREE.Mesh[]
  // Kroj cosmetic
  krojGroup: THREE.Group | null
  // Unicorn (quadruped) parts
  unicornManeSegments: THREE.Mesh[]
  unicornTailSegments: THREE.Mesh[]
  // Rainbow-wings cosmetic
  rainbowWingsGroup: THREE.Group | null
  rainbowWingL: THREE.Group | null
  rainbowWingR: THREE.Group | null
  // Rainbow-tail cosmetic
  rainbowTailGroup: THREE.Group | null
  rainbowTailSegments: THREE.Mesh[]
  // Falcon-pet companion
  falconGroup: THREE.Group | null
  falconWingL: THREE.Mesh | null
  falconWingR: THREE.Mesh | null
  // Neko-pet companion (maneki-neko style)
  nekoPetGroup: THREE.Group | null
  nekoPetLegs: THREE.Group[]
  nekoPetTailSegments: THREE.Mesh[]
  // Kitsune-pet companion (fox)
  kitsuneGroup: THREE.Group | null
  kitsuneLegs: THREE.Group[]
  kitsuneTailSegments: THREE.Mesh[]
  // Ninja headband tails (animated)
  ninjaHeadbandTailL: THREE.Mesh | null
  ninjaHeadbandTailR: THREE.Mesh | null
  // Ground contact-shadow (cloud level only): a dark disc on the cloud surface
  // that stays put while the player jumps, so feet/landing spot stay readable.
  shadow: THREE.Mesh | null
  scene: THREE.Scene
}

// Rainbow palette (7 colours), reused for unicorn mane/tail and rainbow cosmetics
const RAINBOW = [
  0xe53935, // red
  0xfb8c00, // orange
  0xfdd835, // yellow
  0x43a047, // green
  0x1e88e5, // blue
  0x3949ab, // indigo
  0x8e24aa, // violet
] as const

// Unicorn colours
const UNICORN_WHITE = 0xfdfdff
const UNICORN_GOLD = 0xf2c14e
const UNICORN_EYE = 0x2b2b40

const H = PLAYER_WORLD_HEIGHT

// Biped proportions
const HEAD_H = H * 0.22
const TORSO_H = H * 0.30
const ARM_H = H * 0.24
const LEG_H = H * 0.26
const ARM_W = H * 0.10
const LEG_W = H * 0.11
const BODY_W = H * 0.32
const BODY_D = H * 0.20

const LEG_Y_BOTTOM = 0
const LEG_Y_TOP = LEG_Y_BOTTOM + LEG_H
const TORSO_Y_BOTTOM = LEG_Y_TOP
const TORSO_Y_TOP = TORSO_Y_BOTTOM + TORSO_H
const HEAD_Y_BOTTOM = TORSO_Y_TOP
const HEAD_Y_CENTER = HEAD_Y_BOTTOM + HEAD_H / 2

// Cat colors
const CAT_ORANGE = 0xf28c28
const CAT_CREAM = 0xfff0d0
const CAT_PINK = 0xf4a0b0
const CAT_STRIPE = 0xc8680a

// Quadruped cat proportions
// Body sits along z-axis; camera is at +z, player runs toward −z
// −z = front of cat (away from camera), +z = rear of cat (toward camera)
const CAT_BODY_L = H * 0.62
const CAT_BODY_H = H * 0.26
const CAT_BODY_W = H * 0.28
const CAT_BODY_Y = H * 0.32        // top of legs = underside of body
const CAT_BODY_Z = H * 0.05        // body center-z (slightly behind world origin)
const CAT_LEG_H = H * 0.30
const CAT_LEG_W = H * 0.10
const CAT_HEAD_S = H * 0.26
// Head is at −z end of body, slightly raised
const CAT_HEAD_Z = -(CAT_BODY_L / 2 + CAT_HEAD_S * 0.35)
const CAT_HEAD_Y = CAT_BODY_Y + CAT_BODY_H * 0.1

// Front and rear leg z positions
const CAT_FRONT_LEG_Z = CAT_HEAD_Z + CAT_HEAD_S * 0.2
const CAT_REAR_LEG_Z = CAT_BODY_Z + CAT_BODY_L * 0.32

// Bear colors
const BEAR_BODY_COLOR = 0x7a4f2a
const BEAR_LIMB_COLOR = 0x6b4420
const BEAR_SNOUT_COLOR = 0xb98a5e

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color })
}

function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color))
}

function makeLimbGroup(mesh: THREE.Mesh, limbHeight: number, pivotY: number): THREE.Group {
  const g = new THREE.Group()
  mesh.position.set(0, -limbHeight / 2, 0)
  g.position.setY(pivotY)
  g.add(mesh)
  return g
}

// Build one quadruped leg group: pivot at body underside (CAT_BODY_Y), leg hangs down
function makeCatLegGroup(x: number, z: number, color: number = CAT_ORANGE): THREE.Group {
  const legMesh = box(CAT_LEG_W, CAT_LEG_H, CAT_LEG_W, color)
  const g = makeLimbGroup(legMesh, CAT_LEG_H, CAT_BODY_Y)
  g.position.set(x, 0, z)
  return g
}

const PET_GRAY = 0x8a8a8a
const PET_WHITE = 0xffffff
const PET_PINK = 0xf4a0b0

function buildCatPet(): { petGroup: THREE.Group; petLegs: THREE.Group[]; petTailSegments: THREE.Mesh[] } {
  const petGroup = new THREE.Group()

  const headMesh = box(CAT_HEAD_S, CAT_HEAD_S, CAT_HEAD_S, PET_GRAY)
  headMesh.position.set(0, CAT_HEAD_Y, CAT_HEAD_Z)
  petGroup.add(headMesh)

  const torsoMesh = box(CAT_BODY_W, CAT_BODY_H, CAT_BODY_L, PET_GRAY)
  torsoMesh.position.set(0, CAT_BODY_Y, CAT_BODY_Z)
  petGroup.add(torsoMesh)

  const earW = H * 0.09
  const earH = H * 0.11
  const earTopY = CAT_HEAD_Y + CAT_HEAD_S / 2 + earH / 2

  const earL = box(earW, earH, earW * 0.5, PET_GRAY)
  earL.position.set(-(CAT_HEAD_S * 0.28), earTopY, CAT_HEAD_Z)
  petGroup.add(earL)

  const earR = box(earW, earH, earW * 0.5, PET_GRAY)
  earR.position.set(CAT_HEAD_S * 0.28, earTopY, CAT_HEAD_Z)
  petGroup.add(earR)

  const earInnerW = earW * 0.55
  const earInnerH = earH * 0.65
  const earInnerL = box(earInnerW, earInnerH, earW * 0.3, PET_PINK)
  earInnerL.position.set(-(CAT_HEAD_S * 0.28), earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.25)
  petGroup.add(earInnerL)

  const earInnerR = box(earInnerW, earInnerH, earW * 0.3, PET_PINK)
  earInnerR.position.set(CAT_HEAD_S * 0.28, earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.25)
  petGroup.add(earInnerR)

  const snoutW = CAT_HEAD_S * 0.55
  const snoutH = CAT_HEAD_S * 0.28
  const snout = box(snoutW, snoutH, H * 0.06, PET_WHITE)
  snout.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.1, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.02)
  petGroup.add(snout)

  const nose = box(H * 0.06, H * 0.04, H * 0.04, PET_PINK)
  nose.position.set(0, CAT_HEAD_Y + CAT_HEAD_S * 0.08, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.03)
  petGroup.add(nose)

  const petLegs: THREE.Group[] = []
  const halfX = CAT_BODY_W / 2 + CAT_LEG_W * 0.1
  const legPositions = [
    [-halfX, CAT_FRONT_LEG_Z],
    [ halfX, CAT_FRONT_LEG_Z],
    [-halfX, CAT_REAR_LEG_Z],
    [ halfX, CAT_REAR_LEG_Z],
  ] as const
  for (const [lx, lz] of legPositions) {
    const legMesh = box(CAT_LEG_W, CAT_LEG_H, CAT_LEG_W, PET_GRAY)
    const lg = makeLimbGroup(legMesh, CAT_LEG_H, CAT_BODY_Y)
    lg.position.set(lx, 0, lz)
    petGroup.add(lg)
    petLegs.push(lg)
  }

  const petTailSegments: THREE.Mesh[] = []
  const tailSegCount = 4
  const tailSegSize0 = H * 0.11
  for (let i = 0; i < tailSegCount; i++) {
    const t = i / (tailSegCount - 1)
    const size = tailSegSize0 * (1 - t * 0.4)
    const color = i === tailSegCount - 1 ? PET_WHITE : PET_GRAY
    const tailSeg = box(size, size, size, color)
    petGroup.add(tailSeg)
    petTailSegments.push(tailSeg)
  }

  petGroup.scale.setScalar(0.5)

  return { petGroup, petLegs, petTailSegments }
}

// Bear chaser / bear cub builder
// Returns a simple upright bear with animatable leg groups
function buildBear(scale: number): { group: THREE.Group; legs: THREE.Group[] } {
  const g = new THREE.Group()

  // Body proportions (relative to H)
  const bearBodyH = H * 0.32
  const bearBodyW = H * 0.35
  const bearBodyD = H * 0.22
  const bearHeadS = H * 0.26
  const bearLegH = H * 0.26
  const bearLegW = H * 0.12
  const bearArmH = H * 0.24
  const bearArmW = H * 0.11

  const bearLegY = 0
  const bearLegYTop = bearLegY + bearLegH
  const bearTorsoYBottom = bearLegYTop
  const bearTorsoYTop = bearTorsoYBottom + bearBodyH
  const bearHeadYCenter = bearTorsoYTop + bearHeadS / 2

  // Torso
  const torso = box(bearBodyW, bearBodyH, bearBodyD, BEAR_BODY_COLOR)
  torso.position.set(0, bearTorsoYBottom + bearBodyH / 2, 0)
  g.add(torso)

  // Belly patch (lighter)
  const bellyW = bearBodyW * 0.55
  const bellyH = bearBodyH * 0.65
  const belly = box(bellyW, bellyH, bearBodyD * 0.1, BEAR_SNOUT_COLOR)
  belly.position.set(0, bearTorsoYBottom + bearBodyH / 2, -(bearBodyD / 2 + bearBodyD * 0.05))
  g.add(belly)

  // Head
  const head = box(bearHeadS * 0.95, bearHeadS, bearHeadS * 0.88, BEAR_BODY_COLOR)
  head.position.set(0, bearHeadYCenter, 0)
  g.add(head)

  // Ears (round, using small boxes on top of head)
  const earS = bearHeadS * 0.30
  const earTopY = bearHeadYCenter + bearHeadS / 2 + earS * 0.3
  const earL = box(earS, earS, earS * 0.6, BEAR_BODY_COLOR)
  earL.position.set(-(bearHeadS * 0.30), earTopY, 0)
  g.add(earL)
  const earR = box(earS, earS, earS * 0.6, BEAR_BODY_COLOR)
  earR.position.set(bearHeadS * 0.30, earTopY, 0)
  g.add(earR)

  // Muzzle/snout on FRONT (−z face)
  const snoutW = bearHeadS * 0.52
  const snoutH = bearHeadS * 0.30
  const snout = box(snoutW, snoutH, H * 0.07, BEAR_SNOUT_COLOR)
  snout.position.set(0, bearHeadYCenter - bearHeadS * 0.08, -(bearHeadS / 2 + H * 0.035))
  g.add(snout)

  // Legs (animatable)
  const legs: THREE.Group[] = []
  const legOffsets = [
    [-bearLegW * 0.7, bearLegYTop, 0] as const,
    [ bearLegW * 0.7, bearLegYTop, 0] as const,
  ]
  for (const [lx, ly, lz] of legOffsets) {
    const legMesh = box(bearLegW, bearLegH, bearLegW, BEAR_LIMB_COLOR)
    const lg = makeLimbGroup(legMesh, bearLegH, ly)
    lg.position.set(lx, 0, lz)
    g.add(lg)
    legs.push(lg)
  }

  // Arms
  const armMeshL = box(bearArmW, bearArmH, bearArmW, BEAR_LIMB_COLOR)
  const armLG = makeLimbGroup(armMeshL, bearArmH, bearTorsoYTop - bearArmH * 0.1)
  armLG.position.setX(-(bearBodyW / 2 + bearArmW / 2))
  g.add(armLG)

  const armMeshR = box(bearArmW, bearArmH, bearArmW, BEAR_LIMB_COLOR)
  const armRG = makeLimbGroup(armMeshR, bearArmH, bearTorsoYTop - bearArmH * 0.1)
  armRG.position.setX(bearBodyW / 2 + bearArmW / 2)
  g.add(armRG)

  g.scale.setScalar(scale)
  return { group: g, legs }
}

// Bear cub pet (small, brown, quadruped style similar to cat pet)
function buildBearCub(): { petGroup: THREE.Group; petLegs: THREE.Group[] } {
  const petGroup = new THREE.Group()

  const headMesh = box(CAT_HEAD_S, CAT_HEAD_S, CAT_HEAD_S, BEAR_BODY_COLOR)
  headMesh.position.set(0, CAT_HEAD_Y, CAT_HEAD_Z)
  petGroup.add(headMesh)

  const torsoMesh = box(CAT_BODY_W, CAT_BODY_H, CAT_BODY_L, BEAR_BODY_COLOR)
  torsoMesh.position.set(0, CAT_BODY_Y, CAT_BODY_Z)
  petGroup.add(torsoMesh)

  // Round ears on top of head
  const earS = H * 0.09
  const earTopY = CAT_HEAD_Y + CAT_HEAD_S / 2 + earS * 0.4
  const earL = box(earS, earS, earS * 0.6, BEAR_BODY_COLOR)
  earL.position.set(-(CAT_HEAD_S * 0.28), earTopY, CAT_HEAD_Z)
  petGroup.add(earL)
  const earR = box(earS, earS, earS * 0.6, BEAR_BODY_COLOR)
  earR.position.set(CAT_HEAD_S * 0.28, earTopY, CAT_HEAD_Z)
  petGroup.add(earR)

  // Snout on −z face
  const snoutW = CAT_HEAD_S * 0.50
  const snoutH = CAT_HEAD_S * 0.28
  const snout = box(snoutW, snoutH, H * 0.06, BEAR_SNOUT_COLOR)
  snout.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.1, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.02)
  petGroup.add(snout)

  const petLegs: THREE.Group[] = []
  const halfX = CAT_BODY_W / 2 + CAT_LEG_W * 0.1
  const legPositions = [
    [-halfX, CAT_FRONT_LEG_Z],
    [ halfX, CAT_FRONT_LEG_Z],
    [-halfX, CAT_REAR_LEG_Z],
    [ halfX, CAT_REAR_LEG_Z],
  ] as const
  for (const [lx, lz] of legPositions) {
    const legMesh = box(CAT_LEG_W, CAT_LEG_H, CAT_LEG_W, BEAR_LIMB_COLOR)
    const lg = makeLimbGroup(legMesh, CAT_LEG_H, CAT_BODY_Y)
    lg.position.set(lx, 0, lz)
    petGroup.add(lg)
    petLegs.push(lg)
  }

  petGroup.scale.setScalar(0.5)
  return { petGroup, petLegs }
}

// Squirrel pet
const SQUIRREL_BODY = 0xa0522d
const SQUIRREL_CREAM = 0xf5e6c8

function buildSquirrel(): { petGroup: THREE.Group; petLegs: THREE.Group[]; tailSegments: THREE.Mesh[] } {
  const petGroup = new THREE.Group()

  // Body (smaller upright rodent)
  const bodyH = H * 0.20
  const bodyW = H * 0.14
  const bodyD = H * 0.12
  const legH = H * 0.14
  const legW = H * 0.07

  const legYTop = legH
  const torsoYBottom = legYTop
  const torsoYCenter = torsoYBottom + bodyH / 2
  const headS = H * 0.13
  const headYCenter = torsoYBottom + bodyH + headS / 2

  // Torso
  const torso = box(bodyW, bodyH, bodyD, SQUIRREL_BODY)
  torso.position.set(0, torsoYCenter, 0)
  petGroup.add(torso)

  // Cream belly
  const belly = box(bodyW * 0.55, bodyH * 0.6, bodyD * 0.12, SQUIRREL_CREAM)
  belly.position.set(0, torsoYCenter, -(bodyD / 2 + bodyD * 0.05))
  petGroup.add(belly)

  // Head
  const headMesh = box(headS * 0.95, headS, headS * 0.85, SQUIRREL_BODY)
  headMesh.position.set(0, headYCenter, 0)
  petGroup.add(headMesh)

  // Small ears
  const earS = headS * 0.28
  const earTopY = headYCenter + headS / 2 + earS * 0.35
  const earL = box(earS, earS * 1.1, earS * 0.5, SQUIRREL_BODY)
  earL.position.set(-headS * 0.28, earTopY, 0)
  petGroup.add(earL)
  const earR = box(earS, earS * 1.1, earS * 0.5, SQUIRREL_BODY)
  earR.position.set(headS * 0.28, earTopY, 0)
  petGroup.add(earR)

  // Snout nub
  const snout = box(headS * 0.38, headS * 0.24, H * 0.04, SQUIRREL_CREAM)
  snout.position.set(0, headYCenter - headS * 0.06, -(headS / 2 + H * 0.02))
  petGroup.add(snout)

  // Legs
  const petLegs: THREE.Group[] = []
  for (const lx of [-legW * 0.6, legW * 0.6]) {
    const legMesh = box(legW, legH, legW, SQUIRREL_BODY)
    const lg = makeLimbGroup(legMesh, legH, legYTop)
    lg.position.set(lx, 0, 0)
    petGroup.add(lg)
    petLegs.push(lg)
  }

  // Bushy tail — curved arc of segments going up and over
  const tailSegments: THREE.Mesh[] = []
  const tailSegCount = 5
  for (let i = 0; i < tailSegCount; i++) {
    const t = i / (tailSegCount - 1)
    const sSize = H * 0.10 * (1 - t * 0.3)
    const seg = box(sSize, sSize, sSize, i < tailSegCount - 1 ? SQUIRREL_BODY : SQUIRREL_CREAM)
    petGroup.add(seg)
    tailSegments.push(seg)
  }

  petGroup.scale.setScalar(0.5)
  return { petGroup, petLegs, tailSegments }
}

// Kroj (Slovak folk costume) — overlay on biped, approximate on cat
function buildKroj(isCat: boolean): THREE.Group {
  const g = new THREE.Group()

  const WHITE = 0xffffff
  const RED = 0xd11e2a
  const BLUE = 0x1f57a4
  const GREEN = 0x2e8b3d

  if (!isCat) {
    // White vest/tunic over torso
    const vestW = BODY_W * 1.08
    const vestH = TORSO_H * 0.75
    const vestD = BODY_D * 1.05
    const vest = box(vestW, vestH, vestD, WHITE)
    vest.position.set(0, TORSO_Y_BOTTOM + TORSO_H * 0.35, 0)
    g.add(vest)

    // Red trim band at bottom of vest
    const trimH = vestH * 0.10
    const redTrim = box(vestW * 1.02, trimH, vestD * 1.02, RED)
    redTrim.position.set(0, TORSO_Y_BOTTOM + trimH / 2, 0)
    g.add(redTrim)

    // Blue embroidery strip (center vertical)
    const embH = vestH * 0.65
    const embW = vestW * 0.10
    const blueEmb = box(embW, embH, vestD * 0.12, BLUE)
    blueEmb.position.set(0, TORSO_Y_BOTTOM + TORSO_H * 0.38, -(vestD / 2))
    g.add(blueEmb)

    // Green side stripe
    const greenStripeL = box(embW * 0.7, embH * 0.8, vestD * 0.08, GREEN)
    greenStripeL.position.set(-vestW * 0.28, TORSO_Y_BOTTOM + TORSO_H * 0.38, -(vestD / 2))
    g.add(greenStripeL)

    const greenStripeR = box(embW * 0.7, embH * 0.8, vestD * 0.08, GREEN)
    greenStripeR.position.set(vestW * 0.28, TORSO_Y_BOTTOM + TORSO_H * 0.38, -(vestD / 2))
    g.add(greenStripeR)

    // Wreath on head (torus ring)
    const wreath = new THREE.Mesh(
      new THREE.TorusGeometry(BODY_W * 0.44, H * 0.028, 6, 12),
      mat(GREEN)
    )
    wreath.position.set(0, HEAD_Y_BOTTOM + HEAD_H + H * 0.01, 0)
    wreath.rotation.x = Math.PI / 2
    g.add(wreath)

    // Small flower decorations on wreath (tiny colored boxes)
    const flowerColors = [RED, BLUE, RED, BLUE, RED]
    for (let i = 0; i < flowerColors.length; i++) {
      const angle = (i / flowerColors.length) * Math.PI * 2
      const r = BODY_W * 0.44
      const flowerS = H * 0.045
      const flower = box(flowerS, flowerS, flowerS, flowerColors[i])
      flower.position.set(
        Math.cos(angle) * r,
        HEAD_Y_BOTTOM + HEAD_H + H * 0.01,
        Math.sin(angle) * r
      )
      g.add(flower)
    }
  } else {
    // Approximate for cat: just put a wreath around the head area
    const wreath = new THREE.Mesh(
      new THREE.TorusGeometry(CAT_HEAD_S * 0.52, H * 0.028, 6, 12),
      mat(0x2e8b3d)
    )
    wreath.position.set(0, CAT_HEAD_Y + CAT_HEAD_S * 0.45, CAT_HEAD_Z)
    wreath.rotation.x = Math.PI / 2
    g.add(wreath)

    const redBand = box(CAT_BODY_W * 1.04, H * 0.04, CAT_BODY_L * 0.20, RED)
    redBand.position.set(0, CAT_BODY_Y + CAT_BODY_H / 2 + H * 0.02, CAT_BODY_Z)
    g.add(redBand)
  }

  return g
}

// Rainbow wings cosmetic — a pair of wings on the player's back, segments
// cycling rainbow colours. Built once and toggled by `state.equipped`.
function buildRainbowWings(isQuad: boolean): {
  wingsGroup: THREE.Group
  wingL: THREE.Group
  wingR: THREE.Group
} {
  const wingsGroup = new THREE.Group()

  // Anchor on the back of the torso.
  const baseY = isQuad ? CAT_BODY_Y + CAT_BODY_H * 0.5 : TORSO_Y_BOTTOM + TORSO_H * 0.55
  const baseZ = isQuad ? CAT_BODY_Z : BODY_D * 0.35
  wingsGroup.position.set(0, baseY, baseZ)

  const featherCount = RAINBOW.length
  const featherW = H * 0.07
  const featherH0 = H * 0.30

  const makeWing = (dir: number): THREE.Group => {
    const wing = new THREE.Group()
    for (let i = 0; i < featherCount; i++) {
      const t = i / (featherCount - 1)
      const fh = featherH0 * (1 - t * 0.45)
      const feather = box(featherW, fh, featherW * 0.4, RAINBOW[i])
      // Fan the feathers outward and upward from the shoulder.
      const spread = H * 0.06 + t * H * 0.22
      feather.position.set(dir * spread, fh * 0.5 - t * H * 0.04, 0)
      feather.rotation.z = dir * (0.2 + t * 0.5)
      wing.add(feather)
    }
    return wing
  }

  const wingL = makeWing(-1)
  const wingR = makeWing(1)
  wingsGroup.add(wingL)
  wingsGroup.add(wingR)

  return { wingsGroup, wingL, wingR }
}

// Rainbow-tail cosmetic — a flowing rainbow trail behind the player, modelled
// on the dragon-tail (segmented trail that sways) but coloured across the rainbow.
function buildRainbowTail(): { tailGroup: THREE.Group; segments: THREE.Mesh[] } {
  const tailGroup = new THREE.Group()
  const segments: THREE.Mesh[] = []
  const segmentCount = 9
  const headSegSize = H * 0.18
  for (let i = 0; i < segmentCount; i++) {
    const t = i / (segmentCount - 1)
    const size = headSegSize * (1 - t * 0.5)
    const color = RAINBOW[i % RAINBOW.length]
    const seg = box(size, size, size, color)
    tailGroup.add(seg)
    segments.push(seg)
  }
  return { tailGroup, segments }
}

// Falcon-pet companion — a small brown bird that flies/follows behind the player.
// Modelled on the cat-pet / bear-cub / squirrel companions.
const FALCON_BODY = 0x6b4f33
const FALCON_BELLY = 0xd8c4a0
const FALCON_BEAK = 0xf2c14e

function buildFalcon(): { petGroup: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh } {
  const petGroup = new THREE.Group()

  const bodyL = H * 0.26
  const bodyH = H * 0.16
  const bodyW = H * 0.14
  const bodyY = H * 0.4

  // Body (pointed toward −z front by tapering not needed; a small box)
  const bodyMesh = box(bodyW, bodyH, bodyL, FALCON_BODY)
  bodyMesh.position.set(0, bodyY, 0)
  petGroup.add(bodyMesh)

  // Pale belly underside
  const belly = box(bodyW * 0.7, bodyH * 0.12, bodyL * 0.7, FALCON_BELLY)
  belly.position.set(0, bodyY - bodyH / 2 - bodyH * 0.04, 0)
  petGroup.add(belly)

  // Head at the −z front
  const headS = H * 0.13
  const headZ = -(bodyL / 2 + headS * 0.3)
  const head = box(headS, headS, headS, FALCON_BODY)
  head.position.set(0, bodyY + bodyH * 0.2, headZ)
  petGroup.add(head)

  // Hooked beak (small gold box, slightly down-angled) on the −z face of head
  const beak = box(H * 0.04, H * 0.05, H * 0.08, FALCON_BEAK)
  beak.position.set(0, bodyY + bodyH * 0.12, headZ - headS / 2 - H * 0.03)
  beak.rotation.x = -0.35
  petGroup.add(beak)

  // Tail feathers at the +z rear
  const tail = box(bodyW * 0.7, H * 0.03, bodyL * 0.5, FALCON_BODY)
  tail.position.set(0, bodyY, bodyL / 2 + bodyL * 0.2)
  petGroup.add(tail)

  // Pointed wings — thin angled boxes, pivoted at the shoulder so they can flap.
  const wingLen = H * 0.30
  const makeWing = (dir: number): THREE.Mesh => {
    const wing = box(wingLen, H * 0.02, bodyL * 0.6, FALCON_BODY)
    // Shift geometry so the inner edge sits at the pivot.
    wing.geometry.translate((dir * wingLen) / 2, 0, 0)
    wing.position.set(dir * bodyW * 0.45, bodyY + bodyH * 0.2, 0)
    petGroup.add(wing)
    return wing
  }
  const wingL = makeWing(-1)
  const wingR = makeWing(1)

  petGroup.scale.setScalar(0.55)
  return { petGroup, wingL, wingR }
}

const NINJA_DARK = 0x1c1c2e
const NINJA_RED = 0xd23b3b

const NEKO_CREAM = 0xfff8f0
const NEKO_COLLAR = 0xd23b3b
const NEKO_BELL = 0xf2c14e

const KITSUNE_ORANGE = 0xe07b39
const KITSUNE_WHITE = 0xfff5e0

function buildNekoPet(): { petGroup: THREE.Group; petLegs: THREE.Group[]; petTailSegments: THREE.Mesh[] } {
  const petGroup = new THREE.Group()

  const headMesh = box(CAT_HEAD_S * 1.05, CAT_HEAD_S, CAT_HEAD_S, NEKO_CREAM)
  headMesh.position.set(0, CAT_HEAD_Y, CAT_HEAD_Z)
  petGroup.add(headMesh)

  const torsoMesh = box(CAT_BODY_W, CAT_BODY_H, CAT_BODY_L, NEKO_CREAM)
  torsoMesh.position.set(0, CAT_BODY_Y, CAT_BODY_Z)
  petGroup.add(torsoMesh)

  const earW = H * 0.065
  const earH = H * 0.15
  const earTopY = CAT_HEAD_Y + CAT_HEAD_S / 2 + earH / 2

  const earL = box(earW, earH, earW * 0.5, NEKO_CREAM)
  earL.position.set(-(CAT_HEAD_S * 0.30), earTopY, CAT_HEAD_Z)
  petGroup.add(earL)

  const earR = box(earW, earH, earW * 0.5, NEKO_CREAM)
  earR.position.set(CAT_HEAD_S * 0.30, earTopY, CAT_HEAD_Z)
  petGroup.add(earR)

  const earInnerW = earW * 0.52
  const earInnerH = earH * 0.68
  const earInnerL = box(earInnerW, earInnerH, earW * 0.3, PET_PINK)
  earInnerL.position.set(-(CAT_HEAD_S * 0.30), earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.28)
  petGroup.add(earInnerL)

  const earInnerR = box(earInnerW, earInnerH, earW * 0.3, PET_PINK)
  earInnerR.position.set(CAT_HEAD_S * 0.30, earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.28)
  petGroup.add(earInnerR)

  const faceZ = CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.01
  const eyeW = CAT_HEAD_S * 0.14
  const eyeH = CAT_HEAD_S * 0.15
  const eyeY = CAT_HEAD_Y + CAT_HEAD_S * 0.10

  for (const ex of [-CAT_HEAD_S * 0.24, CAT_HEAD_S * 0.24]) {
    const sclera = box(eyeW, eyeH, H * 0.025, 0xffffff)
    sclera.position.set(ex, eyeY, faceZ)
    petGroup.add(sclera)
    const pupil = box(eyeW * 0.48, eyeH * 0.60, H * 0.025, 0x1a0d2e)
    pupil.position.set(ex, eyeY, faceZ - H * 0.015)
    petGroup.add(pupil)
  }

  const snoutW = CAT_HEAD_S * 0.50
  const snoutH = CAT_HEAD_S * 0.24
  const snout = box(snoutW, snoutH, H * 0.06, PET_WHITE)
  snout.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.14, faceZ)
  petGroup.add(snout)

  const nose = box(H * 0.055, H * 0.038, H * 0.04, PET_PINK)
  nose.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.04, faceZ - H * 0.015)
  petGroup.add(nose)

  const collarH = H * 0.055
  const collarZ = CAT_BODY_Z - CAT_BODY_L * 0.42
  const collar = box(CAT_BODY_W * 1.04, collarH, H * 0.10, NEKO_COLLAR)
  collar.position.set(0, CAT_BODY_Y + CAT_BODY_H * 0.35, collarZ)
  petGroup.add(collar)

  const bellS = H * 0.065
  const bell = box(bellS, bellS, bellS, NEKO_BELL)
  bell.position.set(0, CAT_BODY_Y + CAT_BODY_H * 0.35 - collarH - bellS * 0.5, collarZ)
  petGroup.add(bell)

  const petLegs: THREE.Group[] = []
  const halfX = CAT_BODY_W / 2 + CAT_LEG_W * 0.1
  const legPositions = [
    [-halfX, CAT_FRONT_LEG_Z],
    [ halfX, CAT_FRONT_LEG_Z],
    [-halfX, CAT_REAR_LEG_Z],
    [ halfX, CAT_REAR_LEG_Z],
  ] as const
  for (const [lx, lz] of legPositions) {
    const legMesh = box(CAT_LEG_W, CAT_LEG_H, CAT_LEG_W, NEKO_CREAM)
    const lg = makeLimbGroup(legMesh, CAT_LEG_H, CAT_BODY_Y)
    lg.position.set(lx, 0, lz)
    petGroup.add(lg)
    petLegs.push(lg)
  }

  const petTailSegments: THREE.Mesh[] = []
  const tailSegCount = 5
  const tailSegSize0 = H * 0.13
  for (let i = 0; i < tailSegCount; i++) {
    const t = i / (tailSegCount - 1)
    const size = tailSegSize0 * (1 - t * 0.42)
    const color = i >= tailSegCount - 1 ? PET_WHITE : NEKO_CREAM
    const tailSeg = box(size, size, size, color)
    petGroup.add(tailSeg)
    petTailSegments.push(tailSeg)
  }

  petGroup.scale.setScalar(0.5)
  return { petGroup, petLegs, petTailSegments }
}

function buildKitsune(): { petGroup: THREE.Group; petLegs: THREE.Group[]; petTailSegments: THREE.Mesh[] } {
  const petGroup = new THREE.Group()

  const kitBodyW = CAT_BODY_W * 0.82

  const headMesh = box(CAT_HEAD_S * 0.96, CAT_HEAD_S, CAT_HEAD_S * 0.94, KITSUNE_ORANGE)
  headMesh.position.set(0, CAT_HEAD_Y, CAT_HEAD_Z)
  petGroup.add(headMesh)

  const torsoMesh = box(kitBodyW, CAT_BODY_H, CAT_BODY_L, KITSUNE_ORANGE)
  torsoMesh.position.set(0, CAT_BODY_Y, CAT_BODY_Z)
  petGroup.add(torsoMesh)

  const belly = box(kitBodyW * 0.65, CAT_BODY_H * 0.70, CAT_BODY_L * 0.85, KITSUNE_WHITE)
  belly.position.set(0, CAT_BODY_Y - CAT_BODY_H * 0.16, CAT_BODY_Z)
  petGroup.add(belly)

  const earW = H * 0.060
  const earH = H * 0.18
  const earTopY = CAT_HEAD_Y + CAT_HEAD_S / 2 + earH / 2

  const earL = box(earW, earH, earW * 0.5, KITSUNE_ORANGE)
  earL.position.set(-(CAT_HEAD_S * 0.28), earTopY, CAT_HEAD_Z)
  petGroup.add(earL)

  const earR = box(earW, earH, earW * 0.5, KITSUNE_ORANGE)
  earR.position.set(CAT_HEAD_S * 0.28, earTopY, CAT_HEAD_Z)
  petGroup.add(earR)

  const earInnerW = earW * 0.48
  const earInnerH = earH * 0.68
  const earInnerL = box(earInnerW, earInnerH, earW * 0.30, KITSUNE_WHITE)
  earInnerL.position.set(-(CAT_HEAD_S * 0.28), earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.28)
  petGroup.add(earInnerL)

  const earInnerR = box(earInnerW, earInnerH, earW * 0.30, KITSUNE_WHITE)
  earInnerR.position.set(CAT_HEAD_S * 0.28, earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.28)
  petGroup.add(earInnerR)

  const faceZ = CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.01
  const eyeW = CAT_HEAD_S * 0.13
  const eyeH = CAT_HEAD_S * 0.11
  const eyeY = CAT_HEAD_Y + CAT_HEAD_S * 0.11

  for (const ex of [-CAT_HEAD_S * 0.23, CAT_HEAD_S * 0.23]) {
    const sclera = box(eyeW, eyeH, H * 0.025, 0xffffff)
    sclera.position.set(ex, eyeY, faceZ)
    petGroup.add(sclera)
    const pupil = box(eyeW * 0.44, eyeH * 0.55, H * 0.025, 0x1a0a00)
    pupil.position.set(ex, eyeY, faceZ - H * 0.015)
    petGroup.add(pupil)
  }

  const snoutBaseW = CAT_HEAD_S * 0.44
  const snoutBaseH = CAT_HEAD_S * 0.24
  const snoutBase = box(snoutBaseW, snoutBaseH, H * 0.07, KITSUNE_WHITE)
  snoutBase.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.08, faceZ - H * 0.02)
  petGroup.add(snoutBase)

  const snoutTipW = CAT_HEAD_S * 0.26
  const snoutTipH = CAT_HEAD_S * 0.16
  const snoutTip = box(snoutTipW, snoutTipH, H * 0.06, KITSUNE_WHITE)
  snoutTip.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.15, faceZ - H * 0.07)
  petGroup.add(snoutTip)

  const noseKit = box(H * 0.048, H * 0.033, H * 0.04, 0x1a0a00)
  noseKit.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.04, faceZ - H * 0.016)
  petGroup.add(noseKit)

  const petLegs: THREE.Group[] = []
  const halfX = kitBodyW / 2 + CAT_LEG_W * 0.1
  const legPositions = [
    [-halfX, CAT_FRONT_LEG_Z],
    [ halfX, CAT_FRONT_LEG_Z],
    [-halfX, CAT_REAR_LEG_Z],
    [ halfX, CAT_REAR_LEG_Z],
  ] as const
  for (const [lx, lz] of legPositions) {
    const legMesh = box(CAT_LEG_W * 0.88, CAT_LEG_H, CAT_LEG_W * 0.88, KITSUNE_ORANGE)
    const lg = makeLimbGroup(legMesh, CAT_LEG_H, CAT_BODY_Y)
    lg.position.set(lx, 0, lz)
    petGroup.add(lg)
    petLegs.push(lg)
  }

  const petTailSegments: THREE.Mesh[] = []
  const tailSegCount = 7
  const tailSegSize0 = H * 0.155
  for (let i = 0; i < tailSegCount; i++) {
    const t = i / (tailSegCount - 1)
    const size = tailSegSize0 * (1 - t * 0.45)
    const color = i >= tailSegCount - 2 ? KITSUNE_WHITE : KITSUNE_ORANGE
    const tailSeg = box(size, size, size, color)
    petGroup.add(tailSeg)
    petTailSegments.push(tailSeg)
  }

  petGroup.scale.setScalar(0.5)
  return { petGroup, petLegs, petTailSegments }
}

export function createPlayer3D(scene: THREE.Scene, state: GameState): Player3D {
  const isCat = state.character === 'cat'
  const isBear = state.character === 'bear'
  const isUnicorn = state.character === 'unicorn'
  const isNinja = state.character === 'ninja'
  // Quadrupeds (cat + unicorn) share the 4-leg layout and animation hooks.
  const isQuad = isCat || isUnicorn
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

  // --- Head ---
  const headColor = isCat ? CAT_ORANGE : isBear ? BEAR_BODY_COLOR : isUnicorn ? UNICORN_WHITE : isNinja ? NINJA_DARK : 0xf5c07a
  const headMesh = box(
    isQuad ? CAT_HEAD_S : BODY_W * 0.88,
    isQuad ? CAT_HEAD_S : HEAD_H,
    isQuad ? CAT_HEAD_S : BODY_D * 0.88,
    headColor,
  )
  if (isQuad) {
    headMesh.position.set(0, CAT_HEAD_Y, CAT_HEAD_Z)
  } else {
    headMesh.position.set(0, HEAD_Y_CENTER, 0)
  }
  body.add(headMesh)

  // Bear-specific head features: ears and muzzle
  if (isBear) {
    const bearEarS = HEAD_H * 0.38
    const bearEarTopY = HEAD_Y_CENTER + HEAD_H / 2 + bearEarS * 0.35
    const bearEarL = box(bearEarS, bearEarS, bearEarS * 0.6, BEAR_BODY_COLOR)
    bearEarL.position.set(-(BODY_W * 0.88 / 2 - bearEarS * 0.2), bearEarTopY, 0)
    body.add(bearEarL)
    const bearEarR = box(bearEarS, bearEarS, bearEarS * 0.6, BEAR_BODY_COLOR)
    bearEarR.position.set(BODY_W * 0.88 / 2 - bearEarS * 0.2, bearEarTopY, 0)
    body.add(bearEarR)

    // Muzzle on FRONT (−z face)
    const muzzleW = BODY_W * 0.88 * 0.52
    const muzzleH = HEAD_H * 0.34
    const muzzle = box(muzzleW, muzzleH, BODY_D * 0.10, BEAR_SNOUT_COLOR)
    muzzle.position.set(0, HEAD_Y_CENTER - HEAD_H * 0.10, -(BODY_D * 0.88 / 2 + BODY_D * 0.05))
    body.add(muzzle)
  }

  let ninjaHeadbandTailL: THREE.Mesh | null = null
  let ninjaHeadbandTailR: THREE.Mesh | null = null

  if (isNinja) {
    const faceZ = -(BODY_D * 0.88 / 2 + BODY_D * 0.05)
    const backZ  =  BODY_D * 0.88 / 2 + BODY_D * 0.05

    const maskH = HEAD_H * 0.34
    const mask = box(BODY_W * 0.88 * 1.01, maskH, BODY_D * 0.88 * 1.01, 0x252538)
    mask.position.set(0, HEAD_Y_CENTER - HEAD_H * 0.13, 0)
    body.add(mask)

    const eyeW = HEAD_H * 0.17
    const eyeH = HEAD_H * 0.14
    const eyeY = HEAD_Y_CENTER + HEAD_H * 0.09
    for (const ex of [-BODY_W * 0.88 * 0.22, BODY_W * 0.88 * 0.22]) {
      const sclera = box(eyeW, eyeH, BODY_D * 0.07, 0xdde8f0)
      sclera.position.set(ex, eyeY, faceZ)
      body.add(sclera)
      const pupil = box(eyeW * 0.44, eyeH * 0.56, BODY_D * 0.06, 0x0d0d1a)
      pupil.position.set(ex, eyeY, faceZ - BODY_D * 0.04)
      body.add(pupil)
    }

    const bandH = HEAD_H * 0.12
    const headband = box(BODY_W * 0.88 * 1.02, bandH, BODY_D * 0.88 * 1.02, NINJA_RED)
    headband.position.set(0, HEAD_Y_CENTER + HEAD_H * 0.30, 0)
    body.add(headband)

    ninjaHeadbandTailL = box(HEAD_H * 0.11, HEAD_H * 0.30, HEAD_H * 0.08, NINJA_RED)
    ninjaHeadbandTailL.position.set(-BODY_W * 0.88 * 0.25, HEAD_Y_CENTER + HEAD_H * 0.14, backZ)
    body.add(ninjaHeadbandTailL)

    ninjaHeadbandTailR = box(HEAD_H * 0.11, HEAD_H * 0.28, HEAD_H * 0.08, NINJA_RED)
    ninjaHeadbandTailR.position.set(BODY_W * 0.88 * 0.25, HEAD_Y_CENTER + HEAD_H * 0.12, backZ)
    body.add(ninjaHeadbandTailR)

    const sashH = TORSO_H * 0.17
    const sash = box(BODY_W * 1.04, sashH, BODY_D * 1.04, NINJA_RED)
    sash.position.set(0, TORSO_Y_BOTTOM + sashH * 0.7, 0)
    body.add(sash)

    const scabbardL = H * 0.36
    const scabbardW = H * 0.055
    const scabbard = box(scabbardW, scabbardL, scabbardW * 0.5, 0x2e1a0a)
    scabbard.position.set(BODY_W * 0.30, TORSO_Y_BOTTOM + TORSO_H * 0.52, BODY_D / 2 + scabbardW * 0.35)
    scabbard.rotation.z = 0.38
    body.add(scabbard)
  }

  // --- Torso ---
  const torsoColor = isCat
    ? CAT_ORANGE
    : isBear
      ? BEAR_BODY_COLOR
      : isUnicorn
        ? UNICORN_WHITE
        : isNinja
          ? NINJA_DARK
          : state.character === 'boy'
            ? 0x3a7bd5
            : 0xe87fac
  const torsoMesh = isQuad
    ? box(CAT_BODY_W, CAT_BODY_H, CAT_BODY_L, torsoColor)
    : box(BODY_W, TORSO_H, BODY_D, torsoColor)
  if (isQuad) {
    torsoMesh.position.set(0, CAT_BODY_Y, CAT_BODY_Z)
  } else {
    torsoMesh.position.set(0, TORSO_Y_BOTTOM + TORSO_H / 2, 0)
  }
  body.add(torsoMesh)

  // Bear belly patch (lighter, on front face of torso)
  if (isBear) {
    const bellyW = BODY_W * 0.58
    const bellyH = TORSO_H * 0.65
    const belly = box(bellyW, bellyH, BODY_D * 0.10, BEAR_SNOUT_COLOR)
    belly.position.set(0, TORSO_Y_BOTTOM + TORSO_H / 2, -(BODY_D / 2 + BODY_D * 0.05))
    body.add(belly)
  }

  // --- Biped limbs (used for boy/girl/bear; created-but-unused for quadrupeds) ---
  const limbSkinColor = isCat ? CAT_ORANGE : isBear ? BEAR_LIMB_COLOR : isUnicorn ? UNICORN_WHITE : isNinja ? NINJA_DARK : 0xf5c07a
  const legColor = isCat ? CAT_ORANGE : isBear ? BEAR_LIMB_COLOR : isUnicorn ? UNICORN_WHITE : isNinja ? NINJA_DARK : 0x2c3e7a

  const armMesh = box(ARM_W, ARM_H, ARM_W, limbSkinColor)
  const armLGroup = makeLimbGroup(armMesh, ARM_H, TORSO_Y_TOP - ARM_H * 0.1)
  if (!isQuad) armLGroup.position.setX(-(BODY_W / 2 + ARM_W / 2))
  body.add(armLGroup)

  const armMeshR = box(ARM_W, ARM_H, ARM_W, limbSkinColor)
  const armRGroup = makeLimbGroup(armMeshR, ARM_H, TORSO_Y_TOP - ARM_H * 0.1)
  if (!isQuad) armRGroup.position.setX(BODY_W / 2 + ARM_W / 2)
  body.add(armRGroup)

  const legMeshL = box(LEG_W, LEG_H, LEG_W, legColor)
  const legLGroup = makeLimbGroup(legMeshL, LEG_H, LEG_Y_TOP)
  if (!isQuad) legLGroup.position.setX(-LEG_W * 0.7)
  body.add(legLGroup)

  const legMeshR = box(LEG_W, LEG_H, LEG_W, legColor)
  const legRGroup = makeLimbGroup(legMeshR, LEG_H, LEG_Y_TOP)
  if (!isQuad) legRGroup.position.setX(LEG_W * 0.7)
  body.add(legRGroup)

  // --- Quadruped 4 legs (cat + unicorn) ---
  // Diagonal trot pairs: [0]=front-left, [1]=front-right, [2]=rear-left, [3]=rear-right
  // FL+RR swing one direction, FR+RL swing opposite — natural quadruped trot
  const catLegs: THREE.Group[] = []
  if (isQuad) {
    const quadLegColor = isUnicorn ? UNICORN_WHITE : CAT_ORANGE
    const halfX = CAT_BODY_W / 2 + CAT_LEG_W * 0.1
    catLegs.push(makeCatLegGroup(-halfX, CAT_FRONT_LEG_Z, quadLegColor))  // 0: front-left
    catLegs.push(makeCatLegGroup( halfX, CAT_FRONT_LEG_Z, quadLegColor))  // 1: front-right
    catLegs.push(makeCatLegGroup(-halfX, CAT_REAR_LEG_Z, quadLegColor))   // 2: rear-left
    catLegs.push(makeCatLegGroup( halfX, CAT_REAR_LEG_Z, quadLegColor))   // 3: rear-right
    for (const lg of catLegs) body.add(lg)
  }

  // --- Girl braids ---
  let braidL: THREE.Mesh | null = null
  let braidR: THREE.Mesh | null = null

  if (state.character === 'girl') {
    const braidW = H * 0.07
    const braidH = H * 0.18
    braidL = box(braidW, braidH, braidW, 0x6b3a2a)
    braidL.position.set(-(BODY_W * 0.88 / 2 + braidW / 2), HEAD_Y_CENTER - HEAD_H * 0.1, 0)
    body.add(braidL)

    braidR = box(braidW, braidH, braidW, 0x6b3a2a)
    braidR.position.set(BODY_W * 0.88 / 2 + braidW / 2, HEAD_Y_CENTER - HEAD_H * 0.1, 0)
    body.add(braidR)
  }

  // --- Labubu cosmetic ---
  let labubuEarL: THREE.Mesh | null = null
  let labubuEarR: THREE.Mesh | null = null
  let labubuEarInnerL: THREE.Mesh | null = null
  let labubuEarInnerR: THREE.Mesh | null = null
  const labubuTeeth: THREE.Mesh[] = []

  if (state.equipped.includes('labubu')) {
    const earW = H * 0.09
    const earH = H * 0.22
    const innerW = H * 0.05
    const innerH = H * 0.14
    const earColor = 0xf5f0e0
    const innerColor = 0xf4a0b0

    if (isQuad) {
      // Ears anchor to quadruped head — top-front (−z) face, slightly inset from head sides
      const earTopY = CAT_HEAD_Y + CAT_HEAD_S / 2 + earH / 2 - earH * 0.15
      labubuEarL = box(earW, earH, earW * 0.6, earColor)
      labubuEarL.position.set(-(CAT_HEAD_S * 0.25), earTopY, CAT_HEAD_Z)
      body.add(labubuEarL)

      labubuEarR = box(earW, earH, earW * 0.6, earColor)
      labubuEarR.position.set(CAT_HEAD_S * 0.25, earTopY, CAT_HEAD_Z)
      body.add(labubuEarR)

      // Inner pink on −z face (front of cat, away from camera)
      labubuEarInnerL = box(innerW, innerH, earW * 0.4, innerColor)
      labubuEarInnerL.position.set(-(CAT_HEAD_S * 0.25), earTopY, CAT_HEAD_Z - earW * 0.25)
      body.add(labubuEarInnerL)

      labubuEarInnerR = box(innerW, innerH, earW * 0.4, innerColor)
      labubuEarInnerR.position.set(CAT_HEAD_S * 0.25, earTopY, CAT_HEAD_Z - earW * 0.25)
      body.add(labubuEarInnerR)

      // Teeth on −z face of cat head
      const toothCount = 5
      const toothW = H * 0.045
      const toothH = H * 0.03
      const toothsStartX = -(toothCount * toothW) / 2 + toothW / 2
      const teethY = CAT_HEAD_Y - CAT_HEAD_S * 0.1

      for (let i = 0; i < toothCount; i++) {
        const tooth = box(toothW * 0.85, toothH, toothW * 0.5, 0xffffff)
        tooth.position.set(toothsStartX + i * toothW, teethY, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.01)
        body.add(tooth)
        labubuTeeth.push(tooth)
      }
    } else {
      labubuEarL = box(earW, earH, earW * 0.6, earColor)
      labubuEarL.position.set(-(BODY_W * 0.88 / 2 - earW * 0.1), HEAD_Y_BOTTOM + HEAD_H + earH / 2 - HEAD_H * 0.1, 0)
      body.add(labubuEarL)

      labubuEarR = box(earW, earH, earW * 0.6, earColor)
      labubuEarR.position.set(BODY_W * 0.88 / 2 - earW * 0.1, HEAD_Y_BOTTOM + HEAD_H + earH / 2 - HEAD_H * 0.1, 0)
      body.add(labubuEarR)

      labubuEarInnerL = box(innerW, innerH, earW * 0.4, innerColor)
      labubuEarInnerL.position.set(-(BODY_W * 0.88 / 2 - earW * 0.1), HEAD_Y_BOTTOM + HEAD_H + earH / 2 - HEAD_H * 0.1 + earH * 0.05, BODY_D * 0.35)
      body.add(labubuEarInnerL)

      labubuEarInnerR = box(innerW, innerH, earW * 0.4, innerColor)
      labubuEarInnerR.position.set(BODY_W * 0.88 / 2 - earW * 0.1, HEAD_Y_BOTTOM + HEAD_H + earH / 2 - HEAD_H * 0.1 + earH * 0.05, BODY_D * 0.35)
      body.add(labubuEarInnerR)

      const toothCount = 5
      const toothW = H * 0.045
      const toothH = H * 0.03
      const toothsStartX = -(toothCount * toothW) / 2 + toothW / 2
      const teethY = HEAD_Y_CENTER - HEAD_H * 0.05

      for (let i = 0; i < toothCount; i++) {
        const tooth = box(toothW * 0.85, toothH, toothW * 0.5, 0xffffff)
        tooth.position.set(toothsStartX + i * toothW, teethY, BODY_D * 0.45)
        body.add(tooth)
        labubuTeeth.push(tooth)
      }
    }
  }

  // --- Cat-specific parts: ears, snout, nose, stripes, tail ---
  let catEarL: THREE.Mesh | null = null
  let catEarR: THREE.Mesh | null = null
  let catSnout: THREE.Mesh | null = null
  let catNose: THREE.Mesh | null = null
  const catTailSegments: THREE.Mesh[] = []

  if (isCat) {
    const earW = H * 0.09
    const earH = H * 0.11
    const earTopY = CAT_HEAD_Y + CAT_HEAD_S / 2 + earH / 2
    const earInnerW = earW * 0.55
    const earInnerH = earH * 0.65

    catEarL = box(earW, earH, earW * 0.5, CAT_ORANGE)
    catEarL.position.set(-(CAT_HEAD_S * 0.28), earTopY, CAT_HEAD_Z)
    body.add(catEarL)

    catEarR = box(earW, earH, earW * 0.5, CAT_ORANGE)
    catEarR.position.set(CAT_HEAD_S * 0.28, earTopY, CAT_HEAD_Z)
    body.add(catEarR)

    // Pink inner on −z face (front face, facing away from camera)
    const earInnerL = box(earInnerW, earInnerH, earW * 0.3, CAT_PINK)
    earInnerL.position.set(-(CAT_HEAD_S * 0.28), earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.25)
    body.add(earInnerL)

    const earInnerR = box(earInnerW, earInnerH, earW * 0.3, CAT_PINK)
    earInnerR.position.set(CAT_HEAD_S * 0.28, earTopY + earH * 0.04, CAT_HEAD_Z - earW * 0.25)
    body.add(earInnerR)

    // Snout and nose on −z face of head (front of cat, away from camera)
    const snoutW = CAT_HEAD_S * 0.55
    const snoutH = CAT_HEAD_S * 0.28
    catSnout = box(snoutW, snoutH, H * 0.06, CAT_CREAM)
    catSnout.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.1, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.02)
    body.add(catSnout)

    catNose = box(H * 0.06, H * 0.04, H * 0.04, CAT_PINK)
    catNose.position.set(0, CAT_HEAD_Y + CAT_HEAD_S * 0.08, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.03)
    body.add(catNose)

    // Stripes: wide-x, short-z boxes on top of back
    const stripeW = CAT_BODY_W * 1.02
    const stripeH = H * 0.025
    const stripe1 = box(stripeW, stripeH, CAT_BODY_L * 0.12, CAT_STRIPE)
    stripe1.position.set(0, CAT_BODY_Y + CAT_BODY_H / 2 + stripeH / 2, CAT_BODY_Z - CAT_BODY_L * 0.15)
    body.add(stripe1)

    const stripe2 = box(stripeW, stripeH, CAT_BODY_L * 0.12, CAT_STRIPE)
    stripe2.position.set(0, CAT_BODY_Y + CAT_BODY_H / 2 + stripeH / 2, CAT_BODY_Z + CAT_BODY_L * 0.1)
    body.add(stripe2)

    // Tail: segments from +z rear, curving up and further +z
    const tailSegCount = 4
    const tailSegSize0 = H * 0.11
    for (let i = 0; i < tailSegCount; i++) {
      const t = i / (tailSegCount - 1)
      const size = tailSegSize0 * (1 - t * 0.4)
      const tailSeg = box(size, size, size, CAT_ORANGE)
      body.add(tailSeg)
      catTailSegments.push(tailSeg)
    }
  }

  // --- Unicorn-specific parts: horn, eyes, rainbow mane, rainbow tail ---
  const unicornManeSegments: THREE.Mesh[] = []
  const unicornTailSegments: THREE.Mesh[] = []

  if (isUnicorn) {
    // Gold spiral horn (cone) on the forehead, tilting slightly forward (−z).
    const hornH = CAT_HEAD_S * 0.9
    const hornR = CAT_HEAD_S * 0.16
    const horn = new THREE.Mesh(new THREE.ConeGeometry(hornR, hornH, 7), mat(UNICORN_GOLD))
    horn.position.set(0, CAT_HEAD_Y + CAT_HEAD_S / 2 + hornH * 0.35, CAT_HEAD_Z - CAT_HEAD_S * 0.18)
    horn.rotation.x = -0.35
    body.add(horn)
    // Spiral ridges: a few thin gold rings stacked up the horn.
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(hornR * (0.85 - i * 0.22), hornR * 0.18, 5, 8),
        mat(0xd9a23a),
      )
      const ry = CAT_HEAD_Y + CAT_HEAD_S / 2 + hornH * (0.12 + i * 0.26)
      ring.position.set(0, ry, CAT_HEAD_Z - CAT_HEAD_S * 0.18 - (ry - CAT_HEAD_Y) * 0.18)
      ring.rotation.x = Math.PI / 2 - 0.35
      body.add(ring)
    }

    // Big friendly eyes on the −z face of the head.
    const eyeS = CAT_HEAD_S * 0.18
    const eyeFaceZ = CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.005
    for (const ex of [-CAT_HEAD_S * 0.24, CAT_HEAD_S * 0.24]) {
      const eyeWhite = box(eyeS, eyeS, H * 0.02, 0xffffff)
      eyeWhite.position.set(ex, CAT_HEAD_Y + CAT_HEAD_S * 0.05, eyeFaceZ)
      body.add(eyeWhite)
      const pupil = box(eyeS * 0.5, eyeS * 0.6, H * 0.02, UNICORN_EYE)
      pupil.position.set(ex, CAT_HEAD_Y + CAT_HEAD_S * 0.05, eyeFaceZ - H * 0.005)
      body.add(pupil)
    }

    // Pink snout/nose nub on the −z face.
    const nose = box(CAT_HEAD_S * 0.5, CAT_HEAD_S * 0.22, H * 0.05, 0xf6d2dd)
    nose.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.22, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.02)
    body.add(nose)

    // Flowing rainbow mane: a row of segments running along the neck/top of head,
    // from behind the horn back toward the shoulders. Animated to undulate.
    const maneCount = RAINBOW.length
    for (let i = 0; i < maneCount; i++) {
      const size = H * 0.10 * (1 - i * 0.04)
      const seg = box(size, size, size, RAINBOW[i])
      body.add(seg)
      unicornManeSegments.push(seg)
    }

    // Flowing rainbow tail at the +z rear, cycling the rainbow colours.
    const uTailCount = RAINBOW.length
    for (let i = 0; i < uTailCount; i++) {
      const size = H * 0.12 * (1 - i * 0.07)
      const seg = box(size, size, size, RAINBOW[i])
      body.add(seg)
      unicornTailSegments.push(seg)
    }
  }

  // --- Dragon cosmetic ---
  let dragonGroup: THREE.Group | null = null
  const dragonSegments: THREE.Mesh[] = []
  let dragonHornL: THREE.Mesh | null = null
  let dragonHornR: THREE.Mesh | null = null
  let dragonEyeL: THREE.Mesh | null = null
  let dragonEyeR: THREE.Mesh | null = null

  if (state.equipped.includes('dragon-tail')) {
    dragonGroup = new THREE.Group()
    group.add(dragonGroup)

    const segmentCount = 9
    const segColors = [0xe8192c, 0xf7c325]
    const headSegSize = H * 0.22

    for (let i = 0; i < segmentCount; i++) {
      const t = i / (segmentCount - 1)
      const size = headSegSize * (1 - t * 0.55)
      const color = segColors[i % 2]
      const seg = box(size, size, size, color)
      dragonGroup.add(seg)
      dragonSegments.push(seg)

      if (i % 2 === 0 && i > 0) {
        const finSize = size * 0.45
        const fin = box(finSize, finSize * 0.4, finSize * 0.2, 0x2ecc71)
        fin.position.set(0, size / 2 + finSize * 0.2, 0)
        seg.add(fin)
      }
    }

    const hornH = headSegSize * 0.5
    const hornW = headSegSize * 0.12
    dragonHornL = box(hornW, hornH, hornW, 0xf7c325)
    dragonHornR = box(hornW, hornH, hornW, 0xf7c325)
    dragonSegments[0].add(dragonHornL)
    dragonSegments[0].add(dragonHornR)
    dragonHornL.position.set(-headSegSize * 0.25, headSegSize / 2 + hornH / 2, 0)
    dragonHornR.position.set(headSegSize * 0.25, headSegSize / 2 + hornH / 2, 0)

    const eyeSize = headSegSize * 0.15
    dragonEyeL = box(eyeSize, eyeSize, eyeSize * 0.3, 0xffffff)
    dragonEyeR = box(eyeSize, eyeSize, eyeSize * 0.3, 0xffffff)
    dragonSegments[0].add(dragonEyeL)
    dragonSegments[0].add(dragonEyeR)
    dragonEyeL.position.set(-headSegSize * 0.18, headSegSize * 0.1, headSegSize / 2)
    dragonEyeR.position.set(headSegSize * 0.18, headSegSize * 0.1, headSegSize / 2)
  }

  // --- Cat-pet cosmetic ---
  let catPetGroup: THREE.Group | null = null
  let catPetLegs: THREE.Group[] = []
  let catPetTailSegments: THREE.Mesh[] = []

  if (state.equipped.includes('cat-pet')) {
    const built = buildCatPet()
    catPetGroup = built.petGroup
    catPetLegs = built.petLegs
    catPetTailSegments = built.petTailSegments
    catPetGroup.position.set(-0.45, 0, 1.25)
    group.add(catPetGroup)
  }

  // --- Bear-cub cosmetic ---
  let bearCubGroup: THREE.Group | null = null
  let bearCubLegs: THREE.Group[] = []

  if (state.equipped.includes('bear-cub')) {
    const built = buildBearCub()
    bearCubGroup = built.petGroup
    bearCubLegs = built.petLegs
    bearCubGroup.position.set(-0.45, 0, 1.25)
    group.add(bearCubGroup)
  }

  // --- Squirrel cosmetic ---
  let squirrelGroup: THREE.Group | null = null
  let squirrelLegs: THREE.Group[] = []
  let squirrelTailSegments: THREE.Mesh[] = []

  if (state.equipped.includes('squirrel')) {
    const built = buildSquirrel()
    squirrelGroup = built.petGroup
    squirrelLegs = built.petLegs
    squirrelTailSegments = built.tailSegments
    squirrelGroup.position.set(0.5, 0, 1.05)
    group.add(squirrelGroup)
  }

  // --- Kroj cosmetic ---
  let krojGroup: THREE.Group | null = null

  if (state.equipped.includes('kroj')) {
    krojGroup = buildKroj(isCat)
    body.add(krojGroup)
  }

  // --- Rainbow-wings cosmetic ---
  let rainbowWingsGroup: THREE.Group | null = null
  let rainbowWingL: THREE.Group | null = null
  let rainbowWingR: THREE.Group | null = null

  if (state.equipped.includes('rainbow-wings')) {
    const built = buildRainbowWings(isQuad)
    rainbowWingsGroup = built.wingsGroup
    rainbowWingL = built.wingL
    rainbowWingR = built.wingR
    body.add(rainbowWingsGroup)
  }

  // --- Rainbow-tail cosmetic (modelled on dragon-tail) ---
  let rainbowTailGroup: THREE.Group | null = null
  let rainbowTailSegments: THREE.Mesh[] = []

  if (state.equipped.includes('rainbow-tail')) {
    const built = buildRainbowTail()
    rainbowTailGroup = built.tailGroup
    rainbowTailSegments = built.segments
    group.add(rainbowTailGroup)
  }

  // --- Falcon-pet companion ---
  let falconGroup: THREE.Group | null = null
  let falconWingL: THREE.Mesh | null = null
  let falconWingR: THREE.Mesh | null = null

  if (state.equipped.includes('falcon-pet')) {
    const built = buildFalcon()
    falconGroup = built.petGroup
    falconWingL = built.wingL
    falconWingR = built.wingR
    falconGroup.position.set(0.55, 1.4, 1.3)
    group.add(falconGroup)
  }

  // --- Neko-pet cosmetic ---
  let nekoPetGroup: THREE.Group | null = null
  let nekoPetLegs: THREE.Group[] = []
  let nekoPetTailSegments: THREE.Mesh[] = []

  if (state.equipped.includes('neko-pet')) {
    const built = buildNekoPet()
    nekoPetGroup = built.petGroup
    nekoPetLegs = built.petLegs
    nekoPetTailSegments = built.petTailSegments
    nekoPetGroup.position.set(0.42, 0, 1.25)
    group.add(nekoPetGroup)
  }

  // --- Kitsune-pet cosmetic ---
  let kitsuneGroup: THREE.Group | null = null
  let kitsuneLegs: THREE.Group[] = []
  let kitsuneTailSegments: THREE.Mesh[] = []

  if (state.equipped.includes('kitsune-pet')) {
    const built = buildKitsune()
    kitsuneGroup = built.petGroup
    kitsuneLegs = built.petLegs
    kitsuneTailSegments = built.petTailSegments
    kitsuneGroup.position.set(-0.42, 0, 1.20)
    group.add(kitsuneGroup)
  }

  // --- Bear chaser ---
  let chaserGroup: THREE.Group | null = null
  let chaserLegs: THREE.Group[] = []
  const chaserZOffset = 6.0  // initial offset: 3 lives

  if (state.chaser) {
    const built = buildBear(1.4)
    chaserGroup = built.group
    chaserLegs = built.legs
    scene.add(chaserGroup)
  }

  const pos = playerWorldPosition(state.player.x, state.distance)
  group.position.set(pos.x, 0, pos.z)

  scene.add(group)

  // On the cloud level the white puffs hide where the feet are, making jump
  // timing hard — drop a soft contact-shadow on the cloud surface as a depth cue.
  let shadow: THREE.Mesh | null = null
  const isCloud = state.obstacles.some((o) => o.kind === 'cloud-gap')
  if (isCloud) {
    const shadowGeo = new THREE.CircleGeometry(0.52, 20)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x14202c,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    shadow = new THREE.Mesh(shadowGeo, shadowMat)
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(pos.x, 0.04, pos.z)
    scene.add(shadow)
  }

  return {
    group,
    body,
    head: headMesh,
    torso: torsoMesh,
    armLGroup,
    armRGroup,
    legLGroup,
    legRGroup,
    armL: armMesh,
    armR: armMeshR,
    legL: legMeshL,
    legR: legMeshR,
    braidL,
    braidR,
    labubuEarL,
    labubuEarR,
    labubuEarInnerL,
    labubuEarInnerR,
    labubuTeeth,
    dragonGroup,
    dragonSegments,
    dragonHornL,
    dragonHornR,
    dragonEyeL,
    dragonEyeR,
    catEarL,
    catEarR,
    catSnout,
    catNose,
    catTailSegments,
    catLegs,
    catPetGroup,
    catPetLegs,
    catPetTailSegments,
    chaserGroup,
    chaserLegs,
    chaserZOffset,
    bearCubGroup,
    bearCubLegs,
    squirrelGroup,
    squirrelLegs,
    squirrelTailSegments,
    krojGroup,
    unicornManeSegments,
    unicornTailSegments,
    rainbowWingsGroup,
    rainbowWingL,
    rainbowWingR,
    rainbowTailGroup,
    rainbowTailSegments,
    falconGroup,
    falconWingL,
    falconWingR,
    nekoPetGroup,
    nekoPetLegs,
    nekoPetTailSegments,
    kitsuneGroup,
    kitsuneLegs,
    kitsuneTailSegments,
    ninjaHeadbandTailL,
    ninjaHeadbandTailR,
    shadow,
    scene,
  }
}

export function updatePlayer3D(p: Player3D, state: GameState): void {
  const { group, body, armLGroup, armRGroup, legLGroup, legRGroup, dragonGroup, dragonSegments, catLegs } = p
  const { phase, player, elapsed, distance, deathPauseFor } = state
  const isCat = state.character === 'cat'
  const isUnicorn = state.character === 'unicorn'
  // Quadrupeds (cat + unicorn) share the 4-leg animation hooks.
  const isQuad = isCat || isUnicorn

  // Treat the brief death-pause of a mid-climb hit as still climbing, so the
  // player stays on the ladder instead of dropping to the gate base off-camera.
  const inClimb = phase === 'climbing' || (phase === 'dying' && state.climb.active)

  const pos = playerWorldPosition(player.x, distance)
  // The Slovak boulder trail rolls up and down; the runner rides its height.
  const groundY = state.chaser ? slovakPathHeight(distance) : 0
  // The climbing branch fully owns the player transform (lane x + fixed Y).
  if (!inClimb) {
    group.position.set(pos.x, groundY + toWorldSize(player.jumpHeight), pos.z)
  }

  // Contact-shadow stays on the ground under the player; it shrinks and fades as
  // the player jumps higher, marking both the feet and the landing spot.
  if (p.shadow) {
    const showShadow = !inClimb && (phase === 'running' || phase === 'dying')
    p.shadow.visible = showShadow && group.visible
    if (showShadow) {
      const lift = toWorldSize(player.jumpHeight)
      const k = Math.max(0.45, 1 - lift * 0.55)
      p.shadow.position.set(pos.x, groundY + 0.04, pos.z)
      p.shadow.scale.set(k, k, k)
      ;(p.shadow.material as THREE.MeshBasicMaterial).opacity = 0.4 * k
    }
  }

  const isBlinking = player.invulnerableFor > 0 && Math.floor(elapsed * 10) % 2 === 0
  group.visible = !isBlinking

  body.rotation.x = 0
  body.position.y = 0

  // Biped limb resets — only biped uses these groups
  armLGroup.rotation.x = 0
  armRGroup.rotation.x = 0
  legLGroup.rotation.x = 0
  legRGroup.rotation.x = 0

  // Cat leg resets
  for (const lg of catLegs) lg.rotation.x = 0

  if (inClimb) {
    const c = state.climb
    const gx = toWorldX(c.gapCenter)
    const gz = toWorldZ(c.gateTrackY)
    const laneX = gx + (c.lane - (CLIMB_LANES - 1) / 2) * CLIMB_LANE_WORLD_DX
    // Smooth lateral slide between lanes; fixed height while rungs scroll past.
    group.position.x += (laneX - group.position.x) * 0.3
    group.position.y = CLIMB_PLAYER_WORLD_Y
    group.position.z = gz + 0.1

    // Reaching climb cycle keyed off how far up the player has tapped.
    const reach = Math.sin(c.progress * 0.05)
    if (isQuad) {
      catLegs[0].rotation.x = -0.4 - reach * 0.4
      catLegs[1].rotation.x = -0.4 + reach * 0.4
      catLegs[2].rotation.x = -0.2 + reach * 0.4
      catLegs[3].rotation.x = -0.2 - reach * 0.4
    } else {
      armLGroup.rotation.x = -2.4 - reach * 0.5 // arms reaching overhead
      armRGroup.rotation.x = -2.4 + reach * 0.5
      legLGroup.rotation.x = reach * 0.5
      legRGroup.rotation.x = -reach * 0.5
    }
  } else if (phase === 'running') {
    const swing = Math.sin(distance * 0.05)

    if (isQuad) {
      // Quadruped trot: FL+RR vs FR+RL diagonal pairs
      const amp = 0.45
      catLegs[0].rotation.x = -swing * amp   // front-left
      catLegs[1].rotation.x =  swing * amp   // front-right
      catLegs[2].rotation.x =  swing * amp   // rear-left (opposite front-left)
      catLegs[3].rotation.x = -swing * amp   // rear-right (opposite front-right)
    } else {
      legLGroup.rotation.x =  swing * 0.6
      legRGroup.rotation.x = -swing * 0.6
      armLGroup.rotation.x = -swing * 0.5
      armRGroup.rotation.x =  swing * 0.5
      body.position.y = Math.abs(Math.sin(distance * 0.1)) * 0.04
    }

    // Tuck limbs while airborne for a clear jump pose
    if (player.jumpHeight > 0) {
      if (isQuad) {
        for (const lg of catLegs) lg.rotation.x = -0.5
      } else {
        legLGroup.rotation.x = -0.7
        legRGroup.rotation.x = -0.4
        armLGroup.rotation.x = -0.6
        armRGroup.rotation.x = -0.6
        body.position.y = 0
      }
    }
  } else if (phase === 'dying') {
    const progress = Math.max(0, Math.min(1, 1 - deathPauseFor / DEATH_PAUSE_SECONDS))
    body.rotation.x = -progress * (Math.PI / 2)
  } else if (phase === 'finished') {
    const bounce = Math.abs(Math.sin(elapsed * 6)) * 0.35
    group.position.y = groundY + bounce
    if (isQuad) {
      catLegs[0].rotation.x = -Math.PI * 0.3
      catLegs[1].rotation.x = -Math.PI * 0.3
    } else {
      armLGroup.rotation.x = -Math.PI * 0.6
      armRGroup.rotation.x = -Math.PI * 0.6
    }
  }

  // Cat tail animation: segments trail from +z rear, curve up
  if (p.catTailSegments.length > 0) {
    const tailSegCount = p.catTailSegments.length
    const tailRearZ = CAT_BODY_Z + CAT_BODY_L / 2
    const tailStepZ = H * 0.10
    const tailStepY = H * 0.13

    for (let i = 0; i < tailSegCount; i++) {
      const seg = p.catTailSegments[i]
      const t = (i + 1) / tailSegCount
      const wave = Math.sin(elapsed * 3.5 + i * 0.9) * 0.05
      const segY = CAT_BODY_Y + t * tailStepY * tailSegCount
      const segZ = tailRearZ + t * tailStepZ * tailSegCount
      seg.position.set(wave, segY, segZ)
    }
  }

  // Unicorn rainbow mane: row of segments running from the head back over the
  // neck (−z toward shoulders), undulating like flowing hair.
  if (p.unicornManeSegments.length > 0) {
    const count = p.unicornManeSegments.length
    const startZ = CAT_HEAD_Z + CAT_HEAD_S * 0.35
    const stepZ = (CAT_BODY_Z - startZ) / count
    const topY = CAT_BODY_Y + CAT_BODY_H * 0.5
    for (let i = 0; i < count; i++) {
      const seg = p.unicornManeSegments[i]
      const t = i / count
      const wave = Math.sin(elapsed * 4 + i * 0.8) * (0.03 + t * 0.04)
      const segY = (CAT_HEAD_Y + CAT_HEAD_S * 0.45) + (topY - (CAT_HEAD_Y + CAT_HEAD_S * 0.45)) * t
      seg.position.set(wave, segY + Math.sin(elapsed * 5 + i) * 0.015, startZ + stepZ * i)
    }
  }

  // Unicorn rainbow tail: segments trailing from the +z rear, curving up and back.
  if (p.unicornTailSegments.length > 0) {
    const count = p.unicornTailSegments.length
    const tailRearZ = CAT_BODY_Z + CAT_BODY_L / 2
    const stepZ = H * 0.11
    const stepY = H * 0.12
    for (let i = 0; i < count; i++) {
      const seg = p.unicornTailSegments[i]
      const t = (i + 1) / count
      const wave = Math.sin(elapsed * 4 + i * 0.9) * (0.04 + i * 0.02)
      const segY = CAT_BODY_Y + t * stepY * count
      const segZ = tailRearZ + t * stepZ * count
      seg.position.set(wave, segY, segZ)
    }
  }

  // Dragon tail animation: trails behind player (+z)
  if (dragonGroup && dragonSegments.length > 0) {
    const segGap = H * 0.18
    const dragonY = isQuad ? CAT_BODY_Y + CAT_BODY_H * 0.5 : TORSO_Y_BOTTOM + TORSO_H * 0.5

    for (let i = 0; i < dragonSegments.length; i++) {
      const seg = dragonSegments[i]
      const waveX = Math.sin(elapsed * 4 + i * 0.7) * (0.06 + i * 0.025)
      const segZ = (i + 1) * segGap
      seg.position.set(waveX, dragonY, segZ)
    }
  }

  // Cat-pet cosmetic animation
  if (p.catPetGroup) {
    const petGroup = p.catPetGroup

    petGroup.position.x = -0.45 + Math.sin(elapsed * 2) * 0.08
    petGroup.position.z = 1.25

    for (const lg of p.catPetLegs) lg.rotation.x = 0

    if (phase === 'running') {
      const petSwing = Math.sin(distance * 0.05)
      const amp = 0.45
      p.catPetLegs[0].rotation.x = -petSwing * amp
      p.catPetLegs[1].rotation.x =  petSwing * amp
      p.catPetLegs[2].rotation.x =  petSwing * amp
      p.catPetLegs[3].rotation.x = -petSwing * amp
    } else if (phase === 'finished') {
      petGroup.position.y = Math.abs(Math.sin(elapsed * 5)) * 0.2
    } else {
      petGroup.position.y = 0
    }

    const tailSegCount = p.catPetTailSegments.length
    const tailRearZ = CAT_BODY_Z + CAT_BODY_L / 2
    const tailStepZ = H * 0.10
    const tailStepY = H * 0.13

    for (let i = 0; i < tailSegCount; i++) {
      const seg = p.catPetTailSegments[i]
      const t = (i + 1) / tailSegCount
      const wave = Math.sin(elapsed * 3.5 + i * 0.9) * 0.05
      const segY = CAT_BODY_Y + t * tailStepY * tailSegCount
      const segZ = tailRearZ + t * tailStepZ * tailSegCount
      seg.position.set(wave, segY, segZ)
    }
  }

  // Bear-cub cosmetic animation (quadruped trot, mirroring cat-pet)
  if (p.bearCubGroup) {
    const cubGroup = p.bearCubGroup
    cubGroup.position.x = -0.45 + Math.sin(elapsed * 2.2) * 0.07
    cubGroup.position.z = 1.25

    for (const lg of p.bearCubLegs) lg.rotation.x = 0

    if (phase === 'running') {
      const petSwing = Math.sin(distance * 0.05)
      const amp = 0.45
      p.bearCubLegs[0].rotation.x = -petSwing * amp
      p.bearCubLegs[1].rotation.x =  petSwing * amp
      p.bearCubLegs[2].rotation.x =  petSwing * amp
      p.bearCubLegs[3].rotation.x = -petSwing * amp
    } else if (phase === 'finished') {
      cubGroup.position.y = Math.abs(Math.sin(elapsed * 5)) * 0.2
    } else {
      cubGroup.position.y = 0
    }
  }

  // Squirrel cosmetic animation
  if (p.squirrelGroup) {
    const sqGroup = p.squirrelGroup

    // Slight hop and sway
    sqGroup.position.x = 0.5 + Math.sin(elapsed * 3.1) * 0.06
    sqGroup.position.z = 1.05

    for (const lg of p.squirrelLegs) lg.rotation.x = 0

    if (phase === 'running') {
      const sqSwing = Math.sin(distance * 0.06)
      p.squirrelLegs[0].rotation.x =  sqSwing * 0.55
      p.squirrelLegs[1].rotation.x = -sqSwing * 0.55
      sqGroup.position.y = Math.abs(Math.sin(distance * 0.12)) * 0.05
    } else if (phase === 'finished') {
      sqGroup.position.y = Math.abs(Math.sin(elapsed * 6)) * 0.18
    } else {
      sqGroup.position.y = 0
    }

    // Bushy tail arc: segments curve up and back
    const sqTailCount = p.squirrelTailSegments.length
    for (let i = 0; i < sqTailCount; i++) {
      const seg = p.squirrelTailSegments[i]
      const t = (i + 1) / sqTailCount
      const arc = Math.sin(t * Math.PI * 0.8)
      const wave = Math.sin(elapsed * 2.5 + i * 0.7) * 0.03
      // segments go up and arc over the back (+z rear)
      const segX = wave
      const segY = (0.15 + arc * 0.28) * sqGroup.scale.x   // in pet local space (scale 0.5)
      const segZ = 0.05 + t * 0.28
      seg.position.set(segX, segY, segZ)
    }
  }

  // Rainbow-wings cosmetic: gentle flapping of the two wing fans.
  if (p.rainbowWingsGroup && p.rainbowWingL && p.rainbowWingR) {
    const flap = phase === 'running' ? Math.sin(elapsed * 8) * 0.35 : Math.sin(elapsed * 3) * 0.15
    // Wings fan out from the back; flap around the z-axis (up/down).
    p.rainbowWingL.rotation.z = flap
    p.rainbowWingR.rotation.z = -flap
  }

  // Rainbow-tail cosmetic: segmented trail swaying behind the player (mirrors dragon-tail).
  if (p.rainbowTailGroup && p.rainbowTailSegments.length > 0) {
    const segGap = H * 0.16
    const tailY = isQuad ? CAT_BODY_Y + CAT_BODY_H * 0.5 : TORSO_Y_BOTTOM + TORSO_H * 0.5
    for (let i = 0; i < p.rainbowTailSegments.length; i++) {
      const seg = p.rainbowTailSegments[i]
      const waveX = Math.sin(elapsed * 4 + i * 0.7) * (0.06 + i * 0.025)
      const waveY = Math.sin(elapsed * 3.2 + i * 0.5) * (0.02 + i * 0.012)
      const segZ = (i + 1) * segGap
      seg.position.set(waveX, tailY + waveY, segZ)
    }
  }

  // Falcon-pet companion: flies behind the player, bobbing, with flapping wings.
  if (p.falconGroup) {
    const fg = p.falconGroup
    fg.position.x = 0.55 + Math.sin(elapsed * 1.8) * 0.12
    fg.position.z = 1.3
    const bobBase = 1.4
    if (phase === 'finished') {
      fg.position.y = bobBase + Math.abs(Math.sin(elapsed * 6)) * 0.25
    } else {
      fg.position.y = bobBase + Math.sin(elapsed * 3.5) * 0.12
    }
    const flap = Math.sin(elapsed * 12) * 0.6
    if (p.falconWingL) p.falconWingL.rotation.z = flap
    if (p.falconWingR) p.falconWingR.rotation.z = -flap
  }

  // Neko-pet cosmetic animation
  if (p.nekoPetGroup) {
    const petGroup = p.nekoPetGroup
    petGroup.position.x = 0.42 + Math.sin(elapsed * 2.3) * 0.07
    petGroup.position.z = 1.25

    for (const lg of p.nekoPetLegs) lg.rotation.x = 0

    if (phase === 'running') {
      const petSwing = Math.sin(distance * 0.05)
      const amp = 0.45
      p.nekoPetLegs[0].rotation.x = -petSwing * amp
      p.nekoPetLegs[1].rotation.x =  petSwing * amp
      p.nekoPetLegs[2].rotation.x =  petSwing * amp
      p.nekoPetLegs[3].rotation.x = -petSwing * amp
    } else if (phase === 'finished') {
      petGroup.position.y = Math.abs(Math.sin(elapsed * 5)) * 0.2
    } else {
      petGroup.position.y = 0
    }

    // Upright curled tail (maneki-neko): rises from rear then arcs toward head (−z)
    const nekoTailCount = p.nekoPetTailSegments.length
    const tailBaseZ = CAT_BODY_Z + CAT_BODY_L * 0.38
    const tailBaseY = CAT_BODY_Y + CAT_BODY_H * 0.48
    const arcR = H * 0.30
    for (let i = 0; i < nekoTailCount; i++) {
      const seg = p.nekoPetTailSegments[i]
      const t = (i + 1) / nekoTailCount
      const angle = t * Math.PI * 0.70
      const sway = Math.sin(elapsed * 2.5 + i * 0.55) * 0.04
      const segY = tailBaseY + Math.cos(0) * arcR * t - Math.cos(angle) * arcR * t * 0.45
      const segZ = tailBaseZ - Math.sin(angle) * arcR * t * 0.55
      seg.position.set(sway, segY, segZ)
    }
  }

  // Kitsune-pet cosmetic animation (quadruped trot + big bushy arcing tail)
  if (p.kitsuneGroup) {
    const kGroup = p.kitsuneGroup
    kGroup.position.x = -0.42 + Math.sin(elapsed * 2.1) * 0.08
    kGroup.position.z = 1.20

    for (const lg of p.kitsuneLegs) lg.rotation.x = 0

    if (phase === 'running') {
      const petSwing = Math.sin(distance * 0.05)
      const amp = 0.45
      p.kitsuneLegs[0].rotation.x = -petSwing * amp
      p.kitsuneLegs[1].rotation.x =  petSwing * amp
      p.kitsuneLegs[2].rotation.x =  petSwing * amp
      p.kitsuneLegs[3].rotation.x = -petSwing * amp
    } else if (phase === 'finished') {
      kGroup.position.y = Math.abs(Math.sin(elapsed * 5.2)) * 0.2
    } else {
      kGroup.position.y = 0
    }

    // Bushy tail: sweeping arc upward and over the back (+z rear)
    const kTailCount = p.kitsuneTailSegments.length
    const kTailBaseZ = CAT_BODY_Z + CAT_BODY_L * 0.42
    const kTailBaseY = CAT_BODY_Y + CAT_BODY_H * 0.42
    for (let i = 0; i < kTailCount; i++) {
      const seg = p.kitsuneTailSegments[i]
      const t = (i + 1) / kTailCount
      const arc = Math.sin(t * Math.PI * 0.82)
      const wave = Math.sin(elapsed * 2.8 + i * 0.75) * 0.06
      const segY = kTailBaseY + arc * H * 0.60 + t * H * 0.06
      const segZ = kTailBaseZ + t * H * 0.22
      seg.position.set(wave, segY, segZ)
    }
  }

  // Ninja headband tail sway (wired to elapsed, same rhythm as run)
  if (p.ninjaHeadbandTailL && p.ninjaHeadbandTailR) {
    const swing = phase === 'running' ? Math.sin(distance * 0.05) : Math.sin(elapsed * 3)
    p.ninjaHeadbandTailL.rotation.x  =  swing * 0.22
    p.ninjaHeadbandTailR.rotation.x  = -swing * 0.18
  }

  // Bear chaser animation
  if (p.chaserGroup) {
    // While climbing, the bear waits at the foot of the ladder, looking up.
    if (inClimb) {
      const c = state.climb
      const gx = toWorldX(c.gapCenter)
      const gz = toWorldZ(c.gateTrackY)
      p.chaserGroup.position.set(gx, 0, gz + 2.2)
      p.chaserGroup.rotation.x = 0
      const sway = Math.sin(elapsed * 3)
      for (const lg of p.chaserLegs) lg.rotation.x = 0
      if (p.chaserLegs.length >= 2) {
        p.chaserLegs[0].rotation.x = sway * 0.2
        p.chaserLegs[1].rotation.x = -sway * 0.2
      }
      return
    }

    const playerPos = playerWorldPosition(player.x, distance)

    // Target z offset based on lives and phase
    let targetOffset: number
    if (phase === 'gameover') {
      targetOffset = 0.7
    } else if (phase === 'dying') {
      const livesOffset = state.lives === 3 ? 6.0 : state.lives === 2 ? 4.0 : 2.3
      targetOffset = livesOffset - 1.2
    } else {
      targetOffset = state.lives === 3 ? 6.0 : state.lives === 2 ? 4.0 : 2.3
    }

    const lerpFactor = phase === 'gameover' ? 0.25 : 0.06
    p.chaserZOffset += (targetOffset - p.chaserZOffset) * lerpFactor

    const chaserX = playerPos.x + Math.sin(elapsed * 2) * 0.1
    const runBob = phase === 'running' ? Math.abs(Math.sin(distance * 0.07)) * 0.06 : 0
    const chaserY = runBob

    p.chaserGroup.position.set(chaserX, chaserY, playerPos.z + p.chaserZOffset)

    // Animate legs
    for (const lg of p.chaserLegs) lg.rotation.x = 0

    if (phase === 'gameover') {
      // Rearing/pouncing pose: tilt body forward, raise front legs
      p.chaserGroup.rotation.x = -Math.PI * 0.3
      if (p.chaserLegs.length >= 2) {
        p.chaserLegs[0].rotation.x = -Math.PI * 0.5  // left leg raised
        p.chaserLegs[1].rotation.x = -Math.PI * 0.5  // right leg raised
      }
    } else if (phase === 'running' || phase === 'dying') {
      p.chaserGroup.rotation.x = 0
      const chaserSwing = Math.sin(distance * 0.05)
      if (p.chaserLegs.length >= 2) {
        p.chaserLegs[0].rotation.x =  chaserSwing * 0.6
        p.chaserLegs[1].rotation.x = -chaserSwing * 0.6
      }
    } else {
      p.chaserGroup.rotation.x = 0
    }
  }
}

export function disposePlayer3D(p: Player3D): void {
  p.scene.remove(p.group)

  const disposeGroup = (g: THREE.Group | null) => {
    if (!g) return
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    g.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        geometries.add(obj.geometry)
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => materials.add(m))
        } else {
          materials.add(obj.material)
        }
      }
    })
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
  }

  disposeGroup(p.group)

  // Dispose chaser group (it lives directly in the scene, not under p.group)
  if (p.chaserGroup) {
    p.scene.remove(p.chaserGroup)
    disposeGroup(p.chaserGroup)
  }

  // Contact-shadow also lives directly in the scene.
  if (p.shadow) {
    p.scene.remove(p.shadow)
    p.shadow.geometry.dispose()
    ;(p.shadow.material as THREE.Material).dispose()
  }
}
