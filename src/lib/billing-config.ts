// Mirrors constants/BillingConfig.ts in the mobile app and the server's
// provider-proxy limits. The server is authoritative; these drive the UI only.

export type Feature =
  | "PROMPT_MUSIC"
  | "PHOTO_MUSIC"
  | "LYRICS_MUSIC"
  | "AI_SINGING"
  | "AI_MUSIC_VIDEO"
  | "VOICE_TRAINING";

export type Plan = "FREE" | "WEEKLY" | "MONTHLY" | "YEARLY";

export const PLAN_LIMITS: Record<Plan, Record<Feature, number>> = {
  FREE: { PROMPT_MUSIC: 1, PHOTO_MUSIC: 0, LYRICS_MUSIC: 1, AI_SINGING: 0, AI_MUSIC_VIDEO: 1, VOICE_TRAINING: 0 },
  WEEKLY: { PROMPT_MUSIC: 5, PHOTO_MUSIC: 5, LYRICS_MUSIC: 5, AI_SINGING: 3, AI_MUSIC_VIDEO: 0, VOICE_TRAINING: 3 },
  MONTHLY: { PROMPT_MUSIC: 40, PHOTO_MUSIC: 20, LYRICS_MUSIC: 20, AI_SINGING: 15, AI_MUSIC_VIDEO: 1, VOICE_TRAINING: 15 },
  YEARLY: { PROMPT_MUSIC: 250, PHOTO_MUSIC: 100, LYRICS_MUSIC: 100, AI_SINGING: 50, AI_MUSIC_VIDEO: 5, VOICE_TRAINING: 50 },
};

export const CREDIT_COSTS: Record<Feature, number> = {
  PROMPT_MUSIC: 13,
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
  MONTHLY: "Pro monthly",
  YEARLY: "Pro yearly",
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
