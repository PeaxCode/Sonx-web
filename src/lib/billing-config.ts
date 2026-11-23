// Mirrors constants/BillingConfig.ts in the mobile app and the server's
// provider-proxy limits. The server is authoritative; these drive the UI only.
// Songs are one number: instrumentals and songs with vocals share one allowance
// (counted under SONG_POOL) and cost the same in credits. FREE gets one song a
// calendar month, without MP3 download or commercial use.

export type Feature =
  | "PROMPT_MUSIC"
  | "PHOTO_MUSIC"
  | "LYRICS_MUSIC"
  | "AI_SINGING"
  | "AI_MUSIC_VIDEO"
  | "VOICE_TRAINING";

export type Plan = "FREE" | "WEEKLY" | "MONTHLY" | "YEARLY" | "STUDIO";

export const PLAN_LIMITS: Record<Plan, Record<Feature, number>> = {
  FREE: { PROMPT_MUSIC: 1, PHOTO_MUSIC: 0, LYRICS_MUSIC: 1, AI_SINGING: 0, AI_MUSIC_VIDEO: 0, VOICE_TRAINING: 0 },
  WEEKLY: { PROMPT_MUSIC: 10, PHOTO_MUSIC: 5, LYRICS_MUSIC: 10, AI_SINGING: 3, AI_MUSIC_VIDEO: 0, VOICE_TRAINING: 3 },
  MONTHLY: { PROMPT_MUSIC: 60, PHOTO_MUSIC: 20, LYRICS_MUSIC: 60, AI_SINGING: 15, AI_MUSIC_VIDEO: 1, VOICE_TRAINING: 15 },
  YEARLY: { PROMPT_MUSIC: 350, PHOTO_MUSIC: 100, LYRICS_MUSIC: 350, AI_SINGING: 50, AI_MUSIC_VIDEO: 5, VOICE_TRAINING: 50 },
  // Web-only tier (Paddle); web Pro uses MONTHLY. Both renew monthly, also when billed yearly.
  STUDIO: { PROMPT_MUSIC: 200, PHOTO_MUSIC: 60, LYRICS_MUSIC: 200, AI_SINGING: 50, AI_MUSIC_VIDEO: 3, VOICE_TRAINING: 50 },
};

/** The usage row every song is counted in (mirrors billingBucket on the server). */
export const SONG_POOL: Feature = "LYRICS_MUSIC";
export const usageBucket = (feature: Feature): Feature =>
  feature === "PROMPT_MUSIC" || feature === "LYRICS_MUSIC" ? SONG_POOL : feature;

/** Songs a plan gives every month (one number, since K2). */
export const songsIn = (plan: Plan) => PLAN_LIMITS[plan][SONG_POOL];

/** Credits per song, instrumental or with vocals. */
export const SONG_CREDIT_COST = 10;

export const CREDIT_COSTS: Record<Feature, number> = {
  PROMPT_MUSIC: 10,
  PHOTO_MUSIC: 14,
  LYRICS_MUSIC: 10,
  AI_SINGING: 10,
  AI_MUSIC_VIDEO: 75,
  VOICE_TRAINING: 10,
};

export type VideoDuration = 15 | 30;
export const VIDEO_CREDIT_COSTS: Record<VideoDuration, number> = { 15: 30, 30: 75 };

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  WEEKLY: "Pro weekly",
  MONTHLY: "Sonx Pro",
  YEARLY: "Pro yearly",
  STUDIO: "Sonx Studio",
};

export const STORE_LINKS = {
  ios: "https://apps.apple.com/us/app/ai-song-music-generator-sonx/id6757523434",
  android: "https://play.google.com/store/apps/details?id=com.app.sonx",
};

export const GENRES = [
  { id: "pop", name: "Pop" },
  { id: "hiphop", name: "Hip-hop" },
  { id: "edm", name: "EDM" },
  { id: "jazz", name: "Jazz" },
  { id: "lofi", name: "Lo-fi" },
  { id: "rock", name: "Rock" },
  { id: "classical", name: "Classical" },
  { id: "country", name: "Country" },
  { id: "blues", name: "Blues" },
  { id: "reggae", name: "Reggae" },
  { id: "latin", name: "Latin" },
  { id: "metal", name: "Metal" },
  { id: "folk", name: "Folk" },
  { id: "afrobeat", name: "Afrobeat" },
  { id: "indie", name: "Indie" },
  { id: "punk", name: "Punk" },
  { id: "rnb", name: "R&B" },
  { id: "kpop", name: "K-pop" },
] as const;

export const isGenre = (value: unknown): value is (typeof GENRES)[number]["id"] =>
  typeof value === "string" && GENRES.some((genre) => genre.id === value);

// Ways people write each genre in a prompt; checked longest first so "k-pop" beats "pop".
const GENRE_WORDS: [string, RegExp][] = [
  ["kpop", /\bk-?pop\b/i],
  ["rnb", /\br\s?&\s?b\b|\brnb\b|\brhythm and blues\b/i],
  ["lofi", /\blo-?fi\b/i],
  ["hiphop", /\bhip[- ]?hop\b|\brap\b|\btrap\b/i],
  ["edm", /\bedm\b|\btechno\b|\bdubstep\b|\btrance\b/i],
  ["afrobeat", /\bafro-?beats?\b/i],
  ["punk", /\bpunk\b/i],
  ["metal", /\bmetal\b/i],
  ["rock", /\brock\b/i],
  ["jazz", /\bjazz\b/i],
  ["classical", /\bclassical\b|\borchestra(l)?\b|\bpiano sonata\b/i],
  ["country", /\bcountry\b/i],
  ["blues", /\bblues\b/i],
  ["reggae", /\breggae\b/i],
  ["latin", /\blatin\b|\breggaeton\b|\bsalsa\b|\bbachata\b/i],
  ["folk", /\bfolk\b|\bacoustic ballad\b/i],
  ["indie", /\bindie\b/i],
  ["pop", /\bpop\b/i],
];

/** The genre a prompt names ("a slow R&B love song" -> rnb), or null when it names none. */
export function genreFromPrompt(prompt: string): string | null {
  return GENRE_WORDS.find(([, pattern]) => pattern.test(prompt))?.[0] ?? null;
}
