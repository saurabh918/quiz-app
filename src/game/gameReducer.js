export const TIMER_SECONDS = 30

const ZERO_PRIZE = '$ 0'

export const ActionType = {
  START_GAME: 'START_GAME',
  SELECT_ANSWER: 'SELECT_ANSWER',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  NEXT_QUESTION: 'NEXT_QUESTION',
  COMPLETE_GAME: 'COMPLETE_GAME',
  ANSWER_WRONG: 'ANSWER_WRONG',
  TICK: 'TICK',
  TIMEOUT: 'TIMEOUT',
  RESTART_GAME: 'RESTART_GAME',
}

export const GameStatus = {
  IDLE: 'idle',
  PLAYING: 'playing',
  LOCKED: 'locked',
  REVEALING: 'revealing',
  WON: 'won',
  LOST: 'lost',
  TIMEOUT: 'timeout',
}

export const initialGameState = {
  status: GameStatus.IDLE,
  playerName: null,
  questionIndex: 0,
  selectedAnswerId: null,
  secondsLeft: TIMER_SECONDS,
}

export function isActiveGame(status) {
  return (
    status === GameStatus.PLAYING ||
    status === GameStatus.LOCKED ||
    status === GameStatus.REVEALING
  )
}

export function isGameOver(status) {
  return (
    status === GameStatus.WON ||
    status === GameStatus.LOST ||
    status === GameStatus.TIMEOUT
  )
}

export function getCurrentQuestion(state, questions) {
  if (!isActiveGame(state.status)) {
    return null
  }

  return questions[state.questionIndex] ?? null
}

export function getActivePrizeId(state) {
  return state.questionIndex + 1
}

export function getResultPrize(state, prizes) {
  if (state.status === GameStatus.WON) {
    return prizes[prizes.length - 1]?.amount ?? ZERO_PRIZE
  }

  if (state.status === GameStatus.LOST || state.status === GameStatus.TIMEOUT) {
    if (state.questionIndex <= 0) {
      return ZERO_PRIZE
    }

    return prizes.find((prize) => prize.id === state.questionIndex)?.amount ?? ZERO_PRIZE
  }

  return ZERO_PRIZE
}

function startGame(state, playerName) {
  const trimmedName = typeof playerName === 'string' ? playerName.trim() : ''

  if (!trimmedName) {
    return state
  }

  return {
    ...initialGameState,
    status: GameStatus.PLAYING,
    playerName: trimmedName,
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case ActionType.START_GAME:
      return startGame(state, action.payload?.playerName)

    case ActionType.SELECT_ANSWER: {
      if (state.status !== GameStatus.PLAYING) {
        return state
      }

      const answerId = action.payload?.answerId
      if (!answerId) {
        return state
      }

      return {
        ...state,
        status: GameStatus.LOCKED,
        selectedAnswerId: answerId,
      }
    }

    case ActionType.REVEAL_ANSWER: {
      if (state.status !== GameStatus.LOCKED) {
        return state
      }

      return {
        ...state,
        status: GameStatus.REVEALING,
      }
    }

    case ActionType.NEXT_QUESTION: {
      if (state.status !== GameStatus.REVEALING) {
        return state
      }

      const totalQuestions = action.payload?.totalQuestions
      const isLastQuestion =
        typeof totalQuestions === 'number' && state.questionIndex >= totalQuestions - 1

      if (isLastQuestion) {
        return {
          ...state,
          status: GameStatus.WON,
        }
      }

      return {
        ...state,
        status: GameStatus.PLAYING,
        questionIndex: state.questionIndex + 1,
        selectedAnswerId: null,
        secondsLeft: TIMER_SECONDS,
      }
    }

    case ActionType.COMPLETE_GAME: {
      if (state.status !== GameStatus.REVEALING) {
        return state
      }

      return {
        ...state,
        status: GameStatus.WON,
      }
    }

    case ActionType.ANSWER_WRONG: {
      if (state.status !== GameStatus.REVEALING) {
        return state
      }

      return {
        ...state,
        status: GameStatus.LOST,
      }
    }

    case ActionType.TICK: {
      if (state.status !== GameStatus.PLAYING) {
        return state
      }

      if (state.secondsLeft <= 1) {
        return {
          ...state,
          secondsLeft: 0,
          status: GameStatus.TIMEOUT,
        }
      }

      return {
        ...state,
        secondsLeft: state.secondsLeft - 1,
      }
    }

    case ActionType.TIMEOUT: {
      if (state.status !== GameStatus.PLAYING) {
        return state
      }

      return {
        ...state,
        secondsLeft: 0,
        status: GameStatus.TIMEOUT,
      }
    }

    case ActionType.RESTART_GAME:
      return { ...initialGameState }

    default:
      return state
  }
}
