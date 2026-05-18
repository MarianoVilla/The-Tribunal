import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTrial } from '../hooks/useTrial'
import { usePublish } from '../hooks/usePublish'
import { TrialProgress } from '../components/TrialProgress'
import { VerdictCard } from '../components/VerdictCard'
import { ArgumentsSection, PanelSection, RulingSection } from '../components/TrialTranscript'
import { ShareButtons } from '../components/ShareButtons'
import { AppealSelector } from '../components/AppealSelector'
import { SafetyBlockedView } from '../components/SafetyBlockedView'
import { ErrorState } from '../components/ErrorState'
import type { TrialResult, TribunalType } from '../types'

function getLeaningColors(verdict: string) {
  const v = verdict.toLowerCase()
  if (v.includes('not guilty') || v.includes('innocent') || v.includes('promising') || v.includes('defensible')) {
    return { bg: 'rgba(22,163,74,0.08)', text: '#16a34a', border: 'rgba(22,163,74,0.25)' }
  }
  if (v.includes('complicated') || v.includes('mostly') || v.includes('mitigating') || v.includes('needs') || v.includes('framed') || v.includes('shallow') || v.includes('somehow')) {
    return { bg: 'rgba(217,119,6,0.08)', text: '#d97706', border: 'rgba(217,119,6,0.25)' }
  }
  return { bg: 'rgba(220,38,38,0.08)', text: '#dc2626', border: 'rgba(220,38,38,0.25)' }
}

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

function VerdictHero({ trial }: { trial: TrialResult }) {
  const colors = getLeaningColors(trial.verdict)
  return (
    <div className="pt-10 pb-8 text-center animate-fade-in">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#6b7280] mb-3 font-medium">
        The Tribunal has spoken
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

function PublishButton({ trialId }: { trialId: string }) {
  const { publish, published, loading, error } = usePublish()

  if (published) {
    return (
      <span className="text-xs text-[#16a34a] flex items-center gap-1.5">
        <span>✓</span> Published to gallery
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => publish(trialId)}
        disabled={loading}
        className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors border border-[#1e1e2e] rounded-lg px-4 py-2 hover:border-[#2a2a3e] cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Publishing...' : '🌐 Publish to gallery'}
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
        <SafetyBlockedView safetyMessage={data.safetyMessage} resources={data.resources} />
      </div>
    )
  }

  const trial = data as TrialResult

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <div className="pt-6 mb-2">
        <Link to="/" className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
          ← New trial
        </Link>
        {trial.appealOfId && (
          <span className="ml-3 text-xs text-[#4b5563]">
            Appeal of{' '}
            <Link to={`/trial/${trial.appealOfId}`} className="text-[#6b7280] hover:text-[#9ca3af] underline">
              original case
            </Link>
          </span>
        )}
      </div>

      <VerdictHero trial={trial} />

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
          <PublishButton trialId={trial.id} />
        </div>
      </TrialSection>

      <Divider />
      <TrialSection>
        <RulingSection trial={trial} />
      </TrialSection>

      <Divider />
      <TrialSection>
        <PanelSection trial={trial} />
      </TrialSection>

      <Divider />
      <TrialSection>
        <ArgumentsSection trial={trial} />
      </TrialSection>

      <Divider />
      <TrialSection>
        {tribunals.length > 0 && (
          <AppealSelector
            trialId={trial.id}
            currentTribunalType={trial.tribunalType}
            tribunals={tribunals}
          />
        )}
      </TrialSection>
    </div>
  )
}
