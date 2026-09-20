import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Start from './Start'

describe('Start form', () => {
  it('exposes a labeled name field and a start button', () => {
    render(<Start onStart={() => {}} />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
  })

  it('submits a valid name through the start callback', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge')
    expect(screen.queryByText('Enter your name to start.')).not.toBeInTheDocument()
  })

  it('does not start the game when the name is empty', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your name to start.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInvalid()
  })

  it('does not start the game when the name is only whitespace', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.type(screen.getByLabelText('Name'), '   ')
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(onStart).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your name to start.')).toBeInTheDocument()
  })

  it('submits the form when Enter is pressed in the name field', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.type(screen.getByLabelText('Name'), 'Ada{Enter}')

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge')
  })

  it('allows the start button to be reached and activated from the keyboard', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.tab()

    expect(screen.getByRole('button', { name: 'Start' })).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith('Ada', 'generalKnowledge')
  })

  it('selects General Knowledge by default and can submit another category', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()

    render(<Start onStart={onStart} />)

    expect(screen.getByRole('radio', { name: /General Knowledge/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Science/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /History/i })).not.toBeChecked()

    await user.click(screen.getByRole('radio', { name: /Science/i }))
    expect(screen.getByRole('radio', { name: /Science/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /General Knowledge/i })).not.toBeChecked()

    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(onStart).toHaveBeenCalledWith('Ada', 'science')
  })
})
