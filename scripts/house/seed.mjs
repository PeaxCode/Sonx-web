// Creates Sonx's house accounts and publishes their songs on the shared Supabase
// project (live). Re-runnable: existing accounts, profiles and songs are kept.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/house/seed.mjs
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { HOUSE_ACCOUNTS, PUBLISHED } from "./songs.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const catalog = {
  ...JSON.parse(await readFile(path.join(HERE, "catalog.m9.json"), "utf8")),
  ...JSON.parse(await readFile(path.join(HERE, "catalog.house.json"), "utf8")),
};
// Served by getsonx.com and dev.getsonx.com alike; profiles need an https avatar.
const AVATAR = "https://getsonx.com/images/sonx-icon.png";
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

async function houseUser(account) {
  const email = `support+${account.handle.replace(/^sonx-/, "")}@getsonx.com`;
  const existing = await findUserByEmail(email);
  if (existing) return { user: existing, created: false };
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name: account.name } });
  if (error) throw error;
  return { user: data.user, created: true };
}

let accountsCreated = 0;
let songsCreated = 0;
const songs = Object.entries(PUBLISHED).flatMap(([handle, list]) => list.map((song) => ({ handle, ...song })));

for (const account of HOUSE_ACCOUNTS) {
  const { user, created } = await houseUser(account);
  if (created) accountsCreated++;
  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id, handle: account.handle, display_name: account.name, bio: account.bio, avatar_url: AVATAR, is_house: true,
  }, { onConflict: "user_id" });
  if (profileError) throw profileError;

  for (const song of songs.filter((item) => item.handle === account.handle)) {
    const info = catalog[song.slug];
    if (!info) throw new Error(`No catalog entry for ${song.slug}`);
    const clientRequestId = `house_${song.slug}`;
    const { data: found, error: findError } = await supabase.from("generations").select("id")
      .eq("user_id", user.id).eq("client_request_id", clientRequestId).maybeSingle();
    if (findError) throw findError;
    if (found) continue;
    // Spread over the last two weeks so "New on Sonx" has an order; plays start at zero.
    const publishedAt = new Date(Date.now() - (songsCreated % 14) * DAY - songsCreated * 3_600_000).toISOString();
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
    songsCreated++;
  }
}

console.log(`accounts created: ${accountsCreated}, songs created: ${songsCreated}, total songs listed: ${songs.length}`);
