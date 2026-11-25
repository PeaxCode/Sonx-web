# Real Explore, profiles and follows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public profiles with published songs and real follows, an Account page that is the user's profile, and Explore built from real published songs, seeded by Sonx-owned accounts.

**Architecture:** One migration in the shared Supabase project (`ai-music-generator/supabase/migrations`) adds `profiles`, `follows` and publishing columns on `generations`, plus `security definer` read functions for public data. sonx-web reads those functions directly (server components for profile pages, client for Explore/Account) and writes through RLS-guarded tables. A one-off seed script creates the house accounts.

**Tech Stack:** Postgres/Supabase (RLS, SQL functions), Next.js 16 App Router, `@supabase/supabase-js`, Node scripts, EachLabs (Mureka, Flux 3).

**Spec:** `docs/superpowers/specs/2026-11-24-explore-profiles-design.md`

## Global Constraints

- Shared, live backend: deploy order migration → seed → web. New `generations` columns nullable or defaulted.
- A song is public only after its owner publishes it; nothing existing becomes public.
- Public functions never return prompt, email, user_id, provider fields or unpublished rows.
- No invented people or numbers: house profiles carry `is_house = true` and a "By Sonx" badge; counts are real.
- Handles: `^[a-z0-9][a-z0-9-]{2,29}$`, unique on `lower(handle)`, reserved list refused for users: `sonx, admin, administrator, explore, create, pricing, account, support, help, api, blog, login, signup, signin, settings, library, artist, song, checkout, terms, privacy, about, null, undefined`.
- Limits: display name ≤ 40, bio ≤ 160 characters.
- `/explore` and `/artist/*` stay behind `exploreEnabled` and `noindex`.
- House accounts: `support+<slug>@getsonx.com`, email confirmed, no password.

## Review Focus

- A user setting `is_house`, `play_count` or `cover_url` on their own rows through the REST API (Supabase grants new tables to `anon`/`authenticated` by default) — must be impossible. Test: Task 1 `t_user_cannot_set_house_or_counts`.
- Publishing a song that is processing, failed, a video or a voice model — refused by a constraint. Test: Task 1 `t_publish_only_finished_songs`.
- Handles differing only in case (`Mira` vs `mira`) or reserved (`admin`) — second one refused. Test: Task 1 `t_handle_rules`.
- Visitor pressing Follow, or a user on their own profile — sign-in window / no Follow button. Check: Task 4 browser step.
- Deleting a published song or the account — gone from Explore and profile immediately (cascade + filters). Test: Task 1 `t_deleted_rows_vanish`.

---

### Task 1: Migration and its SQL tests (ai-music-generator)

**Files:**
- Create: `supabase/migrations/20261124000000_profiles_follows_publishing.sql`
- Create: `supabase/tests/profiles_follows_publishing_test.sql`
- Create: `scripts/test-migration-local.sh` (throwaway local cluster)

**Interfaces:**
- Produces (SQL, all `security definer`, `set search_path = public`, granted to `anon, authenticated` unless noted):
  - `get_profile(p_handle text)` → `table(handle text, display_name text, bio text, avatar_url text, is_house boolean, followers bigint, following bigint, songs bigint, plays bigint)`
  - `get_profile_songs(p_handle text)` → `table(id uuid, title text, genre text, feature text, output_url text, cover_url text, lyrics text, created_at timestamptz, published_at timestamptz, play_count int)`
  - `explore_songs(p_sort text, p_genre text default null, p_limit int default 24)` → the columns above + `handle, display_name, avatar_url, is_house`. `p_sort` `'new'` = `published_at desc`; `'top'` = published in the last 30 days, `play_count desc, published_at desc`.
  - `explore_artists(p_limit int default 20)` → `table(handle, display_name, avatar_url, is_house, followers bigint, songs bigint)`; only profiles with ≥ 1 published song; `followers desc, songs desc`.
  - `following_songs(p_limit int default 24)` (authenticated only) → same as `explore_songs`, for `auth.uid()`'s followees, `published_at desc`.
  - `record_play(p_id uuid)` → `void`; `play_count + 1` only when published.
  - Tables `profiles(user_id, handle, display_name, bio, avatar_url, is_house, created_at, updated_at)`, `follows(follower_id, followee_id, created_at)`; columns `generations.published_at, play_count, cover_url`.

- [ ] **Step 1: Write `scripts/test-migration-local.sh`**: `initdb` a temp dir, start on port 54329, create stub `auth` schema (`auth.users(id uuid pk, email text)`, `auth.uid()` reading `current_setting('request.jwt.claim.sub', true)::uuid`), roles `anon`, `authenticated`, `service_role`, Supabase-style default privileges (`alter default privileges in schema public grant all on tables to anon, authenticated`), then apply the existing migrations in order, then the new one, then the test file with `psql -v ON_ERROR_STOP=1`; stop and delete the cluster on exit.
- [ ] **Step 2: Write the tests** in `profiles_follows_publishing_test.sql` as `DO` blocks that `raise exception` on failure, switching roles with `set local role` and `set local request.jwt.claim.sub`:
  - `t_handle_rules`: insert `Mira` ok; `mira` → unique violation; `admin` → check violation; `a` → check violation.
  - `t_user_cannot_set_house_or_counts`: as authenticated owner, `update profiles set is_house = true` → error or no change; `update generations set play_count = 999, cover_url = 'x'` → values unchanged.
  - `t_publish_only_finished_songs`: setting `published_at` on a `processing` row, a `failed` row and an `AI_MUSIC_VIDEO` row each fails; on a completed `LYRICS_MUSIC` row with `shared_at` it succeeds.
  - `t_anon_reads_only_public`: as `anon`, `select * from generations` returns 0 rows; `explore_songs('new')` returns only published rows and has no `prompt`/`user_id` column; `get_profile_songs` excludes unpublished.
  - `t_follow_rules`: follow self → error; follow twice → one row; `get_profile` followers = 1; user B cannot delete A's follow row.
  - `t_record_play`: on published → +1; on unpublished → unchanged.
  - `t_deleted_rows_vanish`: delete the auth user → profile, follows and songs gone from all functions.
- [ ] **Step 3: Run** `bash scripts/test-migration-local.sh` — Expected: FAIL (new tables/functions do not exist).
- [ ] **Step 4: Write the migration.** Tables with checks above; `revoke all on profiles, follows from anon, authenticated`; `grant select on profiles to anon, authenticated`; `grant insert (user_id, handle, display_name, bio, avatar_url), update (handle, display_name, bio, avatar_url) on profiles to authenticated`; `grant select, insert, delete on follows to authenticated`; RLS policies (profiles: select all, insert/update own; follows: select/insert/delete where `follower_id = auth.uid()`); `generations` columns + constraint `published_at is null or (shared_at is not null and status = 'completed' and feature in ('PROMPT_MUSIC','PHOTO_MUSIC','LYRICS_MUSIC','AI_SINGING'))`; `grant update (published_at) on generations to authenticated`; a `before update` trigger on `generations` and on `profiles` that, when `current_user in ('anon','authenticated')`, keeps `play_count`, `cover_url` (and `is_house`) at their old values; index `generations (published_at desc) where published_at is not null`; the six functions.
- [ ] **Step 5: Run** `bash scripts/test-migration-local.sh` — Expected: `ALL TESTS PASSED` (last line printed by the test file).
- [ ] **Step 6: Commit** `feat: profiles, follows and published songs (migration + tests)` on `feat/paddle-web-billing`.

### Task 2: Deploy the migration (live)

- [ ] **Step 1:** `supabase migration list` — Expected: `20261124000000` local only.
- [ ] **Step 2:** `supabase db push` — Expected: applies `20261124000000` without error.
- [ ] **Step 3: Verify live as anon** with the publishable key: `rpc/explore_songs` with `{"p_sort":"new"}` returns `[]`; `GET /rest/v1/generations?select=id&limit=1` returns `[]`; `GET /rest/v1/profiles?select=*` returns `[]`.
- [ ] **Step 4:** Push the backend branch; ledger the deploy time.

### Task 3: House accounts and their songs

**Files:**
- Create: `scripts/house/songs.mjs` (song list), `scripts/house/generate.mjs` (EachLabs, reuses the M9 approach), `scripts/house/seed.mjs` (service role)
- Add: `public/samples/house/*.mp3|jpg` (new songs only; M9 files stay where they are)

**Interfaces:**
- Consumes: Task 1 tables.
- Songs: the 10 M9 examples (`/samples/<slug>.mp3|jpg`, already committed) + 14 new ones = 24.
- Produces: 4 house profiles — `sonx-originals` "Sonx Originals", `sonx-lofi-lab` "Sonx Lo-fi Lab", `sonx-beats` "Sonx Beats", `sonx-acoustic` "Sonx Acoustic" — each with ≥ 5 published songs (`output_url` and `cover_url` relative `/samples/...`), `published_at` spread over the last 14 days.

- [ ] **Step 1:** Write 14 new song specs (genres not covered by M9: jazz, indie, latin, reggae, folk, blues, metal, punk, plus second takes of pop, hip-hop, lo-fi, EDM, R&B, country); 9 vocal, 5 instrumental; covers with "No text, no letters" as in M9.
- [ ] **Step 2:** Run `generate.mjs` — Expected: 14 `done` lines, files transcoded to 128 kbps MP3 and 640 px JPEG in `public/samples/house/`; covers viewed in a contact sheet.
- [ ] **Step 3:** Write `seed.mjs`: service-role client (key from `supabase projects api-keys`, passed by env, never printed); per house account `auth.admin.createUser({ email, email_confirm: true })` unless it exists; upsert profile with `is_house = true`; insert completed `generations` rows (`client_request_id = 'house_<slug>'`, skip if present) with `shared_at = published_at`.
- [ ] **Step 4:** Run it twice — Expected: first run creates 4 accounts / 24 songs; second run reports 0 new.
- [ ] **Step 5:** Verify as anon: `explore_artists()` returns the 4 house profiles; `explore_songs('new')` returns 24 rows.
- [ ] **Step 6:** Commit sample files + scripts (sonx-web) `feat: house accounts with 24 published songs`.

### Task 4: Web data layer and the real profile page

**Files:**
- Create: `src/lib/profiles.ts`
- Modify: `src/app/(studio)/artist/[handle]/page.tsx`, `src/components/explore/artist.tsx`, `src/components/explore/tiles.tsx`

**Interfaces:**
- Produces (`src/lib/profiles.ts`):
  - `interface PublicProfile { handle; display_name; bio: string | null; avatar_url: string | null; is_house: boolean; followers: number; following: number; songs: number; plays: number }`
  - `interface PublicSong extends Generation { handle: string; display_name: string; avatar_url: string | null; is_house: boolean; play_count: number; published_at: string }` (with `is_sample: true` so library-only actions hide)
  - `fetchProfile(handle): Promise<PublicProfile | null>`, `fetchProfileSongs(handle): Promise<PublicSong[]>` (server-safe, anon client)
  - `fetchExplore(): Promise<{ newest: PublicSong[]; top: PublicSong[]; artists: PublicArtist[]; byGenre: Record<string, PublicSong[]> }>`, `fetchFollowingSongs(): Promise<PublicSong[]>`
  - `useMyProfile(): { profile: MyProfile | null; loading; save(input): Promise<void> }`, `validateHandle(value): string | null` (error text or null)
  - `useFollow(handle, userId): { following: boolean; toggle(): Promise<void> }`
  - `setPublished(id: string, published: boolean): Promise<void>`, `recordPlay(id: string): void`
- [ ] **Step 1:** Implement `profiles.ts`; `npx tsc --noEmit` — Expected: no errors.
- [ ] **Step 2:** Profile page reads `fetchProfile` + `fetchProfileSongs` (dynamic, `noindex`, 404 when null or `!exploreEnabled`); `ArtistProfile` takes `PublicProfile` + `PublicSong[]`; "By Sonx" badge when `is_house`; no location field; Follow hidden on own profile, opens sign-in when signed out.
- [ ] **Step 3:** Browser check on localhost: `/artist/sonx-originals` signed out shows songs and counts; Follow opens sign-in; signed in, Follow → followers +1 after reload; unfollow → back.
- [ ] **Step 4:** Commit `feat: real profile pages with follows`.

### Task 5: Publishing and the Account profile

**Files:**
- Create: `src/components/studio/profile-dialog.tsx`, `src/components/studio/publish-toggle.tsx`
- Modify: `src/components/studio/account-view.tsx`, `src/components/studio/track-list.tsx`, `src/app/(studio)/account/page.tsx`, `src/lib/generations.ts` (`Generation.published_at?: string | null` and column list)

**Interfaces:**
- Consumes: `useMyProfile`, `validateHandle`, `setPublished` (Task 4).
- Produces: `<ProfileDialog open onClose initial onSaved />`, `<PublishToggle generation />` (renders nothing unless completed song owned by the user).
- [ ] **Step 1:** ProfileDialog: handle (prefilled from name, slugified), display name (prefilled), bio; inline errors from `validateHandle` and from a unique violation ("That handle is taken").
- [ ] **Step 2:** PublishToggle: Public/Private switch; first publish with no profile opens ProfileDialog then publishes; toast "Published to your profile" with a "View" link.
- [ ] **Step 3:** Account: profile header (avatar, display name, @handle, bio, followers/following/songs, Edit profile, View public profile — or "Set up your profile" when none), "Your songs" list (TrackList with PublishToggle per row), then the existing plan/usage/settings sections unchanged.
- [ ] **Step 4:** Track rows in Library and Create show PublishToggle in the row actions.
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint`; browser: set up a profile, publish a song from Account, it appears on `/artist/<handle>` signed out; unpublish removes it; handle `admin` shows the reserved error.
- [ ] **Step 6:** Commit `feat: publish songs and the Account profile`.

### Task 6: Explore on real data, plays, mock removal

**Files:**
- Modify: `src/components/explore/explore-view.tsx`, `src/app/(studio)/explore/page.tsx`, `src/components/studio/player.tsx`
- Delete: `src/lib/explore-mock.ts`, `src/lib/follows.ts`, `public/artists/`

**Interfaces:**
- Consumes: `fetchExplore`, `fetchFollowingSongs`, `recordPlay` (Task 4).
- [ ] **Step 1:** Explore shelves: "New on Sonx", "Most played", "From people you follow" (signed in, non-empty), "Artists to follow", "Best of <Genre>" tiles only for genres with songs (real count); search over loaded songs and artists; empty state when nothing is published.
- [ ] **Step 2:** Player calls `recordPlay(id)` on the first play per session of a song whose `published_at` is set (session set in memory).
- [ ] **Step 3:** Delete the mock files; `grep -rn "explore-mock\|lib/follows\|/artists/" src` — Expected: no matches.
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm run build` — Expected: pass; browser: Explore shows house songs, play a song → its play count on the profile goes up by 1 after reload.
- [ ] **Step 5:** Commit `feat: Explore from published songs`.
