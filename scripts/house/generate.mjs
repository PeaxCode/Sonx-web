// Generates the house accounts' songs through EachLabs (same models as user songs:
// Mureka lyrics + mureka-8, or mureka-7.5 for instrumentals) with Flux 3 covers, then
// transcodes them into public/samples/house and records titles and lyrics in catalog.house.json.
// Usage: EACHLABS_API_KEY=... node scripts/house/generate.mjs <scratchDir>
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NEW_SONGS } from "./songs.mjs";
import { existsSync } from "node:fs";
import path from "node:path";

const KEY = process.env.EACHLABS_API_KEY;
const OUT = process.argv[2];
if (!KEY || !OUT) throw new Error("EACHLABS_API_KEY and an output dir are required");
await mkdir(OUT, { recursive: true });

const GENRE = {
  pop: ["Pop", "Pop music"], hiphop: ["Hip-hop", "Hip-hop rap"], rnb: ["R&B", "R&B soulful"],
  country: ["Country", "Country"], rock: ["Rock", "Rock"], kpop: ["K-pop", "K-Pop"],
  afrobeat: ["Afrobeat", "Afrobeat"], lofi: ["Lo-fi", "Lo-fi chill"], edm: ["EDM", "EDM electronic dance"],
  classical: ["Classical", "Classical orchestral"], jazz: ["Jazz", "Jazz"], indie: ["Indie", "Indie alternative"],
  latin: ["Latin", "Latin"], reggae: ["Reggae", "Reggae"], folk: ["Folk", "Folk acoustic"], blues: ["Blues", "Blues"],
  metal: ["Metal", "Metal heavy"], punk: ["Punk", "Punk"],
};

const SONGS = NEW_SONGS;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(HERE, "../../public/samples/house");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, init) {
  const response = await fetch(`https://api.eachlabs.ai/v1/${pathname}`, {
    ...init,
    headers: { "X-API-Key": KEY, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname}: ${response.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

// Creates a prediction and polls it to a final state; returns the final body.
async function run(model, input, label) {
  const created = await api("prediction", { method: "POST", body: JSON.stringify({ model, input, webhook_url: "" }) });
  const id = created.predictionID || created.prediction_id || created.id;
  if (!id) throw new Error(`${label}: no prediction id in ${JSON.stringify(created).slice(0, 300)}`);
  for (let attempt = 0; attempt < 200; attempt++) {
    await sleep(5000);
    const body = await api(`prediction/${encodeURIComponent(id)}`);
    const status = String(body.status ?? "").toLowerCase();
    if (["success", "succeeded", "completed"].includes(status)) return body;
    if (["failed", "error", "cancelled", "canceled"].includes(status)) {
      throw new Error(`${label}: ${status} ${JSON.stringify(body.error ?? body.output ?? body).slice(0, 300)}`);
    }
  }
  throw new Error(`${label}: timed out`);
}

const firstString = (...values) => values.find((value) => typeof value === "string" && value.trim());

function findUrl(value, pattern) {
  if (typeof value === "string") return /^https?:\/\//.test(value) && pattern.test(value) ? value : undefined;
  if (Array.isArray(value)) for (const item of value) { const url = findUrl(item, pattern); if (url) return url; }
  if (value && typeof value === "object") for (const item of Object.values(value)) { const url = findUrl(item, pattern); if (url) return url; }
  return undefined;
}

function lyricsOf(output) {
  if (typeof output === "string") return /^https?:\/\//.test(output) ? undefined : output;
  if (Array.isArray(output)) return output.map(lyricsOf).find(Boolean);
  if (!output || typeof output !== "object") return undefined;
  return firstString(output.lyrics, output.text, output.content, output.result)
    ?? (Array.isArray(output.choices) ? output.choices.map(lyricsOf).find(Boolean) : undefined);
}

function titleOf(output) {
  if (Array.isArray(output)) return output.map(titleOf).find(Boolean);
  if (!output || typeof output !== "object") return undefined;
  return firstString(output.title) ?? (Array.isArray(output.choices) ? output.choices.map(titleOf).find(Boolean) : undefined);
}

async function download(url, file) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`download ${response.status} ${url}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

async function make(song) {
  const metaFile = path.join(OUT, `${song.slug}.json`);
  if (existsSync(metaFile)) return JSON.parse(await readFile(metaFile, "utf8"));
  const [genreName, style] = GENRE[song.genre];
  const meta = { slug: song.slug, genre: song.genre, vocals: !song.instrumental, title: song.title };

  const coverJob = run("flux-3-text-to-image", {
    prompt: `Square album cover art: ${song.cover}. No text, no letters, no words, no logos.`,
    aspect_ratio: "1:1", resolution: "1k", grounding: false,
  }, `${song.slug} cover`);

  let audio;
  if (song.instrumental) {
    audio = await run("mureka-generate-instrumental", { prompt: song.instrumental, model: "mureka-7.5", n: 1, stream: false }, `${song.slug} instrumental`);
    meta.prompt = song.instrumental;
  } else {
    const written = await run("mureka-generate-lyrics", { prompt: `${genreName} song about: ${song.topic}` }, `${song.slug} lyrics`);
    meta.lyrics = lyricsOf(written.output);
    meta.title = titleOf(written.output) ?? song.title;
    if (!meta.lyrics) throw new Error(`${song.slug}: no lyrics in ${JSON.stringify(written.output).slice(0, 300)}`);
    meta.prompt = song.topic;
    audio = await run("mureka-generate-song", { lyrics: meta.lyrics, prompt: `${style}, ${song.voice}, melodic, emotional`, model: "mureka-8", n: 1 }, `${song.slug} song`);
  }
  meta.audioUrl = findUrl(audio.output, /\.(mp3|wav|m4a|flac)(\?|$)/i) ?? findUrl(audio.output, /./);
  meta.audioTitle = titleOf(audio.output);
  await writeFile(path.join(OUT, `${song.slug}.audio-response.json`), JSON.stringify(audio, null, 2));
  if (!meta.audioUrl) throw new Error(`${song.slug}: no audio url`);
  await download(meta.audioUrl, path.join(OUT, `${song.slug}.raw-audio`));

  const cover = await coverJob;
  await writeFile(path.join(OUT, `${song.slug}.cover-response.json`), JSON.stringify(cover, null, 2));
  meta.coverUrl = findUrl(cover.output, /\.(png|jpe?g|webp)(\?|$)/i) ?? findUrl(cover.output, /./);
  if (!meta.coverUrl) throw new Error(`${song.slug}: no cover url`);
  await download(meta.coverUrl, path.join(OUT, `${song.slug}.raw-cover`));

  await writeFile(metaFile, JSON.stringify(meta, null, 2));
  console.log(`done ${song.slug}: ${meta.title ?? meta.audioTitle ?? "(no title)"}`);
  return meta;
}

// Four at a time; a failure is reported and the rest carry on (rerun skips finished songs).
const queue = [...SONGS];
const failures = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const song = queue.shift();
    try { await make(song); } catch (error) { failures.push(song.slug); console.error(`FAIL ${song.slug}: ${error.message}`); }
  }
}));
await mkdir(PUBLIC_DIR, { recursive: true });
const catalog = {};
for (const song of SONGS) {
  const metaFile = path.join(OUT, `${song.slug}.json`);
  if (!existsSync(metaFile)) continue;
  const meta = JSON.parse(await readFile(metaFile, "utf8"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(OUT, `${song.slug}.raw-audio`), "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", path.join(PUBLIC_DIR, `${song.slug}.mp3`)]);
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", "640", path.join(OUT, `${song.slug}.raw-cover`), "--out", path.join(PUBLIC_DIR, `${song.slug}.jpg`)], { stdio: "ignore" });
  catalog[song.slug] = { title: meta.title ?? song.title, genre: meta.genre, vocals: meta.vocals, lyrics: meta.lyrics ?? null };
}
await writeFile(path.join(HERE, "catalog.house.json"), JSON.stringify(catalog, null, 2) + "\n");
console.log(failures.length ? `failed: ${failures.join(", ")}` : "all done");
