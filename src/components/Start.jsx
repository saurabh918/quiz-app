/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { formatPrizeAmount } from '../data/formatPrize'
import { DEFAULT_DIFFICULTY_ID } from '../data/difficulties'
import { prizes } from '../data/prizes'
import {
  categories,
  DEFAULT_CATEGORY_ID,
  getCategoryById,
  getDifficultyAvailability,
  getPlayableCategory,
  MIN_QUIZ_QUESTIONS,
} from '../data/questionBank'
import { TIMER_SECONDS } from '../game/gameReducer'

const TOP_PRIZE = formatPrizeAmount(prizes[prizes.length - 1]?.amount)
const TOTAL_STEPS = 6

const PLAYER_NAME_ID = 'player-name'
const PLAYER_NAME_ERROR_ID = 'player-name-error'
const CATEGORY_ERROR_ID = 'category-error'
const DIFFICULTY_ERROR_ID = 'difficulty-error'
const START_TITLE_ID = 'start-title'
const START_PROGRESS_ID = 'start-progress-label'
const CATEGORY_LEGEND_ID = 'category-legend'
const DIFFICULTY_LEGEND_ID = 'difficulty-legend'
const LEARNING_MODE_LEGEND_ID = 'learning-mode-legend'

const STEP_LABELS = [
  'How to Play',
  'Enter Your Name',
  'Choose Your Category',
  'Choose Difficulty',
  'Choose Your Mode',
  'Review and Start',
]

function getDefaultDifficultyId(categoryId) {
  const availability = getDifficultyAvailability(categoryId)
  const preferred = availability.find((item) => item.id === DEFAULT_DIFFICULTY_ID && item.playable)
  const fallback = availability.find((item) => item.playable)
  return preferred?.id ?? fallback?.id ?? DEFAULT_DIFFICULTY_ID
}

function Start({ onStart, onOpenHistory }) {
  const inputRef = useRef(null)
  const stepHeadingRef = useRef(null)
  const [step, setStep] = useState(1)
  const [stepDirection, setStepDirection] = useState('forward')
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [difficultyError, setDifficultyError] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORY_ID)
  const [selectedDifficultyId, setSelectedDifficultyId] = useState(() =>
    getDefaultDifficultyId(DEFAULT_CATEGORY_ID),
  )
  const [learningMode, setLearningMode] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const difficultyAvailability = getDifficultyAvailability(selectedCategoryId)
  const selectedCategory = getCategoryById(selectedCategoryId)
  const selectedDifficulty = difficultyAvailability.find((item) => item.id === selectedDifficultyId)

  useEffect(() => {
    const availability = getDifficultyAvailability(selectedCategoryId)
    setSelectedDifficultyId((currentId) => {
      const current = availability.find((item) => item.id === currentId)
      if (current?.playable) {
        return currentId
      }

      return getDefaultDifficultyId(selectedCategoryId)
    })
  }, [selectedCategoryId])

  useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [step])

  const goToStep = (nextStep, direction) => {
    setStepDirection(direction)
    setStep(nextStep)
  }

  const validateName = () => {
    const value = playerName.trim()
    if (!value) {
      setError('Enter your name to start.')
      inputRef.current?.focus()
      return false
    }

    setError('')
    return true
  }

  const handleContinue = () => {
    if (step === 2 && !validateName()) {
      return
    }

    if (step < TOTAL_STEPS) {
      goToStep(step + 1, 'forward')
    }
  }

  const handleBack = () => {
    if (step > 1) {
      goToStep(step - 1, 'back')
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (step !== TOTAL_STEPS) {
      handleContinue()
      return
    }

    const value = playerName.trim()

    if (!value) {
      setError('Enter your name to start.')
      goToStep(2, 'back')
      inputRef.current?.focus()
      return
    }

    const playableDifficulty = difficultyAvailability.find((item) => item.id === selectedDifficultyId)
    if (!playableDifficulty?.playable) {
      setDifficultyError('Choose an available difficulty to start.')
      goToStep(4, 'back')
      return
    }

    const playable = getPlayableCategory(selectedCategoryId, selectedDifficultyId)
    if (!playable.ok) {
      if (!getDifficultyAvailability(selectedCategoryId).some((item) => item.playable)) {
        setCategoryError(playable.error)
        goToStep(3, 'back')
      } else {
        setDifficultyError(playable.error)
        goToStep(4, 'back')
      }
      return
    }

    setError('')
    setCategoryError('')
    setDifficultyError('')
    onStart(value, playable.category.id, playable.difficulty.id, learningMode)
  }

  const stepPanelClassName = [
    'startStepPanel',
    stepDirection === 'back' ? 'isBack' : 'isForward',
  ].join(' ')

  return (
    <form className="start" onSubmit={handleSubmit} noValidate aria-labelledby={START_TITLE_ID}>
      <header className="startHeader">
        <h1 id={START_TITLE_ID} className="startTitle">
          Prize Ladder
        </h1>
        <p className="startSubtitle">Climb fifteen timed questions toward the top prize.</p>
      </header>

      <div key={`progress-${step}`} className="startProgress" aria-labelledby={START_PROGRESS_ID}>
        <p id={START_PROGRESS_ID} className="startProgressText">
          Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
        </p>
        <div
          className="startProgressTrack"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-label={`Setup progress, step ${step} of ${TOTAL_STEPS}`}
        >
          <span className="startProgressFill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <ol className="startProgressDots" aria-hidden="true">
          {STEP_LABELS.map((label, index) => {
            const stepNumber = index + 1
            const dotClassName = [
              'startProgressDot',
              stepNumber === step ? 'isCurrent' : '',
              stepNumber < step ? 'isComplete' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return <li key={label} className={dotClassName} title={label} />
          })}
        </ol>
      </div>

      <div key={step} className={stepPanelClassName}>
        {step === 1 ? (
          <section className="startRules" aria-labelledby={START_PROGRESS_ID}>
            <h2 ref={stepHeadingRef} className="visuallyHidden" tabIndex={-1}>
              {STEP_LABELS[0]}
            </h2>
            <ul className="startRulesList">
              <li>{MIN_QUIZ_QUESTIONS} questions</li>
              <li>{TIMER_SECONDS} seconds per question</li>
              <li>One wrong answer or timeout ends the run</li>
              <li>Maximum prize of {TOP_PRIZE}</li>
            </ul>
          </section>
        ) : null}

        {step === 2 ? (
          <div className="startFields">
            <h2 ref={stepHeadingRef} className="visuallyHidden" tabIndex={-1}>
              {STEP_LABELS[1]}
            </h2>
            <p className="startStepDescription">This name appears on your prize ladder run.</p>
            <label className="startLabel" htmlFor={PLAYER_NAME_ID}>
              Name
            </label>
            <input
              id={PLAYER_NAME_ID}
              ref={inputRef}
              name="playerName"
              type="text"
              autoComplete="name"
              placeholder="Enter your name"
              className="startBox"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? PLAYER_NAME_ERROR_ID : undefined}
            />
            {error ? (
              <p id={PLAYER_NAME_ERROR_ID} className="startError">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <fieldset
            className="categoryFieldset"
            aria-describedby={categoryError ? CATEGORY_ERROR_ID : undefined}
          >
            <legend id={CATEGORY_LEGEND_ID} ref={stepHeadingRef} className="visuallyHidden" tabIndex={-1}>
              {STEP_LABELS[2]}
            </legend>
            <p className="startStepDescription">Pick the question set for this run.</p>
            <div className="categoryOptions">
              {categories.map((category) => {
                const isSelected = selectedCategoryId === category.id

                return (
                  <label
                    key={category.id}
                    className={isSelected ? 'categoryOption isSelected' : 'categoryOption'}
                  >
                    <input
                      className="visuallyHidden"
                      type="radio"
                      name="quiz-category"
                      value={category.id}
                      checked={isSelected}
                      onChange={() => setSelectedCategoryId(category.id)}
                    />
                    <span className="categoryOptionMarker" aria-hidden="true" />
                    <span className="categoryOptionBody">
                      <span className="categoryOptionName">
                        {category.name}
                        {isSelected ? <span className="categorySelectedMark">Selected</span> : null}
                      </span>
                      <span className="categoryOptionDescription">{category.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {categoryError ? (
              <p id={CATEGORY_ERROR_ID} className="startError">
                {categoryError}
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {step === 4 ? (
          <fieldset
            className="categoryFieldset"
            aria-describedby={difficultyError ? DIFFICULTY_ERROR_ID : undefined}
          >
            <legend id={DIFFICULTY_LEGEND_ID} ref={stepHeadingRef} className="visuallyHidden" tabIndex={-1}>
              {STEP_LABELS[3]}
            </legend>
            <p className="startStepDescription">Medium is available for every category today.</p>
            <div className="categoryOptions">
              {difficultyAvailability.map((difficulty) => {
                const isSelected = selectedDifficultyId === difficulty.id
                const isPlayable = difficulty.playable
                const optionClassName = [
                  'categoryOption',
                  isSelected ? 'isSelected' : '',
                  isPlayable ? '' : 'isUnavailable',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <label key={difficulty.id} className={optionClassName}>
                    <input
                      className="visuallyHidden"
                      type="radio"
                      name="quiz-difficulty"
                      value={difficulty.id}
                      checked={isSelected && isPlayable}
                      disabled={!isPlayable}
                      onChange={() => {
                        if (isPlayable) {
                          setSelectedDifficultyId(difficulty.id)
                        }
                      }}
                    />
                    <span className="categoryOptionMarker" aria-hidden="true" />
                    <span className="categoryOptionBody">
                      <span className="categoryOptionName">
                        {difficulty.name}
                        {isSelected && isPlayable ? (
                          <span className="categorySelectedMark">Selected</span>
                        ) : null}
                        {!isPlayable ? <span className="categoryComingSoonMark">Coming soon</span> : null}
                      </span>
                      <span className="categoryOptionDescription">
                        {isPlayable
                          ? difficulty.description
                          : `Requires at least ${MIN_QUIZ_QUESTIONS} questions.`}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
            {difficultyError ? (
              <p id={DIFFICULTY_ERROR_ID} className="startError">
                {difficultyError}
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {step === 5 ? (
          <fieldset className="categoryFieldset">
            <legend id={LEARNING_MODE_LEGEND_ID} ref={stepHeadingRef} className="visuallyHidden" tabIndex={-1}>
              {STEP_LABELS[4]}
            </legend>
            <p className="startStepDescription">Normal is fast-paced. Learning Mode adds explanations.</p>
            <div className="categoryOptions">
              <label className={learningMode ? 'categoryOption' : 'categoryOption isSelected'}>
                <input
                  className="visuallyHidden"
                  type="radio"
                  name="quiz-mode"
                  value="normal"
                  checked={!learningMode}
                  onChange={() => setLearningMode(false)}
                />
                <span className="categoryOptionMarker" aria-hidden="true" />
                <span className="categoryOptionBody">
                  <span className="categoryOptionName">
                    Normal
                    {!learningMode ? <span className="categorySelectedMark">Selected</span> : null}
                  </span>
                  <span className="categoryOptionDescription">
                    Fast prize-ladder gameplay with automatic progression.
                  </span>
                </span>
              </label>
              <label className={learningMode ? 'categoryOption isSelected' : 'categoryOption'}>
                <input
                  className="visuallyHidden"
                  type="radio"
                  name="quiz-mode"
                  value="learning"
                  checked={learningMode}
                  onChange={() => setLearningMode(true)}
                />
                <span className="categoryOptionMarker" aria-hidden="true" />
                <span className="categoryOptionBody">
                  <span className="categoryOptionName">
                    Learning Mode
                    {learningMode ? <span className="categorySelectedMark">Selected</span> : null}
                  </span>
                  <span className="categoryOptionDescription">
                    Pause after each reveal to read explanations when available, then continue manually.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        ) : null}

        {step === TOTAL_STEPS ? (
          <section className="startSummary" aria-labelledby={START_PROGRESS_ID}>
            <h2 ref={stepHeadingRef} className="visuallyHidden" tabIndex={-1}>
              {STEP_LABELS[5]}
            </h2>
            <p className="startStepDescription">Confirm your setup before the first question.</p>
            <dl className="startSummaryList">
              <div className="startSummaryItem">
                <dt>Name</dt>
                <dd>{playerName.trim() || '—'}</dd>
              </div>
              <div className="startSummaryItem">
                <dt>Category</dt>
                <dd>{selectedCategory?.name ?? '—'}</dd>
              </div>
              <div className="startSummaryItem">
                <dt>Difficulty</dt>
                <dd>{selectedDifficulty?.name ?? '—'}</dd>
              </div>
              <div className="startSummaryItem">
                <dt>Mode</dt>
                <dd>{learningMode ? 'Learning Mode' : 'Normal'}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>

      <div key={`nav-${step}`} className={`startNav ${stepDirection === 'back' ? 'isBack' : 'isForward'}`}>
        {step > 1 ? (
          <button className="startBtn startBtnSecondary" type="button" onClick={handleBack}>
            Back
          </button>
        ) : (
          <span className="startNavSpacer" aria-hidden="true" />
        )}
        {step < TOTAL_STEPS ? (
          <button className="startBtn" type="button" onClick={handleContinue}>
            Continue
          </button>
        ) : (
          <button className="startBtn startBtnPrimary" type="submit">
            Start Quiz
          </button>
        )}
      </div>

      {onOpenHistory && step === 1 ? (
        <button className="startBtn startBtnSecondary startHistoryBtn" type="button" onClick={onOpenHistory}>
          History
        </button>
      ) : null}
    </form>
  )
}

export default Start
