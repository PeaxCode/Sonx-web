# House accounts as artists, and albums in the library

24 Nov 2026. Status: draft for approval. Builds on `2026-11-24-explore-profiles-design.md`.

## Decisions (Ataberk)
- The four "Sonx …" accounts become **artists**: artist names, no "By Sonx" badge, no human faces,
  real counts, bios that do not claim to be a person.
- **Albums**: a user collects their own songs and published songs from Explore into albums they
  name. Albums are private to their owner. A song that is unpublished later is hidden in other
  people's albums.

## 1. Artists (replaces the four house accounts)
Eight artists, songs regrouped by sound (24 songs, unchanged files and play counts):

| Handle | Name | Songs |
|---|---|---|
| nightdrive | Nightdrive | Summer Bonfire Love, Golden Hour Drive, My Own Stage |
| velvet-hours | Velvet Hours | Can't Stop Thinking, Midnight Kitchen |
| juniper-lane | Juniper Lane | Dirt Road Home, Front Porch Fireflies, Cabin Morning |
| rooftop-static | Rooftop Static | Paper Planes from the Rooftop, Clock Out Forever, No Sleep Til Stage |
| mara-sol | Mara Sol | Noche de sal y arena, City Lights Dance, Island Time |
| lowlight-tapes | Lowlight Tapes | Rainy Window Study, Night Bus Home, Blue Café, New Dawn |
| kilo-nine | Kilo Nine | City Never Sleeps, Corner Store Beat, Sunrise Drop, Neon Pulse |
| grey-harbor | Grey Harbor | The Midnight Train Still Comes, Standing Strong |

- Bios describe the music ("Late-night synth pop for empty highways. Made with Sonx."), never a
  person's life or city.
- Avatars: abstract or illustrated artwork from Flux 3 (no faces, no text), 512 px JPEG, stored in
  a new public Supabase Storage bucket `profile-images` that only the service role writes to. The
  avatar rule gains exactly that path:
  `https://dfsxnkfdnyubcigcrycn.supabase.co/storage/v1/object/public/profile-images/<name>.jpg`
  (a host Sonx controls, so it cannot track visitors). Later user uploads can use the same bucket
  through a server-side copy.
- `is_house` stays true in the database (internal: lets us find and manage them); the web stops
  showing the badge.
- The seed script is rewritten for the eight artists: the four existing house users are renamed and
  reused, four are created, and songs move to their new artist (`generations.user_id`).

## 2. Albums
- Tables `albums` (id, user_id, title 1–60, created_at, updated_at) and `album_songs` (album_id,
  generation_id, added_at; unique pair). Both cascade on delete (album, account, song). No direct
  table access; functions, all acting on the caller's own albums:
  `my_albums()` (id, title, songs, cover_url of the latest song with a cover, updated_at),
  `create_album(title) → id`, `rename_album(id, title)`, `delete_album(id)`,
  `add_to_album(album_id, song_id)` (song must be the caller's own or published),
  `remove_from_album(album_id, song_id)`,
  `album_songs(album_id)` → songs the caller may still see (own, or published), newest added first,
  with artist handle/name for published ones.
- Web:
  - An "Add to album" button on song rows (Library, Create, Account) and on Explore/profile tiles
    opens a small picker: the user's albums with a check on the ones holding the song (toggle),
    and "New album" (name field) at the top. Visitors get the sign-in window.
  - Library gets an **Albums** tab: a grid of album cards (cover, title, song count) and
    "New album"; opening one shows its songs with Play all, Remove from album, Rename, Delete
    album (confirm dialog).
- Albums are a library feature and also work in production, where Explore is hidden: there only
  the user's own songs can be added.

## Non-goals
Public or shared albums, reordering songs inside an album, album artwork upload, likes.

## Verification
- SQL tests (same local Postgres runner): only the owner sees and edits an album; a private song of
  someone else cannot be added; an unpublished song disappears from other users' albums but stays
  in the owner's own; deletes cascade; avatar rule accepts the bucket path and rejects others.
- Web: tsc, lint, build; browser: create an album, add an own song and an Explore song, open it,
  play, remove, rename, delete; Explore shows the eight artists without the badge.
