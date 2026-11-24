# Real Explore, public profiles and follows

24 Nov 2026. Status: draft for approval.

## Why
Explore runs on invented artists, portraits and follower counts (`src/lib/explore-mock.ts`), so it
is hidden on getsonx.com (finding M2). The Account page is nearly empty. We want people to have a
real profile others can visit and follow, showing the songs they made, and an Explore built from
those songs. Development happens on dev.getsonx.com; Explore and profiles stay hidden in
production (`exploreEnabled`) until we decide to launch.

## Decisions already made (by Ataberk)
- A song is public only when its owner publishes it. Nothing becomes public by default; songs made
  in the app before this stay private.
- Until real users publish, Explore is filled by Sonx's own accounts with songs we generate
  (as with the M9 examples).
- Built on the shared Supabase project: tables plus read-only database functions, no new Edge
  Function (approach 1 below).

## Goals
1. **Profile**: handle (`@name`), display name, short bio, avatar. Anyone (signed in or not) can
   open `/artist/<handle>` and see the profile with its published songs, follower count, song
   count and total plays.
2. **Publishing**: the owner can publish or unpublish each finished song from their song list and
   their Account page. Publishing needs a profile; the first publish asks for a handle (prefilled
   from the account name).
3. **Follow**: signed-in users follow and unfollow profiles; counts are real. Visitors who press
   Follow get the sign-in window (L5 behaviour stays).
4. **Account page**: becomes the user's own profile: header (avatar, name, @handle, bio, counts,
   Edit profile, View public profile), then **all their songs** with a Public/Private switch on
   each, then the existing plan, usage and account settings below.
5. **Explore** from real data: New on Sonx (latest published), Most played (plays, last 30 days),
   one shelf per genre that has songs, Artists to follow (by followers), and, when signed in and
   following someone, From people you follow. Search filters what is loaded.
6. **Plays**: a published song's play count goes up once per listen (first play of that song in a
   browser session).
7. **House accounts**: 3 to 5 Sonx-owned profiles (e.g. "Sonx Originals", "Sonx Lo-fi Lab",
   "Sonx Beats") marked as Sonx's own, holding the 10 M9 songs plus 10 to 15 new ones across
   genres, with Flux 3 covers.

## Non-goals (v1)
Likes, comments, notifications, reposts, a full activity feed, playlists made by users, follower
lists on a page, moderation tools beyond unpublishing by hand in SQL, any change to the mobile app.

## Anti-goals (a failure even if it works)
- Invented people or numbers. House accounts say they are Sonx's; counts start at their real value
  (zero). No AI portraits presented as real artists.
- A song becoming public without its owner's action, or any private field leaving the database
  through the public path: prompt, email, user ID, provider fields, unpublished songs.
- Breaking the mobile app or existing web flows (library, share links, billing).

## Constraints
- One Supabase project for dev, production and the mobile app: a migration is live the moment it
  is pushed. Deploy order: migration first, then web. New columns are nullable or defaulted so old
  app versions keep working. Deleting an account removes its profile, follows and songs (cascade).
- `generations` is the app's library table. Its existing RLS (owner reads own rows) stays; public
  reads go only through `security definer` functions that return listed columns, as
  `get_shared_song` does.
- Handles: 3 to 30 characters, `a-z`, `0-9`, `-`, starting with a letter or digit, unique
  case-insensitively; a reserved list (sonx, admin, explore, create, pricing, account, support,
  help, api, blog, …) is refused for users. House accounts are created by the seed script only.
- Text limits: display name 40, bio 160. Titles already max 200 (UI 80).
- Production stays as it is: `/explore` and `/artist/*` behind `exploreEnabled`, `noindex`.

## Approaches considered
1. **Tables + read-only security-definer functions, web reads them directly** (picked). Fast
   reads, one migration, no Edge Function deploy; same pattern as shared songs.
2. Provider-proxy actions for every read and write: an Edge Function round trip per read, more to
   deploy, no gain.
3. A separate database for social data: two sources of truth for one set of accounts.

## Design

### Data (migration `20261124000000_profiles_follows_publishing.sql`, ai-music-generator)
- `profiles`: `user_id` (PK, FK `auth.users` on delete cascade), `handle` (unique on
  `lower(handle)`, format check), `display_name`, `bio`, `avatar_url`, `is_house boolean default
  false`, `created_at`, `updated_at`. RLS: everyone can read; a user inserts and updates only their
  own row and cannot set `is_house` (column grants exclude it).
- `follows`: `follower_id`, `followee_id` (both FK `auth.users` cascade, PK on the pair, no
  self-follow), `created_at`. RLS: a user reads, inserts and deletes rows where they are the
  follower. Counts come from functions.
- `generations` gains `published_at timestamptz` (requires `shared_at` and a song feature, like
  the existing share constraint), `play_count integer not null default 0`, `cover_url text`.
  Authenticated users may update `published_at` on their own rows (column grant added).
- Functions (granted to `anon` and `authenticated`, `security definer`, `search_path = public`):
  - `get_profile(p_handle)` → profile fields + followers, following, published songs, total plays.
  - `get_profile_songs(p_handle)` → published, completed songs: id, title, genre, feature,
    output_url, cover_url, lyrics, created_at, play_count. Never prompt or user_id.
  - `explore_songs(p_sort text /* 'new' | 'top' */, p_genre text, p_limit int)` → same columns plus
    the artist's handle, display name, avatar, is_house.
  - `explore_artists(p_limit int)` → profiles with at least one published song, by followers.
  - `following_songs(p_limit int)` (authenticated) → latest published songs by people I follow.
  - `record_play(p_id uuid)` → increments `play_count` of a published song; no-op otherwise.
- Publishing sets `shared_at` too (a published song has a public page). Unpublishing clears
  `published_at` only; the share link keeps working until the owner stops sharing.

### Web (sonx-web)
- `src/lib/profiles.ts`: typed wrappers for the functions, profile upsert, follow/unfollow,
  publish/unpublish, handle validation shared with the form.
- `/artist/[handle]`: server-rendered from `get_profile` + `get_profile_songs` (no static params);
  `ArtistProfile` reused with real fields; follow button backed by `follows`. Not found → 404.
- Account (`/account`): profile header with Edit profile dialog (handle, display name, bio;
  avatar from the sign-in provider for v1), then the user's songs with a Public/Private switch,
  then the existing billing and settings sections.
- Song rows (Library, Create): the share menu gains "Publish to profile" / "Remove from profile".
  First publish without a profile opens the profile dialog, then publishes.
- Explore: `explore-view.tsx` reads from the functions; `explore-mock.ts`, `follows.ts`
  (localStorage) and the mock portraits are removed. Playlist tiles use real per-genre counts.
- Player: `record_play` on the first play of a published song per session.

### House accounts (seed script, run once, service role)
Creates 3 to 5 auth users on Sonx-owned addresses, their profiles (`is_house = true`, a "By Sonx"
badge in the UI), and published `generations` rows pointing at files in `public/samples`
(relative URLs, served by both hosts) with covers. Generates 10 to 15 more songs with the M9
script first. Re-runnable: skips what exists.

## Calls I made (Claude) — check these
- A new profile copies the avatar from the sign-in provider (Google/Apple metadata); uploading an
  avatar is v2.
- Lyrics of a published song are public (shown in the full player); the prompt never is.
- House accounts use plus addresses on the support inbox (`support+originals@getsonx.com`, …),
  confirmed, no password, so nobody else can claim them.
- Profiles live at `/artist/<handle>` (the route that exists), for users and house accounts alike.
- Unpublishing keeps the share link; stopping sharing is a separate action, as today.
- The migration is tested on a throwaway local Postgres with a stub `auth` schema and the `anon` /
  `authenticated` roles (Docker is not running, so not the Supabase CLI stack).

## Left to the builder
Exact layout of the Account sections and the profile dialog; shelf sizes; how "Most played"
breaks ties; the seed script's language and house account names (within the anti-goals).

## Verification
- SQL: run the migration against a throwaway local Postgres before pushing; check
  as `anon` that no unpublished row, prompt or user_id is readable, and that `is_house` cannot be
  set by a user.
- Web: `tsc`, lint, build; on localhost: create a profile, publish/unpublish, follow from a second
  account, open a profile signed out, Explore shelves, play count.
