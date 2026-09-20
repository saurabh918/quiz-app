/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react'
import { formatPrizeAmount } from '../data/formatPrize'

function getPrizeStatus(itemId, activePrizeId, topPrizeId) {
  if (itemId === activePrizeId) {
    return itemId === topPrizeId ? 'current-final' : 'current'
  }

  if (itemId < activePrizeId) {
    return 'secured'
  }

  return itemId === topPrizeId ? 'upcoming-final' : 'upcoming'
}

function getPrizeClassName(status) {
  const classNames = ['prizeListItem']

  if (status === 'current' || status === 'current-final') {
    classNames.push('isCurrent')
  }

  if (status === 'secured') {
    classNames.push('isSecured')
  }

  if (status === 'upcoming' || status === 'upcoming-final') {
    classNames.push('isUpcoming')
  }

  if (status === 'current-final' || status === 'upcoming-final') {
    classNames.push('isFinal')
  }

  return classNames.join(' ')
}

function getPrizeStatusLabel(status) {
  if (status === 'current' || status === 'current-final') {
    return 'Current prize'
  }

  if (status === 'secured') {
    return 'Secured'
  }

  if (status === 'upcoming-final') {
    return 'Top prize'
  }

  return 'Upcoming'
}

export function CurrentPrizeBar({ activePrizeId, totalPrizes, amount }) {
  return (
    <div className="currentPrizeBar">
      <p className="currentPrizeBarProgress">
        Question {activePrizeId} of {totalPrizes}
      </p>
      <p className="currentPrizeBarAmount">Playing for {formatPrizeAmount(amount)}</p>
    </div>
  )
}

function PrizeLadder({ prizes, activePrizeId, topPrizeId }) {
  const currentItemRef = useRef(null)

  useEffect(() => {
    const currentItem = currentItemRef.current
    const container = currentItem?.closest('.milestone')

    if (!currentItem || !container) {
      return
    }

    let behavior = 'smooth'
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        behavior = 'auto'
      }
    } catch {
      behavior = 'auto'
    }

    const itemOffset =
      currentItem.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop
    const nextScrollTop =
      itemOffset - container.clientHeight / 2 + currentItem.offsetHeight / 2

    container.scrollTo({
      top: Math.max(0, nextScrollTop),
      behavior,
    })
  }, [activePrizeId])

  return (
    <nav className="milestone" aria-label="Prize ladder">
      <ul className="prizeList">
        {prizes.map((item) => {
          const status = getPrizeStatus(item.id, activePrizeId, topPrizeId)
          const isCurrent = status === 'current' || status === 'current-final'

          return (
            <li
              key={item.id}
              ref={isCurrent ? currentItemRef : null}
              className={getPrizeClassName(status)}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="prizeListItemMarker" aria-hidden="true">
                {status === 'secured' ? '✓' : isCurrent ? '▸' : ''}
              </span>
              <span className="prizeListItemNumber">{item.id}</span>
              <span className="prizeListItemAmount">{formatPrizeAmount(item.amount)}</span>
              {isCurrent && (
                <span className="prizeBadge" aria-hidden="true">Now</span>
              )}
              {status === 'upcoming-final' && (
                <span className="prizeBadge prizeBadgeFinal" aria-hidden="true">Top</span>
              )}
              <span className="visuallyHidden">{getPrizeStatusLabel(status)}</span>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default PrizeLadder
