"use client";

import { IconPause, IconPlay } from "@/components/icons";
import type { Generation } from "@/lib/generations";
import type { SharedSong } from "@/lib/shared-songs";
import { usePlayer } from "./player";

/** Plays a shared song in the studio's player bar. */
export function SharedSongPlayButton({ song }: { song: SharedSong }) {
  const { current, playing, play, toggle } = usePlayer();
  const isCurrent = current?.id === song.id;
  // The player takes library rows; a shared song is shown read-only, like the examples.
  const track: Generation = {
    ...song,
    client_request_id: song.id,
    prompt: null,
    lyrics: null,
    status: "completed",
    error: null,
    is_favorite: false,
    completed_at: song.created_at,
    is_sample: true,
  };
  return (
    <button type="button" onClick={() => (isCurrent ? toggle() : play(track, [track]))}
      className="bg-signature flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-[0_12px_32px_-12px_rgb(229_99_241/0.8)] transition hover:brightness-110">
      {isCurrent && playing ? <IconPause size={18} /> : <IconPlay size={18} />}
      {isCurrent && playing ? "Pause" : "Play song"}
    </button>
  );
}
