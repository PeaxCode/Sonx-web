"use client";

import { useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconHeart, IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/components/studio/player";
import { genreName } from "@/components/studio/track-list";
import { ALL_EXPLORE_TRACKS, EXPLORE_SECTIONS, GENRE_PLAYLISTS, type ExploreTrack } from "@/lib/explore-mock";

/** A stable hue shift per song, so mock covers vary like real artwork would. */
const hueFor = (seed: string) => [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 7);

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}

/** A song: square cover that plays on click, title and genre, artist, plays and likes. */
function TrackTile({ track, queue, wide = false }: { track: ExploreTrack; queue: ExploreTrack[]; wide?: boolean }) {
  const { current, playing, play, open } = usePlayer();
  const isCurrent = current?.id === track.id;
  return (
    <li className={`${wide ? "" : "w-[168px] shrink-0 snap-start md:w-[200px]"}`}>
      <button type="button" onClick={() => play(track, queue)}
        aria-label={isCurrent && playing ? `Pause ${track.title}` : `Play ${track.title}`}
        className="group relative block aspect-square w-full overflow-hidden rounded-[14px] bg-raised">
        <span className="block size-full" style={{ filter: `hue-rotate(${hueFor(track.title)}deg) saturate(1.2)` }}>
          <CoverArt seed={track.id} className="size-full transition duration-500 ease-out group-hover:scale-105" />
        </span>
        <span aria-hidden="true" className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
        <span className={`absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-night shadow-xl transition duration-200 ${
          isCurrent ? "scale-100 opacity-100" : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
        }`}>
          {isCurrent && playing ? <IconPause size={20} /> : <IconPlay size={20} />}
        </span>
      </button>
      <div className="mt-2.5 flex items-baseline gap-2">
        <button type="button" onClick={() => open(track, queue)}
          className={`min-w-0 truncate text-left text-[15px] font-medium hover:underline ${isCurrent ? "text-orchid" : ""}`}>
          {track.title}
        </button>
        {track.genre && <span className="shrink-0 text-xs text-orchid/80">{genreName(track.genre)}</span>}
      </div>
      <p className="truncate text-sm text-paper/55">{track.artist}</p>
      <p className="mt-1 flex items-center gap-3 text-xs text-paper/45 tabular-nums">
        <span className="flex items-center gap-1"><IconPlay size={11} /><span className="sr-only">Plays: </span>{compact.format(track.plays)}</span>
        <span className="flex items-center gap-1"><IconHeart size={12} /><span className="sr-only">Likes: </span>{compact.format(track.likes)}</span>
      </p>
    </li>
  );
}

/** A titled row that scrolls sideways, with arrow buttons once it overflows. */
function Shelf({ id, title, onSeeAll, children }: { id: string; title: string; onSeeAll?: () => void; children: React.ReactNode }) {
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

  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
        {onSeeAll && (
          <button type="button" onClick={onSeeAll}
            className="flex items-center gap-1 rounded-full border border-paper/15 px-3.5 py-1.5 text-sm font-medium transition hover:border-paper/40 hover:bg-paper/5">
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
          <button type="button" aria-label={`Scroll ${title} back`} onClick={() => scrollBy(-1)}
            className="absolute left-2 top-[84px] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-night/80 text-paper shadow-lg backdrop-blur transition hover:bg-night md:flex md:top-[100px]">
            <Chevron direction="left" />
          </button>
        )}
        {!edges.end && (
          <button type="button" aria-label={`Scroll ${title} forward`} onClick={() => scrollBy(1)}
            className="absolute right-2 top-[84px] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-night/80 text-paper shadow-lg backdrop-blur transition hover:bg-night md:flex md:top-[100px]">
            <Chevron direction="right" />
          </button>
        )}
      </div>
    </section>
  );
}

/** "Best of" a genre: a gradient mesh card with two cards stacked behind it. */
function PlaylistTile({ playlist, onOpen }: { playlist: (typeof GENRE_PLAYLISTS)[number]; onOpen: () => void }) {
  const [from, to] = playlist.colors;
  return (
    <li className="w-[168px] shrink-0 snap-start md:w-[200px]">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <span className="relative block pt-2">
          <span aria-hidden="true" className="absolute inset-x-4 top-0 h-3 rounded-t-[12px] opacity-40" style={{ background: to }} />
          <span aria-hidden="true" className="absolute inset-x-2 top-1 h-3 rounded-t-[12px] opacity-70" style={{ background: from }} />
          <span className="relative block aspect-square overflow-hidden rounded-[14px] transition duration-300 ease-out group-hover:-translate-y-1"
            style={{
              background: `radial-gradient(circle at 25% 30%, ${from} 0%, transparent 55%), radial-gradient(circle at 75% 75%, ${to} 0%, transparent 60%), linear-gradient(135deg, ${to}, ${from})`,
            }}>
            <span className="absolute left-4 top-3 text-[28px] font-medium tracking-[-0.03em] text-paper drop-shadow">{playlist.name}</span>
          </span>
        </span>
        <span className="mt-2.5 block text-[15px] font-medium">Best of {playlist.name}</span>
        <span className="block text-sm text-paper/55">Sonx, {playlist.songs} songs</span>
      </button>
    </li>
  );
}

const matches = (track: ExploreTrack, query: string) => {
  const needle = query.trim().toLowerCase();
  return [track.title, track.artist, genreName(track.genre)].some((field) => field.toLowerCase().includes(needle));
};

export function ExploreView() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const results = query.trim() ? ALL_EXPLORE_TRACKS.filter((track) => matches(track, query)) : null;
  const expandedSection = EXPLORE_SECTIONS.find((section) => section.id === expanded);

  const searchGenre = (name: string) => {
    setExpanded(null);
    setQuery(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-12">
      <label className="sticky top-0 z-20 -mx-4 block bg-night/85 px-4 py-3 backdrop-blur-xl md:mx-0 md:px-0">
        <span className="sr-only">Search songs, artists or genres</span>
        <span className="relative block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"
            className="absolute left-5 top-1/2 -translate-y-1/2 text-paper/50">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setExpanded(null); }}
            placeholder="Search for songs, artists or genres"
            className="w-full rounded-full bg-paper/[0.07] py-3.5 pl-12 pr-5 text-[15px] transition placeholder:text-paper/40 hover:bg-paper/10 focus:bg-paper/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-paper/40" />
        </span>
      </label>

      {results ? (
        <section aria-labelledby="results-title">
          <h2 id="results-title" className="mb-4 text-2xl font-semibold tracking-[-0.03em]">
            {results.length ? `Results for "${query.trim()}"` : `Nothing matches "${query.trim()}"`}
          </h2>
          {results.length > 0 ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {results.map((track) => <TrackTile key={track.id} track={track} queue={results} wide />)}
            </ul>
          ) : (
            <p className="text-paper/60">Try a genre like lo-fi or pop, or an artist name.</p>
          )}
        </section>
      ) : expandedSection ? (
        <section aria-labelledby="expanded-title">
          <div className="mb-4 flex items-center gap-3">
            <button type="button" aria-label="Back to Explore" onClick={() => setExpanded(null)}
              className="flex size-9 items-center justify-center rounded-full bg-paper/[0.07] transition hover:bg-paper/15">
              <Chevron direction="left" />
            </button>
            <h2 id="expanded-title" className="text-2xl font-semibold tracking-[-0.03em]">{expandedSection.title}</h2>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {expandedSection.tracks.map((track) => <TrackTile key={track.id} track={track} queue={expandedSection.tracks} wide />)}
          </ul>
        </section>
      ) : (
        <>
          {EXPLORE_SECTIONS.map((section) => (
            <Shelf key={section.id} id={section.id} title={section.title} onSeeAll={() => setExpanded(section.id)}>
              {section.tracks.map((track) => <TrackTile key={track.id} track={track} queue={section.tracks} />)}
            </Shelf>
          ))}
          <Shelf id="best-of" title="Best of">
            {GENRE_PLAYLISTS.map((playlist) => (
              <PlaylistTile key={playlist.genre} playlist={playlist} onOpen={() => searchGenre(playlist.name)} />
            ))}
          </Shelf>
        </>
      )}
    </div>
  );
}
