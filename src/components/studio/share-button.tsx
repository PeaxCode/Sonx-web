"use client";

import { IconShare } from "@/components/icons";
import { trackEvent } from "@/lib/analytics";
import { shareGeneration, songUrl, type Generation } from "@/lib/generations";
import { useFeedback } from "./feedback";

/**
 * Publishes the song to its own page (/song/<id>) and hands the link to the
 * phone's share sheet, or copies it on desktop.
 */
export function ShareButton({ generation, className, size = 18 }: { generation: Generation; className: string; size?: number }) {
  const { notify } = useFeedback();
  // Only songs have a public page (videos and voice models cannot be shared).
  if (generation.is_sample || generation.feature === "AI_MUSIC_VIDEO" || generation.feature === "VOICE_TRAINING") return null;

  const share = async () => {
    try {
      await shareGeneration(generation.id);
    } catch {
      notify("Sharing is not available right now. Try again later.", "error");
      return;
    }
    const url = songUrl(generation.id);
    trackEvent("share", { method: "navigator" in window && "share" in navigator ? "share_sheet" : "copy", content_type: "song" });
    if (navigator.share) {
      // Cancelling the share sheet is not an error worth showing.
      await navigator.share({ title: generation.title, text: `Listen to “${generation.title}”, made with Sonx`, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    notify("Link copied. Anyone with it can listen.");
  };

  return (
    <button type="button" aria-label={`Share ${generation.title}`} onClick={share} className={className}>
      <IconShare size={size} />
    </button>
  );
}
