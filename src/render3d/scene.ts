import * as THREE from 'three'
import { GameState } from '../game/types'
import {
  CAMERA_HEIGHT,
  CAMERA_BACK,
  CAMERA_LOOK_AHEAD,
  CAMERA_LOOK_HEIGHT,
  CAMERA_LATERAL_FOLLOW,
  playerWorldPosition,
} from './world'
import { ANTIALIAS, DPR_CAP, FOG_NEAR, FOG_FAR } from './quality'
import { buildChinaWallEnvironment } from './environments/china-wall'
import { buildSlovakParadiseEnvironment } from './environments/slovak-paradise'

export interface Stage {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  ambient: THREE.AmbientLight
  sun: THREE.DirectionalLight
  envGroups: Record<string, THREE.Group>
  currentEnv: string
}

interface EnvConfig {
  skyColor: number
  ambientColor: number
  ambientIntensity: number
  sunColor: number
  sunIntensity: number
  sunPosition: [number, number, number]
  build: (parent: THREE.Object3D) => void
}

const ENV_CONFIGS: Record<string, EnvConfig> = {
  'china-wall': {
    skyColor: 0xf5d98a,
    ambientColor: 0xfff4d6,
    ambientIntensity: 0.7,
    sunColor: 0xffcc88,
    sunIntensity: 1.4,
    sunPosition: [8, 12, 5],
    build: buildChinaWallEnvironment,
  },
  'slovak-paradise': {
    // Cool, fresh mountain-valley light instead of China's warm gold.
    skyColor: 0xbcd6df,
    ambientColor: 0xe2eef2,
    ambientIntensity: 0.78,
    sunColor: 0xfff2dc,
    sunIntensity: 1.15,
    sunPosition: [6, 13, 4],
    build: buildSlovakParadiseEnvironment,
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

  // Build every environment once into its own group; switching toggles
  // visibility (cheap) instead of rebuilding/disposing scenery per run.
  const envGroups: Record<string, THREE.Group> = {}
  for (const [id, cfg] of Object.entries(ENV_CONFIGS)) {
    const group = new THREE.Group()
    cfg.build(group)
    group.visible = false
    scene.add(group)
    envGroups[id] = group
  }

  const stage: Stage = { scene, camera, renderer, ambient, sun, envGroups, currentEnv: DEFAULT_ENV }
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

  stage.scene.background = new THREE.Color(cfg.skyColor)
  stage.scene.fog = new THREE.Fog(cfg.skyColor, FOG_NEAR, FOG_FAR)
  stage.ambient.color.setHex(cfg.ambientColor)
  stage.ambient.intensity = cfg.ambientIntensity
  stage.sun.color.setHex(cfg.sunColor)
  stage.sun.intensity = cfg.sunIntensity
  stage.sun.position.set(...cfg.sunPosition)
  stage.currentEnv = resolvedId
}

export function updateStage(stage: Stage, state: GameState): void {
  const p = playerWorldPosition(state.player.x, state.distance)
  stage.camera.position.set(
    p.x * CAMERA_LATERAL_FOLLOW,
    CAMERA_HEIGHT,
    p.z + CAMERA_BACK,
  )
  stage.camera.lookAt(
    p.x * CAMERA_LATERAL_FOLLOW,
    CAMERA_LOOK_HEIGHT,
    p.z - CAMERA_LOOK_AHEAD,
  )
}

export function renderStage(stage: Stage): void {
  stage.renderer.render(stage.scene, stage.camera)
}
