import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppeal } from '../hooks/useAppeal'
import { APPEAL_GROUNDS, APPEAL_GROUND_LABELS } from '../types'
import type { TribunalType, AppealGround } from '../types'

interface Props {
  trialId: string
  currentTribunalType: string
  tribunals: TribunalType[]
}

const ICONS: Record<string, string> = {
  moral: '⚖',
  relationship: '💬',
  idea: '💡',
  opinion: '🔥',
  roast: '😤',
}

export function AppealSelector({ trialId, currentTribunalType, tribunals }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedTribunal, setSelectedTribunal] = useState<string | null>(null)
  const [selectedGround, setSelectedGround] = useState<AppealGround | null>(null)
  const [appealText, setAppealText] = useState('')
  const { appeal, loading, error } = useAppeal()
  const navigate = useNavigate()

  const available = tribunals.filter((t) => t.id !== currentTribunalType)

  const handleSubmit = async () => {
    if (!selectedTribunal || !selectedGround) return
    const result = await appeal({
      trialId,
      tribunalType: selectedTribunal,
      appealGround: selectedGround,
      appealText,
    })
    if (result) {
      navigate(`/trial/${result.id}`)
    }
  }

  const canSubmit = selectedTribunal && selectedGround && !loading

  if (!open) {
    return (
      <div className="text-center">
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-[#9ca3af] hover:text-[#d4a853] transition-colors border border-[#1e1e2e] rounded-lg px-5 py-2.5 hover:border-[#d4a853]/30 cursor-pointer"
        >
          ⚖ Appeal this verdict in another court
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up rounded-xl border border-[#1e1e2e] bg-[#14141f] p-5">
      <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-5 font-medium text-center">
        File an appeal
      </p>

      {error && (
        <p className="text-xs text-[#dc2626] mb-3 text-center">{error}</p>
      )}

      <div className="mb-5">
        <p className="text-xs text-[#9ca3af] mb-2 font-medium">Choose your court of appeal</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {available.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTribunal(t.id)}
              disabled={loading}
              className={`rounded-lg border p-3 text-left transition-all cursor-pointer disabled:opacity-50 ${
                selectedTribunal === t.id
                  ? 'border-[#d4a853]/60 bg-[#d4a853]/10'
                  : 'border-[#1e1e2e] hover:border-[#d4a853]/40 hover:bg-[#d4a853]/5'
              }`}
            >
              <div className="text-lg mb-1">{ICONS[t.id]}</div>
              <div className="text-xs font-bold text-[#f0ead6] mb-0.5">{t.name.replace(' Tribunal', '')}</div>
              <div className="text-[10px] text-[#6b7280]">{t.scoreLabel}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs text-[#9ca3af] mb-2 font-medium">Grounds for appeal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {APPEAL_GROUNDS.map((ground) => (
            <button
              key={ground}
              onClick={() => setSelectedGround(ground)}
              disabled={loading}
              className={`rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer disabled:opacity-50 ${
                selectedGround === ground
                  ? 'border-[#d4a853]/60 bg-[#d4a853]/10'
                  : 'border-[#1e1e2e] hover:border-[#d4a853]/40 hover:bg-[#d4a853]/5'
              }`}
            >
              <div className="text-xs text-[#f0ead6]">{APPEAL_GROUND_LABELS[ground]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs text-[#9ca3af] mb-2 font-medium">
          Explain your appeal <span className="text-[#4b5563]">(strongly encouraged)</span>
        </p>
        <textarea
          value={appealText}
          onChange={(e) => setAppealText(e.target.value)}
          placeholder="Why do you believe the original verdict was wrong? What did the court miss?"
          maxLength={1000}
          disabled={loading}
          rows={3}
          className="w-full rounded-lg border border-[#1e1e2e] bg-[#0c0c14] text-sm text-[#f0ead6] placeholder-[#4b5563] p-3 resize-none focus:outline-none focus:border-[#d4a853]/40 disabled:opacity-50"
        />
        <p className="text-[10px] text-[#4b5563] mt-1 text-right">{appealText.length}/1000</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-sm font-medium text-[#d4a853] border border-[#d4a853]/40 rounded-lg px-5 py-2 hover:bg-[#d4a853]/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Filing appeal...' : 'File appeal'}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
