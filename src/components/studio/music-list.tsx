"use client";

import { MUSIC_FEATURES } from "@/lib/generations";
import { SAMPLE_GENERATIONS } from "@/lib/samples";
import { useLibrary } from "./library";
import { useSession } from "./session";
import { TrackList } from "./track-list";

const heading = "mb-4 text-2xl font-semibold tracking-[-0.035em]";

/** Songs only (no videos), newest first, including ones made in the app. Visitors hear the examples. */
export function MusicList() {
  const { generations, loading } = useLibrary();
  const { signedIn } = useSession();

  if (signedIn === false) {
    return (
      <>
        <h2 id="songs-title" className={heading}>Hear what Sonx makes</h2>
        <TrackList generations={SAMPLE_GENERATIONS.filter((item) => MUSIC_FEATURES.includes(item.feature))} emptyText="" />
        <p className="mt-4 text-sm text-fog">Songs you create show up here, along with the ones you make in the Sonx app.</p>
      </>
    );
  }
  return (
    <>
      <h2 id="songs-title" className={heading}>Your songs</h2>
      {loading || signedIn === null ? <p className="text-paper/60">Loading your songs</p> : (
        <TrackList
          generations={generations.filter((generation) => MUSIC_FEATURES.includes(generation.feature))}
          emptyText="Your songs show up here, along with the ones you make in the Sonx app."
        />
      )}
    </>
  );
}
