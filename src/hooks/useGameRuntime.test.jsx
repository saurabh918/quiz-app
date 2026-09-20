import { StrictMode } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { questions } from '../data/questions'
import { ActionType, GameStatus } from '../game/gameReducer'
import { useGameRuntime } from './useGameRuntime'

const LOCK_DURATION_MS = 3000
const REVEAL_DURATION_MS = 3000
const TICK_MS = 1000

const soundMocks = vi.hoisted(() => {
  const createSound = () => ({
    play: vi.fn(),
    stop: vi.fn(),
  })

  return {
    start: createSound(),
    correct: createSound(),
    wrong: createSound(),
    celebrate: createSound(),
    sequence: ['start', 'correct', 'wrong', 'celebrate'],
    index: 0,
  }
})

vi.mock('use-sound', () => ({
  default: () => {
    const key = soundMocks.sequence[soundMocks.index % 4]
    soundMocks.index += 1
    const entry = soundMocks[key]
    return [entry.play, { stop: entry.stop }]
  },
}))

function RuntimeHarness(props) {
  useGameRuntime(props)
  return null
}

function renderRuntime(overrides = {}, options = {}) {
  const dispatch = overrides.dispatch ?? vi.fn()
  const props = {
    status: GameStatus.IDLE,
    question: questions[0],
    questionIndex: 0,
    selectedAnswerId: null,
    totalQuestions: questions.length,
    muted: false,
    ...overrides,
    dispatch,
  }

  const view = render(<RuntimeHarness {...props} />, options)

  return {
    dispatch,
    ...view,
    rerenderWith(nextOverrides = {}) {
      view.rerender(
        <RuntimeHarness
          {...props}
          {...nextOverrides}
          dispatch={nextOverrides.dispatch ?? dispatch}
        />,
      )
    },
  }
}

function dispatchedTypes(dispatch) {
  return dispatch.mock.calls.map(([action]) => action.type)
}

describe('useGameRuntime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    soundMocks.index = 0
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not tick while idle', () => {
    const { dispatch } = renderRuntime({ status: GameStatus.IDLE })

    act(() => {
      vi.advanceTimersByTime(TICK_MS * 3)
    })

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches TICK once per second while playing', () => {
    const { dispatch } = renderRuntime({ status: GameStatus.PLAYING })

    act(() => {
      vi.advanceTimersByTime(TICK_MS)
    })
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: ActionType.TICK })

    act(() => {
      vi.advanceTimersByTime(TICK_MS * 2)
    })
    expect(dispatch).toHaveBeenCalledTimes(3)
  })

  it('stops ticking when status leaves playing', () => {
    const { dispatch, rerenderWith } = renderRuntime({ status: GameStatus.PLAYING })

    rerenderWith({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })
    dispatch.mockClear()

    act(() => {
      vi.advanceTimersByTime(TICK_MS * 3)
    })

    expect(dispatchedTypes(dispatch)).not.toContain(ActionType.TICK)
  })

  it('does not create a second interval when mute changes during play', () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const { dispatch, rerenderWith } = renderRuntime({ status: GameStatus.PLAYING })
    const intervalCount = setIntervalSpy.mock.calls.length

    rerenderWith({ status: GameStatus.PLAYING, muted: true })
    expect(setIntervalSpy.mock.calls.length).toBe(intervalCount)

    dispatch.mockClear()
    act(() => {
      vi.advanceTimersByTime(TICK_MS)
    })
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: ActionType.TICK })

    setIntervalSpy.mockRestore()
  })

  it('does not dispatch duplicate ticks under Strict Mode', () => {
    const { dispatch } = renderRuntime(
      { status: GameStatus.PLAYING },
      { wrapper: StrictMode },
    )

    act(() => {
      vi.advanceTimersByTime(TICK_MS)
    })

    expect(dispatch.mock.calls.filter(([action]) => action.type === ActionType.TICK)).toHaveLength(1)
  })

  it('clears the interval on unmount so late ticks are not dispatched', () => {
    const { dispatch, unmount } = renderRuntime({ status: GameStatus.PLAYING })

    unmount()
    dispatch.mockClear()

    act(() => {
      vi.advanceTimersByTime(TICK_MS * 5)
    })

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches REVEAL_ANSWER after the lock delay', () => {
    const { dispatch } = renderRuntime({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })

    act(() => {
      vi.advanceTimersByTime(LOCK_DURATION_MS - 1)
    })
    expect(dispatch).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: ActionType.REVEAL_ANSWER })
  })

  it('dispatches NEXT_QUESTION after the reveal delay for a correct non-final answer', () => {
    const { dispatch } = renderRuntime({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-a',
      questionIndex: 0,
    })

    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS)
    })

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({
      type: ActionType.NEXT_QUESTION,
      payload: { totalQuestions: questions.length },
    })
    expect(soundMocks.correct.play).toHaveBeenCalledTimes(1)
    expect(soundMocks.wrong.play).not.toHaveBeenCalled()
  })

  it('dispatches ANSWER_WRONG after the reveal delay for an incorrect answer', () => {
    const { dispatch } = renderRuntime({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-b',
    })

    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS)
    })

    expect(dispatch).toHaveBeenCalledWith({ type: ActionType.ANSWER_WRONG })
    expect(soundMocks.wrong.play).toHaveBeenCalledTimes(1)
    expect(soundMocks.correct.play).not.toHaveBeenCalled()
  })

  it('dispatches COMPLETE_GAME after the reveal delay on the final correct answer', () => {
    const { dispatch } = renderRuntime({
      status: GameStatus.REVEALING,
      question: questions[14],
      questionIndex: 14,
      selectedAnswerId: '15-a',
    })

    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS)
    })

    expect(dispatch).toHaveBeenCalledWith({ type: ActionType.COMPLETE_GAME })
    expect(soundMocks.celebrate.play).toHaveBeenCalledTimes(1)
  })

  it('clears a pending reveal timeout when the game restarts', () => {
    const { dispatch, rerenderWith } = renderRuntime({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-a',
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    rerenderWith({
      status: GameStatus.IDLE,
      selectedAnswerId: null,
    })
    dispatch.mockClear()

    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS)
    })

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('does not dispatch a stale NEXT_QUESTION after moving to a new question', () => {
    const { dispatch, rerenderWith } = renderRuntime({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-a',
      questionIndex: 0,
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    rerenderWith({
      status: GameStatus.PLAYING,
      question: questions[1],
      questionIndex: 1,
      selectedAnswerId: null,
    })
    dispatch.mockClear()

    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS)
    })

    expect(dispatchedTypes(dispatch)).not.toContain(ActionType.NEXT_QUESTION)
    expect(dispatchedTypes(dispatch)).not.toContain(ActionType.ANSWER_WRONG)
    expect(dispatchedTypes(dispatch)).not.toContain(ActionType.COMPLETE_GAME)
  })

  it('does not let a previous lock timeout reveal after restart', () => {
    const { dispatch, rerenderWith } = renderRuntime({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    rerenderWith({
      status: GameStatus.IDLE,
      selectedAnswerId: null,
    })
    dispatch.mockClear()

    rerenderWith({
      status: GameStatus.PLAYING,
      selectedAnswerId: null,
    })

    act(() => {
      vi.advanceTimersByTime(LOCK_DURATION_MS)
    })

    expect(dispatchedTypes(dispatch)).not.toContain(ActionType.REVEAL_ANSWER)
    expect(dispatchedTypes(dispatch).every((type) => type === ActionType.TICK)).toBe(true)
  })

  it('does not dispatch a stale reveal after unmount', () => {
    const { dispatch, unmount } = renderRuntime({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })

    unmount()
    dispatch.mockClear()

    act(() => {
      vi.advanceTimersByTime(LOCK_DURATION_MS + REVEAL_DURATION_MS)
    })

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches TICK rather than TIMEOUT while the clock is running', () => {
    const { dispatch } = renderRuntime({ status: GameStatus.PLAYING })

    act(() => {
      vi.advanceTimersByTime(TICK_MS * 30)
    })

    expect(dispatch).toHaveBeenCalledTimes(30)
    expect(dispatchedTypes(dispatch).every((type) => type === ActionType.TICK)).toBe(true)
    expect(dispatchedTypes(dispatch)).not.toContain(ActionType.TIMEOUT)
  })

  it('does not keep ticking after the game has timed out', () => {
    const { dispatch, rerenderWith } = renderRuntime({ status: GameStatus.PLAYING })

    rerenderWith({ status: GameStatus.TIMEOUT })
    dispatch.mockClear()

    act(() => {
      vi.advanceTimersByTime(TICK_MS * 3)
    })

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('plays intro sound only when transitioning from idle to playing', () => {
    const { rerenderWith } = renderRuntime({ status: GameStatus.IDLE })
    expect(soundMocks.start.play).not.toHaveBeenCalled()

    rerenderWith({ status: GameStatus.PLAYING })
    expect(soundMocks.start.play).toHaveBeenCalledTimes(1)

    rerenderWith({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })
    rerenderWith({
      status: GameStatus.PLAYING,
      question: questions[1],
      questionIndex: 1,
      selectedAnswerId: null,
    })

    expect(soundMocks.start.play).toHaveBeenCalledTimes(1)
  })

  it('plays the wrong sound when status becomes timeout', () => {
    const { rerenderWith } = renderRuntime({ status: GameStatus.PLAYING })

    rerenderWith({ status: GameStatus.TIMEOUT })

    expect(soundMocks.wrong.play).toHaveBeenCalledTimes(1)
  })

  it('does not play sounds while muted, but still dispatches reveal actions', () => {
    const { dispatch } = renderRuntime({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-b',
      muted: true,
    })

    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS)
    })

    expect(dispatch).toHaveBeenCalledWith({ type: ActionType.ANSWER_WRONG })
    expect(soundMocks.wrong.play).not.toHaveBeenCalled()
    expect(soundMocks.start.play).not.toHaveBeenCalled()
  })

  it('does not play intro sound when starting muted', () => {
    const { rerenderWith } = renderRuntime({
      status: GameStatus.IDLE,
      muted: true,
    })

    rerenderWith({ status: GameStatus.PLAYING, muted: true })

    expect(soundMocks.start.play).not.toHaveBeenCalled()
  })

  it('stops playing sounds when muted becomes true', () => {
    const { rerenderWith } = renderRuntime({ status: GameStatus.PLAYING, muted: false })

    rerenderWith({ status: GameStatus.PLAYING, muted: true })

    expect(soundMocks.start.stop).toHaveBeenCalled()
    expect(soundMocks.correct.stop).toHaveBeenCalled()
    expect(soundMocks.wrong.stop).toHaveBeenCalled()
    expect(soundMocks.celebrate.stop).toHaveBeenCalled()
  })

  it('does not play intro sound when already playing on first render', () => {
    renderRuntime({ status: GameStatus.PLAYING })

    expect(soundMocks.start.play).not.toHaveBeenCalled()
  })
})
