import react from 'react'
import { useState } from 'react'
import { ExerciseCompletion } from '../../schemas/exercise-log.zod'
import { CompleteWorkoutSessionPage } from '../../pages/WorkoutSession'

export function ExerciseCard({ exercise, routineId, onCompletionUpdate }) {
  const [isLoading, setIsLoading] = useState(false)
  const [completion, setCompletion] = useState(exercise.currentCompletion || '')
  
  const handleCompletionChange = async (newCompletion) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/exercise-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          routineId,
          studentId: 'current-student', // TODO: get from auth context
          completion: newCompletion
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        onCompletionUpdate?.(exercise.id, result)
      } else {
        console.error('Failed to update exercise completion')
      }
    } catch (error) {
      console.error('Error updating exercise completion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="exercise-card">
      <h3>{exercise.name}</h3>
      <p>Sets: {exercise.sets}, Reps: {exercise.reps}, Rest: {exercise.restSeconds}s</p>
      
      <div className="completion-selector">
        <label htmlFor={`completion-${exercise.id}`}>Completion Status:</label>
        <select
          id={`completion-${exercise.id}`}
          value={completion}
          onChange={(e) => handleCompletionChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select status...</option>
          {Object.values(ExerciseCompletion).map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      
      {isLoading && <div className="loading">Saving...</div>}
    </div>
  )
}
