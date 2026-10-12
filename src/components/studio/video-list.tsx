"use client";

import { useLibrary } from "./library";
import { TrackList } from "./track-list";

export function VideoList() {
  const { generations, loading } = useLibrary();
  if (loading) return <p className="text-fog">Loading your videos</p>;
  return (
    <TrackList
      generations={generations.filter((generation) => generation.feature === "AI_MUSIC_VIDEO")}
      emptyText="Your music videos show up here, including the ones you make in the app."
    />
  );
}
