"use client";

import { useCallback, useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { formatTime } from "@/lib/audio";
import { IconClose, IconNext, IconPause, IconPlay, IconPrevious } from "@/components/icons";
import { FullPlayer } from "./full-player";
import { usePlayer } from "./player";

/** Playback bar, shown once a song has been played. Opens the full player; can be closed. */
export function PlayerBar() {
  const { current, playing, time, duration, toggle, seek, next, previous, close, hasNext, hasPrevious } = usePlayer();
  const [expanded, setExpanded] = useState(false);
  const minimize = useCallback(() => setExpanded(false), []);
  const barRef = useRef<HTMLDivElement>(null);
  const hasTrack = current !== null;

  // Slides up the first time a song plays.
  useGSAP(() => {
    if (!hasTrack || prefersReducedMotion()) return;
    gsap.from(barRef.current, { yPercent: 100, duration: 0.45, ease: "power3.out", clearProps: "transform" });
  }, { dependencies: [hasTrack] });

  if (!current) return null;

  const progress = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <>
      {expanded && <FullPlayer onMinimize={minimize} />}
      <div ref={barRef} className="fixed inset-x-0 bottom-16 z-40 border-t border-line bg-plum/95 backdrop-blur md:bottom-0 md:left-60">
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
          <button type="button" aria-label={`Open player: ${current.title}`} onClick={() => setExpanded(true)}
            className="group flex min-w-0 flex-1 items-center gap-4 text-left">
            <CoverArt seed={current.id} className="size-11 shrink-0 rounded-[10px] transition group-hover:scale-105" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium group-hover:underline">{current.title}</span>
              <span className="block text-xs text-fog tabular-nums">
                {formatTime(time)} / {formatTime(duration)}
              </span>
            </span>
          </button>
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
            <button type="button" aria-label="Close player" onClick={() => { setExpanded(false); close(); }}
              className="ml-1 rounded-full p-2 text-fog transition hover:text-paper">
              <IconClose size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
