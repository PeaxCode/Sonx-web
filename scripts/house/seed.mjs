// Creates or updates Sonx's house artists and publishes their songs on the shared
// Supabase project (live). Re-runnable: accounts are found by email, songs by
// client_request_id (house_<slug>) and moved to their artist when regrouped; play
// counts and publish dates are kept.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/house/seed.mjs
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { ARTISTS, AVATAR_BASE, PUBLISHED } from "./songs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const catalog = {
  ...JSON.parse(await readFile(path.join(HERE, "catalog.m9.json"), "utf8")),
  ...JSON.parse(await readFile(path.join(HERE, "catalog.house.json"), "utf8")),
};
const DAY = 86_400_000;

async function findUserByEmail(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  return null;
}

const stats = { accountsCreated: 0, profilesUpdated: 0, songsCreated: 0, songsMoved: 0 };
let order = 0;

for (const artist of ARTISTS) {
  let user = await findUserByEmail(artist.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({ email: artist.email, email_confirm: true, user_metadata: { name: artist.name } });
    if (error) throw error;
    user = data.user;
    stats.accountsCreated++;
  }

  const profile = {
    user_id: user.id, handle: artist.handle, display_name: artist.name, bio: artist.bio,
    avatar_url: `${AVATAR_BASE}/${artist.handle}.jpg`, is_house: true, updated_at: new Date().toISOString(),
  };
  const { data: current } = await supabase.from("profiles").select("handle, display_name, bio, avatar_url").eq("user_id", user.id).maybeSingle();
  if (!current || current.handle !== profile.handle || current.display_name !== profile.display_name
      || current.bio !== profile.bio || current.avatar_url !== profile.avatar_url) {
    const { error } = await supabase.from("profiles").upsert(profile, { onConflict: "user_id" });
    if (error) throw new Error(`${artist.handle}: ${error.message}`);
    stats.profilesUpdated++;
  }

  for (const song of PUBLISHED[artist.handle]) {
    const info = catalog[song.slug];
    if (!info) throw new Error(`No catalog entry for ${song.slug}`);
    const clientRequestId = `house_${song.slug}`;
    order++;
    const { data: rows, error: findError } = await supabase.from("generations").select("id, user_id")
      .eq("client_request_id", clientRequestId);
    if (findError) throw findError;
    const existing = rows?.[0];
    if (existing) {
      if (existing.user_id !== user.id) {
        const { error } = await supabase.from("generations").update({ user_id: user.id }).eq("id", existing.id);
        if (error) throw new Error(`${song.slug}: ${error.message}`);
        stats.songsMoved++;
      }
      continue;
    }
    const publishedAt = new Date(Date.now() - (order % 14) * DAY - order * 3_600_000).toISOString();
    const { error } = await supabase.from("generations").insert({
      user_id: user.id,
      client_request_id: clientRequestId,
      feature: info.vocals ? "LYRICS_MUSIC" : "PROMPT_MUSIC",
      title: info.title,
      genre: info.genre,
      lyrics: info.lyrics,
      status: "completed",
      provider_model: info.vocals ? "mureka-generate-song" : "mureka-generate-instrumental",
      output_url: `/${song.dir}/${song.slug}.mp3`,
      cover_url: `/${song.dir}/${song.slug}.jpg`,
      created_at: publishedAt,
      completed_at: publishedAt,
      shared_at: publishedAt,
      published_at: publishedAt,
    });
    if (error) throw new Error(`${song.slug}: ${error.message}`);
    stats.songsCreated++;
  }
}

console.log(JSON.stringify(stats));
