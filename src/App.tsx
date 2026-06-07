import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Volume2 } from 'lucide-react'
import './App.css'
import { ObjectPicture } from './components/ObjectPicture'
import { createQuiz, type QuizMode } from './lib/quiz'
import type { AnswerRecord } from './types'

type Difficulty = 'easy' | 'medium' | 'hard'

const difficultySettings: Record<Difficulty, { label: string; mode: QuizMode; sessionSize: number; choiceCount: number }> = {
  easy: { label: 'Easy', mode: 'three', sessionSize: 10, choiceCount: 3 },
  medium: { label: 'Medium', mode: 'all', sessionSize: 15, choiceCount: 4 },
  hard: { label: 'Hard', mode: 'four', sessionSize: 20, choiceCount: 4 },
}

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
    QuizzesHubAdaptive?: {
      recordAttempt: (answers: Array<{ question: { key: string }, correct: boolean }>) => Promise<{ ok: boolean; reason?: string }>
    }
    QuizzesHubAdaptiveReady?: Promise<{ question_keys?: string[] }>
  }
}

type AppProps = {
  difficulty: Difficulty
}

type SavedPictureSession = {
  answers: AnswerRecord[]
  currentIndex: number
  difficulty: Difficulty
  questions: ReturnType<typeof createQuiz>
  selected: string | null
  version: 1
}

const storageKeyFor = (difficulty: Difficulty) => `picture-reading:active-session:${difficulty}:v1`

const loadSavedSession = (difficulty: Difficulty): SavedPictureSession | null => {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(difficulty))
    if (!raw) return null

    const parsed = JSON.parse(raw) as SavedPictureSession
    if (
      parsed?.version !== 1 ||
      parsed.difficulty !== difficulty ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length === 0 ||
      !Number.isInteger(parsed.currentIndex) ||
      parsed.currentIndex < 0 ||
      parsed.currentIndex >= parsed.questions.length ||
      !Array.isArray(parsed.answers)
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

const clearSavedSession = (difficulty: Difficulty) => {
  try {
    window.localStorage.removeItem(storageKeyFor(difficulty))
  } catch {
    // Ignore storage failures; the quiz can still run in memory.
  }
}

function App({ difficulty }: AppProps) {
  const settings = difficultySettings[difficulty]
  const [savedSession] = useState<SavedPictureSession | null>(() => loadSavedSession(difficulty))
  const [questions, setQuestions] = useState(() => savedSession?.questions ?? createQuiz(settings.mode, settings))
  const [currentIndex, setCurrentIndex] = useState(() => savedSession?.currentIndex ?? 0)
  const [selected, setSelected] = useState<string | null>(() => savedSession?.selected ?? null)
  const [answers, setAnswers] = useState<AnswerRecord[]>(() => savedSession?.answers ?? [])
  const answerLockedRef = useRef(false)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const current = questions[currentIndex]
  const correctCount = answers.filter((answer) => answer.selected === answer.question.item.word).length
  const isComplete = currentIndex >= questions.length
  const isCorrect = selected === current?.item.word

  const startNextRound = () => {
    clearSavedSession(difficulty)
    setQuestions(createQuiz(settings.mode, settings))
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
      answerLockedRef.current = true
      nextButtonRef.current?.focus()
    } else {
      answerLockedRef.current = false
    }
  }, [selected])

  useEffect(() => {
    if (isComplete) {
      clearSavedSession(difficulty)
      return
    }

    try {
      window.localStorage.setItem(
        storageKeyFor(difficulty),
        JSON.stringify({
          answers,
          currentIndex,
          difficulty,
          questions,
          selected,
          version: 1,
        } satisfies SavedPictureSession),
      )
    } catch {
      // Ignore storage failures; the current in-memory session remains valid.
    }
  }, [answers, currentIndex, difficulty, isComplete, questions, selected])

  useEffect(() => {
    if (savedSession || currentIndex !== 0 || selected || answers.length > 0) return

    let cancelled = false

    void window.QuizzesHubAdaptiveReady?.then((plan) => {
      const preferredKeys = Array.isArray(plan?.question_keys) ? plan.question_keys : []
      if (cancelled || preferredKeys.length === 0) return

      setQuestions(createQuiz(settings.mode, { ...settings, preferredKeys }))
    }).catch(() => null)

    return () => {
      cancelled = true
    }
  }, [answers.length, currentIndex, savedSession, selected, settings])

  useEffect(() => {
    if (!isComplete) return

    const progressPayload = {
      quizId: 'picture-reading',
      score: correctCount,
      total: questions.length,
      level: correctCount === questions.length ? 'A+' : correctCount >= Math.ceil(questions.length * 0.7) ? 'A' : 'Practice',
      details: {
        difficulty,
        answers: answers.map((answer) => ({
          prompt: answer.question.item.word,
          expected: answer.question.item.word,
          selected: answer.selected,
          correct: answer.selected === answer.question.item.word,
        })),
      },
    }

    void (async () => {
      await window.QuizzesHubAdaptiveReady?.catch(() => null)
      const adaptiveResult = await window.QuizzesHubAdaptive?.recordAttempt(
        answers.map((answer) => ({
          question: { key: answer.question.item.id },
          correct: answer.selected === answer.question.item.word,
        })),
      )

      if (!adaptiveResult?.ok) {
        await window.QuizzesHubProgress?.record(progressPayload)
      }
    })()
  }, [answers, correctCount, difficulty, isComplete, questions.length])

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
          <p className="eyebrow">{settings.label} · Little Words</p>
          <h1>Picture Reading Quiz</h1>
        </div>
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
              <button className="primary-button" type="button" onClick={startNextRound}>
                Next round
                <ArrowRight aria-hidden="true" size={20} />
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
