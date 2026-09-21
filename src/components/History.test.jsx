import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import History from './History'
import { GameStatus } from '../game/gameReducer'
import { HISTORY_STORAGE_KEY } from '../history/gameHistory'

const olderRecord = {
  id: 'older',
  playerName: 'Bo',
  status: GameStatus.TIMEOUT,
  questionIndex: 2,
  totalQuestions: 15,
  securedPrize: '$200',
  completedAt: '2026-01-01T10:00:00.000Z',
}

const newerRecord = {
  id: 'newer',
  playerName: 'Ada',
  status: GameStatus.WON,
  questionIndex: 14,
  totalQuestions: 15,
  securedPrize: '$1,000,000',
  completedAt: '2026-01-02T10:00:00.000Z',
}

describe('History', () => {
  beforeEach(() => {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY)
  })

  it('shows an empty state when no games are stored', () => {
    render(<History onBack={() => {}} />)

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument()
    expect(screen.getByText('No games played yet')).toBeInTheDocument()
    expect(screen.getByText('Completed games will appear here after you finish a round.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to start' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear history' })).not.toBeInTheDocument()
  })

  it('shows saved records newest first with a correct summary', () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([olderRecord, newerRecord]))
    render(<History onBack={() => {}} />)

    const names = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(names).toEqual(['Best performance', 'Ada', 'Bo'])
    expect(screen.getByText('Won')).toBeInTheDocument()
    expect(screen.getByText('Time out')).toBeInTheDocument()
    expect(screen.getAllByText('$1,000,000')).toHaveLength(2)
    expect(screen.getByText('$200')).toBeInTheDocument()
    expect(screen.getByText('Question 15 of 15')).toBeInTheDocument()
    expect(screen.getByText('Question 3 of 15')).toBeInTheDocument()
    expect(screen.getByText('Games played').closest('li')).toHaveTextContent('2')
    expect(screen.getByText('Wins').closest('li')).toHaveTextContent('1')
    expect(screen.getByText('Highest prize').closest('li')).toHaveTextContent('$1,000,000')
    expect(screen.getAllByText('General Knowledge · Medium')).toHaveLength(2)
  })

  it('shows a saved category name when present', () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          ...newerRecord,
          categoryId: 'science',
          categoryName: 'Science',
        },
      ]),
    )
    render(<History onBack={() => {}} />)

    expect(screen.getByText('Science · Medium')).toBeInTheDocument()
    expect(screen.queryByText('General Knowledge · Medium')).not.toBeInTheDocument()
  })

  it('requires confirmation before clearing history', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([newerRecord]))
    render(<History onBack={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Clear history' }))

    expect(screen.getByText('Clear all saved games? This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.queryByText('Clear all saved games? This cannot be undone.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear history' }))
    await user.click(screen.getByRole('button', { name: 'Confirm clear' }))

    expect(screen.getByText('No games played yet')).toBeInTheDocument()
    expect(screen.queryByText('Ada')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('returns to start when Back to start is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<History onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: 'Back to start' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
