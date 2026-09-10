# SatzGarten

A visual, playful German A1 grammar learning app for personal study. The curriculum follows CEFR A1 and the common progression of *Netzwerk neu A1*, while all explanations, examples, and exercises are original.

![SatzGarten learning dashboard](docs/preview.png)

## Language

The interface, instructions, grammar explanations, hints, and feedback are in **English**. German sentences, vocabulary, and answer choices stay in **German**, with English translations beside examples. Browser auto-translation is disabled to prevent it from turning distinct German answers into identical English words.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Included

- 12 A1 chapters and 64 directly searchable grammar topics
- Bookmarkable routes for every chapter, tab, topic, and mini-game
- A tactile sentence lab with drag, tap-to-swap, mixing, reset, and German audio
- An AI Learning Compass that explains where to start and generates validated one-click course links
- Interactive visual grammar models and a pocket rule beside practice
- German text-to-speech examples
- Choice, fill-in, and sentence-building exercises
- Article Garden, Blitz Mix, and Sentence Workshop games
- Four-step visual learning-style calibration
- Confidence input after exercises
- Adaptive daily plan based on accuracy, response time, recent errors, confidence, and preferred learning format
- Local learning fingerprint and progress dashboard
- Browser-local persistence; learning data stays on the device
- Responsive desktop/mobile UI and practice shortcuts (`A`–`D`, `1`–`4`, `Enter`, and `Esc`)

## Main files

- `src/data/curriculum.ts` — curriculum, examples, visual states, and exercises
- `src/hooks/useLearningState.ts` — progress persistence and adaptive recommendation logic
- `src/components/LessonView.tsx` — lesson visualization, examples, audio, and practice
- `src/components/PracticeHub.tsx` — mini-games
- `src/components/LearningFingerprintCard.tsx` — adaptive learning insights
- `src/components/AILearningGuide.tsx` — global AI topic navigator and direct links
- `src/components/InteractiveSentenceLab.tsx` — tactile visual grammar sandbox
- `src/lib/routes.ts` — dependency-free bookmarkable hash routes
- `server/tutor.ts` — validated API/Codex middleware and isolated subprocess adapter

## Connected AI: Codex CLI

Codex CLI is installed as a local development dependency and is the default AI provider. It uses your existing ChatGPT/Codex login—no API key is placed in the app.

```bash
npm run ai:status       # verify authentication
npm run ai:login        # device login, only if status says logged out
npm run ai:test         # real read-only connection test
npm run dev
```

The global **AI Learning Compass** accepts an English learning goal, gives a bounded A1 explanation, and returns only validated internal links such as `#/learn/essen-artikel/discover/accusative`. The chapter **Examples** tab also has a context-aware tutor for simpler explanations, new examples, and challenges.

Each request launches `codex exec` without a shell, sends the prompt through stdin, and runs in an isolated temporary directory with `--sandbox read-only`, `--ephemeral`, a timeout, and output limits. The endpoint accepts localhost only, checks Origin, validates/limits request data, serializes requests, and never renders model HTML. Do not expose this personal server publicly without authentication.

Explicit in-app consent is required. The guide sends only the current question and completed chapter IDs. The chapter tutor sends the current chapter context, aggregate answer counts, chosen visual format, and question. Names, raw answer history, browser data, and credentials are excluded. Prompts still leave your computer through the signed-in Codex service and are subject to its policies. Generated answers are suggestions, not grading.

### Alternative API providers

To use Gemini or the OpenAI API instead, copy `.env.example` to `.env.local` and set `AI_PROVIDER`, `AI_MODEL`, and the server-only `AI_API_KEY`. Never use a `VITE_` prefix for secrets. Restart Vite after changing configuration.

A static `dist/` deployment runs the lessons and hash-based direct links but **not** the AI endpoint. The in-app adaptive plan is a transparent local heuristic, not an LLM or a scientifically validated learning-style diagnosis. Format use and task accuracy are clues, not proof that one modality is best. There is no account, cloud sync, or service-worker offline installation yet.

## Verification

Requires Node.js 22.6+ (Node 24+ recommended).

```bash
npm run build
npm run lint
npm test
npm run ai:status
npm run ai:test
```

Optional real-browser smoke test (with the local dev server running):

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/browser_smoke.py
```

## Curriculum scope

This first version contains 12 visual chapters, 36 checked exercises and an article mini-game deck. It covers the main A1 grammar families, but three exercises per chapter are an introduction—not exhaustive mastery testing of every topic tag. Some comparison/adjective material is an A1-to-A2 bridge. Exact chapter-by-chapter alignment with your particular *Netzwerk neu* edition has not been verified; its contents page can be used for a future detailed mapping.

## Notes

This is an independent learning aid and is not affiliated with or endorsed by Klett or the *Netzwerk neu* authors/publishers. It does not reproduce textbook pages or exercises.
