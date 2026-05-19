import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTrial } from '../hooks/useTrial'
import { usePublish } from '../hooks/usePublish'
import { TrialProgress } from '../components/TrialProgress'
import { VerdictCard } from '../components/VerdictCard'
import { CaseSection, ArgumentsSection, PanelSection, RulingSection } from '../components/TrialTranscript'
import { ShareButtons } from '../components/ShareButtons'
import { AppealSelector } from '../components/AppealSelector'
import { SafetyBlockedView } from '../components/SafetyBlockedView'
import { ErrorState } from '../components/ErrorState'
import type { TrialResult, TribunalType, AppealGround } from '../types'
import { APPEAL_GROUND_LABELS } from '../types'
import { getScoreSeverityColors } from '../utils/scoreSeverity'

function Divider() {
  return <div className="border-t border-[#1e1e2e]" />
}

function TrialSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-10 animate-fade-in-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
      {children}
    </div>
  )
}

function AppealBanner({ trial }: { trial: TrialResult }) {
  if (!trial.appealOfId || !trial.appealGround) return null
  return (
    <div className="mb-2 rounded-lg border border-[#d4a853]/20 bg-[#d4a853]/5 px-4 py-3 text-center animate-fade-in">
      <p className="text-[10px] uppercase tracking-widest text-[#d4a853] font-medium mb-1">Appellate Hearing</p>
      <p className="text-xs text-[#9ca3af]">
        Appeal of{' '}
        <Link to={`/trial/${trial.appealOfId}`} className="text-[#d4a853] hover:underline">
          original verdict
        </Link>
        {' '}on grounds: <span className="text-[#f0ead6]">{APPEAL_GROUND_LABELS[trial.appealGround as AppealGround]}</span>
      </p>
      {trial.appealText && (
        <p className="text-xs text-[#6b7280] mt-1.5 italic max-w-lg mx-auto">"{trial.appealText}"</p>
      )}
    </div>
  )
}

function VerdictHero({ trial }: { trial: TrialResult }) {
  const colors = getScoreSeverityColors(trial.score)
  const isAppeal = !!trial.appealOfId
  return (
    <div className="pt-10 pb-8 text-center animate-fade-in">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b7280] mb-3 font-medium">
        {isAppeal ? 'The Appellate Tribunal has spoken' : 'The Tribunal has spoken'}
      </p>
      <div
        className="inline-block rounded-2xl px-6 py-4 mb-4"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
          style={{ fontFamily: 'Georgia, Times New Roman, serif', color: colors.text }}
        >
          {trial.verdict}
        </h1>
      </div>
      <div className="flex items-center justify-center gap-3 text-sm text-[#9ca3af]">
        <span className="capitalize">{trial.tribunalType} Tribunal</span>
        <span className="text-[#2a2a3e]">·</span>
        <span>
          {trial.scoreLabel}:{' '}
          <span className="font-bold" style={{ color: colors.text }}>
            {trial.score}/100
          </span>
        </span>
      </div>
    </div>
  )
}

function PublishButton({ trialId, isPublic }: { trialId: string; isPublic: boolean }) {
  const { publish, published, loading, error } = usePublish(isPublic)
  const [confirming, setConfirming] = useState(false)

  if (published) {
    return (
      <span className="text-xs text-[#16a34a] flex items-center gap-1.5">
        <span>✓</span> Published to Community Cases
      </span>
    )
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-[#9ca3af] text-center max-w-[220px]">
          This will make your case publicly visible in Community Cases.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { publish(trialId); setConfirming(false) }}
            disabled={loading}
            className="text-xs text-[#16a34a] hover:text-[#22c55e] transition-colors border border-[rgba(22,163,74,0.3)] rounded-lg px-3 py-1.5 hover:border-[rgba(22,163,74,0.5)] cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors border border-[#1e1e2e] rounded-lg px-3 py-1.5 hover:border-[#2a2a3e] cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-[10px] text-[#dc2626]">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => setConfirming(true)}
        disabled={loading}
        className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors border border-[#1e1e2e] rounded-lg px-4 py-2 hover:border-[#2a2a3e] cursor-pointer disabled:opacity-50"
      >
        🌐 Publish to Community Cases
      </button>
      {error && <p className="text-[10px] text-[#dc2626]">{error}</p>}
    </div>
  )
}

export function TrialPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error } = useTrial(id)
  const [tribunals, setTribunals] = useState<TribunalType[]>([])

  useEffect(() => {
    fetch('/api/tribunals')
      .then((r) => r.json())
      .then(setTribunals)
      .catch(console.error)
  }, [])

  if (loading && !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <TrialProgress currentStep={null} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <ErrorState message={error} />
      </div>
    )
  }

  if (!data) return null

  if (data.status === 'pending' || data.status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto">
        <TrialProgress currentStep={data.currentStep} />
      </div>
    )
  }

  if (data.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <ErrorState message={data.error} />
      </div>
    )
  }

  if (data.status === 'safety_blocked') {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <SafetyBlockedView
          safetyMessage={data.safetyMessage}
          safetyType={data.safetyType}
          resources={data.resources}
        />
      </div>
    )
  }

  const trial = data as TrialResult

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <div className="pt-6 mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link to="/" className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
          ← New trial
        </Link>
        <span className="text-[#2a2a3e]">·</span>
        <Link to="/gallery" className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
          Community Cases
        </Link>
        {trial.appealOfId && (
          <>
            <span className="text-[#2a2a3e]">·</span>
            <span className="text-xs text-[#d4a853]">Appeal</span>
          </>
        )}
      </div>

      <AppealBanner trial={trial} />
      <VerdictHero trial={trial} />

      <Divider />
      <TrialSection>
        <CaseSection trial={trial} />
      </TrialSection>

      <Divider />
      <TrialSection>
        <VerdictCard
          shareCard={trial.shareCard}
          score={trial.score}
          scoreLabel={trial.scoreLabel}
          tribunalType={trial.tribunalType}
          caseText={trial.caseText}
          orientation="horizontal"
        />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ShareButtons verdict={trial} />
          {!trial.id.startsWith('sample_') && (
            <PublishButton trialId={trial.id} isPublic={trial.isPublic} />
          )}
        </div>
      </TrialSection>

      {trial.finalReasoning && (
        <>
          <Divider />
          <TrialSection>
            <RulingSection trial={trial} />
          </TrialSection>
        </>
      )}

      {trial.panelJudgments.length > 0 && (
        <>
          <Divider />
          <TrialSection>
            <PanelSection trial={trial} />
          </TrialSection>
        </>
      )}

      {(trial.prosecution.argument || trial.defense.argument) && (
        <>
          <Divider />
          <TrialSection>
            <ArgumentsSection trial={trial} />
          </TrialSection>
        </>
      )}

      {!trial.id.startsWith('sample_') && (
        <>
          <Divider />
          <TrialSection>
            {tribunals.length > 0 && (
              <AppealSelector
                trialId={trial.id}
                tribunals={tribunals}
              />
            )}
          </TrialSection>
        </>
      )}
    </div>
  )
}
