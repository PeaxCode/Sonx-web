"use client";

import { MUSIC_FEATURES } from "@/lib/generations";
import { useLibrary } from "./library";
import { TrackList } from "./track-list";

/** Songs only (no videos), newest first, including ones made in the app. */
export function MusicList() {
  const { generations, loading } = useLibrary();
  if (loading) return <p className="text-fog">Loading your songs</p>;
  return (
    <TrackList
      generations={generations.filter((generation) => MUSIC_FEATURES.includes(generation.feature))}
      emptyText="Your songs show up here, along with the ones you make in the Sonx app."
    />
  );
}
