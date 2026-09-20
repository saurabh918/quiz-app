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
  const gameRunIdRef = useRef(null)
  const savedRunIdRef = useRef(null)
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

  useEffect(() => {
    if (state.status === GameStatus.IDLE && showHistory) {
      document.title = `History · ${APP_TITLE}`
      return
    }

    document.title = getDocumentTitle(state.status, state.questionIndex)
  }, [state.status, state.questionIndex, showHistory])

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
    })
  }, [state.status, state.questionIndex, state.playerName, resultPrize, totalQuestions, activeCategory])

  useGameRuntime({
    status: state.status,
    question: currentQuestion,
    questionIndex: state.questionIndex,
    selectedAnswerId: state.selectedAnswerId,
    totalQuestions,
    dispatch,
    muted,
  })

  const handleStartGame = (playerName, categoryId) => {
    const playable = getPlayableCategory(categoryId)
    if (!playable.ok) {
      return
    }

    setShowHistory(false)
    setActiveQuestions(playable.questions)
    setActiveCategory(playable.category)
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

  const handleRestartGame = () => {
    setShowHistory(false)
    setActiveQuestions([])
    setActiveCategory(null)
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
                categoryName={categoryName}
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
                      categoryName={categoryName}
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
