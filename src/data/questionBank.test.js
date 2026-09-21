import { describe, expect, it } from 'vitest'
import { DEFAULT_DIFFICULTY_ID } from './difficulties'
import {
  categories,
  countQuestionsForDifficulty,
  DEFAULT_CATEGORY_ID,
  getCategoryById,
  getDifficultyAvailability,
  getPlayableCategory,
  getQuestionsForCategory,
  getQuestionsForCategoryAndDifficulty,
  MIN_QUIZ_QUESTIONS,
  questionBank,
} from './questionBank'

function getCorrectAnswers(question) {
  return question.answers.filter((answer) => answer.correct)
}

describe('question bank', () => {
  it('includes the three expected categories', () => {
    expect(categories.map((category) => category.id)).toEqual([
      'generalKnowledge',
      'science',
      'history',
    ])
    expect(Object.keys(questionBank)).toEqual([
      'generalKnowledge',
      'science',
      'history',
    ])
  })

  it('gives each category at least 15 valid questions', () => {
    categories.forEach((category) => {
      const questions = getQuestionsForCategory(category.id)
      expect(questions.length).toBeGreaterThanOrEqual(MIN_QUIZ_QUESTIONS)

      questions.forEach((question) => {
        const optionTexts = question.answers.map((answer) => answer.text)
        expect(question.answers).toHaveLength(4)
        expect(getCorrectAnswers(question)).toHaveLength(1)
        expect(optionTexts).toContain(getCorrectAnswers(question)[0].text)
        expect(new Set(optionTexts).size).toBe(4)
      })
    })
  })

  it('uses unique question ids across every category', () => {
    const ids = Object.values(questionBank).flatMap((questions) => questions.map((question) => question.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes a non-empty explanation on every question', () => {
    Object.values(questionBank).flat().forEach((question) => {
      expect(typeof question.explanation).toBe('string')
      expect(question.explanation.trim().length).toBeGreaterThan(0)
    })
  })

  it('looks up a known category and returns a copy of its questions', () => {
    const original = questionBank.science
    const copy = getQuestionsForCategory('science')

    expect(getCategoryById('science')).toMatchObject({
      id: 'science',
      name: 'Science',
    })
    expect(copy).toEqual(original)
    expect(copy).not.toBe(original)
  })

  it('reports medium as playable and easy or hard as unavailable until tagged', () => {
    categories.forEach((category) => {
      const availability = getDifficultyAvailability(category.id)
      const medium = availability.find((item) => item.id === 'medium')
      const easy = availability.find((item) => item.id === 'easy')
      const hard = availability.find((item) => item.id === 'hard')

      expect(medium?.playable).toBe(true)
      expect(medium?.count).toBeGreaterThanOrEqual(MIN_QUIZ_QUESTIONS)
      expect(easy?.playable).toBe(false)
      expect(hard?.playable).toBe(false)
      expect(countQuestionsForDifficulty(getQuestionsForCategory(category.id), 'medium')).toBe(
        getQuestionsForCategory(category.id).length,
      )
    })
  })

  it('filters questions by effective difficulty', () => {
    const scienceQuestions = getQuestionsForCategory('science')
    expect(getQuestionsForCategoryAndDifficulty('science', 'medium')).toEqual(scienceQuestions)
    expect(getQuestionsForCategoryAndDifficulty('science', 'easy')).toEqual([])
  })

  it('rejects missing or unplayable category and difficulty combinations', () => {
    expect(getCategoryById('not-a-category')).toBeNull()
    expect(getQuestionsForCategory('not-a-category')).toEqual([])
    expect(getPlayableCategory('not-a-category')).toEqual({
      ok: false,
      error: 'Choose a valid category and difficulty.',
    })
    expect(getPlayableCategory(DEFAULT_CATEGORY_ID, 'easy')).toEqual({
      ok: false,
      error: `Choose a difficulty with at least ${MIN_QUIZ_QUESTIONS} questions.`,
    })
    expect(getPlayableCategory(DEFAULT_CATEGORY_ID, DEFAULT_DIFFICULTY_ID).ok).toBe(true)
    expect(getPlayableCategory(DEFAULT_CATEGORY_ID, DEFAULT_DIFFICULTY_ID).questions).toHaveLength(
      MIN_QUIZ_QUESTIONS,
    )
  })
})
