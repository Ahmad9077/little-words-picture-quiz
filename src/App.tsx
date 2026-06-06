import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, RotateCcw, Volume2 } from 'lucide-react'
import './App.css'
import { ObjectPicture } from './components/ObjectPicture'
import { createQuiz } from './lib/quiz'
import type { AnswerRecord } from './types'

declare global {
  interface Window {
    QuizzesHubProgress?: {
      record: (result: {
        quizId: string
        score: number
        total: number
        level?: string
        details?: Record<string, unknown>
      }) => Promise<{ ok: boolean; reason?: string }>
    }
  }
}

function App() {
  const [questions, setQuestions] = useState(() => createQuiz('all'))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const answerLockedRef = useRef(false)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const current = questions[currentIndex]
  const correctCount = answers.filter((answer) => answer.selected === answer.question.item.word).length
  const isComplete = currentIndex >= questions.length
  const isCorrect = selected === current?.item.word

  const restart = () => {
    setQuestions(createQuiz('all'))
    setCurrentIndex(0)
    setSelected(null)
    setAnswers([])
    answerLockedRef.current = false
  }

  const chooseAnswer = (choice: string) => {
    if (answerLockedRef.current || !current) {
      return
    }

    answerLockedRef.current = true
    setSelected(choice)
    setAnswers((value) => [...value, { question: current, selected: choice }])
  }

  const nextQuestion = () => {
    answerLockedRef.current = false
    setSelected(null)
    setCurrentIndex((value) => value + 1)
  }

  useEffect(() => {
    if (selected) {
      nextButtonRef.current?.focus()
    }
  }, [selected])

  useEffect(() => {
    if (!isComplete) return

    void window.QuizzesHubProgress?.record({
      quizId: 'picture-reading',
      score: correctCount,
      total: questions.length,
      level: correctCount === questions.length ? 'A+' : correctCount >= Math.ceil(questions.length * 0.7) ? 'A' : 'Practice',
      details: {
        answers: answers.map((answer) => ({
          prompt: answer.question.item.word,
          expected: answer.question.item.word,
          selected: answer.selected,
          correct: answer.selected === answer.question.item.word,
        })),
      }
    })
  }, [answers, correctCount, isComplete, questions.length])

  const speak = (word: string) => {
    if (!('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.78
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }

  return (
    <main className={`app-shell ${isComplete ? 'is-results' : 'is-playing'}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Little Words</p>
          <h1>Picture Reading Quiz</h1>
        </div>
        <button className="icon-button" type="button" onClick={() => restart()} aria-label="Restart quiz">
          <RotateCcw aria-hidden="true" size={22} />
        </button>
      </header>

      {!isComplete ? (
        <section className="question-indicator" aria-label="Question progress">
          <strong>
            {currentIndex + 1} / {questions.length}
          </strong>
          <div className="indicator-dots" aria-hidden="true">
            {questions.map((question, index) => {
              const answer = answers[index]
              const state =
                index === currentIndex
                  ? 'is-current'
                  : answer
                    ? answer.selected === question.item.word
                      ? 'is-correct'
                      : 'is-wrong'
                    : 'is-upcoming'

              return <span className={state} key={question.item.id} />
            })}
          </div>
        </section>
      ) : null}

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.section
            key="results"
            className="results-view"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.24 }}
          >
            <div className="results-hero">
              <BadgeCheck size={36} aria-hidden="true" />
              <p className="eyebrow">Finished</p>
              <h2>{correctCount} words read</h2>
              <p>
                Score {correctCount} / {questions.length}
              </p>
              <button className="primary-button" type="button" onClick={() => restart()}>
                <RotateCcw aria-hidden="true" size={20} />
                Play again
              </button>
            </div>

            <div className="review-grid" aria-label="Answer review">
              {answers.map((record) => {
                const isAnswerCorrect = record.selected === record.question.item.word

                return (
                  <article className={`review-card ${isAnswerCorrect ? 'is-right' : 'is-wrong'}`} key={record.question.item.id}>
                    <ObjectPicture item={record.question.item} />
                    <div>
                      <strong>{record.question.item.word}</strong>
                      <span>{isAnswerCorrect ? 'right' : `picked ${record.selected}`}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key={current.item.id}
            className="quiz-stage"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2 }}
          >
            <section className="picture-panel" aria-label="Picture">
              <ObjectPicture item={current.item} />
              <button className="sound-button" type="button" onClick={() => speak(current.item.word)}>
                <Volume2 aria-hidden="true" size={28} />
                Hear word
              </button>
            </section>

            <section className="choice-panel" aria-label="Answer choices">
              <div className="choice-grid">
                {current.choices.map((choice) => {
                  const isChoiceCorrect = choice === current.item.word
                  const isPicked = selected === choice
                  const className = [
                    'choice-button',
                    selected && isChoiceCorrect ? 'is-correct' : '',
                    selected && isPicked && !isChoiceCorrect ? 'is-incorrect' : '',
                    selected && !isPicked ? 'is-muted' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button
                      className={className}
                      disabled={Boolean(selected)}
                      key={choice}
                      type="button"
                      onClick={() => chooseAnswer(choice)}
                    >
                      {choice}
                    </button>
                  )
                })}
              </div>

              <div className={`feedback ${selected ? 'is-visible' : ''}`} aria-live="polite">
                {selected ? (
                  <>
                    <div>
                      <strong>{isCorrect ? 'Yes' : 'The word was'}</strong>
                      <span>{current.item.word}</span>
                    </div>
                    <button className="primary-button" type="button" onClick={nextQuestion} ref={nextButtonRef}>
                      Next
                      <ArrowRight aria-hidden="true" size={20} />
                    </button>
                  </>
                ) : (
                  <span aria-hidden="true" />
                )}
              </div>
            </section>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}

export default App
