/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import {
  clearGameHistory,
  formatHistoryDate,
  getGameHistory,
  getHistoryCategoryLabel,
  getHistoryProgressLabel,
  getHistoryResultLabel,
  getHistorySummary,
} from '../history/gameHistory'

const HISTORY_TITLE_ID = 'history-title'
const CLEAR_CONFIRM_ID = 'history-clear-confirm'

function History({ onBack }) {
  const headingRef = useRef(null)
  const [records, setRecords] = useState(() => getGameHistory())
  const [confirmingClear, setConfirmingClear] = useState(false)
  const summary = getHistorySummary(records)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const handleConfirmClear = () => {
    setRecords(clearGameHistory())
    setConfirmingClear(false)
  }

  return (
    <section className="history" aria-labelledby={HISTORY_TITLE_ID}>
      <header className="historyHeader">
        <h1 id={HISTORY_TITLE_ID} ref={headingRef} tabIndex={-1} className="historyTitle">
          History
        </h1>
        <p className="historySubtitle">Previous completed games on this device.</p>
      </header>

      {records.length === 0 ? (
        <div className="historyEmpty">
          <p className="historyEmptyTitle">No games played yet</p>
          <p>Completed games will appear here after you finish a round.</p>
        </div>
      ) : (
        <>
          <section className="historySummary" aria-label="Best performance">
            <h2 className="historySectionHeading">Best performance</h2>
            <ul className="historySummaryList">
              <li>
                <span className="historySummaryLabel">Games played</span>
                <span className="historySummaryValue">{summary.gamesPlayed}</span>
              </li>
              <li>
                <span className="historySummaryLabel">Highest prize</span>
                <span className="historySummaryValue">{summary.highestPrize}</span>
              </li>
              <li>
                <span className="historySummaryLabel">Wins</span>
                <span className="historySummaryValue">{summary.wins}</span>
              </li>
            </ul>
          </section>

          <ul className="historyList">
            {records.map((record) => {
              const resultLabel = getHistoryResultLabel(record.status)

              return (
                <li key={record.id}>
                  <article className={`historyItem is-${record.status}`}>
                    <p className="historyItemKicker">{resultLabel}</p>
                    <h2 className="historyItemName">{record.playerName}</h2>
                    <p className="historyItemCategory">{getHistoryCategoryLabel(record)}</p>
                    <p className="historyItemPrize">{record.securedPrize}</p>
                    <p className="historyItemProgress">{getHistoryProgressLabel(record)}</p>
                    <p className="historyItemDate">
                      <time dateTime={record.completedAt}>{formatHistoryDate(record.completedAt)}</time>
                    </p>
                  </article>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <div className="historyActions">
        {records.length > 0 ? (
          confirmingClear ? (
            <div className="historyConfirm" role="group" aria-labelledby={CLEAR_CONFIRM_ID}>
              <p id={CLEAR_CONFIRM_ID}>Clear all saved games? This cannot be undone.</p>
              <button className="startBtn" type="button" onClick={handleConfirmClear}>
                Confirm clear
              </button>
              <button
                className="startBtn startBtnSecondary"
                type="button"
                onClick={() => setConfirmingClear(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="startBtn startBtnSecondary"
              type="button"
              onClick={() => setConfirmingClear(true)}
            >
              Clear history
            </button>
          )
        ) : null}
        <button className="startBtn" type="button" onClick={onBack}>
          Back to start
        </button>
      </div>
    </section>
  )
}

export default History
