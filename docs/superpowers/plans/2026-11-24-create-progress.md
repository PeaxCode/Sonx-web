# Create progress card and prompt ideas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A real-stage "Now making" card at the top of /create's right column (G11) and prompt ideas under the song list (U3).

**Architecture:** A `CreateProvider` wraps both columns of `src/app/(studio)/create/page.tsx`. The form writes the pre-start stage and the tracked generation ID into it; the card reads them plus the existing `useLibrary()` rows (already polled every 5 s). Ideas send a fill request through the same provider; the form applies it.

**Tech Stack:** Next.js 16 App Router, React client components, Tailwind, existing `useLibrary` / `usePlayer` / `CoverArt`.

**Spec:** `docs/superpowers/specs/2026-11-24-create-progress-design.md`

## Global Constraints

- No fake percentage or invented stage: Lyrics = lyrics request in flight, Starting = start request in flight, Composing = row `processing`, Ready = row `completed`, Failed = row `failed`.
- Copy: "Now making", "usually 1 to 3 minutes", failed fallback "This one did not work. Your charge was refunded." (same as track-list).
- Ideas show for visitors and for signed-in accounts with fewer than 3 songs; 4–6 ideas; genre values must be `GENRES` ids.
- No test runner in the repo: each task is verified with `npm run lint`, `npx tsc --noEmit` and the app on localhost:3000.

## Review Focus

- Start request fails (out of songs, network): the card must disappear, not stick in "Starting".
- User leaves /create mid-generation and comes back: card follows the newest `processing` row, without the Lyrics step.
- Two songs started back to back: the card follows the latest; the older one stays a normal "Making" row.
- Tapping an idea while a song is being written (`busy`): fill must not change the in-flight submit; apply it to the form only (the submit already captured its values).
- Reduced motion: no scroll animation (`behavior: "auto"`), no pulsing beyond existing patterns.

---

### Task 1: Create-page context and form wiring

**Files:**
- Create: `src/components/studio/create-context.tsx`
- Modify: `src/app/(studio)/create/page.tsx` (wrap the grid in `<CreateProvider>`)
- Modify: `src/components/studio/create-music-form.tsx` (`submit`, new fill effect)

**Interfaces:**
- Produces:
  - `type MakingStage = "lyrics" | "starting"`
  - `interface Making { stage: MakingStage; title: string; genre: string; withLyrics: boolean }`
  - `interface Tracked { id: string; withLyrics: boolean }`
  - `interface PromptFill { prompt: string; genre: string; instrumental: boolean; nonce: number }`
  - `useCreate(): { making: Making | null; setMaking(m: Making | null): void; tracked: Tracked | null; setTracked(t: Tracked | null): void; fill: PromptFill | null; requestFill(f: Omit<PromptFill, "nonce">): void; startedAt: number | null }` — `startedAt` is set to `Date.now()` whenever `setMaking` receives a non-null value after null.
  - `useCreateOptional()` returning `null` outside the provider (the form is also rendered as a Suspense fallback; both are inside the provider, but keep the form safe).

- [ ] **Step 1:** Implement the provider and hooks in `create-context.tsx` (plain `useState`, memoized value).
- [ ] **Step 2:** In `submit`: after the access checks, `setMaking({ stage: withLyrics ? "lyrics" : "starting", title: title.trim(), genre, withLyrics })` where `withLyrics = mode === "describe" && !instrumental`; before `startGeneration` set stage `"starting"` (keep title = `title.trim() || autoTitle`); after `await track("")` call `setTracked({ id: generationId, withLyrics })` then `setMaking(null)`; in `catch` call `setMaking(null)`.
- [ ] **Step 3:** Fill effect: when `fill?.nonce` changes, `setMode("describe")`, `setPrompt(fill.prompt)`, `setGenre(fill.genre)`, `setInstrumental(fill.instrumental)`, `genrePicked.current = true`, then focus the textarea and `scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" })` (use `prefersReducedMotion` from `@/lib/motion`).
- [ ] **Step 4:** Run `npx tsc --noEmit && npm run lint` — expected: no errors.
- [ ] **Step 5:** Commit `feat: Create page state for the song being made`.

### Task 2: Now making card

**Files:**
- Create: `src/components/studio/making-card.tsx`
- Modify: `src/components/studio/music-list.tsx` (render `<MakingCard />` above the "Your songs" heading for signed-in users)

**Interfaces:**
- Consumes: `useCreateOptional()` from Task 1; `useLibrary().generations`; `usePlayer().play`; `CoverArt`; `genreName` from `track-list.tsx`.
- Produces: `export function MakingCard(): JSX.Element | null`.

- [ ] **Step 1:** Resolve what to show: `making` (pre-start) → else the generation with `tracked.id` → else the newest `processing` music row (withLyrics false). Hide when nothing, or when the user dismissed that ID (local state).
- [ ] **Step 2:** Steps row: `["Lyrics", "Composing", "Ready"]`, Lyrics only when `withLyrics`. Lyrics done once stage ≠ "lyrics"; Composing active for "starting" and `processing`. Elapsed `m:ss` from `startedAt` (pre-start) or `created_at`, ticking each second while not finished; then "· usually 1 to 3 minutes".
- [ ] **Step 3:** Ready: Play button (`play(generation, [generation])`) and dismiss (×). Failed: `generation.error ?? fallback` in `text-danger` and dismiss. Stage line in an `aria-live="polite"` element.
- [ ] **Step 4:** On phones (`matchMedia("(max-width: 1023px)")`), when `making` goes from null to set, scroll the card into view (`block: "start"`, reduced-motion aware).
- [ ] **Step 5:** Run `npx tsc --noEmit && npm run lint`; on localhost:3000 signed in, start a described song with vocals: card shows Lyrics → Composing → Ready + Play; a failed start leaves no card.
- [ ] **Step 6:** Commit `feat: show the song being made at the top of Create (G11)`.

### Task 3: Prompt ideas

**Files:**
- Create: `src/lib/prompt-ideas.ts`, `src/components/studio/prompt-ideas.tsx`
- Modify: `src/components/studio/music-list.tsx` (render `<PromptIdeas />` under the list for visitors and when fewer than 3 music rows)

**Interfaces:**
- Consumes: `useCreateOptional().requestFill` from Task 1.
- Produces: `export const PROMPT_IDEAS: { label: string; prompt: string; genre: string; instrumental?: boolean }[]` (6 entries, prompt ≤ 500 chars, genre ∈ `GENRES` ids, at least one instrumental); `export function PromptIdeas(): JSX.Element | null` (null outside the provider).

- [ ] **Step 1:** Write the 6 ideas (varied genres and occasions: birthday, road trip, study beat instrumental, breakup, wedding, workout).
- [ ] **Step 2:** Render a "Try an idea" heading and buttons (label + genre name) styled like the genre chips; click → `requestFill`.
- [ ] **Step 3:** Run `npx tsc --noEmit && npm run lint`; on localhost:3000 as a visitor and as a new account, tapping an idea fills prompt/genre/instrumental and the textarea comes into view on a 390 px wide window.
- [ ] **Step 4:** Commit `feat: prompt ideas under the song list on Create (U3)`.
