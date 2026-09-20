import { useState } from 'react'

const STORAGE_KEY = 'quiz-app:sound-muted'

function readStoredMuted() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }

    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    if (storedValue === 'true') {
      return true
    }

    return false
  } catch {
    return false
  }
}

function writeStoredMuted(muted) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false')
  } catch {
    // Ignore private mode and quota errors.
  }
}

export function useSoundPreference() {
  const [muted, setMuted] = useState(() => readStoredMuted())

  const toggleMuted = () => {
    setMuted((currentMuted) => {
      const nextMuted = !currentMuted
      writeStoredMuted(nextMuted)
      return nextMuted
    })
  }

  return { muted, toggleMuted }
}
