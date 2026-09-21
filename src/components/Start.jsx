/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { formatPrizeAmount } from '../data/formatPrize'
import { DEFAULT_DIFFICULTY_ID } from '../data/difficulties'
import { prizes } from '../data/prizes'
import {
  categories,
  DEFAULT_CATEGORY_ID,
  getDifficultyAvailability,
  getPlayableCategory,
  MIN_QUIZ_QUESTIONS,
} from '../data/questionBank'
import { TIMER_SECONDS } from '../game/gameReducer'

const TOP_PRIZE = formatPrizeAmount(prizes[prizes.length - 1]?.amount)

const PLAYER_NAME_ID = 'player-name'
const PLAYER_NAME_ERROR_ID = 'player-name-error'
const CATEGORY_ERROR_ID = 'category-error'
const DIFFICULTY_ERROR_ID = 'difficulty-error'
const START_TITLE_ID = 'start-title'
const START_RULES_ID = 'start-rules-heading'
const CATEGORY_LEGEND_ID = 'category-legend'
const DIFFICULTY_LEGEND_ID = 'difficulty-legend'
const LEARNING_MODE_LEGEND_ID = 'learning-mode-legend'

function getDefaultDifficultyId(categoryId) {
  const availability = getDifficultyAvailability(categoryId)
  const preferred = availability.find((item) => item.id === DEFAULT_DIFFICULTY_ID && item.playable)
  const fallback = availability.find((item) => item.playable)
  return preferred?.id ?? fallback?.id ?? DEFAULT_DIFFICULTY_ID
}

function Start({ onStart, onOpenHistory }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [difficultyError, setDifficultyError] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORY_ID)
  const [selectedDifficultyId, setSelectedDifficultyId] = useState(() =>
    getDefaultDifficultyId(DEFAULT_CATEGORY_ID),
  )
  const [learningMode, setLearningMode] = useState(false)
  const difficultyAvailability = getDifficultyAvailability(selectedCategoryId)

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

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = inputRef.current?.value ?? ''

    if (!value.trim()) {
      setError('Enter your name to start.')
      inputRef.current?.focus()
      return
    }

    const selectedDifficulty = difficultyAvailability.find((item) => item.id === selectedDifficultyId)
    if (!selectedDifficulty?.playable) {
      setDifficultyError('Choose an available difficulty to start.')
      return
    }

    const playable = getPlayableCategory(selectedCategoryId, selectedDifficultyId)
    if (!playable.ok) {
      if (!getDifficultyAvailability(selectedCategoryId).some((item) => item.playable)) {
        setCategoryError(playable.error)
      } else {
        setDifficultyError(playable.error)
      }
      return
    }

    setError('')
    setCategoryError('')
    setDifficultyError('')
    onStart(value, playable.category.id, playable.difficulty.id, learningMode)
  }

  return (
    <form className="start" onSubmit={handleSubmit} noValidate aria-labelledby={START_TITLE_ID}>
      <header className="startHeader">
        <h1 id={START_TITLE_ID} className="startTitle">
          Prize Ladder
        </h1>
        <p className="startSubtitle">
          Climb fifteen timed questions toward the top prize.
        </p>
      </header>

      <section className="startRules" aria-labelledby={START_RULES_ID}>
        <h2 id={START_RULES_ID} className="startRulesHeading">
          How to play
        </h2>
        <ul className="startRulesList">
          <li>{MIN_QUIZ_QUESTIONS} questions</li>
          <li>{TIMER_SECONDS} seconds per question</li>
          <li>One wrong answer or timeout ends the run</li>
          <li>Maximum prize of {TOP_PRIZE}</li>
        </ul>
      </section>

      <fieldset className="categoryFieldset" aria-describedby={categoryError ? CATEGORY_ERROR_ID : undefined}>
        <legend id={CATEGORY_LEGEND_ID} className="startLabel">
          Category
        </legend>
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

      <fieldset
        className="categoryFieldset"
        aria-describedby={difficultyError ? DIFFICULTY_ERROR_ID : undefined}
      >
        <legend id={DIFFICULTY_LEGEND_ID} className="startLabel">
          Difficulty
        </legend>
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

      <fieldset className="categoryFieldset">
        <legend id={LEARNING_MODE_LEGEND_ID} className="startLabel">
          Mode
        </legend>
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
                Pause after each reveal to read explanations when available, then continue
                manually.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="startFields">
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? PLAYER_NAME_ERROR_ID : undefined}
        />
        {error ? (
          <p id={PLAYER_NAME_ERROR_ID} className="startError">
            {error}
          </p>
        ) : null}
        <button className="startBtn" type="submit">
          Start
        </button>
        {onOpenHistory ? (
          <button className="startBtn startBtnSecondary" type="button" onClick={onOpenHistory}>
            History
          </button>
        ) : null}
      </div>
    </form>
  )
}

export default Start
