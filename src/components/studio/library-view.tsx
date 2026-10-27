"use client";

import { useState } from "react";
import { MUSIC_FEATURES, type Generation } from "@/lib/generations";
import { SAMPLE_GENERATIONS } from "@/lib/samples";
import { useLibrary } from "./library";
import { useSession } from "./session";
import { TrackList } from "./track-list";

const FILTERS = [
  { id: "all", label: "All", match: () => true },
  { id: "songs", label: "Songs", match: (item: Generation) => MUSIC_FEATURES.includes(item.feature) },
  // Hidden with music video, pending payment provider review:
  // { id: "videos", label: "Videos", match: (item: Generation) => item.feature === "AI_MUSIC_VIDEO" },
  { id: "favorites", label: "Favorites", match: (item: Generation) => item.is_favorite },
] as const;

export function LibraryView() {
  const { generations, loading } = useLibrary();
  const { signedIn, requestSignIn } = useSession();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const active = FILTERS.find((item) => item.id === filter)!;

  return (
    <>
      <div role="tablist" aria-label="Filter" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${filter === item.id ? "border-violet bg-violet/15 text-paper" : "border-line text-fog hover:text-paper"}`}>
            {item.label}
          </button>
        ))}
      </div>
      {signedIn === false ? (
        <div className="rounded-[var(--radius-panel)] border border-line p-6">
          <p className="font-medium">Your songs live here</p>
          <p className="mt-1 text-sm text-fog">Sign in to see what you made, on the web and in the Sonx app.</p>
          <button type="button" onClick={() => requestSignIn({ next: "/library", title: "Sign in to see your library" })}
            className="bg-signature mt-4 rounded-[var(--radius-control)] px-5 py-2.5 text-sm font-semibold transition hover:brightness-110">
            Sign in
          </button>
        </div>
      ) : loading || signedIn === null ? (
        <p className="text-fog">Loading your library</p>
      ) : (
        <TrackList
          generations={generations.filter(active.match)}
          emptyText={filter === "favorites" ? "Tap the heart on a song to keep it here." : "Nothing here yet. Create a song to get started."}
        />
      )}

      {/* The same examples the mobile app shows in its library. */}
      {filter !== "favorites" && SAMPLE_GENERATIONS.some(active.match) && (
        <section aria-labelledby="samples-title" className="mt-12">
          <h2 id="samples-title" className="font-display text-lg font-semibold">Examples from Sonx</h2>
          <p className="mb-2 mt-1 text-sm text-fog">Made with Sonx. Play them to hear what you can create.</p>
          <TrackList generations={SAMPLE_GENERATIONS.filter(active.match)} emptyText="" />
        </section>
      )}
    </>
  );
}
