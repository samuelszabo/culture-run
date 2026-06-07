import { createCollectibles } from '../game/collectibles'
import { createMovers } from '../game/movers'
import { createBridgeObstacles } from '../game/obstacles'
import { Collectible, Obstacle } from '../game/types'

export interface Level {
  obstacles: Obstacle[]
  collectibles: Collectible[]
}

export function createChinaBridgeLevel(): Level {
  const staticObstacles = createBridgeObstacles()
  return {
    obstacles: [...staticObstacles, ...createMovers(staticObstacles)],
    collectibles: createCollectibles(staticObstacles),
  }
}
