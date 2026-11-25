# House accounts as artists, and library albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eight artist profiles in place of the four "Sonx …" accounts, and private albums in the library holding own and published songs.

**Architecture:** One migration (ai-music-generator) adds the `profile-images` bucket, widens the avatar rule to it, and adds `albums`/`album_songs` with owner-only security definer functions. A rewritten seed regroups the house songs under eight artists with Flux avatars uploaded to the bucket. sonx-web adds `src/lib/albums.ts`, an Add-to-album picker on song rows and tiles, and an Albums tab in Library.

**Tech Stack:** Postgres/Supabase (RLS, storage), Next.js 16, supabase-js, EachLabs Flux 3.

**Spec:** `docs/superpowers/specs/2026-11-24-artists-and-albums-design.md`

## Global Constraints
- Shared live backend; migration before web. No direct table access on new tables.
- Artists: no faces, no "By Sonx" badge in the UI, real counts, bios about the music only.
- Avatar rule adds only `https://dfsxnkfdnyubcigcrycn.supabase.co/storage/v1/object/public/profile-images/<[a-z0-9-]+>.jpg`.
- Album title 1–60 characters. Albums private to their owner.

## Review Focus
- Adding someone else's private song by ID to an album — refused. Test `t_album_rejects_private_song`.
- Another user's song unpublished after being added — hidden for the album owner, kept for the song's owner. Test `t_album_hides_unpublished`.
- Calling album functions on another user's album ID — no rows / not found. Test `t_album_owner_only`.
- Deleting a song or album — rows cascade. Test `t_album_cascade`.
- Visitor pressing Add to album on Explore — sign-in window. Check in browser.

---

### Task 1: Migration 20261124000004 + tests
**Files:** create `supabase/migrations/20261124000004_artist_images_and_albums.sql`; extend `supabase/tests/profiles_follows_publishing_test.sql` (or a new `albums_test.sql` run by the same script).
**Produces (SQL):** bucket `profile-images` (public, no user policies); constraint `profiles_avatar_host` adding the bucket path; tables `albums`, `album_songs`; functions `my_albums()`, `create_album(p_title) → uuid`, `rename_album(p_id, p_title)`, `delete_album(p_id)`, `add_to_album(p_album_id, p_song_id)`, `remove_from_album(p_album_id, p_song_id)`, `album_songs(p_album_id)` → `(id, title, genre, feature, output_url, cover_url, lyrics, created_at, published_at, play_count, is_mine boolean, handle, display_name, avatar_url, added_at)`; all authenticated-only.
- [ ] Write tests: the four Review Focus tests + `t_album_basics` (create, list with count, rename, add own song, album_songs returns it, remove) + avatar bucket path accepted, other storage paths rejected.
- [ ] Run `bash scripts/test-migration-local.sh` — Expected: FAIL (functions missing).
- [ ] Write the migration (stub `storage.buckets` insert works locally).
- [ ] Run again — Expected: `ALL TESTS PASSED`.
- [ ] Commit; `supabase db push`; anon check that `my_albums` is denied.

### Task 2: Eight artists
**Files:** `scripts/house/songs.mjs` (ARTISTS, PUBLISHED by artist), `scripts/house/avatars.mjs` (Flux → 512 px JPEG → upload to bucket), `scripts/house/seed.mjs` (reuse the 4 house users by email for the first four artists, create 4 more, upsert profiles, move songs by `client_request_id`), `src/components/explore/artist.tsx` + `social.tsx` (drop the badge).
- [ ] Generate 8 avatars; view a contact sheet (no faces, no text).
- [ ] Upload to `profile-images/<handle>.jpg` with the service role.
- [ ] Run seed twice — Expected: run 1 renames 4, creates 4, moves 24 songs; run 2 changes nothing.
- [ ] Anon check: `explore_artists()` returns the 8 handles, each with its song count; no `sonx-*` handles remain.
- [ ] Remove the badge from the UI; tsc + lint; commit.

### Task 3: Albums in the web
**Files:** create `src/lib/albums.ts`, `src/components/studio/album-picker.tsx`, `src/components/studio/albums-view.tsx`; modify `track-list.tsx` (row action), `explore/tiles.tsx` (tile action), `library-view.tsx` (Albums tab).
**Interfaces:** `fetchAlbums(): Promise<Album[]>`, `createAlbum(title): Promise<string>`, `renameAlbum(id, title)`, `deleteAlbum(id)`, `addToAlbum(albumId, songId)`, `removeFromAlbum(albumId, songId)`, `fetchAlbumSongs(albumId): Promise<AlbumSong[]>`; `<AddToAlbumButton generation />`.
- [ ] Implement lib + picker (albums with checks, New album field, sign-in for visitors).
- [ ] Albums tab: grid + New album; album view: Play all, remove, rename, delete (ConfirmDialog).
- [ ] tsc + lint + build; browser: create album, add own song and an Explore song, open, play, remove, rename, delete.
- [ ] Commit.
