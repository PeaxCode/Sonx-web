"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CoverArt } from "@/components/cover-art";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { formatTime } from "@/lib/audio";
import { IconChevronDown, IconDownload, IconNext, IconPause, IconPlay, IconPrevious } from "@/components/icons";
import { genreName, kindLabel } from "./track-list";
import { usePlayer } from "./player";

/** Lyrics with section tags like [Chorus] set apart as small labels. */
function Lyrics({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-lg leading-relaxed md:text-xl">
      {text.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-4" />;
        if (/^\[.*\]$/.test(trimmed)) {
          return (
            <p key={index} className="pt-3 text-xs font-semibold uppercase tracking-widest text-fog">
              {trimmed.slice(1, -1)}
            </p>
          );
        }
        return <p key={index} className="font-medium">{trimmed}</p>;
      })}
    </div>
  );
}

/** Full-screen player: large cover, controls and the song's lyrics. */
export function FullPlayer({ onMinimize }: { onMinimize: () => void }) {
  const { current, playing, time, duration, toggle, seek, next, previous, hasNext, hasPrevious } = usePlayer();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { yPercent: 100, duration: 0.45, ease: "power3.out", clearProps: "transform" });
  }, { scope: ref });

  // Escape minimizes; the page behind stops scrolling while open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onMinimize();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onMinimize]);

  if (!current) return null;

  const progress = duration > 0 ? (time / duration) * 100 : 0;
  const words = current.lyrics?.trim() || null;
  const details = [kindLabel(current), genreName(current.genre)].filter(Boolean).join(" · ");
  const cover = current.cover_url ? (
    <Image src={current.cover_url} alt="" fill sizes="(min-width: 768px) 420px, 80vw" className="object-cover" />
  ) : (
    <CoverArt seed={current.id} className="size-full" />
  );

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`Now playing: ${current.title}`}
      className="fixed inset-0 z-50 overflow-hidden bg-night">
      {/* The cover, blurred, tints the whole screen. */}
      <div className="pointer-events-none absolute inset-0 scale-125 opacity-50 blur-3xl" aria-hidden="true">{cover}</div>
      <div className="pointer-events-none absolute inset-0 bg-night/60" aria-hidden="true" />

      <div className="relative flex h-full flex-col">
        <header className="flex items-center justify-between px-4 py-3 md:px-8 md:py-5">
          <button type="button" aria-label="Minimize player" onClick={onMinimize}
            className="rounded-full p-2 text-fog transition hover:bg-raised hover:text-paper">
            <IconChevronDown size={24} />
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-fog">Now playing</p>
          {current.output_url ? (
            <a href={current.output_url} download target="_blank" rel="noreferrer" aria-label={`Download ${current.title}`}
              className="rounded-full p-2 text-fog transition hover:bg-raised hover:text-paper">
              <IconDownload size={22} />
            </a>
          ) : <span className="size-10" />}
        </header>

        <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-8 overflow-y-auto px-6 pb-10 md:grid-cols-2 md:gap-16 md:overflow-hidden md:px-10">
          <section className="flex flex-col justify-center gap-6 md:py-6">
            <div className="relative mx-auto aspect-square w-full max-w-[min(420px,42vh)] overflow-hidden rounded-[var(--radius-panel)] shadow-2xl">
              {cover}
            </div>
            <div className="mx-auto w-full max-w-[420px]">
              <h2 className="truncate font-display text-2xl font-semibold">{current.title}</h2>
              {details && <p className="mt-1 truncate text-sm text-fog">{details}</p>}

              <div className="relative mt-6 h-1.5 w-full rounded-full bg-raised">
                <div className="bg-signature absolute inset-y-0 left-0 rounded-full" style={{ width: `${progress}%` }} />
                <input type="range" aria-label="Seek" min={0} max={duration || 0} step={0.1} value={time}
                  onChange={(event) => seek(Number(event.target.value))}
                  className="absolute -inset-y-2 inset-x-0 h-[calc(100%+1rem)] w-full cursor-pointer opacity-0" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-fog tabular-nums">
                <span>{formatTime(time)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-6">
                <button type="button" aria-label="Previous song" disabled={!hasPrevious} onClick={previous}
                  className="rounded-full p-3 text-fog transition hover:text-paper disabled:opacity-30">
                  <IconPrevious size={26} />
                </button>
                <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle}
                  className="rounded-full bg-paper p-5 text-night transition hover:scale-105">
                  {playing ? <IconPause size={28} /> : <IconPlay size={28} />}
                </button>
                <button type="button" aria-label="Next song" disabled={!hasNext} onClick={next}
                  className="rounded-full p-3 text-fog transition hover:text-paper disabled:opacity-30">
                  <IconNext size={26} />
                </button>
              </div>
            </div>
          </section>

          <section aria-label="Lyrics" className="md:overflow-y-auto md:py-6 md:pr-2">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fog">
              {words ? "Lyrics" : current.prompt ? "About this song" : "Lyrics"}
            </h3>
            {words ? (
              <Lyrics text={words} />
            ) : current.prompt ? (
              <p className="text-lg leading-relaxed">{current.prompt}</p>
            ) : (
              <p className="text-fog">
                {current.feature === "PROMPT_MUSIC" || current.feature === "PHOTO_MUSIC"
                  ? "This song is instrumental, so there are no lyrics."
                  : "Lyrics aren't available for this song."}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
