/* eslint-disable react/prop-types */
import { GameStatus } from '../game/gameReducer'

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

function Quiz({ question, status, selectedAnswerId, onSelectAnswer, categoryName }) {
  const isSelectionEnabled = status === GameStatus.PLAYING

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
    </div>
  )
}

export default Quiz
