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

export const createQuiz = (mode: QuizMode): QuizQuestion[] => {
  const pool = itemsForMode(mode)
  const questionItems = shuffle(pool).slice(0, Math.min(SESSION_SIZE, pool.length))

  return questionItems.map((item) => {
    const sameLengthDistractors = wordBank.filter(
      (candidate) =>
        candidate.word !== item.word &&
        candidate.letters === item.letters &&
        candidate.emoji !== item.emoji,
    )
    const backupDistractors = wordBank.filter(
      (candidate) => candidate.word !== item.word && candidate.emoji !== item.emoji,
    )
    const distractorPool = sameLengthDistractors.length >= 3 ? sameLengthDistractors : backupDistractors
    const distractors = shuffle(distractorPool)
      .slice(0, 3)
      .map((candidate) => candidate.word)

    return {
      item,
      choices: shuffle([item.word, ...distractors]),
    }
  })
}
