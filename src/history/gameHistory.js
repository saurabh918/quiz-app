import { formatPrizeAmount, getPrizeNumericValue, ZERO_PRIZE_DISPLAY } from '../data/formatPrize'
import { FALLBACK_CATEGORY_NAME } from '../data/questionBank'
import { GameStatus } from '../game/gameReducer'

export const HISTORY_STORAGE_KEY = 'quiz-app:game-history:v1'
export const MAX_HISTORY_RECORDS = 20

const VALID_STATUSES = new Set([GameStatus.WON, GameStatus.LOST, GameStatus.TIMEOUT])

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

export function createHistoryId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // Fall through to a timestamp-based id.
  }

  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isValidRecord(record) {
  if (!record || typeof record !== 'object') {
    return false
  }

  if (typeof record.id !== 'string' || !record.id.trim()) {
    return false
  }

  if (typeof record.playerName !== 'string' || !record.playerName.trim()) {
    return false
  }

  if (!VALID_STATUSES.has(record.status)) {
    return false
  }

  if (typeof record.questionIndex !== 'number' || !Number.isFinite(record.questionIndex)) {
    return false
  }

  if (typeof record.totalQuestions !== 'number' || record.totalQuestions < 1) {
    return false
  }

  if (typeof record.securedPrize !== 'string') {
    return false
  }

  if (typeof record.completedAt !== 'string' || Number.isNaN(Date.parse(record.completedAt))) {
    return false
  }

  return true
}

function normalizeRecord(record) {
  if (!isValidRecord(record)) {
    return null
  }

  return {
    id: record.id.trim(),
    playerName: record.playerName.trim(),
    status: record.status,
    questionIndex: record.questionIndex,
    totalQuestions: record.totalQuestions,
    securedPrize: record.securedPrize,
    completedAt: record.completedAt,
    ...(typeof record.categoryId === 'string' && record.categoryId.trim()
      ? { categoryId: record.categoryId.trim() }
      : {}),
    ...(typeof record.categoryName === 'string' && record.categoryName.trim()
      ? { categoryName: record.categoryName.trim() }
      : {}),
  }
}

function sortNewestFirst(records) {
  return [...records].sort((left, right) => {
    const rightTime = Date.parse(right.completedAt)
    const leftTime = Date.parse(left.completedAt)
    return rightTime - leftTime
  })
}

function writeHistory(records) {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Ignore private mode and quota errors.
  }
}

export function getGameHistory() {
  if (!canUseLocalStorage()) {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!storedValue) {
      return []
    }

    const parsed = JSON.parse(storedValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return sortNewestFirst(parsed.map(normalizeRecord).filter(Boolean)).slice(0, MAX_HISTORY_RECORDS)
  } catch {
    return []
  }
}

export function saveGameHistory(record) {
  const current = getGameHistory()
  const nextRecord = normalizeRecord({
    id: typeof record?.id === 'string' && record.id.trim() ? record.id.trim() : createHistoryId(),
    playerName: record?.playerName,
    status: record?.status,
    questionIndex: record?.questionIndex,
    totalQuestions: record?.totalQuestions,
    securedPrize:
      typeof record?.securedPrize === 'string' ? record.securedPrize : formatPrizeAmount(record?.securedPrize),
    completedAt:
      typeof record?.completedAt === 'string' && !Number.isNaN(Date.parse(record.completedAt))
        ? record.completedAt
        : new Date().toISOString(),
    categoryId: record?.categoryId,
    categoryName: record?.categoryName,
  })

  if (!nextRecord) {
    return current
  }

  if (current.some((item) => item.id === nextRecord.id)) {
    return current
  }

  const next = sortNewestFirst([nextRecord, ...current]).slice(0, MAX_HISTORY_RECORDS)
  writeHistory(next)
  return next
}

export function clearGameHistory() {
  if (!canUseLocalStorage()) {
    return []
  }

  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY)
  } catch {
    // Ignore private mode errors.
  }

  return []
}

export function getHistorySummary(records = []) {
  let highestValue = 0

  for (const record of records) {
    const value = getPrizeNumericValue(record?.securedPrize)
    if (value > highestValue) {
      highestValue = value
    }
  }

  return {
    gamesPlayed: records.length,
    wins: records.filter((record) => record.status === GameStatus.WON).length,
    highestPrize: highestValue === 0 ? ZERO_PRIZE_DISPLAY : formatPrizeAmount(highestValue),
  }
}

export function getHistoryResultLabel(status) {
  if (status === GameStatus.WON) {
    return 'Won'
  }

  if (status === GameStatus.TIMEOUT) {
    return 'Time out'
  }

  return 'Incorrect answer'
}

export function getHistoryCategoryLabel(record) {
  if (typeof record?.categoryName === 'string' && record.categoryName.trim()) {
    return record.categoryName.trim()
  }

  return FALLBACK_CATEGORY_NAME
}

export function getHistoryProgressLabel(record) {
  if (record.status === GameStatus.WON) {
    return `Question ${record.totalQuestions} of ${record.totalQuestions}`
  }

  const reached = Math.min(record.questionIndex + 1, record.totalQuestions)
  return `Question ${reached} of ${record.totalQuestions}`
}

export function formatHistoryDate(isoDate) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}
