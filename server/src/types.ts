export type TrialStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'safety_blocked'

export const APPEAL_GROUNDS = [
  'new_context',
  'wrong_tribunal',
  'mitigating_context_ignored',
  'sentence_too_harsh',
  'reasoning_flawed',
  'verdict_too_soft',
] as const

export type AppealGround = typeof APPEAL_GROUNDS[number]

export type CurrentStep =
  | 'normalizing'
  | 'prosecuting'
  | 'judging'
  | 'finalizing'

export interface ShareCard {
  caseNumber: string
  headline: string
  shortCase: string
  verdict: string
  charge: string
  recognized: string
  rejected: string
  sentence: string
}

export interface PanelJudgmentResult {
  agentName: string
  role: string
  judgment: string
  leaning: 'guilty' | 'not_guilty' | 'complicated'
  keyPrinciple: string
}

export interface TrialResult {
  id: string
  caseText: string
  caseSummary: string
  tribunalType: string
  createdAt: string
  completedAt: string | null
  status: 'completed'
  charge: string
  verdict: string
  score: number
  scoreLabel: string
  prosecution: {
    title: string
    argument: string
  }
  defense: {
    title: string
    argument: string
  }
  panelJudgments: PanelJudgmentResult[]
  finalReasoning: string
  sentence: string
  shareCard: ShareCard
  appealOfId: string | null
  appealGround: AppealGround | null
  appealText: string | null
  isPublic: boolean
}

export interface TrialPendingResponse {
  id: string
  status: 'pending' | 'processing'
  currentStep: CurrentStep | null
}

export interface TrialFailedResponse {
  id: string
  status: 'failed'
  error: string
}

export interface SafetyResource {
  label: string
  value: string
}

export interface TrialSafetyBlockedResponse {
  id: string
  status: 'safety_blocked'
  safetyMessage: string
  safetyType: 'crisis' | 'content_policy'
  resources: SafetyResource[]
}

export type TrialResponse =
  | TrialResult
  | TrialPendingResponse
  | TrialFailedResponse
  | TrialSafetyBlockedResponse
