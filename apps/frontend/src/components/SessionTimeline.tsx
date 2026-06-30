import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { SessionReport, Routine } from '../types'
import './SessionTimeline.css'

function SessionTimeline({ sessions }: { sessions: any }) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  
  const allSessions = [...(sessions.routines || []), ...(sessions.sessionReports || [])]
  const groupedByDate = groupByDate(allSessions)
  
  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }
  
  return (
    <div className="session-timeline">
      {Object.entries(groupedByDate).map(([date, sessions]) => (
        <div key={date} className="date-group">
          <div className="date-header">
            <h3>{date}</h3>
            <span className="session-count">{sessions.length} sessions</span>
          </div>
          <div className="sessions-list">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isExpanded={expandedSessions.has(session.id)}
                onToggle={() => toggleSession(session.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByDate(sessions: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  
  sessions.forEach(session => {
    const date = getSessionDate(session)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(session)
  })
  
  return groups
}

function getSessionDate(session: any): string {
  if ('generatedAt' in session) {
    return format(new Date(session.generatedAt), 'yyyy-MM-dd')
  } else if ('createdAt' in session) {
    return format(new Date(session.createdAt), 'yyyy-MM-dd')
  }
  return 'Unknown'
}

function SessionCard({ session, isExpanded, onToggle }: { 
  session: any, 
  isExpanded: boolean, 
  onToggle: () => void 
}) {
  const isRoutine = 'exercises' in session
  const isReport = 'content' in session
  
  const getCompletionColor = (completion: string) => {
    switch (completion) {
      case 'SOBRADO': return 'completion-sobrado'
      case 'AL_LIMITE': return 'completion-al-limite'
      case 'CON_DIFICULTAD': return 'completion-con-dificultad'
      case 'NO_PUDO_TERMINARLO_BIEN': return 'completion-no-pudo'
      default: return 'completion-default'
    }
  }
  
  return (
    <div className={`session-card ${isRoutine ? 'routine-card' : 'report-card'}`}>
      <div className="session-header" onClick={onToggle}>
        <div className="session-title">
          {isRoutine ? (
            <>
              <span className="routine-icon">💪</span>
              <span className="routine-name">{session.name}</span>
            </>
          ) : (
            <>
              <span className="report-icon">📝</span>
              <span className="report-text">Session Report</span>
            </>
          )}
        </div>
        <div className="session-meta">
          <span className="session-date">
            {isRoutine ? format(new Date(session.generatedAt), 'MMM dd, yyyy') : format(new Date(session.createdAt), 'MMM dd, yyyy')}
          </span>
          <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="session-content">
          {isRoutine && (
            <div className="routine-details">
              <h4>Exercises</h4>
              {session.exercises?.map((exercise: any) => (
                <div key={exercise.id} className="exercise-item">
                  <div className="exercise-header">
                    <span className="exercise-name">{exercise.name}</span>
                    <span className="exercise-meta">
                      {exercise.sets} sets × {exercise.reps} reps • {exercise.restSeconds}s rest
                    </span>
                  </div>
                  {exercise.exerciseLogs?.length > 0 && (
                    <div className="exercise-logs">
                      <h5>Completion Status</h5>
                      {exercise.exerciseLogs.map((log: any) => (
                        <div key={log.id} className="log-item">
                          <span className="log-date">{format(new Date(log.performedAt), 'MMM dd, HH:mm')}</span>
                          <span className={`completion-badge ${getCompletionColor(log.completion)}`}>                                {log.completion}
                          </span>
                          <div className="log-details">
                            {log.actualSets && <span>Sets: {log.actualSets}</span>}
                            {log.actualReps && <span>Reps: {log.actualReps}</span>}
                            {log.weightKg && <span>Weight: {log.weightKg}kg</span>}
                            {log.rpe && <span>RPE: {log.rpe}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isReport && (
            <div className="report-content">
              <h4>Session Notes</h4>
              <p className="report-text-content">{session.content}</p>
            </div>
          )}
          
          <div className="session-footer">
            <div className="student-info">
              <span>Student: {session.student?.firstName} {session.student?.lastName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionTimeline