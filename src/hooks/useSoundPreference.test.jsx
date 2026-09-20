import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SoundToggle from '../components/SoundToggle'
import { useSoundPreference } from './useSoundPreference'

const SOUND_STORAGE_KEY = 'quiz-app:sound-muted'

function PreferenceHarness() {
  const { muted, toggleMuted } = useSoundPreference()
  return <SoundToggle muted={muted} onToggle={toggleMuted} />
}

function renderPreference() {
  return render(<PreferenceHarness />)
}

describe('useSoundPreference', () => {
  beforeEach(() => {
    window.localStorage.removeItem(SOUND_STORAGE_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(SOUND_STORAGE_KEY)
  })

  it('defaults to unmuted when nothing is stored', () => {
    renderPreference()

    expect(screen.getByRole('button', { name: 'Mute sounds' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBeNull()
  })

  it('initializes muted from the stored true value', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'true')

    renderPreference()

    expect(screen.getByRole('button', { name: 'Unmute sounds' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('initializes unmuted from the stored false value', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'false')

    renderPreference()

    expect(screen.getByRole('button', { name: 'Mute sounds' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('treats empty or invalid stored values as unmuted', () => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, '')

    const firstRender = renderPreference()
    expect(screen.getByRole('button', { name: 'Mute sounds' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    firstRender.unmount()
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'TRUE')

    renderPreference()
    expect(screen.getByRole('button', { name: 'Mute sounds' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('toggles from unmuted to muted and stores true', async () => {
    const user = userEvent.setup()
    renderPreference()

    await user.click(screen.getByRole('button', { name: 'Mute sounds' }))

    expect(screen.getByRole('button', { name: 'Unmute sounds' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true')
  })

  it('toggles from muted to unmuted and stores false', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(SOUND_STORAGE_KEY, 'true')
    renderPreference()

    await user.click(screen.getByRole('button', { name: 'Unmute sounds' }))

    expect(screen.getByRole('button', { name: 'Mute sounds' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('false')
  })

  it('keeps the saved preference after a new mount', async () => {
    const user = userEvent.setup()
    const { unmount } = renderPreference()

    await user.click(screen.getByRole('button', { name: 'Mute sounds' }))
    unmount()
    renderPreference()

    expect(screen.getByRole('button', { name: 'Unmute sounds' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true')
  })
})
