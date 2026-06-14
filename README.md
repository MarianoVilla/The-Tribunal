# The Tribunal

![The Tribunal](./Banner.png)

Put yourself on trial. Submit a dilemma, confession, opinion, or idea. A panel of AI judges will prosecute it, defend it, and deliver a verdict.

## What it is

The Tribunal is a theatrical AI web app that runs a structured multi-step trial on any user submission. It produces a shareable verdict card with a charge, prosecution argument, defense argument, panel judgments, final verdict, score, and sentence.

Completed trials can be appealed: the appellant picks a new tribunal, states grounds for appeal, and the same pipeline runs in **appeal mode**, weighing the original ruling against the new arguments.

## Features

- Five tribunal types: Moral, Relationship, Idea, Opinion, Roast
- 4-call LLM pipeline (normalize, parallel prosecution/defense, panel, final verdict)
- **Appeals** — appellate hearings in any tribunal with selectable grounds and optional explanation; prompts include the original verdict, charge, reasoning, and sentence
- Google OAuth accounts with private trial ownership, anonymous claim tokens, and public publishing
- Verdict card with charge, recognized/rejected blocks, and a full-width sentence footer; horizontal/vertical image download
- Public gallery of verdicts (plus built-in sample cases)
- Two-tier safety filter (keyword pre-check + LLM review) with context-appropriate blocked-trial UI
- Real-time trial progress via polling

## Tech stack

- Frontend: React 19 + Vite + TypeScript + Tailwind CSS 4
- Backend: Node.js 22 + Express 5 + TypeScript
- Database: SQLite via `@libsql/client` + Drizzle ORM
- LLM: OpenRouter API (configurable model)

## Running it for free (no API key needed)

Don't want to pay for tokens? Fair enough. You can run The Tribunal completely free using a local LLM — no OpenRouter account, no credit card, no OpenAI key.

The trick is to spin up your own inference server locally. Clone this stack, it handles everything:

👉 **https://github.com/matiasoviedo28/LLM**

It's Docker + Ollama + a model of your choice (Gemma 4 works well). Follow the setup there, then come back here and do this instead of the normal setup:

**1. Make sure your local LLM stack is running**

```bash
# In the LLM repo
docker compose up -d
```

**2. Set up `server/.env` from the template**

```bash
cp .env.example server/.env
```

Then open `server/.env` and set these two lines:

```bash
LLM_BASE_URL=http://localhost:11500
OPENROUTER_MODEL=gemma4:e4b
```

No `OPENROUTER_API_KEY` needed when `LLM_BASE_URL` is set.

**3. Run the app normally**

```bash
cd server && npm install && npm run dev
cd ../client && npm install && npm run dev
```

That's it. Every trial now runs on your machine, zero cost per request.

> **Heads up:** local models are slower than cloud APIs — expect trials to take 2–4 minutes on CPU-only hardware. Quality-wise, bigger models (Gemma 4 ~8B) handle the structured JSON prompts much better than smaller ones.

---

## Requirements

- Node 22+ (see `.nvmrc`)
- An OpenRouter API key: https://openrouter.ai (not needed if using a local LLM — see above)

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
STORE_RAW_LLM_RESPONSES=false
TRUST_PROXY=false
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

2. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

## Running

Start the backend (port 3001). Schema bootstrap runs automatically on startup (`CREATE TABLE IF NOT EXISTS` in `server/src/index.ts`):

```bash
cd server && npm run dev
```

Start the frontend (port 5173):

```bash
cd client && npm run dev
```

Open http://localhost:5173

### Resetting the database

The app runs lightweight startup schema compatibility checks. To fully reset local development data:

1. Stop the server (it locks `server/data/tribunal.db`).
2. Delete `server/data/tribunal.db` and any `tribunal.db-shm` / `tribunal.db-wal` files.
3. Restart the server; tables are recreated on boot.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `OPENROUTER_MODEL` | No | Model to use (default: `openai/gpt-4o-mini`) |
| `APP_BASE_URL` | No | Base URL for CORS (default: `http://localhost:5173`) |
| `OPENROUTER_SITE_URL` | No | Sent to OpenRouter as site URL |
| `OPENROUTER_APP_NAME` | No | App name sent to OpenRouter |
| `STORE_RAW_LLM_RESPONSES` | No | Store full provider response bodies in the database when `true` (default: `false`) |
| `TRUST_PROXY` | No | Trust reverse-proxy IP headers for rate limiting when `true` (default: `false`) |
| `GOOGLE_CLIENT_ID` | Yes for sign-in | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Yes for sign-in | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Yes for sign-in | Google OAuth callback URL |

## Architecture

```
client/         React + Vite + Tailwind
  src/
    components/ Reusable UI (VerdictCard, AppealSelector, SafetyBlockedView, ...)
    hooks/      useCreateTrial, useTrial, useAppeal, usePublish
    pages/      HomePage, TrialPage, GalleryPage
    types/      Shared TypeScript types (including APPEAL_GROUNDS)

server/         Express + TypeScript + Drizzle
  src/
    db/           Drizzle schema and libsql connection
    pipeline/     LLM orchestration (same 4 steps for trials and appeals)
      index.ts          runPipeline, buildAppealContext
      appeal-context.ts AppealContext type and prompt block formatter
      prompts.ts        Prompt templates (normal + appeal-mode branches)
      steps.ts          OpenRouter calls + Zod validation
      safety.ts         Keyword pre-check and blocked-trial copy
    routes/       REST API endpoints
    tribunals.ts  Tribunal type definitions
    types.ts      Shared response types and APPEAL_GROUNDS
    samples.ts    Built-in gallery/trial samples
  data/         tribunal.db (auto-created on first run, gitignored)
```

### LLM pipeline (4 rounds per trial)

The same stages run for initial trials and appeals. When `appeal_of_id` is set, `buildAppealContext` loads the original completed trial and each prompt receives an appellate context block (original ruling + appeal ground + appellant text).

1. **Normalize** — Clerk summarizes the case and flags unsafe content (`isSafe`). Temperature 0.3.
2. **Prosecution + defense** — Run in parallel. In appeal mode, prosecution defends the original ruling; defense argues the appeal has merit. Temperature 0.9.
3. **Panel** — Four tribunal-specific judges each return a judgment, leaning, and key principle. In appeal mode, leanings reflect appeal merit. Temperature 0.85.
4. **Final verdict** — Judge delivers a verdict and share card. Appeal mode uses appellate outcomes (e.g. Appeal denied, Appeal granted, Sentence reduced). Temperature 0.65.

Prompt text lives in `server/src/pipeline/prompts.ts`. All calls use OpenRouter with `response_format: { type: 'json_object' }` and Zod validation in `steps.ts`.

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
| `POST` | `/api/trials/:id/appeal` | File appeal (see [Appeals](#appeals)) |
| `POST` | `/api/trials/:id/publish` | Make verdict public in gallery |
| `GET` | `/api/gallery` | Public verdicts (`?sort=latest\|condemned\|vindicated\|contested`) |
| `GET` | `/api/tribunals` | Tribunal type definitions |
| `GET` | `/api/auth/google/start` | Start Google sign-in |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `GET` | `/api/auth/me` | Current signed-in user |
| `POST` | `/api/auth/logout` | End current session |
| `POST` | `/api/auth/claim-trials` | Claim anonymous local trials after sign-in |

Unpublished trials require either the owning session cookie or the matching `X-Trial-Claim-Token` header. Public trials are readable without authentication.

## Tribunal types

- **Moral Tribunal** — ethical choices judged through philosophical frameworks
- **Relationship Tribunal** — interpersonal behavior and communication
- **Idea Tribunal** — startup and creative ideas
- **Opinion Tribunal** — hot takes and arguments
- **Roast Tribunal** — comedic, brutal, still insightful

### Scores (0–100)

Every tribunal uses the same direction: **higher = worse for the person who submitted the case**.

Gallery sort modes (`?sort=`):

| Sort | Behavior |
|------|----------|
| `latest` | Newest public verdicts first |
| `condemned` | Highest badness score first |
| `vindicated` | Lowest badness score first |
| `contested` | Panel split when available; otherwise scores nearest 50 |

| Tribunal | Score label |
|----------|-------------|
| Moral | Immorality Score |
| Relationship | Asshole Score |
| Idea | Concept Sillyness Score |
| Opinion | Argument Weakness Score |
| Roast | Cursedness Score |

## Appeals

An appeal reuses the existing pipeline in appeal mode. The appellant chooses any tribunal, including the original one, selects one appeal ground, and may add supporting text (up to 1000 characters; strongly encouraged in the UI).

### Appeal grounds

| `appealGround` | Meaning |
|----------------|---------|
| `new_context` | New context or evidence was missing from the original trial |
| `wrong_tribunal` | The case was judged by the wrong kind of tribunal |
| `mitigating_context_ignored` | The original court ignored important mitigating circumstances |
| `sentence_too_harsh` | The verdict may be fair, but the sentence was excessive |
| `reasoning_flawed` | The original court's reasoning was inconsistent, unfair, or missed the point |
| `verdict_too_soft` | The original court was too lenient |

### Filing an appeal

`POST /api/trials/:id/appeal` body:

```json
{
  "tribunalType": "moral",
  "appealGround": "reasoning_flawed",
  "appealText": "The panel dismissed my anxiety as laziness when I had a medical diagnosis."
}
```

Returns `{ id, status: "pending" }` for signed-in users, or `{ id, status: "pending", claimToken }` for anonymous owners appealing with a claim token. The original trial must be accessible to the requester.

Completed appeal results include `appealOfId`, `appealGround`, and `appealText`. The trial page shows an appellate banner and links back to the original verdict.

### Appellate verdicts

In appeal mode, the final judge chooses from outcomes such as:

- Appeal denied
- Appeal granted
- Verdict modified
- Sentence reduced
- Sentence increased
- Remanded to a more appropriate tribunal

Share cards for appeals use the headline `THE APPELLATE TRIBUNAL HAS SPOKEN`.

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
