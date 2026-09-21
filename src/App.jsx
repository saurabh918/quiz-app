import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import './App.css'
import Quiz from './components/Quiz'
import Timer from './components/Timer'
import Start from './components/Start'
import ResultScreen from './components/ResultScreen'
import History from './components/History'
import SoundToggle from './components/SoundToggle'
import PrizeLadder, { CurrentPrizeBar } from './components/PrizeLadder'
import { getPlayableCategory } from './data/questionBank'
import { prizes } from './data/prizes'
import {
  ActionType,
  GameStatus,
  gameReducer,
  getActivePrizeId,
  getCurrentQuestion,
  getResultPrize,
  initialGameState,
  isActiveGame,
  isGameOver,
} from './game/gameReducer'
import { formatPrizeAmount } from './data/formatPrize'
import { createHistoryId, saveGameHistory } from './history/gameHistory'
import { useGameRuntime } from './hooks/useGameRuntime'
import { useSoundPreference } from './hooks/useSoundPreference'

function getTimerLabel(secondsLeft) {
  const unit = secondsLeft === 1 ? 'second' : 'seconds'
  return `${secondsLeft} ${unit} remaining`
}

function getTimerClassName(secondsLeft) {
  if (secondsLeft <= 5) {
    return 'timer isCritical'
  }

  if (secondsLeft <= 10) {
    return 'timer isUrgent'
  }

  return 'timer'
}

function getGameStatusAnnouncement(state, question) {
  if (state.status === GameStatus.LOCKED) {
    return 'Answer locked in.'
  }

  if (state.status === GameStatus.REVEALING) {
    const selectedAnswer = question?.answers.find((answer) => answer.id === state.selectedAnswerId)
    const correctAnswer = question?.answers.find((answer) => answer.correct)

    if (selectedAnswer?.correct) {
      return 'Correct.'
    }

    return correctAnswer
      ? `Incorrect. The correct answer is ${correctAnswer.text}.`
      : 'Incorrect.'
  }

  if (state.status === GameStatus.TIMEOUT) {
    return 'Time expired.'
  }

  if (state.status === GameStatus.PLAYING && state.questionIndex > 0) {
    return 'Next question.'
  }

  return ''
}

const APP_TITLE = 'Prize Ladder Quiz'

function getDocumentTitle(status, questionIndex) {
  if (status === GameStatus.IDLE) {
    return APP_TITLE
  }

  if (status === GameStatus.WON) {
    return `Completed · ${APP_TITLE}`
  }

  if (status === GameStatus.LOST) {
    return `Incorrect answer · ${APP_TITLE}`
  }

  if (status === GameStatus.TIMEOUT) {
    return `Time is up · ${APP_TITLE}`
  }

  return `Question ${questionIndex + 1} · ${APP_TITLE}`
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)
  const [showHistory, setShowHistory] = useState(false)
  const [activeQuestions, setActiveQuestions] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeDifficulty, setActiveDifficulty] = useState(null)
  const [learningMode, setLearningMode] = useState(false)
  const [timedOutQuestion, setTimedOutQuestion] = useState(null)
  const gameRunIdRef = useRef(null)
  const savedRunIdRef = useRef(null)
  const continueHandledRef = useRef(false)
  const activeQuestionRef = useRef(null)
  const { muted, toggleMuted } = useSoundPreference()
  const currentQuestion = getCurrentQuestion(state, activeQuestions)
  const resultPrize = getResultPrize(state, prizes)
  const activePrizeId = getActivePrizeId(state)
  const currentPrizeAmount = prizes.find((prize) => prize.id === activePrizeId)?.amount ?? '$ 0'
  const topPrizeId = prizes[prizes.length - 1]?.id
  const prizeLadder = useMemo(() => [...prizes].reverse(), [])
  const statusAnnouncement = getGameStatusAnnouncement(state, currentQuestion)
  const totalQuestions = activeQuestions.length
  const categoryName = activeCategory?.name
  const difficultyName = activeDifficulty?.name
  const quizContextLabel = [categoryName, difficultyName].filter(Boolean).join(' · ')

  useEffect(() => {
    if (state.status === GameStatus.IDLE && showHistory) {
      document.title = `History · ${APP_TITLE}`
      return
    }

    document.title = getDocumentTitle(state.status, state.questionIndex)
  }, [state.status, state.questionIndex, showHistory])

  useEffect(() => {
    if (state.status === GameStatus.PLAYING) {
      activeQuestionRef.current = activeQuestions[state.questionIndex] ?? null
    }
  }, [state.status, state.questionIndex, activeQuestions])

  useEffect(() => {
    if (state.status === GameStatus.TIMEOUT) {
      setTimedOutQuestion(activeQuestionRef.current)
    }
  }, [state.status])

  useEffect(() => {
    if (state.status !== GameStatus.REVEALING) {
      continueHandledRef.current = false
    }
  }, [state.status, state.questionIndex])

  useEffect(() => {
    if (!isGameOver(state.status)) {
      return
    }

    const runId = gameRunIdRef.current
    if (!runId || savedRunIdRef.current === runId) {
      return
    }

    savedRunIdRef.current = runId
    saveGameHistory({
      id: runId,
      playerName: state.playerName || 'Player',
      status: state.status,
      questionIndex: state.questionIndex,
      totalQuestions,
      securedPrize: formatPrizeAmount(resultPrize),
      completedAt: new Date().toISOString(),
      ...(activeCategory
        ? {
            categoryId: activeCategory.id,
            categoryName: activeCategory.name,
          }
        : {}),
      ...(activeDifficulty
        ? {
            difficultyId: activeDifficulty.id,
            difficultyName: activeDifficulty.name,
          }
        : {}),
    })
  }, [
    state.status,
    state.questionIndex,
    state.playerName,
    resultPrize,
    totalQuestions,
    activeCategory,
    activeDifficulty,
  ])

  const { continueAfterReveal } = useGameRuntime({
    status: state.status,
    question: currentQuestion,
    questionIndex: state.questionIndex,
    selectedAnswerId: state.selectedAnswerId,
    totalQuestions,
    dispatch,
    muted,
    learningMode,
  })

  const handleStartGame = (playerName, categoryId, difficultyId, nextLearningMode = false) => {
    const playable = getPlayableCategory(categoryId, difficultyId)
    if (!playable.ok) {
      return
    }

    setShowHistory(false)
    setTimedOutQuestion(null)
    setLearningMode(Boolean(nextLearningMode))
    setActiveQuestions(playable.questions)
    setActiveCategory(playable.category)
    setActiveDifficulty(playable.difficulty)
    gameRunIdRef.current = createHistoryId()
    savedRunIdRef.current = null
    dispatch({
      type: ActionType.START_GAME,
      payload: { playerName },
    })
  }

  const handleSelectAnswer = (answerId) => {
    dispatch({
      type: ActionType.SELECT_ANSWER,
      payload: { answerId },
    })
  }

  const handleContinueAfterReveal = () => {
    if (state.status !== GameStatus.REVEALING || continueHandledRef.current) {
      return
    }

    continueHandledRef.current = true
    continueAfterReveal()
  }

  const handleRestartGame = () => {
    setShowHistory(false)
    setTimedOutQuestion(null)
    setLearningMode(false)
    setActiveQuestions([])
    setActiveCategory(null)
    setActiveDifficulty(null)
    dispatch({ type: ActionType.RESTART_GAME })
  }

  const handleOpenHistory = () => {
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
  }

  return (
    <div
      className={
        state.status === GameStatus.IDLE ? 'app isIdle' : isGameOver(state.status) ? 'app isOver' : 'app'
      }
    >
      <p className="visuallyHidden" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </p>
      <SoundToggle muted={muted} onToggle={toggleMuted} />
      {state.status === GameStatus.IDLE ? (
        showHistory ? (
          <History onBack={handleCloseHistory} />
        ) : (
          <Start onStart={handleStartGame} onOpenHistory={handleOpenHistory} />
        )
      ) : (
        <>
          <div className="main">
            {isGameOver(state.status) ? (
              <ResultScreen
                status={state.status}
                prize={resultPrize}
                playerName={state.playerName}
                questionIndex={state.questionIndex}
                totalQuestions={totalQuestions}
                categoryName={quizContextLabel || categoryName}
                learningMode={learningMode}
                timedOutQuestion={timedOutQuestion}
                onRestart={handleRestartGame}
              />
            ) : (
              <>
                <div className="top">
                  <div
                    className={getTimerClassName(state.secondsLeft)}
                    role="timer"
                    aria-label={getTimerLabel(state.secondsLeft)}
                  >
                    <span className="timerValue">
                      <Timer secondsLeft={state.secondsLeft} />
                    </span>
                    {state.secondsLeft <= 10 ? (
                      <span className="timerUrgency" aria-hidden="true">
                        {state.secondsLeft <= 5 ? 'Hurry' : 'Low'}
                      </span>
                    ) : null}
                  </div>
                  <div className="playerName">
                    <h4>Player: {state.playerName}</h4>
                  </div>
                </div>
                {isActiveGame(state.status) && (
                  <CurrentPrizeBar
                    activePrizeId={activePrizeId}
                    totalPrizes={prizes.length}
                    amount={currentPrizeAmount}
                  />
                )}
                <div className="bottom">
                  {currentQuestion && (
                    <Quiz
                      question={currentQuestion}
                      status={state.status}
                      selectedAnswerId={state.selectedAnswerId}
                      onSelectAnswer={handleSelectAnswer}
                      categoryName={quizContextLabel || categoryName}
                      learningMode={learningMode}
                      onContinue={handleContinueAfterReveal}
                    />
                  )}
                </div>
              </>
            )}
          </div>
          {isActiveGame(state.status) && (
            <PrizeLadder
              prizes={prizeLadder}
              activePrizeId={activePrizeId}
              topPrizeId={topPrizeId}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
