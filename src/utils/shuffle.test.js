import { describe, expect, it } from 'vitest'
import { questions } from '../data/questions'
import { createShuffledQuizQuestions, shuffleArray } from './shuffle'

function makeQuestion(id) {
  return {
    id,
    question: `Question ${id}`,
    answers: [
      { id: `${id}-a`, text: 'A', correct: true },
      { id: `${id}-b`, text: 'B', correct: false },
      { id: `${id}-c`, text: 'C', correct: false },
      { id: `${id}-d`, text: 'D', correct: false },
    ],
  }
}

describe('shuffleArray', () => {
  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c', 'd']
    const copy = original.slice()

    const shuffled = shuffleArray(original)

    expect(original).toEqual(copy)
    expect(shuffled).toHaveLength(original.length)
    expect(shuffled).not.toBe(original)
    expect([...shuffled].sort()).toEqual([...original].sort())
  })
})

describe('createShuffledQuizQuestions', () => {
  it('preserves question count, ids, and four options with the correct answer', () => {
    const original = questions.map((question) => ({
      id: question.id,
      answers: question.answers.map((answer) => ({ ...answer })),
    }))

    const playable = createShuffledQuizQuestions(questions, 15)

    expect(playable).toHaveLength(15)
    expect(playable.map((question) => question.id).sort()).toEqual(
      questions.map((question) => question.id).sort(),
    )
    expect(questions.map((question) => question.id)).toEqual(original.map((question) => question.id))
    expect(questions.map((question) => question.answers.map((answer) => answer.id))).toEqual(
      original.map((question) => question.answers.map((answer) => answer.id)),
    )

    playable.forEach((question) => {
      const source = questions.find((item) => item.id === question.id)
      expect(question.answers).toHaveLength(4)
      expect(question.answers).not.toBe(source.answers)
      expect(question.answers.filter((answer) => answer.correct)).toHaveLength(1)
      expect(question.answers.map((answer) => answer.id).sort()).toEqual(
        source.answers.map((answer) => answer.id).sort(),
      )
    })
  })

  it('shuffles first and then keeps 15 questions when more are available', () => {
    const extra = Array.from({ length: 16 }, (_, index) => makeQuestion(index + 1))
    const playable = createShuffledQuizQuestions(extra, 15)

    expect(playable).toHaveLength(15)
    expect(new Set(playable.map((question) => question.id)).size).toBe(15)
    playable.forEach((question) => {
      expect(extra.some((item) => item.id === question.id)).toBe(true)
    })
  })

  it('returns an empty list for invalid or insufficient question data', () => {
    expect(createShuffledQuizQuestions(null, 15)).toEqual([])
    expect(createShuffledQuizQuestions(undefined, 15)).toEqual([])
    expect(createShuffledQuizQuestions(questions.slice(0, 14), 15)).toEqual([])
    expect(createShuffledQuizQuestions(questions, 0)).toEqual([])
  })
})
