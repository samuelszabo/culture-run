import * as THREE from 'three'
import { GameState } from '../game/types'
import {
  CAMERA_HEIGHT,
  CAMERA_BACK,
  CAMERA_LOOK_AHEAD,
  CAMERA_LOOK_HEIGHT,
  CAMERA_LATERAL_FOLLOW,
  CLIMB_CAM_BACK,
  CLIMB_CAM_HEIGHT,
  CLIMB_CAM_LOOK_AHEAD,
  CLIMB_CAM_LOOK_UP,
  CLIMB_PLAYER_WORLD_Y,
  playerWorldPosition,
  slovakPathHeight,
  toWorldX,
  toWorldZ,
} from './world'
import { ANTIALIAS, DPR_CAP, FOG_NEAR, FOG_FAR, QUALITY_TIER } from './quality'
import { buildChinaWallEnvironment } from './environments/china-wall'
import { buildSlovakParadiseEnvironment, SlovakWaterHandle } from './environments/slovak-paradise'
import { buildBurjKhalifaEnvironment } from './environments/burj-khalifa'

export interface Stage {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  ambient: THREE.AmbientLight
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  envGroups: Record<string, THREE.Group>
  currentEnv: string
  /** Populated when slovak-paradise group is built; used for per-frame water animation. */
  slovakWater?: SlovakWaterHandle
}

interface EnvConfig {
  skyColor: number
  ambientColor: number
  ambientIntensity: number
  sunColor: number
  sunIntensity: number
  sunPosition: [number, number, number]
  hemiSky: number
  hemiGround: number
  hemiIntensity: number
  /** Override fog near/far for this environment. Falls back to global FOG_NEAR/FOG_FAR. */
  fogNear?: number
  fogFar?: number
  build: (parent: THREE.Object3D) => void | SlovakWaterHandle
}

const ENV_CONFIGS: Record<string, EnvConfig> = {
  'china-wall': {
    skyColor: 0xf5d98a,
    ambientColor: 0xfff4d6,
    ambientIntensity: 0.7,
    sunColor: 0xffcc88,
    sunIntensity: 1.4,
    sunPosition: [8, 12, 5],
    hemiSky: 0xfff4d6,
    hemiGround: 0x4a7a30,
    hemiIntensity: 0.35,
    build: buildChinaWallEnvironment,
  },
  'slovak-paradise': {
    // Cool, fresh mountain-valley light — raking low sun angle for drama.
    skyColor: 0xa8cfe0,
    ambientColor: 0xdeeef5,
    ambientIntensity: 0.55,
    sunColor: 0xfff5e0,
    sunIntensity: 1.3,
    sunPosition: [10, 14, 6],
    hemiSky: 0xa8cfe0,
    hemiGround: 0x4a7a30,
    hemiIntensity: 0.55,
    // Push fog much further so mid-ground forest and peaks are visible.
    fogNear: 55,
    fogFar: 130,
    build: buildSlovakParadiseEnvironment,
  },
  'burj-khalifa': {
    // Bright Dubai sky high above the clouds. Keep the fill light cool/white so
    // the cloud road reads as fluffy white — the golden sun disc (built in the
    // environment) supplies the warm accent without tinting the clouds tan.
    skyColor: 0x8fc4e8,
    ambientColor: 0xf4f8ff,
    ambientIntensity: 0.85,
    sunColor: 0xfff6ec,
    sunIntensity: 1.45,
    sunPosition: [-8, 13, 4],
    hemiSky: 0xcfe7f7,
    hemiGround: 0xf4f8ff,
    hemiIntensity: 0.65,
    // Push fog far out so the cloud sea, rainbows and landmarks all read.
    fogNear: 50,
    fogFar: 140,
    build: buildBurjKhalifaEnvironment,
  },
}

const DEFAULT_ENV = 'china-wall'

export function createStage(canvas: HTMLCanvasElement): Stage {
  // antialias must be decided at creation time; disabled on low-tier devices
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: ANTIALIAS })
  renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_CAP))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, CAMERA_HEIGHT, CAMERA_BACK)
  camera.lookAt(0, CAMERA_LOOK_HEIGHT, -CAMERA_LOOK_AHEAD)

  const scene = new THREE.Scene()

  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight(0xffffff, 1.4)
  scene.add(sun)

  // Single hemisphere light shared across all envs; intensity/colours set in setEnvironment.
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0)
  scene.add(hemi)

  // Build every environment once into its own group; switching toggles
  // visibility (cheap) instead of rebuilding/disposing scenery per run.
  const envGroups: Record<string, THREE.Group> = {}
  let slovakWater: SlovakWaterHandle | undefined

  for (const [id, cfg] of Object.entries(ENV_CONFIGS)) {
    const group = new THREE.Group()
    const result = cfg.build(group)
    if (id === 'slovak-paradise' && result) {
      slovakWater = result as SlovakWaterHandle
    }
    group.visible = false
    scene.add(group)
    envGroups[id] = group
  }

  const stage: Stage = { scene, camera, renderer, ambient, sun, hemi, envGroups, currentEnv: DEFAULT_ENV, slovakWater }
  setEnvironment(stage, DEFAULT_ENV)

  window.addEventListener('resize', () => {
    const w = window.innerWidth
    const h = window.innerHeight
    // Re-apply the capped ratio in case the OS DPR changed (e.g. display switch)
    renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_CAP))
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })

  return stage
}

/** Activate one environment: show its scenery, apply its sky/fog/lighting. */
export function setEnvironment(stage: Stage, id: string): void {
  const cfg = ENV_CONFIGS[id] ?? ENV_CONFIGS[DEFAULT_ENV]
  const resolvedId = ENV_CONFIGS[id] ? id : DEFAULT_ENV

  for (const [groupId, group] of Object.entries(stage.envGroups)) {
    group.visible = groupId === resolvedId
  }

  const fogNear = cfg.fogNear ?? FOG_NEAR
  const fogFar  = cfg.fogFar  ?? FOG_FAR
  stage.scene.background = new THREE.Color(cfg.skyColor)
  stage.scene.fog = new THREE.Fog(cfg.skyColor, fogNear, fogFar)
  stage.ambient.color.setHex(cfg.ambientColor)
  stage.ambient.intensity = cfg.ambientIntensity
  stage.sun.color.setHex(cfg.sunColor)
  stage.sun.intensity = cfg.sunIntensity
  stage.sun.position.set(...cfg.sunPosition)
  stage.hemi.color.setHex(cfg.hemiSky)
  stage.hemi.groundColor.setHex(cfg.hemiGround)
  stage.hemi.intensity = cfg.hemiIntensity
  stage.currentEnv = resolvedId
}

export function updateStage(stage: Stage, state: GameState): void {
  // Stay in the climb framing through the brief death-pause of a mid-climb hit.
  const inClimb = state.phase === 'climbing' || (state.phase === 'dying' && state.climb.active)
  if (inClimb) {
    // Frame the ladder from below/behind, tilted up so the climb reads vertical.
    const c = state.climb
    const gx = toWorldX(c.gapCenter)
    const gz = toWorldZ(c.gateTrackY)
    stage.camera.position.set(gx, CLIMB_PLAYER_WORLD_Y + CLIMB_CAM_HEIGHT, gz + CLIMB_CAM_BACK)
    stage.camera.lookAt(gx, CLIMB_PLAYER_WORLD_Y + CLIMB_CAM_LOOK_UP, gz - CLIMB_CAM_LOOK_AHEAD)
  } else {
    const p = playerWorldPosition(state.player.x, state.distance)
    // Follow the rolling boulder-trail height on the Slovak level.
    const gY = state.chaser ? slovakPathHeight(state.distance) : 0
    stage.camera.position.set(
      p.x * CAMERA_LATERAL_FOLLOW,
      CAMERA_HEIGHT + gY,
      p.z + CAMERA_BACK,
    )
    stage.camera.lookAt(
      p.x * CAMERA_LATERAL_FOLLOW,
      CAMERA_LOOK_HEIGHT + gY,
      p.z - CAMERA_LOOK_AHEAD,
    )
  }

  // Per-frame water animation — only on high tier, only for Slovak Paradise.
  if (stage.currentEnv === 'slovak-paradise' && QUALITY_TIER !== 'low' && stage.slovakWater) {
    animateSlovakWater(stage.slovakWater, state.elapsed)
  }
}

/** Ripple stream and waterfall geometry using elapsed time (seconds). */
function animateSlovakWater(handle: SlovakWaterHandle, elapsed: number): void {
  // Stream — gentle sin-wave ripple in Y + scrolling brightness vertex color
  for (const entry of handle.streamEntries) {
    const pos = entry.geo.attributes.position as THREE.BufferAttribute
    const col = entry.geo.attributes.color as THREE.BufferAttribute
    const baseY = entry.baseY
    const vCount = pos.count
    for (let i = 0; i < vCount; i++) {
      const z = pos.getZ(i)
      const wave = Math.sin(z * 1.4 + elapsed * 2.2) * 0.025
      pos.setY(i, baseY[i] + wave)
      // Scrolling brightness band
      const brightness = 0.55 + 0.25 * Math.sin(z * 0.8 - elapsed * 1.8)
      col.setXYZ(i, brightness * 0.44, brightness * 0.66, brightness * 0.75)
    }
    pos.needsUpdate = true
    col.needsUpdate = true
    entry.geo.computeVertexNormals()
  }

  // Waterfall — scroll brightness bands downward
  for (const entry of handle.waterfallEntries) {
    const pos = entry.geo.attributes.position as THREE.BufferAttribute
    const col = entry.geo.attributes.color as THREE.BufferAttribute
    const vCount = pos.count
    for (let i = 0; i < vCount; i++) {
      const y = pos.getY(i)
      // Downward-scrolling foam bands
      const band = 0.45 + 0.45 * Math.sin(y * 2.2 + elapsed * 4.5)
      // Foam line at top (y > 4.0)
      const foam = y > 4.0 ? Math.min(1.0, (y - 4.0) * 0.8 + 0.6) : 0.0
      const b = Math.max(band, foam)
      col.setXYZ(i, b * 0.85, b * 0.94, b)
    }
    col.needsUpdate = true
  }
}

export function renderStage(stage: Stage): void {
  stage.renderer.render(stage.scene, stage.camera)
}
