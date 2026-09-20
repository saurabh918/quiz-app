import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PrizeLadder, { CurrentPrizeBar } from './PrizeLadder'
import { prizes } from '../data/prizes'
import { formatPrizeAmount } from '../data/formatPrize'

const topPrize = prizes[prizes.length - 1]
const firstPrize = prizes[0]
const middlePrize = prizes[4]

function renderPrizeLadder(activePrizeId = firstPrize.id) {
  return render(
    <PrizeLadder
      prizes={[...prizes].reverse()}
      activePrizeId={activePrizeId}
      topPrizeId={topPrize.id}
    />,
  )
}

function getPrizeRow(amount) {
  return screen.getByText(formatPrizeAmount(amount)).closest('li')
}

describe('PrizeLadder', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn()
  })

  describe('rendering', () => {
    it('renders a labeled ladder with every prize from the real prize data', () => {
      renderPrizeLadder()

      expect(screen.getByRole('navigation', { name: 'Prize ladder' })).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(prizes.length)

      prizes.forEach((prize) => {
        expect(screen.getByText(formatPrizeAmount(prize.amount))).toBeInTheDocument()
      })
    })
  })

  describe('current prize', () => {
    it('marks only the active prize as current on the first question', () => {
      renderPrizeLadder(firstPrize.id)

      const currentRow = getPrizeRow(firstPrize.amount)
      const nextRow = getPrizeRow(prizes[1].amount)

      expect(screen.getByRole('listitem', { current: 'step' })).toBe(currentRow)
      expect(currentRow).toHaveClass('isCurrent')
      expect(currentRow).not.toHaveClass('isSecured', 'isUpcoming')
      expect(within(currentRow).getByText('Current prize')).toBeInTheDocument()
      expect(within(currentRow).getByText('Now')).toBeInTheDocument()

      expect(nextRow).not.toHaveAttribute('aria-current')
      expect(nextRow).toHaveClass('isUpcoming')
      expect(nextRow).not.toHaveClass('isCurrent', 'isSecured')
      expect(within(nextRow).getByText('Upcoming')).toBeInTheDocument()
      expect(screen.queryByText('Secured')).not.toBeInTheDocument()
    })

    it('moves the current prize to a middle question without marking it secured', () => {
      renderPrizeLadder(middlePrize.id)

      const currentRow = getPrizeRow(middlePrize.amount)
      const securedRow = getPrizeRow(firstPrize.amount)
      const upcomingRow = getPrizeRow(prizes[5].amount)

      expect(screen.getAllByRole('listitem', { current: 'step' })).toHaveLength(1)
      expect(currentRow).toHaveAttribute('aria-current', 'step')
      expect(currentRow).toHaveClass('isCurrent')
      expect(currentRow).not.toHaveClass('isSecured')
      expect(within(currentRow).getByText('Now')).toBeInTheDocument()

      expect(securedRow).toHaveClass('isSecured')
      expect(securedRow).not.toHaveClass('isCurrent', 'isUpcoming')
      expect(securedRow).not.toHaveAttribute('aria-current')
      expect(within(securedRow).getByText('Secured')).toBeInTheDocument()

      expect(upcomingRow).toHaveClass('isUpcoming')
      expect(upcomingRow).not.toHaveClass('isCurrent', 'isSecured')
      expect(within(upcomingRow).getByText('Upcoming')).toBeInTheDocument()
    })

    it('marks the final prize as current when it is the active prize', () => {
      renderPrizeLadder(topPrize.id)

      const finalRow = getPrizeRow(topPrize.amount)

      expect(finalRow).toHaveAttribute('aria-current', 'step')
      expect(finalRow).toHaveClass('isCurrent', 'isFinal')
      expect(finalRow).not.toHaveClass('isSecured', 'isUpcoming')
      expect(within(finalRow).getByText('Current prize')).toBeInTheDocument()
      expect(within(finalRow).getByText('Now')).toBeInTheDocument()
      expect(within(finalRow).queryByText('Top')).not.toBeInTheDocument()
      expect(screen.queryByText('Top prize')).not.toBeInTheDocument()
    })
  })

  describe('secured and upcoming prizes', () => {
    it('marks every earlier prize as secured once a later prize is current', () => {
      renderPrizeLadder(middlePrize.id)

      const securedAmounts = prizes
        .filter((prize) => prize.id < middlePrize.id)
        .map((prize) => prize.amount)

      expect(screen.getAllByText('Secured')).toHaveLength(securedAmounts.length)

      securedAmounts.forEach((amount) => {
        const row = getPrizeRow(amount)
        expect(row).toHaveClass('isSecured')
        expect(row).not.toHaveClass('isCurrent')
        expect(row).not.toHaveAttribute('aria-current')
        expect(within(row).queryByText('Now')).not.toBeInTheDocument()
      })
    })

    it('keeps unreached prizes upcoming, including the top prize', () => {
      renderPrizeLadder(middlePrize.id)

      const upcomingRow = getPrizeRow(prizes[5].amount)
      const topRow = getPrizeRow(topPrize.amount)

      expect(upcomingRow).toHaveClass('isUpcoming')
      expect(upcomingRow).not.toHaveClass('isCurrent', 'isSecured', 'isFinal')
      expect(within(upcomingRow).getByText('Upcoming')).toBeInTheDocument()
      expect(within(upcomingRow).queryByText('Now')).not.toBeInTheDocument()
      expect(within(upcomingRow).queryByText('Top')).not.toBeInTheDocument()

      expect(topRow).toHaveClass('isUpcoming', 'isFinal')
      expect(topRow).not.toHaveClass('isCurrent', 'isSecured')
      expect(topRow).not.toHaveAttribute('aria-current')
      expect(within(topRow).getByText('Top prize')).toBeInTheDocument()
    })
  })

  describe('markers', () => {
    it('shows a single Now marker on the current prize', () => {
      renderPrizeLadder(middlePrize.id)

      const nowMarkers = screen.getAllByText('Now')
      expect(nowMarkers).toHaveLength(1)
      expect(getPrizeRow(middlePrize.amount)).toContainElement(nowMarkers[0])
      expect(nowMarkers[0]).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows a single Top marker on the unreached final prize', () => {
      renderPrizeLadder(firstPrize.id)

      const topMarkers = screen.getAllByText('Top')
      expect(topMarkers).toHaveLength(1)
      expect(getPrizeRow(topPrize.amount)).toContainElement(topMarkers[0])
      expect(topMarkers[0]).toHaveAttribute('aria-hidden', 'true')
      expect(getPrizeRow(firstPrize.amount)).toContainElement(screen.getByText('Now'))
    })

    it('does not show a Top marker while the final prize is current', () => {
      renderPrizeLadder(topPrize.id)

      expect(screen.queryByText('Top')).not.toBeInTheDocument()
      expect(screen.getAllByText('Now')).toHaveLength(1)
    })
  })
})

describe('CurrentPrizeBar', () => {
  it('shows the current question progress and amount being played for', () => {
    render(
      <CurrentPrizeBar
        activePrizeId={middlePrize.id}
        totalPrizes={prizes.length}
        amount={middlePrize.amount}
      />,
    )

    expect(screen.getByText(`Question ${middlePrize.id} of ${prizes.length}`)).toBeInTheDocument()
    expect(screen.getByText(`Playing for ${formatPrizeAmount(middlePrize.amount)}`)).toBeInTheDocument()
  })
})
