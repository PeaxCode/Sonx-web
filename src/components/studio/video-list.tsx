"use client";

import { SAMPLE_GENERATIONS } from "@/lib/samples";
import { useLibrary } from "./library";
import { useSession } from "./session";
import { TrackList } from "./track-list";

const heading = "mb-4 font-display text-lg font-semibold";

/** Visitors see the example videos until they have their own. */
export function VideoList() {
  const { generations, loading } = useLibrary();
  const { signedIn } = useSession();

  if (signedIn === false) {
    return (
      <>
        <h2 id="videos-title" className={heading}>See what Sonx makes</h2>
        <TrackList generations={SAMPLE_GENERATIONS.filter((item) => item.feature === "AI_MUSIC_VIDEO")} emptyText="" />
        <p className="mt-4 text-sm text-fog">Videos you create show up here, including the ones you make in the app.</p>
      </>
    );
  }
  return (
    <>
      <h2 id="videos-title" className={heading}>Your videos</h2>
      {loading || signedIn === null ? <p className="text-fog">Loading your videos</p> : (
        <TrackList
          generations={generations.filter((generation) => generation.feature === "AI_MUSIC_VIDEO")}
          emptyText="Your music videos show up here, including the ones you make in the app."
        />
      )}
    </>
  );
}
