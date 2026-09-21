import { questions as generalKnowledgeQuestions } from './questions'
import { scienceQuestions } from './scienceQuestions'
import { historyQuestions } from './historyQuestions'
import { createShuffledQuizQuestions } from '../utils/shuffle'
import {
  DEFAULT_DIFFICULTY_ID,
  difficulties,
  getDifficultyById,
  getEffectiveQuestionDifficulty,
} from './difficulties'

export const MIN_QUIZ_QUESTIONS = 15
export const DEFAULT_CATEGORY_ID = 'generalKnowledge'
export const FALLBACK_CATEGORY_NAME = 'General Knowledge'

export const categories = [
  {
    id: 'generalKnowledge',
    name: 'General Knowledge',
    description: 'A mix of geography, arts, and well-known facts',
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Explore questions about science and the natural world',
  },
  {
    id: 'history',
    name: 'History',
    description: 'Key events, people, and places from world history',
  },
]

export const questionBank = {
  generalKnowledge: generalKnowledgeQuestions,
  science: scienceQuestions,
  history: historyQuestions,
}

export function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId) ?? null
}

export function getQuestionsForCategory(categoryId) {
  const list = questionBank[categoryId]
  if (!Array.isArray(list)) {
    return []
  }

  return list.slice()
}

export function countQuestionsForDifficulty(questions, difficultyId) {
  if (!Array.isArray(questions) || !getDifficultyById(difficultyId)) {
    return 0
  }

  return questions.filter((question) => getEffectiveQuestionDifficulty(question) === difficultyId).length
}

export function getQuestionsForCategoryAndDifficulty(categoryId, difficultyId) {
  return getQuestionsForCategory(categoryId).filter(
    (question) => getEffectiveQuestionDifficulty(question) === difficultyId,
  )
}

export function getDifficultyAvailability(categoryId) {
  const questions = getQuestionsForCategory(categoryId)

  return difficulties.map((difficulty) => {
    const count = countQuestionsForDifficulty(questions, difficulty.id)

    return {
      ...difficulty,
      count,
      playable: count >= MIN_QUIZ_QUESTIONS,
    }
  })
}

export function getPlayableCategory(categoryId, difficultyId = DEFAULT_DIFFICULTY_ID) {
  const category = getCategoryById(categoryId)
  const difficulty = getDifficultyById(difficultyId)
  const questions = getQuestionsForCategoryAndDifficulty(categoryId, difficultyId)

  if (!category || !difficulty) {
    return {
      ok: false,
      error: 'Choose a valid category and difficulty.',
    }
  }

  if (questions.length < MIN_QUIZ_QUESTIONS) {
    return {
      ok: false,
      error: `Choose a difficulty with at least ${MIN_QUIZ_QUESTIONS} questions.`,
    }
  }

  return {
    ok: true,
    category,
    difficulty,
    questions: createShuffledQuizQuestions(questions, MIN_QUIZ_QUESTIONS),
  }
}
