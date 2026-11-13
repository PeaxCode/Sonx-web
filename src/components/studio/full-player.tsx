"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconChevronDown, IconDownload, IconNext, IconPause, IconPlay, IconPrevious } from "@/components/icons";
import { formatTime } from "@/lib/audio";
import { activeLyricIndex, timeLyrics } from "@/lib/lyrics-sync";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { genreName, kindLabel } from "./track-list";
import { usePlayer } from "./player";

// After the listener scrolls the lyrics themselves, follow-along waits this long.
const MANUAL_SCROLL_PAUSE_MS = 4000;

/**
 * Lyrics that follow the song: the line being sung is bright and kept in the
 * middle, sung lines dim, and clicking a line jumps there. Timing is estimated
 * (see lib/lyrics-sync), so it follows the song closely but not exactly.
 */
function SyncedLyrics({ text }: { text: string }) {
  const { time, duration, seek, playing } = usePlayer();
  const lines = useMemo(() => timeLyrics(text, duration), [text, duration]);
  const timed = duration > 0;
  const active = timed ? activeLyricIndex(lines, time) : -1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLElement | null)[]>([]);
  const manualUntil = useRef(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const line = lineRefs.current[active];
    if (!scroller || !line || Date.now() < manualUntil.current) return;
    const top = line.offsetTop - scroller.clientHeight / 2 + line.clientHeight / 2;
    scroller.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active]);

  const pauseFollow = () => {
    manualUntil.current = Date.now() + MANUAL_SCROLL_PAUSE_MS;
  };

  return (
    <div ref={scrollerRef} onWheel={pauseFollow} onTouchMove={pauseFollow}
      className="h-full overflow-y-auto overscroll-contain px-1 py-[30vh] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] [scrollbar-width:none]">
      {lines.map((line, index) => {
        if (line.kind === "gap") return <div key={index} className="h-5" />;
        if (line.kind === "section") {
          return (
            <p key={index} className="pb-2 pt-6 text-sm font-medium text-fog/70">{line.text}</p>
          );
        }
        const state = !timed ? "plain" : index === active ? "active" : index < active ? "past" : "future";
        return (
          <button key={index} ref={(element) => { lineRefs.current[index] = element; }} type="button"
            onClick={() => timed && seek(line.start + 0.05)}
            aria-current={state === "active" ? "true" : undefined}
            className={`block w-full origin-left py-1.5 text-left text-2xl font-semibold leading-snug tracking-[-0.02em] transition duration-500 ease-out md:text-[2rem] ${
              state === "active"
                ? `text-paper ${playing ? "scale-[1.02]" : ""}`
                : state === "past"
                  ? "text-paper/30 hover:text-paper/60"
                  : state === "future"
                    ? "text-paper/55 hover:text-paper/80"
                    : "text-paper/85"
            }`}>
            {line.text}
          </button>
        );
      })}
      {timed && <p className="pt-10 text-xs text-fog/60">Lyric timing is estimated from the song length.</p>}
    </div>
  );
}

/** Full-screen player: large cover and controls beside lyrics that follow the song. */
export function FullPlayer() {
  const { current, playing, time, duration, toggle, seek, next, previous, hasNext, hasPrevious, minimize } = usePlayer();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { yPercent: 100, duration: 0.5, ease: "power3.out", clearProps: "transform" });
  }, { scope: ref });

  // Escape minimizes, space plays or pauses; the page behind stops scrolling while open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") minimize();
      if (event.key === " " && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [minimize, toggle]);

  if (!current) return null;

  const progress = duration > 0 ? (time / duration) * 100 : 0;
  const words = current.lyrics?.trim() || null;
  const details = [kindLabel(current), genreName(current.genre)].filter(Boolean).join(", ");
  const cover = current.cover_url ? (
    <Image src={current.cover_url} alt="" fill sizes="(min-width: 768px) 440px, 80vw" className="object-cover" />
  ) : (
    <CoverArt seed={current.id} className="size-full" />
  );

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`Now playing: ${current.title}`}
      className="fixed inset-0 z-50 overflow-hidden bg-night">
      {/* The cover, blurred and enlarged, tints the whole screen. */}
      <div className="pointer-events-none absolute inset-0 scale-150 opacity-60 blur-[90px] saturate-150" aria-hidden="true">{cover}</div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/40 via-night/60 to-night" aria-hidden="true" />

      <div className="relative flex h-full flex-col">
        <header className="flex items-center justify-between px-4 py-3 md:px-8 md:py-5">
          <button type="button" aria-label="Minimize player" onClick={minimize}
            className="rounded-full p-2 text-paper/70 transition hover:bg-paper/10 hover:text-paper">
            <IconChevronDown size={26} />
          </button>
          <p className="text-sm font-medium text-paper/70">Now playing</p>
          {current.output_url ? (
            <a href={current.output_url} download target="_blank" rel="noreferrer" aria-label={`Download ${current.title}`}
              className="rounded-full p-2 text-paper/70 transition hover:bg-paper/10 hover:text-paper">
              <IconDownload size={22} />
            </a>
          ) : <span className="size-10" />}
        </header>

        <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-8 overflow-y-auto px-6 pb-8 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-16 md:overflow-hidden md:px-10">
          <section className="flex flex-col justify-center gap-7 md:py-6">
            <div className="relative mx-auto aspect-square w-full max-w-[min(440px,44vh)] overflow-hidden rounded-[24px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]">
              {cover}
            </div>
            <div className="mx-auto w-full max-w-[440px]">
              <h2 className="truncate text-3xl font-semibold tracking-[-0.03em]">{current.title}</h2>
              {details && <p className="mt-1 truncate text-paper/60">{details}</p>}

              <div className="group relative mt-6 h-1.5 w-full rounded-full bg-paper/15">
                <div className="absolute inset-y-0 left-0 rounded-full bg-paper" style={{ width: `${progress}%` }} />
                <span aria-hidden="true" className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper opacity-0 shadow transition group-hover:opacity-100"
                  style={{ left: `${progress}%` }} />
                <input type="range" aria-label="Seek" min={0} max={duration || 0} step={0.1} value={time}
                  onChange={(event) => seek(Number(event.target.value))}
                  className="absolute -inset-y-2 inset-x-0 h-[calc(100%+1rem)] w-full cursor-pointer opacity-0" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-paper/60 tabular-nums">
                <span>{formatTime(time)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-8">
                <button type="button" aria-label="Previous song" disabled={!hasPrevious} onClick={previous}
                  className="rounded-full p-3 text-paper/80 transition hover:scale-110 hover:text-paper disabled:opacity-30 disabled:hover:scale-100">
                  <IconPrevious size={28} />
                </button>
                <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle}
                  className="flex size-[72px] items-center justify-center rounded-full bg-paper text-night shadow-xl transition hover:scale-105 active:scale-95">
                  {playing ? <IconPause size={30} /> : <IconPlay size={30} />}
                </button>
                <button type="button" aria-label="Next song" disabled={!hasNext} onClick={next}
                  className="rounded-full p-3 text-paper/80 transition hover:scale-110 hover:text-paper disabled:opacity-30 disabled:hover:scale-100">
                  <IconNext size={28} />
                </button>
              </div>
            </div>
          </section>

          <section aria-label="Lyrics" className="min-h-[50vh] md:min-h-0">
            {words ? (
              <SyncedLyrics key={current.id} text={words} />
            ) : (
              <div className="flex h-full flex-col justify-center">
                <p className="text-sm font-medium text-paper/60">{current.prompt ? "About this song" : "Lyrics"}</p>
                <p className="mt-3 text-2xl font-semibold leading-snug tracking-[-0.02em] text-paper/85">
                  {current.prompt
                    ?? (current.feature === "PROMPT_MUSIC" || current.feature === "PHOTO_MUSIC"
                      ? "This song is instrumental, so there are no lyrics."
                      : "Lyrics aren't available for this song.")}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
