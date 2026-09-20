import { questions as generalKnowledgeQuestions } from './questions'
import { scienceQuestions } from './scienceQuestions'
import { historyQuestions } from './historyQuestions'
import { createShuffledQuizQuestions } from '../utils/shuffle'

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

export function getPlayableCategory(categoryId) {
  const category = getCategoryById(categoryId)
  const questions = getQuestionsForCategory(categoryId)

  if (!category || questions.length < MIN_QUIZ_QUESTIONS) {
    return {
      ok: false,
      error: 'Choose a valid category with at least 15 questions.',
    }
  }

  return {
    ok: true,
    category,
    questions: createShuffledQuizQuestions(questions, MIN_QUIZ_QUESTIONS),
  }
}
