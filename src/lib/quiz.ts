import { wordBank, type WordItem } from '../data/words'

export type QuizMode = 'all' | 'three' | 'four'

export type QuizQuestion = {
  item: WordItem
  choices: string[]
}

const SESSION_SIZE = 15

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

export const createQuiz = (mode: QuizMode): QuizQuestion[] => {
  const pool = itemsForMode(mode).filter((item) => distractorsFor(item).length >= 3)
  const questionItems = shuffle(pool).slice(0, Math.min(SESSION_SIZE, pool.length))

  return questionItems.map((item) => {
    const distractors = shuffle(distractorsFor(item))
      .slice(0, 3)
      .map((candidate) => candidate.word)

    return {
      item,
      choices: shuffle([item.word, ...distractors]),
    }
  })
}
