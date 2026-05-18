import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import trialsRouter from './routes/trials.js'
import galleryRouter from './routes/gallery.js'
import tribunalsRouter from './routes/tribunals.js'
import { libsqlClient } from './db/index.js'

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS trials (
    id TEXT PRIMARY KEY,
    case_text TEXT NOT NULL,
    tribunal_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    current_step TEXT,
    case_summary TEXT,
    charge TEXT,
    verdict TEXT,
    score INTEGER,
    score_label TEXT,
    final_reasoning TEXT,
    sentence TEXT,
    share_card_json TEXT,
    safety_message TEXT,
    safety_type TEXT,
    appeal_of_id TEXT REFERENCES trials(id),
    appeal_ground TEXT,
    appeal_text TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    model_used TEXT,
    pipeline_version TEXT NOT NULL DEFAULT '1.0',
    raw_llm_responses TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
  );
  CREATE TABLE IF NOT EXISTS trial_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trial_id TEXT NOT NULL REFERENCES trials(id),
    phase TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    role TEXT NOT NULL,
    content_json TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS panel_judgments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trial_id TEXT NOT NULL REFERENCES trials(id),
    agent_name TEXT NOT NULL,
    role TEXT NOT NULL,
    judgment TEXT NOT NULL,
    leaning TEXT NOT NULL,
    key_principle TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);
  CREATE INDEX IF NOT EXISTS idx_trials_created_at ON trials(created_at);
  CREATE INDEX IF NOT EXISTS idx_trial_turns_trial_id ON trial_turns(trial_id);
  CREATE INDEX IF NOT EXISTS idx_panel_judgments_trial_id ON panel_judgments(trial_id);
`

async function bootstrap() {
  await libsqlClient.executeMultiple(MIGRATION_SQL)
  console.log('[DB] Migration complete.')

  const app = express()
  const PORT = process.env.PORT ?? 3001

  app.use(cors({
    origin: process.env.APP_BASE_URL || 'http://localhost:5173',
    credentials: true,
  }))

  app.use(express.json({ limit: '10kb' }))

  app.use('/api/trials', trialsRouter)
  app.use('/api/gallery', galleryRouter)
  app.use('/api/tribunals', tribunalsRouter)

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.listen(PORT, () => {
    console.log(`[Server] The Tribunal is in session on http://localhost:${PORT}`)
  })
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err)
  process.exit(1)
})
