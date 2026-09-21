export const DEFAULT_DIFFICULTY_ID = 'medium'
export const FALLBACK_DIFFICULTY_NAME = 'Medium'

export const difficulties = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Straightforward questions with widely known answers',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Standard quiz questions from the current question bank',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'More challenging questions for experienced players',
  },
]

export function getDifficultyById(difficultyId) {
  return difficulties.find((difficulty) => difficulty.id === difficultyId) ?? null
}

export function getEffectiveQuestionDifficulty(question) {
  const value = question?.difficulty
  if (value === 'easy' || value === 'hard') {
    return value
  }

  return 'medium'
}
