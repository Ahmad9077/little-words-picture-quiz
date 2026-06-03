import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, RotateCcw, Volume2 } from 'lucide-react'
import './App.css'
import { ObjectPicture } from './components/ObjectPicture'
import { createQuiz, type QuizMode } from './lib/quiz'
import type { AnswerRecord } from './types'

const modeLabels: Record<QuizMode, string> = {
  all: 'All',
  three: '3',
  four: '4',
}

function App() {
  const [mode, setMode] = useState<QuizMode>('all')
  const [questions, setQuestions] = useState(() => createQuiz('all'))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const answerLockedRef = useRef(false)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const current = questions[currentIndex]
  const correctCount = answers.filter((answer) => answer.selected === answer.question.item.word).length
  const answeredCount = answers.length
  const isComplete = currentIndex >= questions.length
  const isCorrect = selected === current?.item.word

  const restart = (nextMode = mode) => {
    setMode(nextMode)
    setQuestions(createQuiz(nextMode))
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
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Little Words</p>
          <h1>Picture Reading Quiz</h1>
        </div>
        <button className="icon-button" type="button" onClick={() => restart()} aria-label="Restart quiz">
          <RotateCcw aria-hidden="true" size={22} />
        </button>
      </header>

      <section className="control-row" aria-label="Letter mode">
        {(Object.keys(modeLabels) as QuizMode[]).map((option) => (
          <button
            key={option}
            className={`mode-button ${mode === option ? 'is-active' : ''}`}
            type="button"
            aria-pressed={mode === option}
            onClick={() => restart(option)}
          >
            <span>{modeLabels[option]}</span>
            <small>{option === 'all' ? 'words' : 'letters'}</small>
          </button>
        ))}
      </section>

      <section className="score-strip" aria-label="Quiz progress">
        <div>
          <strong>{Math.min(answeredCount + 1, questions.length)}</strong>
          <span>of {questions.length}</span>
        </div>
        <div>
          <strong>{correctCount}</strong>
          <span>right</span>
        </div>
        <div>
          <strong>{questions.length - answeredCount}</strong>
          <span>left</span>
        </div>
      </section>

      <div
        className="progress-dots"
        style={{ '--dot-count': questions.length } as CSSProperties}
        aria-hidden="true"
      >
        {questions.map((question, index) => {
          const record = answers[index]
          const state =
            index === currentIndex && !isComplete
              ? 'is-current'
              : record
                ? record.selected === question.item.word
                  ? 'is-right'
                  : 'is-wrong'
                : ''

          return <span key={question.item.id} className={state} />
        })}
      </div>

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
                    <ObjectPicture item={record.question.item} revealed />
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
              <ObjectPicture item={current.item} revealed={Boolean(selected)} />
              <div className="prompt-line">
                <span>Pick the word</span>
                <strong>{current.item.letters} letters</strong>
              </div>
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
                    <button className="icon-button" type="button" onClick={() => speak(current.item.word)} aria-label="Hear word">
                      <Volume2 aria-hidden="true" size={22} />
                    </button>
                    <button className="primary-button" type="button" onClick={nextQuestion} ref={nextButtonRef}>
                      Next
                      <ArrowRight aria-hidden="true" size={20} />
                    </button>
                  </>
                ) : (
                  <span aria-hidden="true">Select one word</span>
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
