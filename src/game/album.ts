export interface AlbumEntry {
  id: string
  category: 'food' | 'landmark'
  nameKey: string
  factKey: string
  icon: string
}

export const ALBUM_ENTRIES: AlbumEntry[] = [
  {
    id: 'baozi',
    category: 'food',
    nameKey: 'food.baozi.name',
    factKey: 'album.baozi.fact',
    icon: '🥟',
  },
  {
    id: 'noodles',
    category: 'food',
    nameKey: 'food.noodles.name',
    factKey: 'album.noodles.fact',
    icon: '🍜',
  },
  {
    id: 'tea',
    category: 'food',
    nameKey: 'food.tea.name',
    factKey: 'album.tea.fact',
    icon: '🍵',
  },
  {
    id: 'watchtower',
    category: 'landmark',
    nameKey: 'landmark.watchtower',
    factKey: 'landmark.watchtower.fact',
    icon: '🗼',
  },
  {
    id: 'pagoda',
    category: 'landmark',
    nameKey: 'landmark.pagoda',
    factKey: 'landmark.pagoda.fact',
    icon: '⛩️',
  },
  {
    id: 'lion',
    category: 'landmark',
    nameKey: 'landmark.lion',
    factKey: 'landmark.lion.fact',
    icon: '🦁',
  },
]
