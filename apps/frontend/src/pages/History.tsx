import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import SessionTimeline from '../components/SessionTimeline'
import { useHistory } from '../hooks/useHistory'
import './History.css'

export function History() {
  const { studentId } = useParams<{ studentId: string }>()
  const { history, isLoading, error, fetchHistory } = useHistory()

  useEffect(() => {
    if (studentId) {
      fetchHistory(studentId)
    }
  }, [studentId, fetchHistory])

  if (isLoading) {
    return (
      <div className="history-page">
        <div className="loading">Loading history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  if (!history) {
    return (
      <div className="history-page">
        <div className="no-history">No history available</div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <header className="history-header">
        <h1>Student History</h1>
        <div className="student-info">
          <span>{history.student?.firstName} {history.student?.lastName}</span>
        </div>
      </header>

      <main className="history-content">
        <SessionTimeline sessions={history} />
      </main>
    </div>
  )
}

export default History
