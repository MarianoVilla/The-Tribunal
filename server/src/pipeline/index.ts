import { db } from '../db/index.js'
import { trials, trialTurns, panelJudgments } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { getTribunal } from '../tribunals.js'
import { quickKeywordCheck, SAFETY_MESSAGE, CONTENT_POLICY_MESSAGE, SAFETY_RESOURCES } from './safety.js'
import {
  runNormalize,
  runProsecution,
  runDefense,
  runPanel,
  runFinalVerdict,
} from './steps.js'
import type { AppealContext } from './appeal-context.js'
import type { AppealGround } from '../types.js'

export type { AppealContext }

async function buildAppealContext(trial: typeof trials.$inferSelect): Promise<AppealContext | null> {
  if (!trial.appealOfId || !trial.appealGround) return null

  const [original] = await db.select().from(trials).where(eq(trials.id, trial.appealOfId)).limit(1)
  if (!original || original.status !== 'completed') return null

  return {
    originalCaseText: original.caseText,
    originalTribunalType: original.tribunalType,
    originalCharge: original.charge ?? '',
    originalVerdict: original.verdict ?? '',
    originalFinalReasoning: original.finalReasoning ?? '',
    originalSentence: original.sentence ?? '',
    newTribunalType: trial.tribunalType,
    appealGround: trial.appealGround as AppealGround,
    appealText: trial.appealText ?? '',
  }
}

const PIPELINE_VERSION = '1.0'

function now(): string {
  return new Date().toISOString()
}

async function setStep(trialId: string, step: string) {
  await db
    .update(trials)
    .set({ currentStep: step, status: 'processing' })
    .where(eq(trials.id, trialId))
}

async function saveTurn(
  trialId: string,
  phase: string,
  agentName: string,
  role: string,
  contentJson: unknown,
  rawText: string
) {
  await db.insert(trialTurns).values({
    trialId,
    phase,
    agentName,
    role,
    contentJson: JSON.stringify(contentJson),
    rawText,
    createdAt: now(),
  })
}

export async function runPipeline(trialId: string): Promise<void> {
  const rawResponses: string[] = []

  try {
    const [trial] = await db.select().from(trials).where(eq(trials.id, trialId)).limit(1)
    if (!trial) throw new Error(`Trial ${trialId} not found`)

    const tribunal = getTribunal(trial.tribunalType)
    if (!tribunal) throw new Error(`Unknown tribunal type: ${trial.tribunalType}`)

    const caseText = trial.caseText
    const appealContext = await buildAppealContext(trial)

    const keywordCheck = quickKeywordCheck(caseText)
    if (!keywordCheck.safe) {
      await db.update(trials).set({
        status: 'safety_blocked',
        safetyMessage: SAFETY_MESSAGE,
        safetyType: 'crisis',
        completedAt: now(),
      }).where(eq(trials.id, trialId))
      return
    }

    await setStep(trialId, 'normalizing')
    const normalizeResult = await runNormalize(caseText, tribunal, appealContext)
    rawResponses.push(normalizeResult.rawBody)

    if (!normalizeResult.isSafe) {
      await db.update(trials).set({
        status: 'safety_blocked',
        safetyMessage: CONTENT_POLICY_MESSAGE,
        safetyType: 'content_policy',
        modelUsed: normalizeResult.model,
        pipelineVersion: PIPELINE_VERSION,
        rawLlmResponses: JSON.stringify(rawResponses),
        completedAt: now(),
      }).where(eq(trials.id, trialId))
      return
    }

    await saveTurn(trialId, 'normalize', 'Clerk', 'Clerk', {
      caseSummary: normalizeResult.caseSummary,
      shortCase: normalizeResult.shortCase,
    }, normalizeResult.rawBody)

    await setStep(trialId, 'prosecuting')
    const [prosecutionResult, defenseResult] = await Promise.all([
      runProsecution(caseText, normalizeResult.caseSummary, tribunal, appealContext),
      runDefense(caseText, normalizeResult.caseSummary, tribunal, appealContext),
    ])

    rawResponses.push(prosecutionResult.rawBody)
    rawResponses.push(defenseResult.rawBody)

    await Promise.all([
      saveTurn(trialId, 'prosecute', 'Prosecutor', 'Prosecutor', {
        charge: prosecutionResult.charge,
        argument: prosecutionResult.argument,
        strongestPoint: prosecutionResult.strongestPoint,
      }, prosecutionResult.rawBody),
      saveTurn(trialId, 'defend', 'Defender', 'Defender', {
        argument: defenseResult.argument,
        mitigatingFactors: defenseResult.mitigatingFactors,
        strongestPoint: defenseResult.strongestPoint,
      }, defenseResult.rawBody),
    ])

    await setStep(trialId, 'judging')
    const panelResult = await runPanel(
      caseText,
      normalizeResult.caseSummary,
      prosecutionResult.argument,
      defenseResult.argument,
      tribunal,
      appealContext
    )
    rawResponses.push(panelResult.rawBody)

    await saveTurn(trialId, 'panel', 'Panel', 'Panel', panelResult.judgments, panelResult.rawBody)

    await db.insert(panelJudgments).values(
      panelResult.judgments.map((j) => ({
        trialId,
        agentName: j.agentName,
        role: j.role,
        judgment: j.judgment,
        leaning: j.leaning,
        keyPrinciple: j.keyPrinciple,
      }))
    )

    await setStep(trialId, 'finalizing')
    const finalResult = await runFinalVerdict(
      caseText,
      normalizeResult.caseSummary,
      normalizeResult.shortCase,
      prosecutionResult.charge,
      prosecutionResult.argument,
      defenseResult.argument,
      panelResult.judgments,
      tribunal,
      appealContext
    )
    rawResponses.push(finalResult.rawBody)

    await saveTurn(trialId, 'finalize', 'Final Judge', 'Final Judge', {
      verdict: finalResult.verdict,
      score: finalResult.score,
      finalReasoning: finalResult.finalReasoning,
      sentence: finalResult.sentence,
    }, finalResult.rawBody)

    await db.update(trials).set({
      status: 'completed',
      currentStep: null,
      caseSummary: normalizeResult.caseSummary,
      charge: prosecutionResult.charge,
      verdict: finalResult.verdict,
      score: finalResult.score,
      scoreLabel: tribunal.scoreLabel,
      finalReasoning: finalResult.finalReasoning,
      sentence: finalResult.sentence,
      shareCardJson: JSON.stringify(finalResult.shareCard),
      modelUsed: finalResult.model,
      pipelineVersion: PIPELINE_VERSION,
      rawLlmResponses: JSON.stringify(rawResponses),
      completedAt: now(),
    }).where(eq(trials.id, trialId))

  } catch (err) {
    console.error(`[Pipeline] Trial ${trialId} failed:`, err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown pipeline error'

    await db.update(trials).set({
      status: 'failed',
      currentStep: null,
      errorMessage,
      rawLlmResponses: rawResponses.length > 0 ? JSON.stringify(rawResponses) : null,
      completedAt: now(),
    }).where(eq(trials.id, trialId))
  }
}

export { SAFETY_RESOURCES }
