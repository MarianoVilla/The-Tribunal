# The Tribunal

![The Tribunal](./Banner.png)

Put yourself on trial. Submit a dilemma, confession, opinion, or idea. A panel of AI judges will prosecute it, defend it, and deliver a verdict.

## What it is

The Tribunal is a theatrical AI web app that runs a structured multi-step trial on any user submission. It produces a shareable verdict card with a charge, prosecution argument, defense argument, panel judgments, final verdict, score, and sentence.

## Features

- Five tribunal types: Moral, Relationship, Idea, Opinion, Roast
- 4-call LLM pipeline (normalize, parallel prosecution/defense, panel, final verdict)
- Verdict card with charge, recognized/rejected blocks, and a full-width sentence footer; horizontal/vertical image download
- Public gallery of verdicts
- Appeals: re-try a case in a different tribunal
- Two-tier safety filter (keyword pre-check + LLM review) with context-appropriate blocked-trial UI
- Real-time trial progress via polling

## Tech stack

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS 4
- Backend: Node.js 22 + Express 5 + TypeScript
- Database: SQLite via `@libsql/client` + Drizzle ORM
- LLM: OpenRouter API (configurable model)

## Requirements

- Node 22+ (see `.nvmrc`)
- An OpenRouter API key: https://openrouter.ai

## Setup

1. Copy the env file and fill in your API key:

```bash
cp .env.example server/.env
```

`server/.env` fields:

```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
APP_BASE_URL=http://localhost:5173
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=The Tribunal
```

2. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

## Running

Start the backend (port 3001) — migrations run automatically on startup:

```bash
cd server && npm run dev
```

Start the frontend (port 5173):

```bash
cd client && npm run dev
```

Open http://localhost:5173

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `OPENROUTER_MODEL` | No | Model to use (default: `openai/gpt-4o-mini`) |
| `APP_BASE_URL` | No | Base URL for CORS (default: `http://localhost:5173`) |
| `OPENROUTER_SITE_URL` | No | Sent to OpenRouter as site URL |
| `OPENROUTER_APP_NAME` | No | App name sent to OpenRouter |

## Architecture

```
client/         React + Vite + Tailwind
  src/
    components/ Reusable UI components (VerdictCard, ShareButtons, ...)
    hooks/      useCreateTrial, useTrial, useAppeal, usePublish
    pages/      HomePage, TrialPage, GalleryPage
    types/      Shared TypeScript types

server/         Express + TypeScript + Drizzle
  src/
    db/         Drizzle schema and libsql connection
    pipeline/   LLM orchestration (4 calls per trial)
      prompts.ts  Prompt templates per pipeline step
      safety.ts   Keyword pre-check and blocked-trial copy
    routes/     REST API endpoints
    tribunals.ts Tribunal type definitions
    types.ts    Shared response types
  data/         tribunal.db (auto-created on first run, gitignored)
```

### LLM pipeline (4 rounds per trial)

1. **Normalize** — Clerk summarizes the case and flags unsafe content (`isSafe`). Temperature 0.3.
2. **Prosecution + defense** — Run in parallel. Each tribunal has its own tone and panel judges defined in `tribunals.ts`. Temperature 0.9.
3. **Panel** — Four tribunal-specific judges each return a judgment, leaning, and key principle. Temperature 0.85.
4. **Final verdict** — Judge picks from `possibleVerdicts`, assigns a score, and fills the share card (charge, recognized, rejected, sentence). Temperature 0.8.

Prompt text for each step lives in `server/src/pipeline/prompts.ts`. All calls use OpenRouter with `response_format: { type: 'json_object' }` and Zod validation in `steps.ts`.

Before step 1, a regex keyword check (`quickKeywordCheck` in `safety.ts`) catches high-risk crisis language without calling the LLM.

### Trial statuses

| Status | Meaning |
|--------|---------|
| `pending` | Just created, pipeline not started |
| `processing` | Pipeline is running |
| `completed` | Result ready |
| `failed` | Pipeline error |
| `safety_blocked` | Submission blocked; see [Safety](#safety) |

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/trials` | Create trial, returns `{ id, status: "pending" }` immediately |
| `GET` | `/api/trials/:id` | Poll for status and full result |
| `POST` | `/api/trials/:id/appeal` | Re-try case in a different tribunal |
| `POST` | `/api/trials/:id/publish` | Make verdict public in gallery |
| `GET` | `/api/gallery` | Public verdicts (filter: recent, guilty, innocent, divisive) |
| `GET` | `/api/tribunals` | Tribunal type definitions |

## Tribunal types

- **Moral Tribunal** — ethical choices judged through philosophical frameworks
- **Relationship Tribunal** — interpersonal behavior and communication
- **Idea Tribunal** — startup and creative ideas
- **Opinion Tribunal** — hot takes and arguments
- **Roast Tribunal** — comedic, brutal, still insightful

## Safety

Blocked trials return `status: "safety_blocked"` with a `safetyType`, `safetyMessage`, and optionally `resources`. No verdict is generated.

| `safetyType` | When | UI |
|--------------|------|-----|
| `crisis` | Keyword pre-check matches self-harm, suicide, threats, or child exploitation patterns | "We see you." + crisis hotline resources |
| `content_policy` | Normalize step sets `isSafe: false` (e.g. hate speech, violence against groups, extremist content) | "Case dismissed." + policy message, no resources |

**Crisis path** — Runs before any LLM call. Uses regex patterns in `server/src/pipeline/safety.ts`. Stores `SAFETY_MESSAGE` and `safetyType: "crisis"`.

**Content policy path** — Runs during normalize. The Clerk prompt instructs the model to reject content that promotes hatred, violence against groups, or similar harm while allowing normal confessions, dilemmas, and dark humor. Stores `CONTENT_POLICY_MESSAGE` and `safetyType: "content_policy"`.

`GET /api/trials/:id` for a blocked trial:

```json
{
  "id": "...",
  "status": "safety_blocked",
  "safetyType": "content_policy",
  "safetyMessage": "The Tribunal can't hear this case...",
  "resources": []
}
```

For `crisis`, `resources` includes 988, Crisis Text Line, and related links.
