// A landmark is a real place passed during a run. The renderer builds a mesh at
// `trackY`; the game loop fires a caption + records it in the album when the
// player approaches. Shared by levels (trigger data) and render3d (meshes).
export interface Landmark {
  id: string
  trackY: number
  nameKey: string
  factKey: string
}
