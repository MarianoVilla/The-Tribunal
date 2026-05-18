export type TribunalId = 'moral' | 'relationship' | 'idea' | 'opinion' | 'roast'

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

export const APPEAL_GROUND_LABELS: Record<AppealGround, string> = {
  new_context: 'New context or evidence was missing',
  wrong_tribunal: 'Judged by the wrong tribunal',
  mitigating_context_ignored: 'Mitigating circumstances ignored',
  sentence_too_harsh: 'Sentence was too harsh',
  reasoning_flawed: 'Reasoning was flawed',
  verdict_too_soft: 'Verdict was too lenient',
}

export type CurrentStep = 'normalizing' | 'prosecuting' | 'judging' | 'finalizing' | null

export interface TribunalType {
  id: TribunalId
  name: string
  description: string
  tone: string
  scoreLabel: string
  possibleVerdicts: string[]
  panelAgents: Array<{ name: string; role: string }>
}

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

export interface PanelJudgment {
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
  panelJudgments: PanelJudgment[]
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
  currentStep: CurrentStep
}

export interface TrialFailedResponse {
  id: string
  status: 'failed'
  error: string
}

export interface TrialSafetyBlockedResponse {
  id: string
  status: 'safety_blocked'
  safetyMessage: string
  safetyType: 'crisis' | 'content_policy'
  resources: Array<{ label: string; value: string }>
}

export type TrialResponse =
  | TrialResult
  | TrialPendingResponse
  | TrialFailedResponse
  | TrialSafetyBlockedResponse
