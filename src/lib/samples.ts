import type { Generation } from "@/lib/generations";

// The examples the mobile app ships in its library (constants/sampleSongs.ts
// and sampleVideos.ts), served from /public/samples. The AI cover example is
// left out while AI Voice is hidden.
const sample = (fields: Pick<Generation, "id" | "feature" | "title" | "genre" | "output_url"> & Partial<Generation>): Generation => ({
  client_request_id: fields.id,
  prompt: null,
  lyrics: null,
  status: "completed",
  error: null,
  is_favorite: false,
  created_at: "2026-01-01T00:00:00.000Z",
  completed_at: "2026-01-01T00:00:00.000Z",
  is_sample: true,
  ...fields,
});

export const SAMPLE_GENERATIONS: Generation[] = [
  sample({
    id: "sample_minimax_001",
    feature: "LYRICS_MUSIC",
    title: "Midnight Wanderer",
    genre: "pop",
    output_url: "/samples/midnight-wanderer.mp3",
  }),
  sample({
    id: "sample_stable_audio_003",
    feature: "PROMPT_MUSIC",
    title: "Stable Diffusion Beats",
    genre: null,
    output_url: "/samples/stable-diffusion-beats.mp3",
  }),
  sample({
    id: "sample_video_omnihuman_001",
    feature: "AI_MUSIC_VIDEO",
    title: "C-5 Demo",
    genre: null,
    output_url: "/samples/c-5.mp4",
    cover_url: "/samples/c-5.jpg",
  }),
  sample({
    id: "sample_video_omnihuman_002",
    feature: "AI_MUSIC_VIDEO",
    title: "G-5 Demo",
    genre: null,
    output_url: "/samples/g-5.mp4",
    cover_url: "/samples/g-5.jpg",
  }),
];
