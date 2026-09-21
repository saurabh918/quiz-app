import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DIFFICULTY_ID,
  difficulties,
  getDifficultyById,
  getEffectiveQuestionDifficulty,
} from './difficulties'

describe('difficulties', () => {
  it('includes easy, medium, and hard in order', () => {
    expect(difficulties.map((difficulty) => difficulty.id)).toEqual(['easy', 'medium', 'hard'])
    expect(DEFAULT_DIFFICULTY_ID).toBe('medium')
  })

  it('looks up a difficulty by id', () => {
    expect(getDifficultyById('medium')).toMatchObject({ id: 'medium', name: 'Medium' })
    expect(getDifficultyById('missing')).toBeNull()
  })

  it('treats untagged questions as medium and respects explicit easy or hard tags', () => {
    expect(getEffectiveQuestionDifficulty({ id: 1 })).toBe('medium')
    expect(getEffectiveQuestionDifficulty({ id: 1, difficulty: 'easy' })).toBe('easy')
    expect(getEffectiveQuestionDifficulty({ id: 1, difficulty: 'hard' })).toBe('hard')
    expect(getEffectiveQuestionDifficulty({ id: 1, difficulty: 'medium' })).toBe('medium')
    expect(getEffectiveQuestionDifficulty({ id: 1, difficulty: 'invalid' })).toBe('medium')
  })
})
