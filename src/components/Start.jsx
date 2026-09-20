/* eslint-disable react/prop-types */
import { useRef, useState } from 'react'
import { formatPrizeAmount } from '../data/formatPrize'
import { prizes } from '../data/prizes'
import {
  categories,
  DEFAULT_CATEGORY_ID,
  getPlayableCategory,
  MIN_QUIZ_QUESTIONS,
} from '../data/questionBank'
import { TIMER_SECONDS } from '../game/gameReducer'

const TOP_PRIZE = formatPrizeAmount(prizes[prizes.length - 1]?.amount)

const PLAYER_NAME_ID = 'player-name'
const PLAYER_NAME_ERROR_ID = 'player-name-error'
const CATEGORY_ERROR_ID = 'category-error'
const START_TITLE_ID = 'start-title'
const START_RULES_ID = 'start-rules-heading'
const CATEGORY_LEGEND_ID = 'category-legend'

function Start({ onStart, onOpenHistory }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(DEFAULT_CATEGORY_ID)

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = inputRef.current?.value ?? ''

    if (!value.trim()) {
      setError('Enter your name to start.')
      inputRef.current?.focus()
      return
    }

    const playable = getPlayableCategory(selectedCategoryId)
    if (!playable.ok) {
      setCategoryError(playable.error)
      return
    }

    setError('')
    setCategoryError('')
    onStart(value, playable.category.id)
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
