import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GameStatus } from '../game/gameReducer'
import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_RECORDS,
  clearGameHistory,
  getGameHistory,
  getHistoryCategoryLabel,
  getHistorySummary,
  saveGameHistory,
} from './gameHistory'

function makeRecord(overrides = {}) {
  return {
    id: 'record-1',
    playerName: 'Ada',
    status: GameStatus.LOST,
    questionIndex: 0,
    totalQuestions: 15,
    securedPrize: '$0',
    completedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('gameHistory', () => {
  beforeEach(() => {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY)
  })

  it('returns an empty array when nothing is stored', () => {
    expect(getGameHistory()).toEqual([])
  })

  it('reads valid records from localStorage', () => {
    const record = makeRecord()
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([record]))

    expect(getGameHistory()).toEqual([record])
  })

  it('handles malformed localStorage data without throwing', () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, '{not-json')
    expect(getGameHistory()).toEqual([])

    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({ id: 'nope' }))
    expect(getGameHistory()).toEqual([])

    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([makeRecord(), { id: 12, status: 'playing' }, null]),
    )
    expect(getGameHistory()).toEqual([makeRecord()])
  })

  it('keeps only the latest 20 records, newest first', () => {
    for (let index = 0; index < 21; index += 1) {
      saveGameHistory(
        makeRecord({
          id: `record-${index}`,
          completedAt: `2026-01-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
        }),
      )
    }

    const history = getGameHistory()
    expect(history).toHaveLength(MAX_HISTORY_RECORDS)
    expect(history[0].id).toBe('record-20')
    expect(history[history.length - 1].id).toBe('record-1')
    expect(history.some((record) => record.id === 'record-0')).toBe(false)
  })

  it('does not create a duplicate when the same id is saved twice', () => {
    const record = makeRecord()
    saveGameHistory(record)
    saveGameHistory(record)

    expect(getGameHistory()).toHaveLength(1)
  })

  it('clears stored records', () => {
    saveGameHistory(makeRecord())
    expect(getGameHistory()).toHaveLength(1)

    expect(clearGameHistory()).toEqual([])
    expect(getGameHistory()).toEqual([])
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('counts wins only and uses the highest secured prize', () => {
    const records = [
      makeRecord({ id: 'lost', status: GameStatus.LOST, securedPrize: '$1,000' }),
      makeRecord({ id: 'timeout', status: GameStatus.TIMEOUT, securedPrize: '$200' }),
      makeRecord({ id: 'won', status: GameStatus.WON, securedPrize: '$1,000,000' }),
    ]

    expect(getHistorySummary(records)).toEqual({
      gamesPlayed: 3,
      wins: 1,
      highestPrize: '$1,000,000',
    })
    expect(getHistorySummary([])).toEqual({
      gamesPlayed: 0,
      wins: 0,
      highestPrize: '$0',
    })
  })

  it('keeps older records without category fields and labels them safely', () => {
    const legacyRecord = makeRecord()
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([legacyRecord]))

    expect(getGameHistory()).toEqual([legacyRecord])
    expect(getHistoryCategoryLabel(legacyRecord)).toBe('General Knowledge')
    expect(
      getHistoryCategoryLabel(
        makeRecord({
          categoryId: 'science',
          categoryName: 'Science',
        }),
      ),
    ).toBe('Science')
  })

  it('stores category fields on new records', () => {
    saveGameHistory(
      makeRecord({
        categoryId: 'science',
        categoryName: 'Science',
      }),
    )

    expect(getGameHistory()[0]).toMatchObject({
      categoryId: 'science',
      categoryName: 'Science',
    })
  })
})
