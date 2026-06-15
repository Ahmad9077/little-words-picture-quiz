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
    QuizzesHubChallenge?: {
      active: boolean
      currentUserId: string | null
      canAnswer: () => boolean
      onChange: (listener: (state: ChallengeState) => void) => () => void
      openHub: () => void
      submitAnswer: (answer: { answerText: string; isCorrect: boolean }) => Promise<{ ok: boolean; reason?: string }>
    }
    QuizzesHubChallengeReady?: Promise<ChallengeState>
  }
}

type ChallengePlayer = {
  display_name: string
  user_id: string
  wrong_count: number
}

type ChallengeState = {
  current_answering_user_id: string | null
  current_question_key: string | null
  current_turn_index: number
  last_turn?: {
    answering_player_id: string
    answer_text?: string | null
    answered_at?: string
    is_correct: boolean
    question_key: string
    turn_index: number
  } | null
  players: ChallengePlayer[]
  status: 'waiting' | 'active' | 'finished' | 'abandoned'
  winner_id: string | null
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

const createChallengeQuestion = (key: string, turnIndex: number, selected?: string | null) => {
  const question = withSeededRandom(`picture-reading:${key}:${turnIndex}`, () => createQuiz('all', {
    choiceCount: 4,
    preferredKeys: [key],
    sessionSize: 1,
  })[0])

  if (!question || question.item.id !== key) return null

  if (selected && selected !== question.item.word && !question.choices.includes(selected)) {
    question.choices = [...question.choices.slice(0, -1), selected]
  }

  return question
}

function App({ difficulty }: AppProps) {
  const settings = difficultySettings[difficulty]
  const isChallengeMode = Boolean(window.QuizzesHubChallenge?.active)
  const [savedSession] = useState<SavedPictureSession | null>(() => isChallengeMode ? null : loadSavedSession(difficulty))
  const [questions, setQuestions] = useState(() => savedSession?.questions ?? (isChallengeMode ? [] : createQuiz(settings.mode, settings)))
  const [currentIndex, setCurrentIndex] = useState(() => savedSession?.currentIndex ?? 0)
  const [selected, setSelected] = useState<string | null>(() => savedSession?.selected ?? null)
  const [answers, setAnswers] = useState<AnswerRecord[]>(() => savedSession?.answers ?? [])
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const challengeLastTurnIdRef = useRef<string | null>(null)
  const challengeRevealTimerRef = useRef<number | null>(null)
  const answerLockedRef = useRef(false)
  const nextButtonRef = useRef<HTMLButtonElement | null>(null)
  const current = questions[currentIndex]
  const correctCount = answers.filter((answer) => answer.selected === answer.question.item.word).length
  const isComplete = currentIndex >= questions.length
  const isCorrect = selected === current?.item.word

  const startNextRound = () => {
    if (isChallengeMode) {
      return
    }

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

    if (isChallengeMode && !window.QuizzesHubChallenge?.canAnswer()) {
      return
    }

    answerLockedRef.current = true
    setSelected(choice)
    setAnswers((value) => [...value, { question: current, selected: choice }])

    if (isChallengeMode) {
      void window.QuizzesHubChallenge?.submitAnswer({
        answerText: choice,
        isCorrect: choice === current.item.word,
      }).then((result) => {
        if (!result?.ok) {
          setChallengeError(result?.reason || 'Could not submit answer.')
          answerLockedRef.current = false
        }
      })
    }
  }

  const nextQuestion = () => {
    if (isChallengeMode) {
      return
    }

    answerLockedRef.current = false
    setSelected(null)
    setCurrentIndex((value) => value + 1)
  }

  useEffect(() => {
    if (isChallengeMode) return

    if (selected) {
      answerLockedRef.current = true
      nextButtonRef.current?.focus()
    } else {
      answerLockedRef.current = false
    }
  }, [isChallengeMode, selected])

  useEffect(() => {
    if (isChallengeMode) return

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
  }, [answers, currentIndex, difficulty, isChallengeMode, isComplete, questions, selected])

  useEffect(() => {
    if (isChallengeMode) return
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
  }, [answers.length, currentIndex, isChallengeMode, savedSession, selected, settings])

  useEffect(() => {
    if (isChallengeMode) return
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
  }, [answers, correctCount, difficulty, isChallengeMode, isComplete, questions.length])

  useEffect(() => {
    if (!isChallengeMode) return

    let unsubscribe: (() => void) | undefined
    let cancelled = false

    const applyChallengeQuestion = (state: ChallengeState) => {
      if (cancelled) return
      setChallengeState(state)
      setChallengeError(null)
      setSelected(null)
      setAnswers([])
      answerLockedRef.current = false

      if (state.status !== 'active' || !state.current_question_key) {
        setQuestions([])
        return
      }

      const nextQuestion = createChallengeQuestion(state.current_question_key, state.current_turn_index)

      if (!nextQuestion || nextQuestion.item.id !== state.current_question_key) {
        setQuestions([])
        setChallengeError('This challenge question is not available in this quiz version.')
        return
      }

      setCurrentIndex(0)
      setQuestions([nextQuestion])
    }

    const revealChallengeAnswer = (state: ChallengeState) => {
      if (cancelled) return
      const lastTurn = state.last_turn
      const nextQuestion = lastTurn ? createChallengeQuestion(lastTurn.question_key, lastTurn.turn_index, lastTurn.answer_text) : null
      if (!lastTurn || !nextQuestion) {
        applyChallengeQuestion(state)
        return
      }

      setChallengeState(state)
      setChallengeError(null)
      setSelected(lastTurn.answer_text || '')
      setAnswers([{ question: nextQuestion, selected: lastTurn.answer_text || '' }])
      answerLockedRef.current = true
      setCurrentIndex(0)
      setQuestions([nextQuestion])

      if (challengeRevealTimerRef.current) {
        window.clearTimeout(challengeRevealTimerRef.current)
      }
      challengeRevealTimerRef.current = window.setTimeout(() => {
        challengeRevealTimerRef.current = null
        applyChallengeQuestion(state)
      }, 3000)
    }

    const applyChallengeState = (state: ChallengeState) => {
      const turnId = getChallengeTurnId(state.last_turn)
      if (turnId && turnId !== challengeLastTurnIdRef.current) {
        challengeLastTurnIdRef.current = turnId
        revealChallengeAnswer(state)
        return
      }

      if (challengeRevealTimerRef.current) return
      applyChallengeQuestion(state)
    }

    void window.QuizzesHubChallengeReady?.then((state) => {
      challengeLastTurnIdRef.current = getChallengeTurnId(state.last_turn)
      applyChallengeState(state)
      unsubscribe = window.QuizzesHubChallenge?.onChange(applyChallengeState)
    }).catch(() => {
      setChallengeError('Could not open this challenge. Please return to Quizzes Hub.')
    })

    return () => {
      cancelled = true
      if (challengeRevealTimerRef.current) window.clearTimeout(challengeRevealTimerRef.current)
      unsubscribe?.()
    }
  }, [isChallengeMode])

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

      {isChallengeMode && challengeState ? (
        <section className="question-indicator" aria-label="Challenge status">
          <strong>
            {getChallengeHudText(challengeState) || `Challenge ${challengeState.status === 'active' ? challengeState.current_turn_index + 1 : ''}`}
          </strong>
          <div className="indicator-dots" aria-hidden="true">
            {challengeState.players.map((player) => (
              <span
                className={player.user_id === challengeState.current_answering_user_id ? 'is-current' : player.wrong_count >= 3 ? 'is-wrong' : 'is-upcoming'}
                key={player.user_id}
              />
            ))}
          </div>
        </section>
      ) : !isComplete ? (
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
        {isChallengeMode && (!current || challengeState?.status !== 'active') ? (
          <motion.section
            key="challenge-status"
            className="results-view"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.24 }}
          >
            <div className="results-hero">
              <BadgeCheck size={36} aria-hidden="true" />
              <p className="eyebrow">Challenge Mode</p>
              <h2>{challengeState?.status === 'finished' ? getChallengeWinnerText(challengeState) : 'Waiting'}</h2>
              <p>{challengeError || 'Waiting for the challenge session.'}</p>
            </div>
          </motion.section>
        ) : isComplete ? (
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
                      disabled={Boolean(selected) || (isChallengeMode && !window.QuizzesHubChallenge?.canAnswer())}
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
                      <strong>{isCorrect ? 'Yes' : `Picked ${selected}. The word was`}</strong>
                      <span>{current.item.word}</span>
                    </div>
                    {!isChallengeMode ? (
                      <button className="primary-button" type="button" onClick={nextQuestion} ref={nextButtonRef}>
                        Next
                        <ArrowRight aria-hidden="true" size={20} />
                      </button>
                    ) : null}
                  </>
                ) : (
                  <span>
                    {isChallengeMode && !window.QuizzesHubChallenge?.canAnswer()
                      ? getChallengeTurnText(challengeState)
                      : challengeError || ''}
                  </span>
                )}
              </div>
            </section>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}

function getChallengeTurnText(state: ChallengeState | null) {
  const currentPlayer = state?.players.find((player) => player.user_id === state.current_answering_user_id)
  return currentPlayer ? `Waiting for ${currentPlayer.display_name}.` : 'Waiting for the other player.'
}

function getChallengeWinnerText(state: ChallengeState | null) {
  const winner = state?.players.find((player) => player.user_id === state.winner_id)
  return winner ? `🎉 ${winner.display_name} wins!` : '🎉 Challenge finished'
}

function getChallengeScoreText(state: ChallengeState | null) {
  if (!state?.players.length) return ''
  return state.players.map((player) => `${player.display_name}: ${player.wrong_count}/3`).join(' · ')
}

function getChallengeHudText(state: ChallengeState | null) {
  if (!state) return ''
  const currentPlayer = state.players.find((player) => player.user_id === state.current_answering_user_id)
  const turn = currentPlayer
    ? currentPlayer.user_id === window.QuizzesHubChallenge?.currentUserId
      ? 'Your turn'
      : `${currentPlayer.display_name}'s turn`
    : 'Challenge'
  return `${turn} · ${getChallengeScoreText(state)}`
}

function getChallengeTurnId(turn: ChallengeState['last_turn']) {
  if (!turn) return null
  return `${turn.turn_index}:${turn.answering_player_id}:${turn.answered_at || ''}`
}

function withSeededRandom<T>(seedText: string, callback: () => T) {
  const originalRandom = Math.random
  let seed = 2166136261

  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index)
    seed = Math.imul(seed, 16777619)
  }

  Math.random = () => {
    seed += 0x6D2B79F5
    let value = seed
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }

  try {
    return callback()
  } finally {
    Math.random = originalRandom
  }
}

export default App
