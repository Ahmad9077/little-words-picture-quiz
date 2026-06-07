import { wordBank, type WordItem } from '../data/words'

export type QuizMode = 'all' | 'three' | 'four'

export type QuizQuestion = {
  item: WordItem
  choices: string[]
}

type QuizOptions = {
  choiceCount?: number
  preferredKeys?: string[]
  sessionSize?: number
}

const DEFAULT_SESSION_SIZE = 15
const DEFAULT_CHOICE_COUNT = 4

const shuffle = <T,>(items: T[]) => {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

const itemsForMode = (mode: QuizMode) => {
  if (mode === 'three') {
    return wordBank.filter((item) => item.letters === 3)
  }

  if (mode === 'four') {
    return wordBank.filter((item) => item.letters === 4)
  }

  return wordBank
}

const distractorsFor = (item: WordItem) =>
  wordBank.filter(
    (candidate) =>
      candidate.word !== item.word &&
      candidate.word[0] === item.word[0] &&
      candidate.emoji !== item.emoji,
  )

export const createQuiz = (mode: QuizMode, options: QuizOptions = {}): QuizQuestion[] => {
  const sessionSize = options.sessionSize || DEFAULT_SESSION_SIZE
  const choiceCount = options.choiceCount || DEFAULT_CHOICE_COUNT
  const pool = itemsForMode(mode).filter((item) => distractorsFor(item).length >= choiceCount - 1)
  const preferredItems = (options.preferredKeys || [])
    .map((key) => pool.find((item) => item.id === key))
    .filter((item): item is WordItem => Boolean(item))
  const preferredIds = new Set(preferredItems.map((item) => item.id))
  const remainingItems = shuffle(pool.filter((item) => !preferredIds.has(item.id)))
  const questionItems = [...preferredItems, ...remainingItems].slice(0, Math.min(sessionSize, pool.length))

  return questionItems.map((item) => {
    const distractors = shuffle(distractorsFor(item))
      .slice(0, choiceCount - 1)
      .map((candidate) => candidate.word)

    return {
      item,
      choices: shuffle([item.word, ...distractors]),
    }
  })
}
