import type { ReactNode } from 'react'
import type { WordItem } from '../data/words'

type ObjectPictureProps = {
  item: WordItem
  revealed?: boolean
}

const ViewBox = ({ children, label }: { children: ReactNode; label: string }) => (
  <svg className="object-svg" viewBox="0 0 240 190" role="img" aria-label={label}>
    <rect x="18" y="18" width="204" height="154" rx="8" className="scene-bg" />
    <ellipse cx="120" cy="153" rx="64" ry="12" className="shadow" />
    {children}
  </svg>
)

export function ObjectPicture({ item, revealed = false }: ObjectPictureProps) {
  return (
    <div className={`picture-frame ${revealed ? 'is-revealed' : ''}`}>
      {renderObject(item.id, item.label)}
      <div className="picture-spark picture-spark-a" />
      <div className="picture-spark picture-spark-b" />
    </div>
  )
}

function renderObject(id: string, label: string) {
  switch (id) {
    case 'bag':
      return (
        <ViewBox label={label}>
          <path d="M86 82c0-25 68-25 68 0" className="line" />
          <rect x="68" y="76" width="104" height="76" rx="8" className="fill-coral" />
          <path d="M68 103h104" className="line" />
          <circle cx="93" cy="100" r="5" className="fill-ink" />
          <circle cx="147" cy="100" r="5" className="fill-ink" />
        </ViewBox>
      )
    case 'bed':
      return (
        <ViewBox label={label}>
          <rect x="52" y="96" width="136" height="44" rx="8" className="fill-teal" />
          <rect x="58" y="78" width="50" height="30" rx="7" className="fill-cream" />
          <rect x="106" y="86" width="76" height="38" rx="6" className="fill-coral" />
          <path d="M54 140v15M186 140v15" className="line" />
        </ViewBox>
      )
    case 'box':
      return (
        <ViewBox label={label}>
          <path d="M65 82l55-25 55 25-55 25z" className="fill-gold" />
          <path d="M65 82v60l55 25v-60z" className="fill-coral" />
          <path d="M175 82v60l-55 25v-60z" className="fill-teal" />
          <path d="M65 82l55 25 55-25M120 107v60" className="line" />
        </ViewBox>
      )
    case 'bus':
      return (
        <ViewBox label={label}>
          <rect x="48" y="70" width="144" height="74" rx="8" className="fill-gold" />
          <rect x="62" y="84" width="34" height="26" rx="4" className="fill-sky" />
          <rect x="104" y="84" width="34" height="26" rx="4" className="fill-sky" />
          <rect x="146" y="84" width="28" height="52" rx="4" className="fill-cream" />
          <circle cx="78" cy="146" r="13" className="fill-ink" />
          <circle cx="162" cy="146" r="13" className="fill-ink" />
        </ViewBox>
      )
    case 'car':
      return (
        <ViewBox label={label}>
          <path d="M61 111l19-34h74l25 34z" className="fill-teal" />
          <rect x="48" y="105" width="144" height="40" rx="8" className="fill-coral" />
          <path d="M90 82h28v25H77zM124 82h27l19 25h-46z" className="fill-sky" />
          <circle cx="82" cy="145" r="14" className="fill-ink" />
          <circle cx="160" cy="145" r="14" className="fill-ink" />
        </ViewBox>
      )
    case 'cup':
      return (
        <ViewBox label={label}>
          <path d="M78 72h78l-8 78H86z" className="fill-teal" />
          <path d="M154 91h18c18 0 18 34 0 34h-20" className="line" />
          <path d="M89 92h58" className="line-light" />
        </ViewBox>
      )
    case 'hat':
      return (
        <ViewBox label={label}>
          <path d="M78 116c2-42 82-42 84 0z" className="fill-coral" />
          <rect x="54" y="112" width="132" height="22" rx="8" className="fill-gold" />
          <path d="M100 73l20-20 20 20" className="line" />
        </ViewBox>
      )
    case 'key':
      return (
        <ViewBox label={label}>
          <circle cx="88" cy="100" r="30" className="fill-gold" />
          <circle cx="88" cy="100" r="13" className="fill-cream" />
          <rect x="114" y="93" width="78" height="14" rx="5" className="fill-gold" />
          <path d="M168 106v22M145 106v16" className="line" />
        </ViewBox>
      )
    case 'map':
      return (
        <ViewBox label={label}>
          <path d="M57 67l42-13 42 13 42-13v97l-42 13-42-13-42 13z" className="fill-cream" />
          <path d="M99 54v97M141 67v97M75 96c22-8 38 19 59 9 19-9 26-26 49-17" className="line" />
          <circle cx="121" cy="91" r="7" className="fill-coral" />
        </ViewBox>
      )
    case 'pen':
      return (
        <ViewBox label={label}>
          <path d="M69 135l19-47 57-57 31 31-57 57z" className="fill-teal" />
          <path d="M145 31l31 31M88 88l31 31M69 135l34-13" className="line" />
          <path d="M65 151l4-16 16 16z" className="fill-ink" />
        </ViewBox>
      )
    case 'pot':
      return (
        <ViewBox label={label}>
          <path d="M74 90h92l-12 62H86z" className="fill-coral" />
          <rect x="66" y="76" width="108" height="20" rx="8" className="fill-gold" />
          <path d="M89 76c8-25 54-25 62 0" className="line" />
        </ViewBox>
      )
    case 'sun':
      return (
        <ViewBox label={label}>
          <circle cx="120" cy="96" r="40" className="fill-gold" />
          <path d="M120 39v-20M120 173v-20M63 96H43M197 96h-20M80 56L66 42M174 150l-14-14M80 136l-14 14M174 42l-14 14" className="line-gold" />
        </ViewBox>
      )
    case 'ball':
      return (
        <ViewBox label={label}>
          <circle cx="120" cy="101" r="54" className="fill-cream" />
          <path d="M81 64c27 8 53 39 50 90M159 64c-27 8-53 39-50 90M70 102h100" className="line" />
          <path d="M120 47a54 54 0 0 1 51 37 97 97 0 0 1-102 0 54 54 0 0 1 51-37z" className="fill-coral-soft" />
        </ViewBox>
      )
    case 'boat':
      return (
        <ViewBox label={label}>
          <path d="M73 121h102l-19 31H92z" className="fill-coral" />
          <path d="M120 51v70" className="line" />
          <path d="M125 58l45 63h-45z" className="fill-gold" />
          <path d="M115 70l-42 51h42z" className="fill-teal" />
        </ViewBox>
      )
    case 'book':
      return (
        <ViewBox label={label}>
          <path d="M55 60h61c14 0 20 8 20 20v78c-4-7-12-11-24-11H55z" className="fill-teal" />
          <path d="M185 60h-61c-14 0-20 8-20 20v78c4-7 12-11 24-11h57z" className="fill-coral" />
          <path d="M120 69v90M71 85h31M71 105h31M139 85h31M139 105h31" className="line-light" />
        </ViewBox>
      )
    case 'cake':
      return (
        <ViewBox label={label}>
          <rect x="67" y="99" width="106" height="53" rx="8" className="fill-coral" />
          <rect x="76" y="78" width="88" height="32" rx="7" className="fill-cream" />
          <path d="M96 78V54M120 78V54M144 78V54" className="line" />
          <path d="M96 52c11 6 11 14 0 20-11-6-11-14 0-20zM120 52c11 6 11 14 0 20-11-6-11-14 0-20zM144 52c11 6 11 14 0 20-11-6-11-14 0-20z" className="fill-gold" />
        </ViewBox>
      )
    case 'door':
      return (
        <ViewBox label={label}>
          <rect x="82" y="46" width="76" height="116" rx="4" className="fill-teal" />
          <rect x="94" y="58" width="52" height="92" rx="3" className="fill-coral-soft" />
          <circle cx="140" cy="106" r="5" className="fill-gold" />
        </ViewBox>
      )
    case 'drum':
      return (
        <ViewBox label={label}>
          <ellipse cx="120" cy="74" rx="58" ry="19" className="fill-cream" />
          <path d="M62 74v68c0 11 116 11 116 0V74" className="fill-coral" />
          <ellipse cx="120" cy="142" rx="58" ry="19" className="fill-teal" />
          <path d="M78 91l84 38M162 91l-84 38" className="line-light" />
          <path d="M77 55l-23-21M163 55l23-21" className="line" />
        </ViewBox>
      )
    case 'fish':
      return (
        <ViewBox label={label}>
          <path d="M65 101c34-42 85-42 119 0-34 42-85 42-119 0z" className="fill-teal" />
          <path d="M65 101L38 75v52z" className="fill-coral" />
          <circle cx="151" cy="91" r="6" className="fill-ink" />
          <path d="M104 76c13 15 13 35 0 50" className="line-light" />
        </ViewBox>
      )
    case 'kite':
      return (
        <ViewBox label={label}>
          <path d="M120 35l54 54-54 54-54-54z" className="fill-gold" />
          <path d="M120 35v108M66 89h108M120 143c5 20-26 17-18 37" className="line" />
          <path d="M120 35l54 54-54 15z" className="fill-coral-soft" />
        </ViewBox>
      )
    case 'lamp':
      return (
        <ViewBox label={label}>
          <path d="M83 76h74l-14 47H97z" className="fill-gold" />
          <path d="M120 123v34M88 157h64" className="line" />
          <rect x="105" y="51" width="30" height="22" rx="8" className="fill-teal" />
        </ViewBox>
      )
    case 'moon':
      return (
        <ViewBox label={label}>
          <path d="M146 43c-40 10-62 52-45 87 12 26 41 38 70 28-14 19-39 29-65 22-43-11-68-55-57-98s55-68 97-39z" className="fill-gold" />
          <circle cx="162" cy="70" r="5" className="fill-cream" />
          <circle cx="182" cy="104" r="4" className="fill-cream" />
        </ViewBox>
      )
    case 'shoe':
      return (
        <ViewBox label={label}>
          <path d="M65 123c27 4 48-14 65-39l26 32c21 3 35 12 39 27 0 11-9 17-21 17H75c-18 0-27-14-10-37z" className="fill-coral" />
          <path d="M93 119h50M79 145h102" className="line-light" />
        </ViewBox>
      )
    case 'sock':
      return (
        <ViewBox label={label}>
          <path d="M86 48h56v77c0 31-27 45-61 33-16-6-20-21-9-33l14-15z" className="fill-teal" />
          <rect x="86" y="48" width="56" height="25" className="fill-gold" />
          <path d="M86 104c23 4 45 4 56 0" className="line-light" />
        </ViewBox>
      )
    case 'star':
      return (
        <ViewBox label={label}>
          <path d="M120 42l18 39 42 5-31 29 8 42-37-21-37 21 8-42-31-29 42-5z" className="fill-gold" />
          <path d="M120 42l18 39 42 5-42 14z" className="fill-coral-soft" />
        </ViewBox>
      )
    case 'tree':
      return (
        <ViewBox label={label}>
          <rect x="109" y="101" width="23" height="55" rx="5" className="fill-coral" />
          <circle cx="94" cy="92" r="34" className="fill-teal" />
          <circle cx="128" cy="76" r="39" className="fill-gold" />
          <circle cx="148" cy="108" r="31" className="fill-teal" />
        </ViewBox>
      )
    default:
      return (
        <ViewBox label={label}>
          <circle cx="120" cy="96" r="48" className="fill-teal" />
        </ViewBox>
      )
  }
}
