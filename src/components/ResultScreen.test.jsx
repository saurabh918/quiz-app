import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultScreen from './ResultScreen'
import { GameStatus } from '../game/gameReducer'
import { scienceQuestions } from '../data/scienceQuestions'

describe('ResultScreen', () => {
  it('shows a completion heading, prize, and play again action when won', () => {
    render(
      <ResultScreen
        status={GameStatus.WON}
        prize="$ 1000000"
        playerName="Ada"
        onRestart={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'You completed the quiz' })).toBeInTheDocument()
    expect(
      screen.getByText('Congratulations, Ada. You answered every question correctly.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Top prize')).toBeInTheDocument()
    expect(screen.getByText('$1,000,000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument()
    expect(screen.queryByText(/you earned/i)).not.toBeInTheDocument()
  })

  it('shows the selected category near the result heading', () => {
    render(
      <ResultScreen
        status={GameStatus.LOST}
        prize="$ 0"
        playerName="Ada"
        categoryName="History"
        onRestart={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Incorrect answer' })).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('shows an incorrect-answer result without a winning message', () => {
    render(
      <ResultScreen
        status={GameStatus.LOST}
        prize="$ 100"
        playerName="Ada"
        onRestart={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Incorrect answer' })).toBeInTheDocument()
    expect(screen.getByText('That answer was wrong, so the game ends here.')).toBeInTheDocument()
    expect(screen.getByText('Incorrect')).toBeInTheDocument()
    expect(screen.getByText('Amount secured')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You completed the quiz' })).not.toBeInTheDocument()
    expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Prize:/)).not.toBeInTheDocument()
  })

  it('shows a time-expired result without a winning message', () => {
    render(
      <ResultScreen
        status={GameStatus.TIMEOUT}
        prize="$ 0"
        playerName="Bo"
        onRestart={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Time is up' })).toBeInTheDocument()
    expect(screen.getByText('The timer ran out before you answered.')).toBeInTheDocument()
    expect(screen.getByText('Timed out')).toBeInTheDocument()
    expect(screen.getByText('No prize secured')).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'You completed the quiz' })).not.toBeInTheDocument()
    expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Prize:/)).not.toBeInTheDocument()
  })

  it('calls onRestart when Play again is clicked', async () => {
    const user = userEvent.setup()
    const onRestart = vi.fn()

    render(
      <ResultScreen
        status={GameStatus.LOST}
        prize="$ 0"
        playerName="Ada"
        onRestart={onRestart}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Play again' }))

    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('shows a timeout explanation in Learning Mode when the timed-out question has one', () => {
    const timedOutQuestion = scienceQuestions.find((question) => question.id === 'sci-7')

    render(
      <ResultScreen
        status={GameStatus.TIMEOUT}
        prize="$ 0"
        playerName="Bo"
        learningMode
        timedOutQuestion={timedOutQuestion}
        onRestart={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Time is up' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Explanation' })).toBeInTheDocument()
    expect(screen.getByText('Correct answer:')).toBeInTheDocument()
    expect(screen.getByText('100°C')).toBeInTheDocument()
    expect(screen.getByText(/At standard atmospheric pressure near sea level/)).toBeInTheDocument()
  })

  it('does not show an empty timeout explanation panel in Normal Mode', () => {
    const timedOutQuestion = scienceQuestions.find((question) => question.id === 'sci-7')

    render(
      <ResultScreen
        status={GameStatus.TIMEOUT}
        prize="$ 0"
        playerName="Bo"
        timedOutQuestion={timedOutQuestion}
        onRestart={() => {}}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Explanation' })).not.toBeInTheDocument()
  })
})
