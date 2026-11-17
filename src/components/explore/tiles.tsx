"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconHeart, IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/components/studio/player";
import { genreName } from "@/components/studio/track-list";
import type { ExploreTrack } from "@/lib/explore-mock";

/** A stable hue shift per song, so mock covers vary like real artwork would. */
const hueFor = (seed: string) => [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 7);

export const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const artistHref = (handle: string) => `/artist/${handle}`;

export function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}

/** A song: square cover that plays on click, title and genre, artist, plays and likes. */
export function TrackTile({ track, queue, wide = false }: { track: ExploreTrack; queue: ExploreTrack[]; wide?: boolean }) {
  const { current, playing, play, open } = usePlayer();
  const isCurrent = current?.id === track.id;
  return (
    <li className={`${wide ? "" : "w-[148px] shrink-0 snap-start md:w-[172px]"}`}>
      <button type="button" onClick={() => play(track, queue)}
        aria-label={isCurrent && playing ? `Pause ${track.title}` : `Play ${track.title}`}
        className="group relative block aspect-square w-full overflow-hidden rounded-[12px] bg-raised">
        <span className="block size-full" style={{ filter: `hue-rotate(${hueFor(track.title)}deg) saturate(1.2)` }}>
          <CoverArt seed={track.id} className="size-full transition duration-500 ease-out group-hover:scale-105" />
        </span>
        <span aria-hidden="true" className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
        <span className={`absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-night shadow-xl transition duration-200 ${
          isCurrent ? "scale-100 opacity-100" : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
        }`}>
          {isCurrent && playing ? <IconPause size={18} /> : <IconPlay size={18} />}
        </span>
      </button>
      <div className="mt-2 flex items-baseline gap-2">
        <button type="button" onClick={() => open(track, queue)}
          className={`min-w-0 truncate text-left text-sm font-medium hover:underline ${isCurrent ? "text-orchid" : ""}`}>
          {track.title}
        </button>
        {track.genre && <span className="shrink-0 text-[11px] text-orchid/80">{genreName(track.genre)}</span>}
      </div>
      <Link href={artistHref(track.artistHandle)} className="block truncate text-[13px] text-paper/55 hover:text-paper hover:underline">
        {track.artist}
      </Link>
      <p className="mt-0.5 flex items-center gap-3 text-[11px] text-paper/45 tabular-nums">
        <span className="flex items-center gap-1"><IconPlay size={10} /><span className="sr-only">Plays: </span>{compact.format(track.plays)}</span>
        <span className="flex items-center gap-1"><IconHeart size={11} /><span className="sr-only">Likes: </span>{compact.format(track.likes)}</span>
      </p>
    </li>
  );
}

/**
 * A titled row that scrolls sideways, with arrow buttons once it overflows.
 * `arrowTop` centres the arrows on the row's artwork.
 */
export function Shelf({ id, title, onSeeAll, arrowTop = "top-[74px] md:top-[86px]", children }: {
  id: string;
  title: string;
  onSeeAll?: () => void;
  arrowTop?: string;
  children: React.ReactNode;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setEdges({
      start: element.scrollLeft <= 4,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4,
    });
    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    const element = scroller.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow = `absolute ${arrowTop} hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-night/80 text-paper shadow-lg backdrop-blur transition hover:bg-night md:flex`;

  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id={`${id}-title`} className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
        {onSeeAll && (
          <button type="button" onClick={onSeeAll}
            className="flex items-center gap-1 rounded-full border border-paper/15 px-3 py-1 text-xs font-medium transition hover:border-paper/40 hover:bg-paper/5">
            See all <Chevron direction="right" />
          </button>
        )}
      </div>
      {/* Clip, not hidden: keeps the row's overflow off the page without a new scroll container. */}
      <div className="relative -mx-4 overflow-x-clip px-4 md:mx-0 md:px-0">
        <ul ref={scroller} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
          {children}
        </ul>
        {!edges.start && (
          <button type="button" aria-label={`Scroll ${title} back`} onClick={() => scrollBy(-1)} className={`${arrow} left-2`}>
            <Chevron direction="left" />
          </button>
        )}
        {!edges.end && (
          <button type="button" aria-label={`Scroll ${title} forward`} onClick={() => scrollBy(1)} className={`${arrow} right-2`}>
            <Chevron direction="right" />
          </button>
        )}
      </div>
    </section>
  );
}
