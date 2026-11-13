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
      <div role="tablist" aria-label="Filter" className="mb-6 flex flex-wrap gap-2 border-b border-paper/5 pb-6">
        {FILTERS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === item.id ? "bg-paper text-night" : "bg-paper/[0.06] text-paper/70 hover:bg-paper/10 hover:text-paper"}`}>
            {item.label}
          </button>
        ))}
      </div>
      {signedIn === false ? (
        <div className="rounded-[24px] bg-paper/[0.04] p-8">
          <p className="text-xl font-semibold tracking-[-0.02em]">Your songs live here</p>
          <p className="mt-1 text-paper/60">Sign in to see what you made, on the web and in the Sonx app.</p>
          <button type="button" onClick={() => requestSignIn({ next: "/library", title: "Sign in to see your library" })}
            className="mt-5 rounded-full bg-paper px-6 py-2.5 text-sm font-semibold text-night transition hover:bg-paper/90">
            Sign in
          </button>
        </div>
      ) : loading || signedIn === null ? (
        <p className="text-paper/60">Loading your library</p>
      ) : (
        <TrackList
          generations={generations.filter(active.match)}
          emptyText={filter === "favorites" ? "Tap the heart on a song to keep it here." : "Nothing here yet. Create a song to get started."}
        />
      )}

      {/* The same examples the mobile app shows in its library. */}
      {filter !== "favorites" && SAMPLE_GENERATIONS.some(active.match) && (
        <section aria-labelledby="samples-title" className="mt-12">
          <h2 id="samples-title" className="text-2xl font-semibold tracking-[-0.03em]">Examples from Sonx</h2>
          <p className="mb-4 mt-1 text-paper/60">Made with Sonx. Play them to hear what you can create.</p>
          <TrackList generations={SAMPLE_GENERATIONS.filter(active.match)} emptyText="" />
        </section>
      )}
    </>
  );
}
