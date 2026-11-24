"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { exploreEnabled } from "@/lib/flags";
import type { Generation } from "@/lib/generations";
import { setPublished } from "@/lib/profiles";
import { useFeedback } from "./feedback";
import { useLibrary } from "./library";
import { useMyProfile } from "./my-profile";

const PUBLISHABLE = new Set(["PROMPT_MUSIC", "PHOTO_MUSIC", "LYRICS_MUSIC", "AI_SINGING"]);

/**
 * Public / Private switch for one of the user's finished songs. The first publish
 * creates the profile from the sign-in name and picture (editable later). Hidden where
 * profiles are off (production until launch) and for examples, videos and songs
 * still being made.
 */
export function PublishToggle({ generation, variant = "switch" }: { generation: Generation; variant?: "switch" | "compact" }) {
  const { profile, editProfile, ensureProfile } = useMyProfile();
  const { markPublished } = useLibrary();
  const { notify } = useFeedback();
  const [busy, setBusy] = useState(false);
  if (!exploreEnabled || generation.is_sample || generation.status !== "completed" || !PUBLISHABLE.has(generation.feature)) return null;

  const published = Boolean(generation.published_at);

  const apply = async (next: boolean) => {
    setBusy(true);
    try {
      // Publishing needs a profile: the first publish makes one, no form in the way.
      const created = next && !profile;
      const owner = next ? await ensureProfile() : profile;
      const at = await setPublished(generation.id, next);
      markPublished(generation.id, at);
      trackEvent(next ? "song_publish" : "song_unpublish", { feature: generation.feature });
      if (!next) notify(`“${generation.title}” is private again.`);
      else if (created && owner) notify(`Published. Your profile is @${owner.handle}.`, "info", { label: "Edit profile", onClick: () => editProfile() });
      else notify(`“${generation.title}” is on your profile and Explore.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "That did not work. Try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const onClick = () => {
    if (!busy) void apply(!published);
  };

  if (variant === "compact") {
    return (
      <button type="button" onClick={onClick} disabled={busy} aria-pressed={published}
        aria-label={published ? `Make ${generation.title} private` : `Publish ${generation.title} to your profile`}
        title={published ? "Public: on your profile and Explore" : "Private: only you can see it"}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${
          published ? "bg-orchid/15 text-orchid hover:bg-orchid/25" : "bg-paper/[0.06] text-paper/60 hover:bg-paper/10 hover:text-paper"
        }`}>
        {published ? "Public" : "Private"}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {published && profile && (
        <Link href={`/artist/${profile.handle}`} className="text-xs text-paper/55 hover:text-paper hover:underline">View</Link>
      )}
      <button type="button" role="switch" aria-checked={published} onClick={onClick} disabled={busy}
        aria-label={`Public on your profile: ${generation.title}`}
        className="flex items-center gap-2 text-xs font-medium text-paper/70 disabled:opacity-50">
        <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${published ? "bg-orchid" : "bg-paper/15"}`}>
          <span className={`absolute top-0.5 size-4 rounded-full bg-paper transition ${published ? "left-[18px]" : "left-0.5"}`} />
        </span>
        {published ? "Public" : "Private"}
      </button>
    </span>
  );
}
