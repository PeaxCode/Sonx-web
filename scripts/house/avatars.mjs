// Makes the artists' avatars with Flux 3 (abstract artwork, no faces, no text) and
// uploads them to the public profile-images bucket as <handle>.jpg.
// Usage: EACHLABS_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/house/avatars.mjs <scratchDir>
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { ARTISTS } from "./songs.mjs";

const { EACHLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const OUT = process.argv[2];
if (!EACHLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OUT) {
  throw new Error("EACHLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and a scratch dir are required");
}
await mkdir(OUT, { recursive: true });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, init) {
  const response = await fetch(`https://api.eachlabs.ai/v1/${pathname}`, {
    ...init,
    headers: { "X-API-Key": EACHLABS_API_KEY, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname}: ${response.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

function findUrl(value) {
  if (typeof value === "string") return /^https?:\/\//.test(value) ? value : undefined;
  if (Array.isArray(value)) return value.map(findUrl).find(Boolean);
  if (value && typeof value === "object") return Object.values(value).map(findUrl).find(Boolean);
  return undefined;
}

async function image(prompt) {
  const created = await api("prediction", { method: "POST", body: JSON.stringify({
    model: "flux-3-text-to-image",
    input: { prompt, aspect_ratio: "1:1", resolution: "1k", grounding: false },
    webhook_url: "",
  }) });
  const id = created.predictionID || created.prediction_id || created.id;
  for (let attempt = 0; attempt < 120; attempt++) {
    await sleep(4000);
    const body = await api(`prediction/${encodeURIComponent(id)}`);
    const status = String(body.status ?? "").toLowerCase();
    if (["success", "succeeded", "completed"].includes(status)) return findUrl(body.output);
    if (["failed", "error", "cancelled", "canceled"].includes(status)) throw new Error(`${prompt}: ${status}`);
  }
  throw new Error(`${prompt}: timed out`);
}

await Promise.all(ARTISTS.map(async (artist) => {
  const raw = path.join(OUT, `${artist.handle}.raw`);
  const jpg = path.join(OUT, `${artist.handle}.jpg`);
  if (!existsSync(raw)) {
    const url = await image(`Square profile artwork for a music artist: ${artist.avatar}. No people, no faces, no text, no letters, no logos.`);
    const response = await fetch(url);
    await writeFile(raw, Buffer.from(await response.arrayBuffer()));
  }
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "84", "-Z", "512", raw, "--out", jpg], { stdio: "ignore" });
  const { error } = await supabase.storage.from("profile-images")
    .upload(`${artist.handle}.jpg`, await readFile(jpg), { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`${artist.handle}: ${error.message}`);
  console.log(`uploaded ${artist.handle}.jpg`);
}));
