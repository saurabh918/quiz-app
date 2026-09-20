import { describe, expect, it } from 'vitest'
import { prizes } from '../data/prizes'
import {
  ActionType,
  GameStatus,
  TIMER_SECONDS,
  gameReducer,
  getActivePrizeId,
  getResultPrize,
  initialGameState,
} from './gameReducer'

function startGame(playerName = 'Ada') {
  return gameReducer(initialGameState, {
    type: ActionType.START_GAME,
    payload: { playerName },
  })
}

function selectAnswer(state, answerId) {
  return gameReducer(state, {
    type: ActionType.SELECT_ANSWER,
    payload: { answerId },
  })
}

function revealAnswer(state) {
  return gameReducer(state, { type: ActionType.REVEAL_ANSWER })
}

describe('gameReducer', () => {
  it('starts in an idle initial state', () => {
    expect(initialGameState).toEqual({
      status: GameStatus.IDLE,
      playerName: null,
      questionIndex: 0,
      selectedAnswerId: null,
      secondsLeft: TIMER_SECONDS,
    })
    expect(gameReducer(initialGameState, { type: 'UNKNOWN' })).toBe(initialGameState)
  })

  it('starts a game with a trimmed player name', () => {
    const state = startGame('  Ada  ')

    expect(state.status).toBe(GameStatus.PLAYING)
    expect(state.playerName).toBe('Ada')
    expect(state.questionIndex).toBe(0)
    expect(state.selectedAnswerId).toBeNull()
    expect(state.secondsLeft).toBe(TIMER_SECONDS)
  })

  it('does not start a game when the name is empty or whitespace', () => {
    expect(
      gameReducer(initialGameState, {
        type: ActionType.START_GAME,
        payload: { playerName: '' },
      }),
    ).toBe(initialGameState)

    expect(
      gameReducer(initialGameState, {
        type: ActionType.START_GAME,
        payload: { playerName: '   ' },
      }),
    ).toBe(initialGameState)
  })

  it('locks a valid answer while playing', () => {
    const state = selectAnswer(startGame(), '1-a')

    expect(state.status).toBe(GameStatus.LOCKED)
    expect(state.selectedAnswerId).toBe('1-a')
    expect(state.secondsLeft).toBe(TIMER_SECONDS)
  })

  it('ignores a second answer after the first is locked', () => {
    const locked = selectAnswer(startGame(), '1-a')
    const next = selectAnswer(locked, '1-b')

    expect(next).toBe(locked)
    expect(next.selectedAnswerId).toBe('1-a')
    expect(next.status).toBe(GameStatus.LOCKED)
  })

  it('decrements the timer while playing', () => {
    const playing = startGame()
    const ticked = gameReducer(playing, { type: ActionType.TICK })

    expect(ticked.status).toBe(GameStatus.PLAYING)
    expect(ticked.secondsLeft).toBe(TIMER_SECONDS - 1)
  })

  it('does not tick after an answer is selected', () => {
    const locked = selectAnswer(startGame(), '1-a')
    const ticked = gameReducer(locked, { type: ActionType.TICK })

    expect(ticked).toBe(locked)
    expect(ticked.secondsLeft).toBe(TIMER_SECONDS)
  })

  it('ends the game as a timeout when the timer reaches zero', () => {
    const almostOut = { ...startGame(), secondsLeft: 1 }
    const timedOut = gameReducer(almostOut, { type: ActionType.TICK })

    expect(timedOut.status).toBe(GameStatus.TIMEOUT)
    expect(timedOut.secondsLeft).toBe(0)
  })

  it('applies TIMEOUT only while playing', () => {
    const playingTimeout = gameReducer(startGame(), { type: ActionType.TIMEOUT })
    expect(playingTimeout.status).toBe(GameStatus.TIMEOUT)
    expect(playingTimeout.secondsLeft).toBe(0)

    const locked = selectAnswer(startGame(), '1-a')
    expect(gameReducer(locked, { type: ActionType.TIMEOUT })).toBe(locked)
  })

  it('reveals a locked answer then advances on NEXT_QUESTION', () => {
    const revealing = revealAnswer(selectAnswer(startGame(), '1-a'))
    expect(revealing.status).toBe(GameStatus.REVEALING)

    const next = gameReducer(revealing, {
      type: ActionType.NEXT_QUESTION,
      payload: { totalQuestions: 15 },
    })

    expect(next.status).toBe(GameStatus.PLAYING)
    expect(next.questionIndex).toBe(1)
    expect(next.selectedAnswerId).toBeNull()
    expect(next.secondsLeft).toBe(TIMER_SECONDS)
  })

  it('marks a wrong revealed answer as lost', () => {
    const revealing = revealAnswer(selectAnswer(startGame(), '1-b'))
    const lost = gameReducer(revealing, { type: ActionType.ANSWER_WRONG })

    expect(lost.status).toBe(GameStatus.LOST)
    expect(lost.questionIndex).toBe(0)
    expect(lost.selectedAnswerId).toBe('1-b')
  })

  it('completes the game from the last question without incrementing the index', () => {
    const lastQuestion = {
      ...revealAnswer(selectAnswer(startGame(), '15-a')),
      questionIndex: 14,
      selectedAnswerId: '15-a',
    }

    const wonByComplete = gameReducer(lastQuestion, { type: ActionType.COMPLETE_GAME })
    expect(wonByComplete.status).toBe(GameStatus.WON)
    expect(wonByComplete.questionIndex).toBe(14)

    const wonByNext = gameReducer(lastQuestion, {
      type: ActionType.NEXT_QUESTION,
      payload: { totalQuestions: 15 },
    })
    expect(wonByNext.status).toBe(GameStatus.WON)
    expect(wonByNext.questionIndex).toBe(14)
  })

  it('restarts to a clean idle state', () => {
    const lost = gameReducer(
      revealAnswer(selectAnswer(startGame(), '1-b')),
      { type: ActionType.ANSWER_WRONG },
    )
    const restarted = gameReducer(lost, { type: ActionType.RESTART_GAME })

    expect(restarted).toEqual(initialGameState)
    expect(restarted).not.toBe(initialGameState)
  })
})

describe('prize selectors', () => {
  it('uses a 1-based prize id for the current question', () => {
    expect(getActivePrizeId(startGame())).toBe(1)
    expect(getActivePrizeId({ ...startGame(), questionIndex: 4 })).toBe(5)
  })

  it('returns $ 0 until a question is completed', () => {
    expect(getResultPrize(startGame(), prizes)).toBe('$ 0')
    expect(getResultPrize(initialGameState, prizes)).toBe('$ 0')
  })

  it('returns the last completed prize after a loss or timeout', () => {
    const lostOnFirst = gameReducer(
      revealAnswer(selectAnswer(startGame(), '1-b')),
      { type: ActionType.ANSWER_WRONG },
    )
    expect(getResultPrize(lostOnFirst, prizes)).toBe('$ 0')

    const lostOnSecond = gameReducer(
      revealAnswer(selectAnswer({ ...startGame(), questionIndex: 1 }, '2-b')),
      { type: ActionType.ANSWER_WRONG },
    )
    expect(getResultPrize(lostOnSecond, prizes)).toBe('$ 100')

    const timedOutOnSecond = gameReducer(
      { ...startGame(), questionIndex: 1 },
      { type: ActionType.TIMEOUT },
    )
    expect(getResultPrize(timedOutOnSecond, prizes)).toBe('$ 100')
  })

  it('returns the top prize when the game is won', () => {
    const won = gameReducer(
      {
        ...revealAnswer(selectAnswer(startGame(), '15-a')),
        questionIndex: 14,
        selectedAnswerId: '15-a',
      },
      { type: ActionType.COMPLETE_GAME },
    )

    expect(getResultPrize(won, prizes)).toBe('$ 1000000')
  })
})
