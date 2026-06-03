import type { QuizQuestion } from './lib/quiz'

export type AnswerRecord = {
  question: QuizQuestion
  selected: string
}
