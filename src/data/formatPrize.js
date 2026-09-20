export const ZERO_PRIZE_DISPLAY = '$0'

export function getPrizeNumericValue(amount) {
  const digits = String(amount ?? '').replace(/\D/g, '')
  if (digits === '') {
    return 0
  }

  const value = Number(digits)
  return Number.isFinite(value) ? value : 0
}

export function formatPrizeAmount(amount) {
  const value = getPrizeNumericValue(amount)

  if (value === 0) {
    return ZERO_PRIZE_DISPLAY
  }

  return `$${value.toLocaleString('en-US')}`
}

export function isZeroPrizeAmount(amount) {
  return getPrizeNumericValue(amount) === 0
}
