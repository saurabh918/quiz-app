import { useEffect, useRef } from 'react'
import useSound from 'use-sound'
import play from '../assets/play.mp3'
import correct from '../assets/correct.mp3'
import wrong from '../assets/wrong.mp3'
import celebrate from '../assets/celebration.mp3'
import { ActionType, GameStatus } from '../game/gameReducer'

const LOCK_DURATION_MS = 3000
const REVEAL_DURATION_MS = 3000

export function useGameRuntime({
  status,
  question,
  questionIndex,
  selectedAnswerId,
  totalQuestions,
  dispatch,
  muted,
}) {
  const [startPlay, startControls] = useSound(play)
  const [correctAns, correctControls] = useSound(correct)
  const [wrongAns, wrongControls] = useSound(wrong)
  const [celebrateSound, celebrateControls] = useSound(celebrate)
  const previousStatusRef = useRef(status)
  const mutedRef = useRef(muted)
  const soundsRef = useRef({
    startPlay,
    correctAns,
    wrongAns,
    celebrateSound,
    stopAll() {},
  })

  mutedRef.current = muted
  soundsRef.current = {
    startPlay: () => {
      if (!mutedRef.current) {
        startPlay()
      }
    },
    correctAns: () => {
      if (!mutedRef.current) {
        correctAns()
      }
    },
    wrongAns: () => {
      if (!mutedRef.current) {
        wrongAns()
      }
    },
    celebrateSound: () => {
      if (!mutedRef.current) {
        celebrateSound()
      }
    },
    stopAll() {
      startControls.stop?.()
      correctControls.stop?.()
      wrongControls.stop?.()
      celebrateControls.stop?.()
    },
  }

  useEffect(() => {
    if (muted) {
      soundsRef.current.stopAll()
    }
  }, [muted])

  useEffect(() => {
    const previousStatus = previousStatusRef.current
    previousStatusRef.current = status

    if (status === GameStatus.PLAYING && previousStatus === GameStatus.IDLE) {
      soundsRef.current.startPlay()
    }

    if (status === GameStatus.TIMEOUT && previousStatus !== GameStatus.TIMEOUT) {
      soundsRef.current.wrongAns()
    }
  }, [status])

  useEffect(() => {
    if (status !== GameStatus.PLAYING) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: ActionType.TICK })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [status, dispatch])

  useEffect(() => {
    if (status !== GameStatus.LOCKED) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: ActionType.REVEAL_ANSWER })
    }, LOCK_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [status, dispatch])

  useEffect(() => {
    if (status !== GameStatus.REVEALING) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      const selectedAnswer = question?.answers.find((answer) => answer.id === selectedAnswerId)
      const isCorrect = Boolean(selectedAnswer?.correct)
      const isLastQuestion = questionIndex >= totalQuestions - 1
      const sounds = soundsRef.current

      if (!isCorrect) {
        sounds.wrongAns()
        dispatch({ type: ActionType.ANSWER_WRONG })
        return
      }

      if (isLastQuestion) {
        sounds.celebrateSound()
        dispatch({ type: ActionType.COMPLETE_GAME })
        return
      }

      sounds.correctAns()
      dispatch({
        type: ActionType.NEXT_QUESTION,
        payload: { totalQuestions },
      })
    }, REVEAL_DURATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [status, dispatch, question, selectedAnswerId, questionIndex, totalQuestions])
}
