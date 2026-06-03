import type { WordItem } from '../data/words'

type ObjectPictureProps = {
  item: WordItem
}

export function ObjectPicture({ item }: ObjectPictureProps) {
  return (
    <div className="picture-frame" role="img" aria-label={item.label}>
      <span className="object-emoji" aria-hidden="true">
        {item.emoji}
      </span>
    </div>
  )
}
