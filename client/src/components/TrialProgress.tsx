import type { CurrentStep } from '../types'

const STEPS: Array<{ step: CurrentStep | null; label: string; sublabel: string }> = [
  { step: null, label: 'Case filed.', sublabel: 'Your submission is in the hands of the court.' },
  { step: 'normalizing', label: 'Case filed.', sublabel: 'The clerk is reviewing your submission.' },
  { step: 'prosecuting', label: 'The prosecution is sharpening its knives.', sublabel: 'The defense is also preparing. They are less enthusiastic.' },
  { step: 'judging', label: 'The judges are pretending to be impartial.', sublabel: 'The panel has reviewed all arguments and is deliberating.' },
  { step: 'finalizing', label: 'The verdict is being sealed.', sublabel: 'The final judge is composing the ruling. This is the dramatic part.' },
]

function getStepIndex(currentStep: CurrentStep): number {
  if (currentStep === null) return 0
  const found = STEPS.findIndex((s) => s.step === currentStep)
  return found >= 0 ? found : 0
}

interface Props {
  currentStep: CurrentStep
}

export function TrialProgress({ currentStep }: Props) {
  const activeIndex = getStepIndex(currentStep)
  const active = STEPS[activeIndex]

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-fade-in">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-2 border-[#d4a853]/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full border-2 border-[#d4a853]/40" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚖</div>
        </div>
        <h2 className="text-2xl font-bold text-[#f0ead6] mb-2" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
          {active?.label}
        </h2>
        <p className="text-[#9ca3af] text-sm max-w-sm mx-auto">{active?.sublabel}</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={[
              'w-2 h-2 rounded-full transition-all duration-500',
              i < activeIndex ? 'bg-[#d4a853]' :
              i === activeIndex ? 'bg-[#d4a853] animate-pulse-slow scale-125' :
              'bg-[#2a2a3e]'
            ].join(' ')} />
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px transition-all duration-500 ${i < activeIndex ? 'bg-[#d4a853]/60' : 'bg-[#2a2a3e]'}`} />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-[#4b5563] uppercase tracking-widest">
        Trials typically take 20-40 seconds
      </p>
    </div>
  )
}
