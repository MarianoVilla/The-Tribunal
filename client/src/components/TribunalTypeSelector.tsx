import { useState } from 'react'
import type { TribunalType } from '../types'

interface TooltipProps {
  tribunal: TribunalType
}

function InfoTooltip({ tribunal }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <span
        role="button"
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full border border-[#4b5563] text-[#6b7280] hover:border-[#9ca3af] hover:text-[#9ca3af] transition-colors flex items-center justify-center text-[9px] font-bold leading-none cursor-default select-none"
        aria-label={`More info about ${tribunal.name}`}
      >
        i
      </span>
      {visible && (
        <div
          className="absolute z-50 right-0 top-6 w-56 rounded-xl border border-[#2a2a3e] bg-[#0f0f1a] p-3 shadow-2xl text-left"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
        >
          <p className="text-xs font-bold text-[#f0ead6] mb-1">{tribunal.name}</p>
          <p className="text-[11px] text-[#9ca3af] leading-snug mb-2">{tribunal.description}</p>
          <div className="border-t border-[#1e1e2e] pt-2 space-y-1.5">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#4b5563] mb-0.5">Tone</p>
              <p className="text-[11px] text-[#9ca3af] italic">{tribunal.tone}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#4b5563] mb-0.5">Score</p>
              <p className="text-[11px] text-[#9ca3af]">{tribunal.scoreLabel}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#4b5563] mb-0.5">Panel</p>
              <p className="text-[11px] text-[#9ca3af]">
                {tribunal.panelAgents.map((a) => a.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  tribunals: TribunalType[]
  selected: string
  onSelect: (id: string) => void
}

export function TribunalTypeSelector({ tribunals, selected, onSelect }: Props) {
  return (
    <div className="w-full">
      <p className="text-xs uppercase tracking-widest text-[#9ca3af] mb-3 font-medium">Choose your court</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {tribunals.map((t) => {
          const isSelected = t.id === selected
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={[
                'relative rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer',
                isSelected
                  ? 'border-[#d4a853] bg-[#d4a853]/10 shadow-[0_0_20px_-8px_rgba(212,168,83,0.4)]'
                  : 'border-[#1e1e2e] bg-[#14141f] hover:border-[#2a2a3e] hover:bg-[#1a1a2e]',
              ].join(' ')}
            >
              <div className="absolute top-2 right-2">
                <InfoTooltip tribunal={t} />
              </div>
              <div className="text-xl mb-1.5">{t.icon}</div>
              <div className={`text-xs font-bold mb-0.5 pr-4 ${isSelected ? 'text-[#d4a853]' : 'text-[#f0ead6]'}`}>
                {t.name.replace(' Tribunal', '')}
              </div>
              <div className="text-[10px] text-[#6b7280] leading-tight line-clamp-2 pr-4">
                {t.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
