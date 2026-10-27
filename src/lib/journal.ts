// The Journal (blog) carried over from the old getsonx.com landing site.
// Each post is a static page in public/blog/<slug>/index.html, served at
// /blog/<slug>/ (with the trailing slash its canonical URL already uses).
// This list feeds sitemap.xml and llms.txt; add a post here when you add one there.

export const SITE_URL = "https://getsonx.com";

export type JournalPost = {
  slug: string;
  title: string;
  /** One or two sentences for llms.txt. */
  summary: string;
  /** Last content change, YYYY-MM-DD. */
  updated: string;
  priority: number;
};

export const JOURNAL_UPDATED = "2026-08-16";

export const JOURNAL_POSTS: JournalPost[] = [
  {
    slug: "how-ai-music-generation-works-2026",
    title: "How AI Music Generation Actually Works in 2026",
    summary: "Plain-English breakdown of the three-stage AI music pipeline — diffusion, transformers, and audio synthesis.",
    updated: "2026-05-07",
    priority: 0.7,
  },
  {
    slug: "suno-alternatives-2026",
    title: "Suno Alternatives in 2026: Which AI Music App Is Right for You?",
    summary: "Honest comparison of Suno, Udio, Sonx, and the rest of the field.",
    updated: "2026-05-21",
    priority: 0.7,
  },
  {
    slug: "how-to-make-a-tiktok-song",
    title: "How to Make a TikTok-Ready Song from a Single Sentence",
    summary: "Step-by-step guide to writing prompts that produce hook-first, vertical-friendly tracks for short-form video.",
    updated: "2026-06-04",
    priority: 0.7,
  },
  {
    slug: "can-grok-generate-music",
    title: "Can Grok Make Music? What xAI's Grok Can and Can't Do in 2026",
    summary: "What Grok and Grok Imagine actually do with music, why \"Grok Music\" sites aren't xAI, and how to turn a Grok lyric into a finished song.",
    updated: "2026-06-20",
    priority: 0.7,
  },
  {
    slug: "ai-music-prompts-analyzed",
    title: "We Analyzed 1,136 AI Music Prompts. Most of Them Are Too Short.",
    summary: "Original frequency study of 1,136 AI music prompts published across 16 public sources. Median prompt length is 7 words, only 21.6% specify a tempo, 69% say nothing about vocals, and 2.4% mention song structure. Includes a six-layer prompt formula and 143 original copy-paste prompts across 20 categories.",
    updated: "2026-07-30",
    priority: 0.8,
  },
  {
    slug: "how-to-make-a-song-with-ai",
    title: "How to Make a Song with AI in 2026 (Step by Step, Free)",
    summary: "Five-step workflow from a one-line idea to a finished track with vocals in about a minute — tool choice, prompt writing, lyrics, iteration, and export. Covers whether AI songs can sound professional and what free tiers include.",
    updated: "2026-08-05",
    priority: 0.8,
  },
  {
    slug: "can-you-make-money-with-ai-music",
    title: "Can You Make Money with AI Music? 7 Real Ways to Earn (2026)",
    summary: "Honest guide to AI music monetization — who owns an AI-generated song, what Spotify streams actually pay, seven realistic income routes (streaming, custom songs, background music, sync libraries), and what gets accounts banned.",
    updated: "2026-08-05",
    priority: 0.8,
  },
  {
    slug: "is-ai-music-allowed-on-spotify",
    title: "Is AI Music Allowed on Spotify? What Gets Banned in 2026",
    summary: "Spotify does not ban AI-generated music — it bans artist-voice impersonation, upload spam, and artificial streaming, and supports a DDEX-based AI disclosure standard. Includes rules for Apple Music, YouTube, Deezer, TikTok, and distributors like DistroKid and TuneCore.",
    updated: "2026-08-05",
    priority: 0.8,
  },
  {
    slug: "can-chatgpt-make-music",
    title: "Can ChatGPT Make Music? What It Can and Can't Do in 2026",
    summary: "ChatGPT writes lyrics, chords, and song structures but cannot produce audio; Sora 2 makes short videos with synced sound, not songs. Includes the ChatGPT-to-Sonx workflow for turning a lyric into a finished track.",
    updated: "2026-08-16",
    priority: 0.8,
  },
  {
    slug: "can-gemini-make-music",
    title: "Can Gemini Make Music? Lyria 3's Real Limits (2026)",
    summary: "Yes — Gemini generates real music with Lyria 3 (30-second tracks free, up to 3 minutes on Pro, vocals and image prompts), but every track is SynthID-watermarked, commercial rights are a license not ownership, and there is no section editing.",
    updated: "2026-08-16",
    priority: 0.8,
  },
  {
    slug: "can-claude-make-music",
    title: "Can Claude Make Music? The Honest 2026 Answer",
    summary: "Claude produces no audio — no Anthropic music model exists — but it writes arguably the best lyrics of the major chatbots, generates music as code (MIDI files, browser synth sketches), and can operate external music generators through tool connectors. A dedicated app still turns the words into a track.",
    updated: "2026-08-16",
    priority: 0.8,
  },
];

export const postUrl = (slug: string) => `${SITE_URL}/blog/${slug}/`;
