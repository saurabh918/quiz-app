import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Quiz from './Quiz'
import { GameStatus } from '../game/gameReducer'
import { questions } from '../data/questions'

const firstQuestion = questions[0]
const thirdQuestion = questions[2]
const questionWithoutExplanation = {
  id: 'test-no-explanation',
  question: 'Which option is correct?',
  answers: [
    { id: 'test-a', text: 'Option A', correct: true },
    { id: 'test-b', text: 'Option B', correct: false },
    { id: 'test-c', text: 'Option C', correct: false },
    { id: 'test-d', text: 'Option D', correct: false },
  ],
}

function renderQuiz({
  question = firstQuestion,
  status = GameStatus.PLAYING,
  selectedAnswerId = null,
  onSelectAnswer = vi.fn(),
  categoryName,
  learningMode = false,
  onContinue = vi.fn(),
} = {}) {
  const view = render(
    <Quiz
      question={question}
      status={status}
      selectedAnswerId={selectedAnswerId}
      onSelectAnswer={onSelectAnswer}
      categoryName={categoryName}
      learningMode={learningMode}
      onContinue={onContinue}
    />,
  )

  return { ...view, onSelectAnswer, onContinue }
}

function getAnswerButtons() {
  return screen.getAllByRole('button')
}

describe('Quiz rendering', () => {
  it('renders the current question and every answer as a button', () => {
    renderQuiz()

    expect(
      screen.getByText('What is the largest country in the world by land area?'),
    ).toBeInTheDocument()

    const answers = getAnswerButtons()
    expect(answers).toHaveLength(firstQuestion.answers.length)

    firstQuestion.answers.forEach((answer) => {
      expect(screen.getByRole('button', { name: answer.text })).toBeEnabled()
    })
  })

  it('renders the selected category above the question', () => {
    renderQuiz({ categoryName: 'History' })

    expect(screen.getByText('History')).toBeInTheDocument()
    expect(
      screen.getByText('What is the largest country in the world by land area?'),
    ).toBeInTheDocument()
  })

  it('renders answers from the actual question data structure', () => {
    renderQuiz({ question: thirdQuestion })

    expect(screen.getByText('What is the capital of Australia?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Canberra' })).toBeInTheDocument()
    expect(getAnswerButtons()).toHaveLength(4)
  })
})

describe('Quiz answer selection', () => {
  it('notifies the parent with the selected answer id', async () => {
    const user = userEvent.setup()
    const { onSelectAnswer } = renderQuiz()

    await user.click(screen.getByRole('button', { name: 'Russia' }))

    expect(onSelectAnswer).toHaveBeenCalledTimes(1)
    expect(onSelectAnswer).toHaveBeenCalledWith('1-a')
  })

  it('marks the selected answer as active while locked', () => {
    renderQuiz({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })

    expect(screen.getByRole('button', { name: 'Russia' })).toHaveClass('answer', 'active')
    expect(screen.getByRole('button', { name: 'China' })).toHaveClass('answer')
    expect(screen.getByRole('button', { name: 'China' })).not.toHaveClass('active')
  })

  it('does not show reveal classes before the revealing status', () => {
    renderQuiz({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })

    getAnswerButtons().forEach((button) => {
      expect(button).not.toHaveClass('right')
      expect(button).not.toHaveClass('wrong')
    })
  })

  it('ignores further clicks after the parent locks selection', async () => {
    const user = userEvent.setup()
    const onSelectAnswer = vi.fn()
    const { rerender } = renderQuiz({ onSelectAnswer })

    await user.click(screen.getByRole('button', { name: 'Russia' }))
    expect(onSelectAnswer).toHaveBeenCalledTimes(1)

    rerender(
      <Quiz
        question={firstQuestion}
        status={GameStatus.LOCKED}
        selectedAnswerId="1-a"
        onSelectAnswer={onSelectAnswer}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'China' }))
    expect(onSelectAnswer).toHaveBeenCalledTimes(1)
    getAnswerButtons().forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})

describe('Quiz reveal states', () => {
  it('applies the correct class to the right answer when revealing a correct selection', () => {
    renderQuiz({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-a',
    })

    expect(screen.getByRole('button', { name: 'Russia' })).toHaveClass('answer', 'right')
    expect(screen.getByRole('button', { name: 'China' })).toHaveClass('answer')
    expect(screen.getByRole('button', { name: 'China' })).not.toHaveClass('wrong')
    expect(screen.getByRole('button', { name: 'China' })).not.toHaveClass('right')
  })

  it('marks the selected wrong answer and still reveals the correct answer', () => {
    renderQuiz({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-b',
    })

    expect(screen.getByRole('button', { name: 'China' })).toHaveClass('answer', 'wrong')
    expect(screen.getByRole('button', { name: 'Russia' })).toHaveClass('answer', 'right')
    expect(screen.getByRole('button', { name: 'Canada' })).not.toHaveClass('wrong')
    expect(screen.getByRole('button', { name: 'Canada' })).not.toHaveClass('right')
  })

  it('reveals the correct option even when it is not the first answer', () => {
    renderQuiz({
      question: thirdQuestion,
      status: GameStatus.REVEALING,
      selectedAnswerId: '3-a',
    })

    expect(screen.getByRole('button', { name: 'Sydney' })).toHaveClass('wrong')
    expect(screen.getByRole('button', { name: 'Canberra' })).toHaveClass('right')
  })

  it('keeps answers disabled while revealing', () => {
    renderQuiz({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-a',
    })

    getAnswerButtons().forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})

describe('Quiz game status', () => {
  it.each([
    GameStatus.LOCKED,
    GameStatus.REVEALING,
    GameStatus.WON,
    GameStatus.LOST,
    GameStatus.TIMEOUT,
  ])('disables answer selection when status is %s', async (status) => {
    const user = userEvent.setup()
    const onSelectAnswer = vi.fn()

    renderQuiz({
      status,
      selectedAnswerId: status === GameStatus.PLAYING ? null : '1-a',
      onSelectAnswer,
    })

    getAnswerButtons().forEach((button) => {
      expect(button).toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Russia' }))
    expect(onSelectAnswer).not.toHaveBeenCalled()
  })

  it('allows selection only while playing', async () => {
    const user = userEvent.setup()
    const { onSelectAnswer } = renderQuiz({ status: GameStatus.PLAYING })

    getAnswerButtons().forEach((button) => {
      expect(button).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Canada' }))
    expect(onSelectAnswer).toHaveBeenCalledWith('1-d')
  })
})

describe('Quiz accessibility', () => {
  it('exposes each answer as a named button', () => {
    renderQuiz()

    const answers = screen.getAllByRole('button')
    expect(answers.map((button) => button.textContent)).toEqual([
      'Russia',
      'China',
      'United States',
      'Canada',
    ])
  })

  it('lets a keyboard user focus an enabled answer', async () => {
    const user = userEvent.setup()
    renderQuiz()

    await user.tab()

    expect(screen.getByRole('button', { name: 'Russia' })).toHaveFocus()
  })

  it('exposes disabled answers to the accessibility tree while locked', () => {
    renderQuiz({
      status: GameStatus.LOCKED,
      selectedAnswerId: '1-a',
    })

    const selected = screen.getByRole('button', { name: 'Russia' })
    expect(selected).toBeDisabled()
    expect(selected).toHaveAccessibleName('Russia')
  })
})

describe('Quiz learning mode', () => {
  it('shows an explanation and Continue while revealing in Learning Mode', () => {
    renderQuiz({
      question: thirdQuestion,
      status: GameStatus.REVEALING,
      selectedAnswerId: '3-c',
      learningMode: true,
    })

    expect(screen.getByRole('heading', { name: 'Explanation' })).toBeInTheDocument()
    expect(screen.getByText(/Canberra was chosen as the capital in 1908/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('does not show explanation UI in Normal Mode while revealing', () => {
    renderQuiz({
      question: thirdQuestion,
      status: GameStatus.REVEALING,
      selectedAnswerId: '3-c',
    })

    expect(screen.queryByRole('heading', { name: 'Explanation' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument()
  })

  it('shows Continue without an empty explanation panel when none exists', () => {
    renderQuiz({
      question: questionWithoutExplanation,
      status: GameStatus.REVEALING,
      selectedAnswerId: 'test-a',
      learningMode: true,
    })

    expect(screen.queryByRole('heading', { name: 'Explanation' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('calls onContinue when Continue is clicked', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()

    renderQuiz({
      status: GameStatus.REVEALING,
      selectedAnswerId: '1-a',
      learningMode: true,
      onContinue,
    })

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
