import { describe, expect, it } from 'vitest'
import {
  categories,
  DEFAULT_CATEGORY_ID,
  getCategoryById,
  getPlayableCategory,
  getQuestionsForCategory,
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

  it('rejects missing or unplayable categories', () => {
    expect(getCategoryById('not-a-category')).toBeNull()
    expect(getQuestionsForCategory('not-a-category')).toEqual([])
    expect(getPlayableCategory('not-a-category')).toEqual({
      ok: false,
      error: 'Choose a valid category with at least 15 questions.',
    })
    expect(getPlayableCategory(DEFAULT_CATEGORY_ID).ok).toBe(true)
    expect(getPlayableCategory(DEFAULT_CATEGORY_ID).questions).toHaveLength(MIN_QUIZ_QUESTIONS)
  })
})
