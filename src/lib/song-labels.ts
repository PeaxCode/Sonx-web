import { GENRES, type Feature } from "@/lib/billing-config";

// Display labels for a song. Plain functions with no client-only imports, so
// server components (the shared song page, its metadata) can call them too.

/** "Pop", "Lo-fi"...; an unknown genre ID is shown as is, a missing one as "". */
export const genreName = (id: string | null) => GENRES.find((genre) => genre.id === id)?.name ?? id ?? "";

export const kindLabel = (generation: { feature: Feature }) => {
  switch (generation.feature) {
    case "AI_MUSIC_VIDEO": return "Music video";
    case "LYRICS_MUSIC": return "Song with vocals";
    // AI Voice is hidden; older AI_SINGING rows read as a plain song.
    case "AI_SINGING": return "Song with vocals";
    default: return "Instrumental";
  }
};
