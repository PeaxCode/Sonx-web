import type { Feature } from "@/lib/billing-config";
import type { Generation } from "@/lib/generations";
import { getSupabase } from "@/lib/supabase/client";

// Private albums in the user's library (migration 20261124000004): the user's own
// songs and songs others published. Everything goes through owner-only functions.

export interface Album {
  id: string;
  title: string;
  songs: number;
  cover_url: string | null;
  updated_at: string;
}

/** A song in an album; `is_mine` is false for someone else's published song. */
export interface AlbumSong extends Generation {
  is_mine: boolean;
  handle: string | null;
  display_name: string | null;
  added_at: string;
}

interface AlbumSongRow {
  id: string;
  title: string;
  genre: string | null;
  feature: Feature;
  output_url: string;
  cover_url: string | null;
  lyrics: string | null;
  created_at: string;
  published_at: string | null;
  play_count: number;
  is_mine: boolean;
  handle: string | null;
  display_name: string | null;
  added_at: string;
}

const TITLE_LIMIT = 60;
export const cleanAlbumTitle = (title: string) => title.trim().slice(0, TITLE_LIMIT);

function fail(error: { message: string } | null, message: string): asserts error is null {
  if (error) throw new Error(message);
}

export async function fetchAlbums(): Promise<Album[]> {
  const { data, error } = await getSupabase().rpc("my_albums");
  fail(error, "Your albums could not load.");
  return (data ?? []) as Album[];
}

export async function createAlbum(title: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_album", { p_title: cleanAlbumTitle(title) });
  fail(error, "The album could not be created.");
  return data as string;
}

export async function renameAlbum(id: string, title: string): Promise<void> {
  const { error } = await getSupabase().rpc("rename_album", { p_id: id, p_title: cleanAlbumTitle(title) });
  fail(error, "The album could not be renamed.");
}

export async function deleteAlbum(id: string): Promise<void> {
  const { error } = await getSupabase().rpc("delete_album", { p_id: id });
  fail(error, "The album could not be deleted.");
}

export async function addToAlbum(albumId: string, songId: string): Promise<void> {
  const { error } = await getSupabase().rpc("add_to_album", { p_album_id: albumId, p_song_id: songId });
  fail(error, "The song could not be added.");
}

export async function removeFromAlbum(albumId: string, songId: string): Promise<void> {
  const { error } = await getSupabase().rpc("remove_from_album", { p_album_id: albumId, p_song_id: songId });
  fail(error, "The song could not be removed.");
}

/** IDs of the user's albums that hold this song. */
export async function albumsWithSong(songId: string): Promise<string[]> {
  const { data, error } = await getSupabase().rpc("albums_with_song", { p_song_id: songId });
  fail(error, "Your albums could not load.");
  return ((data ?? []) as { album_id: string }[]).map((row) => row.album_id);
}

export async function fetchAlbumSongs(albumId: string): Promise<AlbumSong[]> {
  const { data, error } = await getSupabase().rpc("album_songs", { p_album_id: albumId });
  fail(error, "This album could not load.");
  return ((data ?? []) as AlbumSongRow[]).map((row) => ({
    id: row.id,
    client_request_id: row.id,
    feature: row.feature,
    title: row.title,
    genre: row.genre,
    prompt: null,
    lyrics: row.lyrics,
    status: "completed",
    output_url: row.output_url,
    error: null,
    is_favorite: false,
    created_at: row.created_at,
    completed_at: row.created_at,
    // Read-only in the player and lists; counted as a play only when published by someone else.
    is_sample: !row.is_mine,
    cover_url: row.cover_url ?? undefined,
    published_at: row.published_at,
    is_mine: row.is_mine,
    handle: row.handle,
    display_name: row.display_name,
    added_at: row.added_at,
  }));
}
