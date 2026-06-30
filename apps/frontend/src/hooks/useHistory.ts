// useHistory.ts - Custom hook for fetching and managing student history
import { useState, useCallback } from 'react'
import type { HistoryData } from '../types'

export function useHistory() {
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async (studentId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/students/${studentId}/history`)
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`)
      }
      
      const data = await response.json()
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setHistory(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearHistory = useCallback(() => {
    setHistory(null)
    setError(null)
  }, [])

  return {
    history,
    isLoading,
    error,
    fetchHistory,
    clearHistory,
    refetch: fetchHistory
  }
}

export default useHistory