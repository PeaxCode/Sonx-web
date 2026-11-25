"use client";

import Image from "next/image";
import { useRef } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconClose, IconNext, IconPause, IconPlay, IconPrevious } from "@/components/icons";
import { formatTime } from "@/lib/audio";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { DownloadButton } from "./download-button";
import { FullPlayer } from "./full-player";
import { usePlayer } from "./player";
import { kindLabel } from "./track-list";

function Seek({ className = "" }: { className?: string }) {
  const { time, duration, seek } = usePlayer();
  const progress = duration > 0 ? (time / duration) * 100 : 0;
  return (
    <div className={`group relative h-1 rounded-full bg-paper/15 ${className}`}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-paper transition-colors group-hover:bg-orchid" style={{ width: `${progress}%` }} />
      <span aria-hidden="true" className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper opacity-0 shadow transition group-hover:opacity-100"
        style={{ left: `${progress}%` }} />
      <input type="range" aria-label="Seek" min={0} max={duration || 0} step={0.1} value={time}
        onChange={(event) => seek(Number(event.target.value))}
        className="absolute -inset-y-2 inset-x-0 h-[calc(100%+1rem)] w-full cursor-pointer opacity-0" />
    </div>
  );
}

/** Lyrics icon: speech lines, for opening the full player. */
const IconLyrics = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h16M4 11h12M4 16h9" />
    <circle cx="18.5" cy="17.5" r="2.5" />
  </svg>
);

/** Playback bar, shown once a song has been played. Opens the full player; can be closed. */
export function PlayerBar() {
  const { current, playing, time, duration, toggle, next, previous, close, hasNext, hasPrevious, expanded, expand } = usePlayer();
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
      {expanded && <FullPlayer />}
      <div ref={barRef}
        className="fixed inset-x-0 bottom-16 z-40 border-t border-paper/5 bg-night/85 backdrop-blur-xl md:bottom-0 md:left-60">
        {/* Phones: a hairline of progress on top of the bar. */}
        <div className="h-0.5 w-full bg-paper/10 md:hidden">
          <div className="h-full bg-paper" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:px-5 md:py-3">
          <button type="button" aria-label={`Open player: ${current.title}`} onClick={expand}
            className="group flex min-w-0 items-center gap-3 text-left">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-[10px] shadow-lg">
              {current.cover_url ? (
                <Image src={current.cover_url} alt="" fill sizes="48px" className="object-cover transition duration-500 group-hover:scale-110" />
              ) : (
                <CoverArt seed={current.id} className="size-full transition duration-500 group-hover:scale-110" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium group-hover:underline">{current.title}</span>
              <span className="block truncate text-xs text-paper/55">{kindLabel(current)}</span>
            </span>
          </button>

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1 md:gap-3">
              <button type="button" aria-label="Previous song" disabled={!hasPrevious} onClick={previous}
                className="hidden rounded-full p-2 text-paper/70 transition hover:text-paper disabled:opacity-30 sm:block">
                <IconPrevious size={18} />
              </button>
              <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle}
                className="flex size-10 items-center justify-center rounded-full bg-paper text-night transition hover:scale-105 active:scale-95">
                {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
              </button>
              <button type="button" aria-label="Next song" disabled={!hasNext} onClick={next}
                className="hidden rounded-full p-2 text-paper/70 transition hover:text-paper disabled:opacity-30 sm:block">
                <IconNext size={18} />
              </button>
              <button type="button" aria-label="Close player" onClick={close}
                className="rounded-full p-2 text-paper/70 transition hover:text-paper md:hidden">
                <IconClose size={18} />
              </button>
            </div>
            <div className="hidden w-full max-w-xl items-center gap-3 text-[11px] text-paper/55 tabular-nums md:flex">
              <span className="w-9 text-right">{formatTime(time)}</span>
              <Seek className="flex-1" />
              <span className="w-9">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-1 md:flex">
            <button type="button" aria-label="Show lyrics" onClick={expand}
              className="rounded-full p-2 text-paper/70 transition hover:bg-paper/10 hover:text-paper">
              <IconLyrics />
            </button>
            {current.output_url && (
              <DownloadButton generation={current} className="rounded-full p-2 text-paper/70 transition hover:bg-paper/10 hover:text-paper" />
            )}
            <button type="button" aria-label="Close player" onClick={close}
              className="rounded-full p-2 text-paper/70 transition hover:bg-paper/10 hover:text-paper">
              <IconClose size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
