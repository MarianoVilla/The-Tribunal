import type { AppealGround } from '../types.js'

export interface AppealContext {
  originalCaseText: string
  originalTribunalType: string
  originalCharge: string
  originalVerdict: string
  originalFinalReasoning: string
  originalSentence: string
  newTribunalType: string
  appealGround: AppealGround
  appealText: string
}

const APPEAL_GROUND_LABELS: Record<AppealGround, string> = {
  new_context: 'New context or evidence was missing from the original trial',
  wrong_tribunal: 'The case was judged by the wrong kind of tribunal',
  mitigating_context_ignored: 'The original court ignored important mitigating circumstances',
  sentence_too_harsh: 'The verdict may be fair, but the sentence was excessive',
  reasoning_flawed: "The original court's reasoning was inconsistent, unfair, or missed the point",
  verdict_too_soft: 'The original court was too lenient',
}

export function formatAppealBlock(ctx: AppealContext): string {
  const parts = [
    `\n--- APPEAL CONTEXT ---`,
    `This is an APPELLATE HEARING. The case was previously tried and a verdict was rendered. A new court is now reviewing the original ruling on appeal.`,
    ``,
    `Original tribunal: ${ctx.originalTribunalType} Tribunal`,
    `Original charge: ${ctx.originalCharge}`,
    `Original verdict: ${ctx.originalVerdict}`,
    `Original reasoning: """${ctx.originalFinalReasoning}"""`,
    `Original sentence: ${ctx.originalSentence}`,
    ``,
    `Appeal ground: ${APPEAL_GROUND_LABELS[ctx.appealGround]}`,
  ]

  if (ctx.appealText) {
    parts.push(`Appellant's explanation: """${ctx.appealText}"""`)
  }

  parts.push(`New appellate tribunal: ${ctx.newTribunalType} Tribunal`)
  parts.push(`--- END APPEAL CONTEXT ---\n`)

  return parts.join('\n')
}
