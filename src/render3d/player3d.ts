import * as THREE from 'three'
import { GameState, DEATH_PAUSE_SECONDS } from '../game/types'
import { playerWorldPosition, PLAYER_WORLD_HEIGHT } from './world'

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
  scene: THREE.Scene
}

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

// Build one cat leg group: pivot at body underside (CAT_BODY_Y), leg hangs down
function makeCatLegGroup(x: number, z: number): THREE.Group {
  const legMesh = box(CAT_LEG_W, CAT_LEG_H, CAT_LEG_W, CAT_ORANGE)
  const g = makeLimbGroup(legMesh, CAT_LEG_H, CAT_BODY_Y)
  g.position.set(x, 0, z)
  return g
}

export function createPlayer3D(scene: THREE.Scene, state: GameState): Player3D {
  const isCat = state.character === 'cat'
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

  // --- Head ---
  const headColor = isCat ? CAT_ORANGE : 0xf5c07a
  const headMesh = box(
    isCat ? CAT_HEAD_S : BODY_W * 0.88,
    isCat ? CAT_HEAD_S : HEAD_H,
    isCat ? CAT_HEAD_S : BODY_D * 0.88,
    headColor,
  )
  if (isCat) {
    headMesh.position.set(0, CAT_HEAD_Y, CAT_HEAD_Z)
  } else {
    headMesh.position.set(0, HEAD_Y_CENTER, 0)
  }
  body.add(headMesh)

  // --- Torso ---
  const torsoColor = isCat ? CAT_ORANGE : state.character === 'boy' ? 0x3a7bd5 : 0xe87fac
  const torsoMesh = isCat
    ? box(CAT_BODY_W, CAT_BODY_H, CAT_BODY_L, torsoColor)
    : box(BODY_W, TORSO_H, BODY_D, torsoColor)
  if (isCat) {
    torsoMesh.position.set(0, CAT_BODY_Y, CAT_BODY_Z)
  } else {
    torsoMesh.position.set(0, TORSO_Y_BOTTOM + TORSO_H / 2, 0)
  }
  body.add(torsoMesh)

  // --- Biped limbs (used only for boy/girl; created-but-unused for cat) ---
  const limbSkinColor = isCat ? CAT_ORANGE : 0xf5c07a
  const legColor = isCat ? CAT_ORANGE : 0x2c3e7a

  const armMesh = box(ARM_W, ARM_H, ARM_W, limbSkinColor)
  const armLGroup = makeLimbGroup(armMesh, ARM_H, TORSO_Y_TOP - ARM_H * 0.1)
  if (!isCat) armLGroup.position.setX(-(BODY_W / 2 + ARM_W / 2))
  body.add(armLGroup)

  const armMeshR = box(ARM_W, ARM_H, ARM_W, limbSkinColor)
  const armRGroup = makeLimbGroup(armMeshR, ARM_H, TORSO_Y_TOP - ARM_H * 0.1)
  if (!isCat) armRGroup.position.setX(BODY_W / 2 + ARM_W / 2)
  body.add(armRGroup)

  const legMeshL = box(LEG_W, LEG_H, LEG_W, legColor)
  const legLGroup = makeLimbGroup(legMeshL, LEG_H, LEG_Y_TOP)
  if (!isCat) legLGroup.position.setX(-LEG_W * 0.7)
  body.add(legLGroup)

  const legMeshR = box(LEG_W, LEG_H, LEG_W, legColor)
  const legRGroup = makeLimbGroup(legMeshR, LEG_H, LEG_Y_TOP)
  if (!isCat) legRGroup.position.setX(LEG_W * 0.7)
  body.add(legRGroup)

  // --- Cat-dedicated 4 legs ---
  // Diagonal trot pairs: [0]=front-left, [1]=front-right, [2]=rear-left, [3]=rear-right
  // FL+RR swing one direction, FR+RL swing opposite — natural quadruped trot
  const catLegs: THREE.Group[] = []
  if (isCat) {
    const halfX = CAT_BODY_W / 2 + CAT_LEG_W * 0.1
    catLegs.push(makeCatLegGroup(-halfX, CAT_FRONT_LEG_Z))  // 0: front-left
    catLegs.push(makeCatLegGroup( halfX, CAT_FRONT_LEG_Z))  // 1: front-right
    catLegs.push(makeCatLegGroup(-halfX, CAT_REAR_LEG_Z))   // 2: rear-left
    catLegs.push(makeCatLegGroup( halfX, CAT_REAR_LEG_Z))   // 3: rear-right
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

    if (isCat) {
      // Ears anchor to cat head — top-front (−z) face, slightly inset from head sides
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

  const pos = playerWorldPosition(state.player.x, state.distance)
  group.position.set(pos.x, 0, pos.z)

  scene.add(group)

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
    scene,
  }
}

export function updatePlayer3D(p: Player3D, state: GameState): void {
  const { group, body, armLGroup, armRGroup, legLGroup, legRGroup, dragonGroup, dragonSegments, catLegs } = p
  const { phase, player, elapsed, distance, deathPauseFor } = state
  const isCat = state.character === 'cat'

  const pos = playerWorldPosition(player.x, distance)
  group.position.set(pos.x, 0, pos.z)

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

  if (phase === 'running') {
    const swing = Math.sin(distance * 0.05)

    if (isCat) {
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
  } else if (phase === 'dying') {
    const progress = Math.max(0, Math.min(1, 1 - deathPauseFor / DEATH_PAUSE_SECONDS))
    body.rotation.x = -progress * (Math.PI / 2)
  } else if (phase === 'finished') {
    const bounce = Math.abs(Math.sin(elapsed * 6)) * 0.35
    group.position.y = bounce
    if (isCat) {
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

  // Dragon tail animation: trails behind player (+z)
  if (dragonGroup && dragonSegments.length > 0) {
    const segGap = H * 0.18
    const dragonY = isCat ? CAT_BODY_Y + CAT_BODY_H * 0.5 : TORSO_Y_BOTTOM + TORSO_H * 0.5

    for (let i = 0; i < dragonSegments.length; i++) {
      const seg = dragonSegments[i]
      const waveX = Math.sin(elapsed * 4 + i * 0.7) * (0.06 + i * 0.025)
      const segZ = (i + 1) * segGap
      seg.position.set(waveX, dragonY, segZ)
    }
  }
}

export function disposePlayer3D(p: Player3D): void {
  p.scene.remove(p.group)

  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()

  p.group.traverse((obj) => {
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
