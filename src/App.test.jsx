import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { questions } from './data/questions'
import { scienceQuestions } from './data/scienceQuestions'
import { TIMER_SECONDS } from './game/gameReducer'
import { getGameHistory } from './history/gameHistory'

const LOCK_DURATION_MS = 3000
const REVEAL_DURATION_MS = 3000
const SOUND_STORAGE_KEY = 'quiz-app:sound-muted'

function findDisplayedQuestion(questionList) {
  return questionList.find((question) => screen.queryByText(question.question)) ?? null
}

function getDisplayedAnswers(question) {
  return {
    correct: question.answers.find((answer) => answer.correct),
    wrong: question.answers.find((answer) => !answer.correct),
  }
}

vi.mock('use-sound', () => ({
  default: () => [vi.fn(), { stop: vi.fn() }],
}))

function setupUser() {
  return userEvent.setup({
    delay: null,
  })
}

function renderApp() {
  return render(<App />)
}

async function startGame(user, playerName = 'Ada', { learningMode = false, category } = {}) {
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.type(screen.getByLabelText('Name'), playerName)
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  if (category) {
    await user.click(screen.getByRole('radio', { name: new RegExp(category, 'i') }))
  }

  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))

  if (learningMode) {
    await user.click(screen.getByRole('radio', { name: /Learning Mode/i }))
  }

  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Start Quiz' }))
}

function advanceMs(ms) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

function advanceThroughAnswerReveal() {
  // Flush React effects between delays so the reveal timeout is actually scheduled.
  advanceMs(LOCK_DURATION_MS)
  advanceMs(REVEAL_DURATION_MS)
}

describe('App integration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
    // RTL asyncWrapper only flushes setTimeout(0) when a Jest fake-timer global exists.
    vi.stubGlobal('jest', vi)
    Element.prototype.scrollTo = vi.fn()
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  describe('initial state', () => {
    it('shows the start screen and not the quiz or result screens', () => {
      renderApp()

      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()
      expect(screen.getByText(/Step 1 of 6 — How to Play/i)).toBeInTheDocument()
      expect(screen.getByText('15 questions')).toBeInTheDocument()
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(screen.queryByRole('timer')).not.toBeInTheDocument()
      expect(screen.queryByText(questions[0].question)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: questions[0].answers[0].text })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Incorrect answer' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Time is up' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'You completed the quiz' })).not.toBeInTheDocument()
      expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
    })
  })

  describe('start flow', () => {
    it('starts a game from the form and shows the first question', async () => {
      const user = setupUser()
      renderApp()

      await startGame(user, 'Ada')

      const currentQuestion = findDisplayedQuestion(questions)
      expect(currentQuestion).not.toBeNull()
      expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Player: Ada' })).toBeInTheDocument()
      expect(screen.getByRole('timer', { name: `${TIMER_SECONDS} seconds remaining` })).toHaveTextContent(
        String(TIMER_SECONDS),
      )
      expect(screen.getByText('Question 1 of 15')).toBeInTheDocument()
      expect(screen.getByText('Playing for $100')).toBeInTheDocument()
      expect(screen.getAllByRole('button').filter((button) => button.className.includes('answer'))).toHaveLength(4)

      currentQuestion.answers.forEach((answer) => {
        expect(screen.getByRole('button', { name: answer.text })).toBeEnabled()
      })
    })
  })

  describe('correct answer flow', () => {
    it('locks, reveals, then advances to the next question with a reset timer', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user)

      const currentQuestion = findDisplayedQuestion(questions)
      const { correct } = getDisplayedAnswers(currentQuestion)
      const selected = screen.getByRole('button', { name: correct.text })
      await user.click(selected)

      expect(selected).toHaveClass('answer', 'active')
      expect(selected).toBeDisabled()
      currentQuestion.answers.forEach((answer) => {
        expect(screen.getByRole('button', { name: answer.text })).toBeDisabled()
      })

      advanceMs(LOCK_DURATION_MS - 1)
      expect(selected).toHaveClass('active')
      expect(selected).not.toHaveClass('right')

      advanceMs(1)
      expect(selected).toHaveClass('answer', 'right')
      expect(screen.getByText(currentQuestion.question)).toBeInTheDocument()

      advanceMs(REVEAL_DURATION_MS)
      expect(screen.queryByText(currentQuestion.question)).not.toBeInTheDocument()
      const nextQuestion = findDisplayedQuestion(questions)
      expect(nextQuestion).not.toBeNull()
      expect(nextQuestion.id).not.toBe(currentQuestion.id)
      expect(screen.getByRole('button', { name: nextQuestion.answers[0].text })).toBeEnabled()
      expect(screen.getByRole('timer', { name: `${TIMER_SECONDS} seconds remaining` })).toHaveTextContent(
        String(TIMER_SECONDS),
      )
      expect(screen.getByText('Question 2 of 15')).toBeInTheDocument()
      expect(screen.getByText('Playing for $200')).toBeInTheDocument()
    })
  })

  describe('wrong answer flow', () => {
    it('ends the game on an incorrect answer and shows the lost result', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user)

      const currentQuestion = findDisplayedQuestion(questions)
      const { wrong } = getDisplayedAnswers(currentQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceThroughAnswerReveal()

      expect(screen.getByRole('heading', { name: 'Incorrect answer' })).toBeInTheDocument()
      expect(screen.getByText('No prize secured')).toBeInTheDocument()
      expect(screen.getByText('$0')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'You completed the quiz' })).not.toBeInTheDocument()
      expect(screen.queryByText(/congratulations/i)).not.toBeInTheDocument()
      expect(screen.queryByText(currentQuestion.question)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: wrong.text })).not.toBeInTheDocument()
    })
  })

  describe('timeout flow', () => {
    it('shows the timeout result after the question timer elapses', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user)

      const currentQuestion = findDisplayedQuestion(questions)
      const { correct } = getDisplayedAnswers(currentQuestion)
      advanceMs((TIMER_SECONDS - 1) * 1000)
      expect(screen.getByText(currentQuestion.question)).toBeInTheDocument()
      expect(screen.getByRole('timer', { name: '1 second remaining' })).toBeInTheDocument()

      advanceMs(1000)
      expect(screen.getByRole('heading', { name: 'Time is up' })).toBeInTheDocument()
      expect(screen.getByText('No prize secured')).toBeInTheDocument()
      expect(screen.getByText('$0')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'You completed the quiz' })).not.toBeInTheDocument()
      expect(screen.queryByText(currentQuestion.question)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: correct.text })).not.toBeInTheDocument()
      expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    })
  })

  describe('restart flow', () => {
    it('returns to the start screen and does not keep the previous game', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user, 'Ada')

      const currentQuestion = findDisplayedQuestion(questions)
      const { wrong } = getDisplayedAnswers(currentQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceThroughAnswerReveal()

      await user.click(screen.getByRole('button', { name: 'Play again' }))

      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
      expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Player: Ada' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Incorrect answer' })).not.toBeInTheDocument()
      expect(screen.queryByText(currentQuestion.question)).not.toBeInTheDocument()
      expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
    })

    it('does not let a previous lock or reveal timeout affect a new game', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user, 'Ada')

      const firstRunQuestion = findDisplayedQuestion(questions)
      const { wrong } = getDisplayedAnswers(firstRunQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceThroughAnswerReveal()
      await user.click(screen.getByRole('button', { name: 'Play again' }))
      await startGame(user, 'Bob')

      const secondRunQuestion = findDisplayedQuestion(questions)
      const { correct } = getDisplayedAnswers(secondRunQuestion)
      expect(screen.getByRole('heading', { name: 'Player: Bob' })).toBeInTheDocument()
      expect(screen.getByText(secondRunQuestion.question)).toBeInTheDocument()

      advanceMs(LOCK_DURATION_MS + REVEAL_DURATION_MS)

      expect(screen.queryByRole('heading', { name: 'Incorrect answer' })).not.toBeInTheDocument()
      expect(screen.getByText(secondRunQuestion.question)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: correct.text })).toBeEnabled()
      expect(
        screen.getByRole('timer', {
          name: `${TIMER_SECONDS - 6} seconds remaining`,
        }),
      ).toBeInTheDocument()
    })
  })

  describe('mute integration', () => {
    it('exposes an accessible mute control on the start screen', () => {
      renderApp()

      const muteToggle = screen.getByRole('button', { name: 'Mute sounds' })
      expect(muteToggle).toHaveAttribute('aria-pressed', 'false')
    })

    it('toggles mute without resetting an active game', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user)

      const currentQuestion = findDisplayedQuestion(questions)
      const { correct } = getDisplayedAnswers(currentQuestion)
      advanceMs(1000)
      expect(screen.getByRole('timer', { name: '29 seconds remaining' })).toBeInTheDocument()

      const muteToggle = screen.getByRole('button', { name: 'Mute sounds' })
      await user.click(muteToggle)

      expect(screen.getByRole('button', { name: 'Unmute sounds' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true')
      expect(screen.getByText(currentQuestion.question)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Player: Ada' })).toBeInTheDocument()
      expect(screen.getByRole('timer', { name: '29 seconds remaining' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: correct.text })).toBeEnabled()

      advanceMs(1000)
      expect(screen.getByRole('timer', { name: '28 seconds remaining' })).toBeInTheDocument()
      expect(screen.getByText(currentQuestion.question)).toBeInTheDocument()
    })
  })

  describe('game history', () => {
    it('saves one record for a completed game and shows it in History', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user, 'Ada')
      const currentQuestion = findDisplayedQuestion(questions)
      const { wrong } = getDisplayedAnswers(currentQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceThroughAnswerReveal()

      const history = getGameHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toMatchObject({
        playerName: 'Ada',
        status: 'lost',
        questionIndex: 0,
        totalQuestions: 15,
        securedPrize: '$0',
        categoryId: 'generalKnowledge',
        categoryName: 'General Knowledge',
        difficultyId: 'medium',
        difficultyName: 'Medium',
      })

      await user.click(screen.getByRole('button', { name: 'Play again' }))
      await user.click(screen.getByRole('button', { name: 'History' }))

      expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument()
      expect(screen.getByText('Ada')).toBeInTheDocument()
      expect(screen.getByText('Incorrect answer')).toBeInTheDocument()
      expect(screen.getByText('Games played').closest('li')).toHaveTextContent('1')
      expect(screen.getByText('Wins').closest('li')).toHaveTextContent('0')
    })

    it('does not create duplicate records under Strict Mode', async () => {
      const user = setupUser()
      render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
      await startGame(user, 'Ada')
      const currentQuestion = findDisplayedQuestion(questions)
      const { wrong } = getDisplayedAnswers(currentQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceThroughAnswerReveal()

      expect(getGameHistory()).toHaveLength(1)
    })
  })

  describe('quiz categories', () => {
    it('loads the selected category into the quiz, result, and history', async () => {
      const user = setupUser()
      renderApp()

      await startGame(user, 'Ada', { category: 'Science' })

      expect(screen.getByText('Science · Medium')).toBeInTheDocument()
      const scienceQuestion = findDisplayedQuestion(scienceQuestions)
      expect(scienceQuestion).not.toBeNull()
      expect(findDisplayedQuestion(questions)).toBeNull()

      const { wrong } = getDisplayedAnswers(scienceQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceThroughAnswerReveal()

      expect(screen.getByRole('heading', { name: 'Incorrect answer' })).toBeInTheDocument()
      expect(screen.getByText('Science · Medium')).toBeInTheDocument()
      expect(getGameHistory()[0]).toMatchObject({
        categoryId: 'science',
        categoryName: 'Science',
        difficultyId: 'medium',
        difficultyName: 'Medium',
      })

      await user.click(screen.getByRole('button', { name: 'Play again' }))
      await user.click(screen.getByRole('button', { name: 'History' }))
      expect(screen.getByText('Science · Medium')).toBeInTheDocument()
    })
  })

  describe('learning mode', () => {
    it('ends on an incorrect answer after Continue without advancing to the next question', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user, 'Ada', { learningMode: true })

      const currentQuestion = findDisplayedQuestion(questions)
      const { wrong } = getDisplayedAnswers(currentQuestion)
      await user.click(screen.getByRole('button', { name: wrong.text }))
      advanceMs(LOCK_DURATION_MS)

      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Continue' }))

      expect(screen.getByRole('heading', { name: 'Incorrect answer' })).toBeInTheDocument()
      expect(screen.queryByText(currentQuestion.question)).not.toBeInTheDocument()
    })

    it('does not dispatch duplicate transitions when Continue is clicked twice', async () => {
      const user = setupUser()
      renderApp()
      await startGame(user, 'Ada', { learningMode: true })

      const currentQuestion = findDisplayedQuestion(questions)
      const { correct } = getDisplayedAnswers(currentQuestion)
      await user.click(screen.getByRole('button', { name: correct.text }))
      advanceMs(LOCK_DURATION_MS)

      const continueButton = screen.getByRole('button', { name: 'Continue' })
      await user.click(continueButton)
      await user.click(continueButton)

      expect(screen.queryByText(currentQuestion.question)).not.toBeInTheDocument()
      const nextQuestion = findDisplayedQuestion(questions)
      expect(nextQuestion).not.toBeNull()
      expect(nextQuestion.id).not.toBe(currentQuestion.id)
    })
  })
})
