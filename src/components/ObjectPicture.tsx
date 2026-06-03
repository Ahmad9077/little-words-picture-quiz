import type { WordItem } from '../data/words'

type ObjectPictureProps = {
  item: WordItem
}

const objectIcons: Record<string, string> = {
  bag: '👜',
  bed: '🛏️',
  box: '📦',
  bus: '🚌',
  car: '🚗',
  cup: '☕',
  hat: '🧢',
  key: '🔑',
  map: '🗺️',
  pen: '🖊️',
  pot: '🥘',
  sun: '☀️',
  ball: '⚽',
  boat: '⛵',
  book: '📘',
  cake: '🎂',
  door: '🚪',
  drum: '🥁',
  fish: '🐟',
  kite: '🪁',
  lamp: '💡',
  moon: '🌙',
  shoe: '👟',
  sock: '🧦',
  star: '⭐',
  tree: '🌳',
}

export function ObjectPicture({ item }: ObjectPictureProps) {
  return (
    <div className="picture-frame" role="img" aria-label={item.label}>
      <span className="object-emoji" aria-hidden="true">
        {objectIcons[item.id] ?? '❓'}
      </span>
    </div>
  )
}
