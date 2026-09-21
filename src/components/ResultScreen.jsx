/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react'
import { formatPrizeAmount, isZeroPrizeAmount } from '../data/formatPrize'
import { GameStatus } from '../game/gameReducer'

const RESULT_HEADING_ID = 'result-heading'
const TIMEOUT_EXPLANATION_HEADING_ID = 'result-timeout-explanation-heading'

function getCorrectAnswer(question) {
  return question?.answers.find((answer) => answer.correct) ?? null
}

function getProgressSummary(status, questionIndex, totalQuestions) {
  if (typeof questionIndex !== 'number' || typeof totalQuestions !== 'number' || totalQuestions < 1) {
    return null
  }

  if (status === GameStatus.WON) {
    return `You answered all ${totalQuestions} questions.`
  }

  const reached = Math.min(questionIndex + 1, totalQuestions)
  return `Stopped on question ${reached} of ${totalQuestions}.`
}

function getResultContent(status, prize, playerName) {
  const name = playerName || 'Player'

  if (status === GameStatus.WON) {
    return {
      variant: 'isWon',
      kicker: 'Completed',
      heading: 'You completed the quiz',
      message: `Congratulations, ${name}. You answered every question correctly.`,
      prizeCaption: 'Top prize',
    }
  }

  if (status === GameStatus.TIMEOUT) {
    return {
      variant: 'isTimeout',
      kicker: 'Timed out',
      heading: 'Time is up',
      message: 'The timer ran out before you answered.',
      prizeCaption: isZeroPrizeAmount(prize) ? 'No prize secured' : 'Amount secured',
    }
  }

  return {
    variant: 'isLost',
    kicker: 'Incorrect',
    heading: 'Incorrect answer',
    message: 'That answer was wrong, so the game ends here.',
    prizeCaption: isZeroPrizeAmount(prize) ? 'No prize secured' : 'Amount secured',
  }
}

function ResultScreen({
  status,
  prize,
  playerName,
  questionIndex,
  totalQuestions,
  categoryName,
  learningMode = false,
  timedOutQuestion = null,
  onRestart,
}) {
  const headingRef = useRef(null)
  const content = getResultContent(status, prize, playerName)
  const progress = getProgressSummary(status, questionIndex, totalQuestions)
  const prizeDisplay = formatPrizeAmount(prize)
  const timeoutExplanation =
    learningMode &&
    status === GameStatus.TIMEOUT &&
    typeof timedOutQuestion?.explanation === 'string' &&
    timedOutQuestion.explanation.trim()
      ? timedOutQuestion.explanation.trim()
      : null
  const timeoutCorrectAnswer = timeoutExplanation ? getCorrectAnswer(timedOutQuestion) : null

  useEffect(() => {
    headingRef.current?.focus()
  }, [status])

  return (
    <section className={`resultCard resultText ${content.variant}`} aria-labelledby={RESULT_HEADING_ID}>
      <p className="resultKicker">{content.kicker}</p>
      <h1 id={RESULT_HEADING_ID} ref={headingRef} tabIndex={-1}>
        {content.heading}
      </h1>
      {categoryName ? <p className="resultCategory">{categoryName}</p> : null}
      <p className="resultMessage">{content.message}</p>
      {timeoutExplanation ? (
        <section className="resultExplanationPanel" aria-labelledby={TIMEOUT_EXPLANATION_HEADING_ID}>
          <h2 id={TIMEOUT_EXPLANATION_HEADING_ID} className="resultExplanationHeading">
            Explanation
          </h2>
          {timeoutCorrectAnswer ? (
            <p className="resultCorrectAnswer">
              Correct answer: <strong>{timeoutCorrectAnswer.text}</strong>
            </p>
          ) : null}
          <p className="resultExplanation">{timeoutExplanation}</p>
        </section>
      ) : null}
      <div className="resultPrizeBlock">
        <p className="resultPrizeCaption">{content.prizeCaption}</p>
        <p className="resultPrize">{prizeDisplay}</p>
      </div>
      {progress ? <p className="resultProgress">{progress}</p> : null}
      <button className="endButton" type="button" onClick={onRestart}>
        Play again
      </button>
    </section>
  )
}

export default ResultScreen
