import { createClient } from "@supabase/supabase-js";
import type { Generation } from "@/lib/generations";
import type { Feature } from "@/lib/billing-config";
import { getSupabase } from "@/lib/supabase/client";

// Public profiles, published songs and follows (migration 20261124000000 in the
// shared Supabase project). The tables are not readable directly: everything goes
// through database functions that return display columns only.

export interface PublicProfile {
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  /** One of Sonx's own accounts. */
  is_house: boolean;
  followers: number;
  following: number;
  songs: number;
  plays: number;
}

export interface PublicArtist {
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_house: boolean;
  followers: number;
  songs: number;
}

/** A published song with its artist; `is_sample` hides the owner-only row actions. */
export interface PublicSong extends Generation {
  handle: string;
  display_name: string;
  artist_avatar_url: string | null;
  is_house: boolean;
  play_count: number;
  published_at: string;
}

interface SongRow {
  id: string;
  title: string;
  genre: string | null;
  feature: Feature;
  output_url: string;
  cover_url: string | null;
  lyrics: string | null;
  created_at: string;
  published_at: string;
  play_count: number;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_house: boolean;
}

/**
 * Avatar hosts the database accepts (Google sign-in pictures and Sonx). Anything
 * else could log every visitor who sees the avatar, so it is never rendered.
 */
export const isAllowedAvatar = (url: string | null | undefined): url is string =>
  typeof url === "string" && /^https:\/\/(([a-z0-9-]+\.)*googleusercontent\.com|getsonx\.com)\//.test(url);

/** A session-less client for public reads (works on the server and in the browser). */
function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toSong(row: SongRow): PublicSong {
  return {
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
    completed_at: row.published_at,
    is_sample: true,
    cover_url: row.cover_url ?? undefined,
    handle: row.handle,
    display_name: row.display_name,
    artist_avatar_url: row.avatar_url,
    is_house: row.is_house,
    play_count: row.play_count,
    published_at: row.published_at,
  };
}

export async function fetchProfile(handle: string): Promise<PublicProfile | null> {
  const { data, error } = await anonClient().rpc("get_profile", { p_handle: handle });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : null) ?? null;
}

export async function fetchProfileSongs(profile: PublicProfile): Promise<PublicSong[]> {
  const { data, error } = await anonClient().rpc("get_profile_songs", { p_handle: profile.handle });
  if (error) throw error;
  return ((data ?? []) as Omit<SongRow, "handle" | "display_name" | "avatar_url" | "is_house">[]).map((row) => toSong({
    ...row, handle: profile.handle, display_name: profile.display_name, avatar_url: profile.avatar_url, is_house: profile.is_house,
  }));
}

export interface ExploreData {
  newest: PublicSong[];
  top: PublicSong[];
  artists: PublicArtist[];
  /** Genre id → that genre's songs, newest first. */
  byGenre: Record<string, PublicSong[]>;
}

export async function fetchExplore(): Promise<ExploreData> {
  const client = anonClient();
  const [recent, top, artists] = await Promise.all([
    client.rpc("explore_songs", { p_sort: "new", p_limit: 100 }),
    client.rpc("explore_songs", { p_sort: "top", p_limit: 24 }),
    client.rpc("explore_artists", { p_limit: 20 }),
  ]);
  const error = recent.error ?? top.error ?? artists.error;
  if (error) throw error;
  const all = ((recent.data ?? []) as SongRow[]).map(toSong);
  const byGenre: Record<string, PublicSong[]> = {};
  for (const song of all) if (song.genre) (byGenre[song.genre] ??= []).push(song);
  return {
    newest: all.slice(0, 24),
    top: ((top.data ?? []) as SongRow[]).map(toSong),
    artists: (artists.data ?? []) as PublicArtist[],
    byGenre,
  };
}

/** Latest songs by the profiles the signed-in user follows. */
export async function fetchFollowingSongs(): Promise<PublicSong[]> {
  const { data, error } = await getSupabase().rpc("following_songs", { p_limit: 24 });
  if (error) throw error;
  return ((data ?? []) as SongRow[]).map(toSong);
}

// Handles: 3 to 30 lowercase letters, digits or dashes; the database enforces the same rules.
const RESERVED = new Set([
  "sonx", "admin", "administrator", "explore", "create", "pricing", "account", "support", "help", "api", "blog", "login",
  "signup", "signin", "settings", "library", "artist", "song", "checkout", "terms", "privacy", "about", "null", "undefined",
]);

/** Why a handle cannot be used, or null when it can. */
export function validateHandle(value: string): string | null {
  const handle = value.trim().toLowerCase();
  if (handle.length < 3 || handle.length > 30) return "Use 3 to 30 characters.";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(handle)) return "Use letters, numbers and dashes, starting with a letter or number.";
  if (RESERVED.has(handle) || handle.startsWith("sonx")) return "That handle is reserved. Try another.";
  return null;
}

/** "Ada Lovelace" → "ada-lovelace": a starting point for the handle field. */
export function suggestHandle(name: string): string {
  // Turkish dotless ı does not decompose to i, so it is mapped by hand.
  const base = name.replace(/ı/g, "i").replace(/İ/g, "I").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
  return base.length >= 3 && !base.startsWith("sonx") ? base : "";
}

export interface ProfileInput {
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
}

/** Creates or updates the signed-in user's profile; throws an Error with a message to show. */
export async function saveProfile(input: ProfileInput): Promise<void> {
  const { error } = await getSupabase().rpc("save_profile", {
    p_handle: input.handle.trim().toLowerCase(),
    p_display_name: input.display_name.trim(),
    p_bio: input.bio.trim() || null,
    p_avatar_url: input.avatar_url,
  });
  if (!error) return;
  if (error.code === "23505") throw new Error("That handle is taken. Try another.");
  if (error.code === "23514") throw new Error(validateHandle(input.handle) ?? "Check the name and bio length.");
  throw new Error("Your profile could not be saved. Try again.");
}

export async function fetchMyProfile(): Promise<PublicProfile | null> {
  const { data, error } = await getSupabase().rpc("my_profile");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  return row?.handle ? row : null;
}

/** Thrown by setPublished when the user has no profile yet. */
export class ProfileRequiredError extends Error {}

/** Publishes or unpublishes one of the user's songs; resolves to the new published_at (null when private). */
export async function setPublished(id: string, published: boolean): Promise<string | null> {
  const { data, error } = await getSupabase().rpc("set_published", { p_id: id, p_published: published });
  if (!error) return (data as string | null) ?? null;
  if (error.hint === "profile_required") throw new ProfileRequiredError("Set up your profile first.");
  throw new Error(published ? "This song could not be published." : "This song could not be removed from your profile.");
}

export async function isFollowing(handle: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc("is_following", { p_handle: handle });
  if (error) throw error;
  return Boolean(data);
}

export async function setFollowing(handle: string, follow: boolean): Promise<void> {
  const { error } = await getSupabase().rpc(follow ? "follow" : "unfollow", { p_handle: handle });
  if (error) throw error;
}

const counted = new Set<string>();
/** Counts one listen of a published song per browser session. */
export function recordPlay(id: string) {
  if (counted.has(id)) return;
  counted.add(id);
  // Query builders only send when awaited or then-ed.
  getSupabase().rpc("record_play", { p_id: id }).then(() => undefined, () => undefined);
}
