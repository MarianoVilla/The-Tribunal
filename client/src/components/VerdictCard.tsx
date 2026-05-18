import { forwardRef } from 'react'
import type { ShareCard } from '../types'

export type VerdictOrientation = 'vertical' | 'horizontal'

function getLeaningColors(verdict: string) {
  const v = verdict.toLowerCase()
  if (
    v.includes('not guilty') ||
    v.includes('innocent') ||
    v.includes('promising') ||
    v.includes('defensible')
  ) {
    return { bg: 'rgba(22,163,74,0.1)', text: '#16a34a', border: 'rgba(22,163,74,0.3)', accent: '#16a34a' }
  }
  if (
    v.includes('complicated') ||
    v.includes('mostly') ||
    v.includes('mitigating') ||
    v.includes('needs') ||
    v.includes('framed') ||
    v.includes('shallow') ||
    v.includes('somehow')
  ) {
    return { bg: 'rgba(217,119,6,0.1)', text: '#d97706', border: 'rgba(217,119,6,0.3)', accent: '#d97706' }
  }
  return { bg: 'rgba(220,38,38,0.1)', text: '#dc2626', border: 'rgba(220,38,38,0.3)', accent: '#dc2626' }
}

function ScoreBadge({ score, label, verdict }: { score: number; label: string; verdict: string }) {
  const colors = getLeaningColors(verdict)
  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl border-2"
        style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
      >
        {score}
      </div>
      <p
        className="text-[9px] uppercase tracking-widest mt-1.5 text-center leading-tight"
        style={{ color: colors.text, maxWidth: 70 }}
      >
        {label}
      </p>
    </div>
  )
}

interface Props {
  shareCard: ShareCard
  score: number
  scoreLabel: string
  tribunalType: string
  caseText?: string
  orientation?: VerdictOrientation
  forExport?: boolean
}

export const VerdictCard = forwardRef<HTMLDivElement, Props>(
  ({ shareCard, score, scoreLabel, tribunalType, caseText, orientation = 'vertical', forExport = false }, ref) => {
    const colors = getLeaningColors(shareCard.verdict)
    const isHorizontal = orientation === 'horizontal'

    const cardStyle: React.CSSProperties = {
      background: 'linear-gradient(160deg, #1a1020 0%, #14141f 40%, #0f1a14 100%)',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 0 60px -20px ${colors.accent}40, 0 20px 60px -20px rgba(0,0,0,0.6)`,
      fontFamily: 'Georgia, Times New Roman, serif',
    }

    const Header = () => (
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] mb-0.5">
            Case #{shareCard.caseNumber}
          </p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#9ca3af] capitalize">
            {tribunalType} Tribunal
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl mb-0.5">⚖</div>
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#6b7280]">The Tribunal</p>
        </div>
      </div>
    )

    const VerdictBlock = () => (
      <div className="border-t border-b py-3 mb-4" style={{ borderColor: colors.border + '60' }}>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280] mb-1">{shareCard.headline}</p>
        <p className="font-black leading-tight" style={{ color: colors.text, fontSize: isHorizontal ? 22 : 20 }}>
          {shareCard.verdict}
        </p>
      </div>
    )

    const displayCase = caseText ?? shareCard.shortCase

    const CaseRow = () => (
      <div className="flex items-start gap-4 mb-4">
        <ScoreBadge score={score} label={scoreLabel} verdict={shareCard.verdict} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1">The case</p>
          <p className="text-sm text-[#d4cbb8] italic leading-relaxed line-clamp-4">
            "{displayCase}"
          </p>
        </div>
      </div>
    )

    const DetailBlocks = () => (
      <div className="space-y-2.5">
        <div className="rounded-lg p-3" style={{ background: 'rgba(220,38,38,0.06)', borderLeft: '2px solid rgba(220,38,38,0.4)' }}>
          <p className="text-[9px] uppercase tracking-widest text-[#6b7280] mb-1">Charge</p>
          <p className="text-sm text-[#f0ead6] font-medium">{shareCard.charge}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(22,163,74,0.06)', borderLeft: '2px solid rgba(22,163,74,0.4)' }}>
          <p className="text-[9px] uppercase tracking-widest text-[#6b7280] mb-1">The court recognizes</p>
          <p className="text-sm text-[#d4cbb8]">{shareCard.recognized}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(220,38,38,0.06)', borderLeft: '2px solid rgba(220,38,38,0.4)' }}>
          <p className="text-[9px] uppercase tracking-widest text-[#6b7280] mb-1">The court rejects</p>
          <p className="text-sm text-[#d4cbb8]">{shareCard.rejected}</p>
        </div>
      </div>
    )

    const SentenceFooter = () => (
      <div
        className="px-6 py-5 text-center border-t"
        style={{ background: colors.bg, borderColor: colors.border + '80' }}
      >
        <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: colors.text }}>Sentence</p>
        <p className="text-base font-bold text-[#f0ead6] leading-snug">{shareCard.sentence}</p>
      </div>
    )

    if (isHorizontal) {
      return (
        <div
          ref={ref}
          className={`rounded-2xl overflow-hidden w-full ${forExport ? 'w-[900px]' : ''}`}
          style={cardStyle}
        >
          <div className="p-6 sm:p-7">
            <Header />
            <div className="flex gap-6 items-stretch">
              <div className="flex-1 min-w-0 flex flex-col">
                <VerdictBlock />
                <CaseRow />
              </div>
              <div className="w-px shrink-0" style={{ background: colors.border + '40' }} />
              <div className="flex-1 min-w-0">
                <DetailBlocks />
              </div>
            </div>
          </div>
          <SentenceFooter />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={`rounded-2xl overflow-hidden ${forExport ? 'w-[520px]' : 'w-full max-w-lg mx-auto'}`}
        style={cardStyle}
      >
        <div className="p-6 sm:p-8">
          <Header />
          <VerdictBlock />
          <CaseRow />
          <DetailBlocks />
        </div>
        <SentenceFooter />
      </div>
    )
  }
)

VerdictCard.displayName = 'VerdictCard'
