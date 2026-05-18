import { z } from 'zod'
import { callOpenRouterWithRetry } from './openrouter.js'
import {
  normalizePrompt,
  prosecutionPrompt,
  defensePrompt,
  panelPrompt,
  finalVerdictPrompt,
} from './prompts.js'
import type { TribunalType } from '../tribunals.js'
import type { AppealContext } from './appeal-context.js'

function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  const truncated = words.slice(0, maxWords).join(' ')
  const lastPeriod = truncated.lastIndexOf('.')
  if (lastPeriod > truncated.length * 0.6) return truncated.slice(0, lastPeriod + 1)
  return truncated + '...'
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned)
}

const NormalizeSchema = z.object({
  isSafe: z.boolean(),
  safetyReason: z.string().nullable(),
  caseSummary: z.string().min(1),
  shortCase: z.string().min(1),
})

const ProsecutionSchema = z.object({
  charge: z.string().min(1),
  argument: z.string().min(1),
  strongestPoint: z.string().min(1),
})

const DefenseSchema = z.object({
  argument: z.string().min(1),
  mitigatingFactors: z.array(z.string()),
  strongestPoint: z.string().min(1),
})

const PanelJudgmentSchema = z.object({
  agentName: z.string(),
  role: z.string(),
  judgment: z.string().min(1),
  leaning: z.enum(['guilty', 'not_guilty', 'complicated']),
  keyPrinciple: z.string().min(1),
})

const PanelSchema = z.object({
  judgments: z.array(PanelJudgmentSchema),
})

const ShareCardSchema = z.object({
  caseNumber: z.string(),
  headline: z.string(),
  shortCase: z.string(),
  verdict: z.string(),
  charge: z.string(),
  recognized: z.string(),
  rejected: z.string(),
  sentence: z.string(),
})

const FinalVerdictSchema = z.object({
  verdict: z.string().min(1),
  score: z.number().int().min(0).max(100),
  finalReasoning: z.string().min(1),
  sentence: z.string().min(1),
  recognized: z.string().min(1),
  rejected: z.string().min(1),
  shareCard: ShareCardSchema,
})

export interface NormalizeResult {
  isSafe: boolean
  safetyReason: string | null
  caseSummary: string
  shortCase: string
  rawBody: string
  model: string
}

export async function runNormalize(
  caseText: string,
  tribunal: TribunalType,
  appealContext?: AppealContext | null
): Promise<NormalizeResult> {
  const prompt = normalizePrompt(caseText, tribunal, appealContext ?? null)
  const { content, model, rawBody } = await callOpenRouterWithRetry([
    { role: 'user', content: prompt },
  ], { temperature: 0.3, maxTokens: 400 })

  const parsed = NormalizeSchema.parse(parseJson(content))

  return {
    isSafe: parsed.isSafe,
    safetyReason: parsed.safetyReason,
    caseSummary: truncateToWordLimit(parsed.caseSummary, 80),
    shortCase: truncateToWordLimit(parsed.shortCase, 20),
    rawBody,
    model,
  }
}

export interface ProsecutionResult {
  charge: string
  argument: string
  strongestPoint: string
  rawBody: string
  model: string
}

export async function runProsecution(
  caseText: string,
  caseSummary: string,
  tribunal: TribunalType,
  appealContext?: AppealContext | null
): Promise<ProsecutionResult> {
  const prompt = prosecutionPrompt(caseText, caseSummary, tribunal, appealContext ?? null)
  const { content, model, rawBody } = await callOpenRouterWithRetry([
    { role: 'user', content: prompt },
  ], { temperature: 0.9, maxTokens: 600 })

  const parsed = ProsecutionSchema.parse(parseJson(content))

  return {
    charge: truncateToWordLimit(parsed.charge, 30),
    argument: truncateToWordLimit(parsed.argument, 200),
    strongestPoint: truncateToWordLimit(parsed.strongestPoint, 40),
    rawBody,
    model,
  }
}

export interface DefenseResult {
  argument: string
  mitigatingFactors: string[]
  strongestPoint: string
  rawBody: string
  model: string
}

export async function runDefense(
  caseText: string,
  caseSummary: string,
  tribunal: TribunalType,
  appealContext?: AppealContext | null
): Promise<DefenseResult> {
  const prompt = defensePrompt(caseText, caseSummary, tribunal, appealContext ?? null)
  const { content, model, rawBody } = await callOpenRouterWithRetry([
    { role: 'user', content: prompt },
  ], { temperature: 0.9, maxTokens: 600 })

  const parsed = DefenseSchema.parse(parseJson(content))

  return {
    argument: truncateToWordLimit(parsed.argument, 200),
    mitigatingFactors: parsed.mitigatingFactors.slice(0, 5),
    strongestPoint: truncateToWordLimit(parsed.strongestPoint, 40),
    rawBody,
    model,
  }
}

export interface PanelResult {
  judgments: Array<{
    agentName: string
    role: string
    judgment: string
    leaning: 'guilty' | 'not_guilty' | 'complicated'
    keyPrinciple: string
  }>
  rawBody: string
  model: string
}

export async function runPanel(
  caseText: string,
  caseSummary: string,
  prosecutionArg: string,
  defenseArg: string,
  tribunal: TribunalType,
  appealContext?: AppealContext | null
): Promise<PanelResult> {
  const prompt = panelPrompt(caseText, caseSummary, prosecutionArg, defenseArg, tribunal, appealContext ?? null)
  const { content, model, rawBody } = await callOpenRouterWithRetry([
    { role: 'user', content: prompt },
  ], { temperature: 0.85, maxTokens: 1200 })

  const parsed = PanelSchema.parse(parseJson(content))

  return {
    judgments: parsed.judgments.map((j) => ({
      ...j,
      judgment: truncateToWordLimit(j.judgment, 80),
      keyPrinciple: truncateToWordLimit(j.keyPrinciple, 25),
    })),
    rawBody,
    model,
  }
}

export interface FinalVerdictResult {
  verdict: string
  score: number
  finalReasoning: string
  sentence: string
  recognized: string
  rejected: string
  shareCard: {
    caseNumber: string
    headline: string
    shortCase: string
    verdict: string
    charge: string
    recognized: string
    rejected: string
    sentence: string
  }
  rawBody: string
  model: string
}

export async function runFinalVerdict(
  caseText: string,
  caseSummary: string,
  shortCase: string,
  charge: string,
  prosecutionArg: string,
  defenseArg: string,
  panelJudgments: Array<{ agentName: string; judgment: string; leaning: string }>,
  tribunal: TribunalType,
  appealContext?: AppealContext | null
): Promise<FinalVerdictResult> {
  const prompt = finalVerdictPrompt(
    caseText,
    caseSummary,
    shortCase,
    charge,
    prosecutionArg,
    defenseArg,
    panelJudgments,
    tribunal,
    appealContext ?? null
  )

  const { content, model, rawBody } = await callOpenRouterWithRetry([
    { role: 'user', content: prompt },
  ], { temperature: 0.8, maxTokens: 900 })

  const parsed = FinalVerdictSchema.parse(parseJson(content))

  return {
    verdict: parsed.verdict,
    score: parsed.score,
    finalReasoning: truncateToWordLimit(parsed.finalReasoning, 200),
    sentence: truncateToWordLimit(parsed.sentence, 35),
    recognized: truncateToWordLimit(parsed.recognized, 20),
    rejected: truncateToWordLimit(parsed.rejected, 20),
    shareCard: {
      caseNumber: parsed.shareCard.caseNumber || String(Math.floor(Math.random() * 99999)).padStart(5, '0'),
      headline: 'THE TRIBUNAL HAS SPOKEN',
      shortCase: truncateToWordLimit(parsed.shareCard.shortCase, 20),
      verdict: parsed.verdict,
      charge: truncateToWordLimit(parsed.shareCard.charge, 30),
      recognized: truncateToWordLimit(parsed.shareCard.recognized, 20),
      rejected: truncateToWordLimit(parsed.shareCard.rejected, 20),
      sentence: truncateToWordLimit(parsed.shareCard.sentence, 35),
    },
    rawBody,
    model,
  }
}
