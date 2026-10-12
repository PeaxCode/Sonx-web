"use client";

import { formatTime } from "@/lib/audio";
import { IconNext, IconPause, IconPlay, IconPrevious } from "@/components/icons";
import { usePlayer } from "./player";

/** Always-visible playback bar, shown once a song has been played. */
export function PlayerBar() {
  const { current, playing, time, duration, toggle, seek, next, previous, hasNext, hasPrevious } = usePlayer();
  if (!current) return null;

  const progress = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-line bg-plum/95 backdrop-blur md:bottom-0 md:left-60">
      {/* The signature gradient marks playback progress. */}
      <div className="relative h-1 w-full bg-raised">
        <div className="bg-signature absolute inset-y-0 left-0" style={{ width: `${progress}%` }} />
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(event) => seek(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{current.title}</p>
          <p className="text-xs text-fog tabular-nums">
            {formatTime(time)} / {formatTime(duration)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous song" disabled={!hasPrevious} onClick={previous}
            className="rounded-full p-2 text-fog transition hover:text-paper disabled:opacity-30">
            <IconPrevious size={18} />
          </button>
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle}
            className="rounded-full bg-paper p-3 text-night transition hover:scale-105">
            {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
          </button>
          <button type="button" aria-label="Next song" disabled={!hasNext} onClick={next}
            className="rounded-full p-2 text-fog transition hover:text-paper disabled:opacity-30">
            <IconNext size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
