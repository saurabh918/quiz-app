import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Start from './Start'

async function goThroughSetup(user, { playerName = 'Ada', category, learningMode = false } = {}) {
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.clear(screen.getByLabelText('Name'))
  await user.type(screen.getByLabelText('Name'), playerName)
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  if (category) {
    await user.click(screen.getByRole('radio', { name: new RegExp(category, 'i') }))
  }

  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  if (learningMode) {
    await user.click(screen.getByRole('radio', { name: /Learning Mode/i }))
  }

  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('Start form', () => {
  it('exposes a labeled name field and a start button', async () => {
    const user = userEvent.setup()
    render(<Start onStart={() => {}} />)

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
    await goThroughSetup(user)
    expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeEnabled()
  })

  it('submits a valid name through the start callback', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await goThroughSetup(user, { playerName: 'Ada' })
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }))

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge', 'medium', false)
    expect(screen.queryByText('Enter your name to start.')).not.toBeInTheDocument()
  })

  it('does not start the game when the name is empty', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your name to start.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInvalid()
  })

  it('does not start the game when the name is only whitespace', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText('Name'), '   ')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your name to start.')).toBeInTheDocument()
  })

  it('submits the form when Enter is pressed in the name field', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText('Name'), 'Ada{Enter}')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }))

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge', 'medium', false)
  })

  it('allows the start button to be reached and activated from the keyboard', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await goThroughSetup(user, { playerName: 'Ada' })
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }))

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge', 'medium', false)
  })

  it('selects General Knowledge by default and can submit another category', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('radio', { name: /General Knowledge/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Science/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /History/i })).not.toBeChecked()

    await user.click(screen.getByRole('radio', { name: /Science/i }))
    expect(screen.getByRole('radio', { name: /Science/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /General Knowledge/i })).not.toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }))

    expect(onStart).toHaveBeenCalledWith('Ada', 'science', 'medium', false)
  })

  it('selects Medium by default and disables unavailable difficulties', async () => {
    const user = userEvent.setup()
    render(<Start onStart={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('radio', { name: /Medium/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Easy/i })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /Hard/i })).toBeDisabled()
    expect(screen.getAllByText('Coming soon')).toHaveLength(2)
  })

  it('selects Normal Mode by default and can submit Learning Mode', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await goThroughSetup(user, { playerName: 'Ada', learningMode: true })
    await user.click(screen.getByRole('button', { name: 'Start Quiz' }))

    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge', 'medium', true)
  })
})
