import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export type ModelName = 'noodles' | 'baozi' | 'tea' | 'pagoda' | 'lion'

const MODEL_PATHS: Partial<Record<ModelName, string>> = {
  noodles: 'models/noodles.glb',
  baozi: 'models/baozi.glb',
  tea: 'models/tea.glb',
}

const loader = new GLTFLoader()
const cache = new Map<ModelName, Promise<THREE.Group | null>>()

function loadOriginal(name: ModelName): Promise<THREE.Group | null> {
  const path = MODEL_PATHS[name]
  if (!path) return Promise.resolve(null)

  return new Promise((resolve) => {
    loader.load(
      path,
      (gltf) => resolve(gltf.scene),
      undefined,
      () => resolve(null)
    )
  })
}

export function loadModel(name: ModelName): Promise<THREE.Group | null> {
  if (!cache.has(name)) {
    cache.set(name, loadOriginal(name))
  }
  return cache.get(name)!.then((group) => (group ? group.clone() : null))
}
