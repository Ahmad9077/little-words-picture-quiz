export type WordItem = {
  id: string
  word: string
  label: string
  letters: 3 | 4
}

export const wordBank: WordItem[] = [
  { id: 'bag', word: 'bag', label: 'a bag', letters: 3 },
  { id: 'bed', word: 'bed', label: 'a bed', letters: 3 },
  { id: 'box', word: 'box', label: 'a box', letters: 3 },
  { id: 'bus', word: 'bus', label: 'a bus', letters: 3 },
  { id: 'car', word: 'car', label: 'a car', letters: 3 },
  { id: 'cup', word: 'cup', label: 'a cup', letters: 3 },
  { id: 'hat', word: 'hat', label: 'a hat', letters: 3 },
  { id: 'key', word: 'key', label: 'a key', letters: 3 },
  { id: 'map', word: 'map', label: 'a map', letters: 3 },
  { id: 'pen', word: 'pen', label: 'a pen', letters: 3 },
  { id: 'pot', word: 'pot', label: 'a pot', letters: 3 },
  { id: 'sun', word: 'sun', label: 'the sun', letters: 3 },
  { id: 'ball', word: 'ball', label: 'a ball', letters: 4 },
  { id: 'boat', word: 'boat', label: 'a boat', letters: 4 },
  { id: 'book', word: 'book', label: 'a book', letters: 4 },
  { id: 'cake', word: 'cake', label: 'a cake', letters: 4 },
  { id: 'door', word: 'door', label: 'a door', letters: 4 },
  { id: 'drum', word: 'drum', label: 'a drum', letters: 4 },
  { id: 'fish', word: 'fish', label: 'a fish', letters: 4 },
  { id: 'kite', word: 'kite', label: 'a kite', letters: 4 },
  { id: 'lamp', word: 'lamp', label: 'a lamp', letters: 4 },
  { id: 'moon', word: 'moon', label: 'the moon', letters: 4 },
  { id: 'shoe', word: 'shoe', label: 'a shoe', letters: 4 },
  { id: 'sock', word: 'sock', label: 'a sock', letters: 4 },
  { id: 'star', word: 'star', label: 'a star', letters: 4 },
  { id: 'tree', word: 'tree', label: 'a tree', letters: 4 },
]
