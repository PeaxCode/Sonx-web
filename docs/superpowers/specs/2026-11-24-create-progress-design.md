# Create: real progress card (G11) and a filled right column (U3)

Approved 24 Nov 2026. Small change.

## Why
Test finding G11: after pressing Create the form resets and the only feedback is a small
"Making your song" row in the list. U3: the right column (and the area under it) is empty,
especially for a new account with no songs.

## Goals
- From the moment Create is pressed, a "Now making" card at the top of the right column shows
  the real stage: Lyrics (only when Sonx writes them) → Composing → Ready, plus elapsed time and
  "usually 1 to 3 minutes". Ready turns into Play. Failed shows the reason and that the charge
  was refunded.
- On phones (one column) the page scrolls to the card after Create.
- Under "Your songs", while the account has fewer than 3 songs (and for visitors), 4–6 prompt
  ideas; tapping one fills the form (prompt, genre, instrumental) and brings the form into view.

## Non-goals / anti-goals
- No fake percentage or invented stages: every stage maps to something real (lyrics request in
  flight, start request in flight, row `processing`, row `completed` / `failed`).
- No example songs in the column (M9 is waiting for real ones). No plan summary (the cost hint
  and sidebar already show it).

## Approaches
1. **Create-page context (picked).** A small provider wrapping both columns of /create holds the
   pre-start stage, the tracked generation ID and a "fill the form" request. The card reads the
   tracked row from the existing library (which already polls processing rows every 5 s).
2. Put the state in LibraryProvider: global for a page-local concern.
3. Window custom events between form and column: no types, harder to follow.

## Builder notes (my calls)
- With no tracked song, the card follows the newest `processing` song, so coming back to
  /create mid-generation still shows it (without the Lyrics step).
- The global ready toast stays; the card is the on-page view.
- Ideas live in `src/lib/prompt-ideas.ts`; genres must be ids from `GENRES`.
- No test runner in this repo: verify with `npm run lint`, `npm run build` and the app on
  localhost.
