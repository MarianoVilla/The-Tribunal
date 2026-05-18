import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const trials = sqliteTable('trials', {
  id: text('id').primaryKey(),
  caseText: text('case_text').notNull(),
  tribunalType: text('tribunal_type').notNull(),
  status: text('status').notNull().default('pending'),
  currentStep: text('current_step'),
  caseSummary: text('case_summary'),
  charge: text('charge'),
  verdict: text('verdict'),
  score: integer('score'),
  scoreLabel: text('score_label'),
  finalReasoning: text('final_reasoning'),
  sentence: text('sentence'),
  shareCardJson: text('share_card_json'),
  safetyMessage: text('safety_message'),
  safetyType: text('safety_type'),
  appealOfId: text('appeal_of_id'),
  appealGround: text('appeal_ground'),
  appealText: text('appeal_text'),
  isPublic: integer('is_public').notNull().default(0),
  modelUsed: text('model_used'),
  pipelineVersion: text('pipeline_version').notNull().default('1.0'),
  rawLlmResponses: text('raw_llm_responses'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
})

export const trialTurns = sqliteTable('trial_turns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trialId: text('trial_id').notNull().references(() => trials.id),
  phase: text('phase').notNull(),
  agentName: text('agent_name').notNull(),
  role: text('role').notNull(),
  contentJson: text('content_json').notNull(),
  rawText: text('raw_text').notNull(),
  createdAt: text('created_at').notNull(),
})

export const panelJudgments = sqliteTable('panel_judgments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trialId: text('trial_id').notNull().references(() => trials.id),
  agentName: text('agent_name').notNull(),
  role: text('role').notNull(),
  judgment: text('judgment').notNull(),
  leaning: text('leaning').notNull(),
  keyPrinciple: text('key_principle').notNull(),
})

export type Trial = typeof trials.$inferSelect
export type NewTrial = typeof trials.$inferInsert
export type TrialTurn = typeof trialTurns.$inferSelect
export type PanelJudgment = typeof panelJudgments.$inferSelect
