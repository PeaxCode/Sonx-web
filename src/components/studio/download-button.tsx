"use client";

import { IconDownload } from "@/components/icons";
import { trackEvent } from "@/lib/analytics";
import { downloadLink, type Generation } from "@/lib/generations";
import { useBilling } from "./billing";
import { useFeedback } from "./feedback";

/**
 * MP3 download. Examples download for everyone; the user's own songs need a
 * plan (free songs play but do not download), so free accounts get the paywall.
 */
export function DownloadButton({ generation, className, size = 18, label: text }: { generation: Generation; className: string; size?: number; label?: string }) {
  const { billing } = useBilling();
  const { openPaywall } = useFeedback();
  const label = `Download ${generation.title}`;

  if (!generation.is_sample && !billing?.isPro) {
    return (
      <button type="button" aria-label={label} className={className}
        onClick={() => {
          trackEvent("download_locked", { page: window.location.pathname });
          openPaywall("MP3 downloads come with a plan");
        }}>
        <IconDownload size={size} />
        {text && <span>{text}</span>}
      </button>
    );
  }
  const { href, filename } = downloadLink(generation);
  return (
    <a href={href} download={filename ?? true} aria-label={label} className={className}
      onClick={() => trackEvent("song_download", { sample: Boolean(generation.is_sample) })}>
      <IconDownload size={size} />
      {text && <span>{text}</span>}
    </a>
  );
}
