# FitMind

AI fitness coach that talks to you the way you want it to — empathetic, brutal, friendly, or pro. Logs your training from natural language, builds your weekly plan with Gemini, tracks PRs, and ranks you live against other users.

**Live demo:** [fitmind-iota.vercel.app](https://fitmind-iota.vercel.app)

Solo full-stack project — from Postgres schema to UI animations. Built as a portfolio piece for AI / full-stack roles.

---

## What it does

- **Chat with an AI coach** — pick one of four personas (empathetic, hardcore Goggins-style, friend, pro). Each has its own voice, system prompt, and reaction style. Streamed token-by-token.
- **Log workouts in plain Polish** — type `"wyciskanie 80kg 3x10, plank 3x60s"` and Gemini parses it into structured exercises, sets, and metrics. Handles weighted, bodyweight (with body-weight coefficients), and timed exercises.
- **Generate a weekly plan** — Gemini composes a 7-day plan based on your goal, training history, conversation summary, and an optional briefing ("less time this week, focus on legs").
- **Track Personal Records** — bench / squat / deadlift detection from Polish exercise names, estimated 1RM via Brzycki formula, badge unlock on new PR.
- **Gamification** — XP, levels, daily quests, achievements, streaks.
- **Live leaderboards** — three categories (weekly XP, total volume, total XP) updated in real time over WebSocket as users gain XP.
- **Conversation memory** — chat auto-summarizes after N messages, keeping long-term context without blowing up the prompt.

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Server Actions, Turbopack) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| AI | Google Gemini 3 (`@google/genai`) — streaming + structured output via `responseSchema` |
| Database & Auth | Supabase (Postgres 17, Row Level Security, Realtime, OAuth Google/GitHub) |
| Hosting | Vercel |

## Architecture highlights

- **Server-first data fetching** — every page hits the DB through React Server Components, parallelized in a single `Promise.all` to avoid request waterfalls.
- **Structured Gemini output** — workout parser and plan generator both use `responseMimeType: 'application/json'` + JSON schema with enums, so AI responses are deterministic and type-safe instead of free-form text.
- **Streaming chat** — responses arrive token-by-token through a `ReadableStream`, with the full message persisted to the DB after the stream closes.
- **Row Level Security on every table** — `auth.uid() = user_id` policies; leaderboards use `SECURITY DEFINER` Postgres functions to aggregate across users without exposing private fields.
- **Anti-gaming** — workouts are re-parsed server-side (client can't fabricate volume), body-weight overrides are validated and accepted only when the profile is empty.
- **Conversation summarization** — when chat history crosses a threshold, a background Gemini call condenses it into a summary row that future requests pull as context.

## Running locally

```bash
git clone https://github.com/JachB/fitmind
cd fitmind
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

You'll need:
- A Supabase project (URL, anon key, service role key)
- A Google Gemini API key
- Database schema (migrations applied via Supabase)

Open [localhost:3000](http://localhost:3000).

## Status

Production-deployed, used as a personal training tool. Built solo end-to-end. Not actively monetized — this is a portfolio project showcasing AI integration, full-stack patterns, and security-aware Postgres + Next.js work.

---

Built by [Jan Bartnicki](https://github.com/JachB).
