/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react'
import { GameStatus } from '../game/gameReducer'

const EXPLANATION_HEADING_ID = 'quiz-explanation-heading'

function getCorrectAnswer(question) {
  return question?.answers.find((answer) => answer.correct) ?? null
}

function getAnswerClassName(answer, status, selectedAnswerId) {
  const isSelected = answer.id === selectedAnswerId

  if (status === GameStatus.LOCKED && isSelected) {
    return 'answer active'
  }

  if (status === GameStatus.REVEALING) {
    if (answer.correct) {
      return 'answer right'
    }

    if (isSelected) {
      return 'answer wrong'
    }
  }

  return 'answer'
}

function getAnswerFeedback(answer, status, selectedAnswerId) {
  if (status !== GameStatus.REVEALING) {
    return null
  }

  if (answer.correct) {
    return 'Correct'
  }

  if (answer.id === selectedAnswerId) {
    return 'Incorrect'
  }

  return null
}

function Quiz({
  question,
  status,
  selectedAnswerId,
  onSelectAnswer,
  categoryName,
  learningMode = false,
  onContinue,
}) {
  const continueRef = useRef(null)
  const isSelectionEnabled = status === GameStatus.PLAYING
  const showLearningContinue = learningMode && status === GameStatus.REVEALING
  const correctAnswer = getCorrectAnswer(question)
  const explanation =
    typeof question.explanation === 'string' && question.explanation.trim()
      ? question.explanation.trim()
      : null

  useEffect(() => {
    if (!showLearningContinue) {
      return
    }

    continueRef.current?.focus()
  }, [showLearningContinue, question.id])

  return (
    <div className="quiz">
      {categoryName ? <p className="quizCategory">{categoryName}</p> : null}
      <h1 className="question">{question.question}</h1>
      <div className="answers">
        {question.answers.map((answer) => {
          const feedback = getAnswerFeedback(answer, status, selectedAnswerId)

          return (
            <button
              key={answer.id}
              type="button"
              disabled={!isSelectionEnabled}
              className={getAnswerClassName(answer, status, selectedAnswerId)}
              onClick={() => onSelectAnswer(answer.id)}
            >
              <span className="answerText">{answer.text}</span>
              {feedback ? (
                <span className="answerFeedback" aria-hidden="true">
                  {feedback}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {showLearningContinue ? (
        <section className="quizLearningPanel" aria-labelledby={EXPLANATION_HEADING_ID}>
          {explanation ? (
            <>
              <h2 id={EXPLANATION_HEADING_ID} className="quizExplanationHeading">
                Explanation
              </h2>
              {correctAnswer ? (
                <p className="quizCorrectAnswer">
                  Correct answer: <strong>{correctAnswer.text}</strong>
                </p>
              ) : null}
              <p className="quizExplanation">{explanation}</p>
            </>
          ) : (
            <h2 id={EXPLANATION_HEADING_ID} className="quizExplanationHeading">
              Continue
            </h2>
          )}
          <button
            ref={continueRef}
            className="quizContinueBtn"
            type="button"
            onClick={onContinue}
          >
            Continue
          </button>
        </section>
      ) : null}
    </div>
  )
}

export default Quiz
