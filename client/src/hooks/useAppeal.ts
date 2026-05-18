import { useState } from 'react'
import type { AppealGround } from '../types'

interface AppealParams {
  trialId: string
  tribunalType: string
  appealGround: AppealGround
  appealText: string
}

export function useAppeal() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const appeal = async ({ trialId, tribunalType, appealGround, appealText }: AppealParams): Promise<{ id: string } | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/trials/${trialId}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tribunalType, appealGround, appealText }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to file appeal')
        return null
      }
      return data as { id: string }
    } catch {
      setError('Network error. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { appeal, loading, error, clearError: () => setError(null) }
}
