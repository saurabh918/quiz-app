export function shuffleArray(items, random = Math.random) {
  if (!Array.isArray(items)) {
    return []
  }

  const next = items.slice()

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }

  return next
}

export function createShuffledQuizQuestions(questions, count, random = Math.random) {
  if (!Array.isArray(questions) || typeof count !== 'number' || count < 1 || questions.length < count) {
    return []
  }

  return shuffleArray(questions, random)
    .slice(0, count)
    .map((question) => ({
      ...question,
      answers: shuffleArray(Array.isArray(question.answers) ? question.answers : [], random),
    }))
}
