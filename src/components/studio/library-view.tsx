"use client";

import { useState } from "react";
import { MUSIC_FEATURES, type Generation } from "@/lib/generations";
import { useLibrary } from "./library";
import { TrackList } from "./track-list";

const FILTERS = [
  { id: "all", label: "All", match: () => true },
  { id: "songs", label: "Songs", match: (item: Generation) => MUSIC_FEATURES.includes(item.feature) },
  { id: "videos", label: "Videos", match: (item: Generation) => item.feature === "AI_MUSIC_VIDEO" },
  { id: "favorites", label: "Favorites", match: (item: Generation) => item.is_favorite },
] as const;

export function LibraryView() {
  const { generations, loading } = useLibrary();
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
      {loading ? (
        <p className="text-fog">Loading your library</p>
      ) : (
        <TrackList
          generations={generations.filter(active.match)}
          emptyText={filter === "favorites" ? "Tap the heart on a song to keep it here." : "Nothing here yet. Create a song to get started."}
        />
      )}
    </>
  );
}
