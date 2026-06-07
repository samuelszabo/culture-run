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
  scene: THREE.Scene
}

const H = PLAYER_WORLD_HEIGHT

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

const CAT_ORANGE = 0xf28c28
const CAT_CREAM = 0xfff0d0
const CAT_PINK = 0xf4a0b0
const CAT_STRIPE = 0xc8680a

const CAT_BODY_L = H * 0.62
const CAT_BODY_H = H * 0.26
const CAT_BODY_W = H * 0.28
const CAT_BODY_Y = H * 0.32
const CAT_BODY_Z = H * 0.05
const CAT_LEG_H = H * 0.30
const CAT_LEG_W = H * 0.10
const CAT_HEAD_S = H * 0.26
const CAT_HEAD_Z = -(CAT_BODY_L / 2 + CAT_HEAD_S * 0.35)
const CAT_HEAD_Y = CAT_BODY_Y + CAT_BODY_H * 0.1

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

export function createPlayer3D(scene: THREE.Scene, state: GameState): Player3D {
  const isCat = state.character === 'cat'
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

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

  const limbSkinColor = isCat ? CAT_ORANGE : 0xf5c07a
  const legColor = isCat ? CAT_ORANGE : 0x2c3e7a

  const armMesh = box(
    isCat ? CAT_LEG_W : ARM_W,
    isCat ? CAT_LEG_H : ARM_H,
    isCat ? CAT_LEG_W : ARM_W,
    limbSkinColor,
  )
  const armLimb = isCat ? CAT_LEG_H : ARM_H
  const armPivotY = isCat ? CAT_BODY_Y : TORSO_Y_TOP - ARM_H * 0.1
  const armLGroup = makeLimbGroup(armMesh, armLimb, armPivotY)
  if (isCat) {
    armLGroup.position.set(-(CAT_BODY_W / 2 + CAT_LEG_W * 0.1), 0, CAT_HEAD_Z + CAT_HEAD_S * 0.2)
  } else {
    armLGroup.position.setX(-(BODY_W / 2 + ARM_W / 2))
  }

  const armMeshR = box(
    isCat ? CAT_LEG_W : ARM_W,
    isCat ? CAT_LEG_H : ARM_H,
    isCat ? CAT_LEG_W : ARM_W,
    limbSkinColor,
  )
  const armRGroup = makeLimbGroup(armMeshR, armLimb, armPivotY)
  if (isCat) {
    armRGroup.position.set(CAT_BODY_W / 2 + CAT_LEG_W * 0.1, 0, CAT_HEAD_Z + CAT_HEAD_S * 0.2)
  } else {
    armRGroup.position.setX(BODY_W / 2 + ARM_W / 2)
  }

  body.add(armLGroup)
  body.add(armRGroup)

  const legMeshL = box(
    isCat ? CAT_LEG_W : LEG_W,
    isCat ? CAT_LEG_H : LEG_H,
    isCat ? CAT_LEG_W : LEG_W,
    legColor,
  )
  const legLimb = isCat ? CAT_LEG_H : LEG_H
  const legPivotY = isCat ? CAT_BODY_Y : LEG_Y_TOP
  const legLGroup = makeLimbGroup(legMeshL, legLimb, legPivotY)
  if (isCat) {
    legLGroup.position.set(-(CAT_BODY_W / 2 + CAT_LEG_W * 0.1), 0, CAT_BODY_Z + CAT_BODY_L * 0.32)
  } else {
    legLGroup.position.setX(-LEG_W * 0.7)
  }

  const legMeshR = box(
    isCat ? CAT_LEG_W : LEG_W,
    isCat ? CAT_LEG_H : LEG_H,
    isCat ? CAT_LEG_W : LEG_W,
    legColor,
  )
  const legRGroup = makeLimbGroup(legMeshR, legLimb, legPivotY)
  if (isCat) {
    legRGroup.position.set(CAT_BODY_W / 2 + CAT_LEG_W * 0.1, 0, CAT_BODY_Z + CAT_BODY_L * 0.32)
  } else {
    legRGroup.position.setX(LEG_W * 0.7)
  }

  body.add(legLGroup)
  body.add(legRGroup)

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

    const earInnerL = box(earInnerW, earInnerH, earW * 0.3, CAT_PINK)
    earInnerL.position.set(-(CAT_HEAD_S * 0.28), earTopY + earH * 0.04, CAT_HEAD_Z - CAT_HEAD_S * 0.28)
    body.add(earInnerL)

    const earInnerR = box(earInnerW, earInnerH, earW * 0.3, CAT_PINK)
    earInnerR.position.set(CAT_HEAD_S * 0.28, earTopY + earH * 0.04, CAT_HEAD_Z - CAT_HEAD_S * 0.28)
    body.add(earInnerR)

    const snoutW = CAT_HEAD_S * 0.55
    const snoutH = CAT_HEAD_S * 0.28
    catSnout = box(snoutW, snoutH, H * 0.06, CAT_CREAM)
    catSnout.position.set(0, CAT_HEAD_Y - CAT_HEAD_S * 0.1, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.02)
    body.add(catSnout)

    catNose = box(H * 0.06, H * 0.04, H * 0.04, CAT_PINK)
    catNose.position.set(0, CAT_HEAD_Y + CAT_HEAD_S * 0.08, CAT_HEAD_Z - CAT_HEAD_S / 2 - H * 0.03)
    body.add(catNose)

    const stripeW = CAT_BODY_W * 1.02
    const stripeH = H * 0.025
    const stripe1 = box(stripeW, stripeH, CAT_BODY_L * 0.12, CAT_STRIPE)
    stripe1.position.set(0, CAT_BODY_Y + CAT_BODY_H / 2 + stripeH / 2, CAT_BODY_Z - CAT_BODY_L * 0.15)
    body.add(stripe1)

    const stripe2 = box(stripeW, stripeH, CAT_BODY_L * 0.12, CAT_STRIPE)
    stripe2.position.set(0, CAT_BODY_Y + CAT_BODY_H / 2 + stripeH / 2, CAT_BODY_Z + CAT_BODY_L * 0.1)
    body.add(stripe2)

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
    scene,
  }
}

export function updatePlayer3D(p: Player3D, state: GameState): void {
  const { group, body, armLGroup, armRGroup, legLGroup, legRGroup, dragonGroup, dragonSegments } = p
  const { phase, player, elapsed, distance, deathPauseFor } = state
  const isCat = state.character === 'cat'

  const pos = playerWorldPosition(player.x, distance)
  group.position.set(pos.x, 0, pos.z)

  const isBlinking = player.invulnerableFor > 0 && Math.floor(elapsed * 10) % 2 === 0
  group.visible = !isBlinking

  body.rotation.x = 0
  body.position.y = 0
  armLGroup.rotation.x = 0
  armRGroup.rotation.x = 0
  legLGroup.rotation.x = 0
  legRGroup.rotation.x = 0

  if (phase === 'running') {
    const swing = Math.sin(distance * 0.05)
    const legAmp = isCat ? 0.45 : 0.6
    const armAmp = isCat ? 0.45 : 0.5
    legLGroup.rotation.x = swing * legAmp
    legRGroup.rotation.x = -swing * legAmp
    armLGroup.rotation.x = -swing * armAmp
    armRGroup.rotation.x = swing * armAmp
    if (!isCat) {
      body.position.y = Math.abs(Math.sin(distance * 0.1)) * 0.04
    }
  } else if (phase === 'dying') {
    const progress = Math.max(0, Math.min(1, 1 - deathPauseFor / DEATH_PAUSE_SECONDS))
    body.rotation.x = -progress * (Math.PI / 2)
  } else if (phase === 'finished') {
    const bounce = Math.abs(Math.sin(elapsed * 6)) * 0.35
    group.position.y = bounce
    armLGroup.rotation.x = isCat ? -Math.PI * 0.3 : -Math.PI * 0.6
    armRGroup.rotation.x = isCat ? -Math.PI * 0.3 : -Math.PI * 0.6
  }

  if (p.catTailSegments.length > 0) {
    const tailSegCount = p.catTailSegments.length
    const tailRearZ = CAT_BODY_Z + CAT_BODY_L / 2
    const tailStepZ = H * 0.10
    const tailStepY = H * 0.13

    for (let i = 0; i < tailSegCount; i++) {
      const seg = p.catTailSegments[i]
      const t = (i + 1) / tailSegCount
      const wave = Math.sin(elapsed * 3.5 + i * 0.9) * 0.05
      const segX = wave
      const segY = CAT_BODY_Y + t * tailStepY * tailSegCount
      const segZ = tailRearZ + t * tailStepZ * tailSegCount
      seg.position.set(segX, segY, segZ)
    }
  }

  if (dragonGroup && dragonSegments.length > 0) {
    const segGap = H * 0.18

    for (let i = 0; i < dragonSegments.length; i++) {
      const seg = dragonSegments[i]
      const waveX = Math.sin(elapsed * 4 + i * 0.7) * (0.06 + i * 0.025)
      const segZ = (i + 1) * segGap
      const segY = TORSO_Y_BOTTOM + TORSO_H * 0.5

      seg.position.set(waveX, segY, segZ)
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
