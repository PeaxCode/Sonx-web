"use client";

import { Fragment, useState } from "react";
import { genreName } from "@/components/studio/track-list";
import { ALL_EXPLORE_TRACKS, ARTISTS, EXPLORE_SECTIONS, GENRE_PLAYLISTS, tracksBy, type ExploreArtist, type ExploreTrack } from "@/lib/explore-mock";
import { useFollowing } from "@/lib/follows";
import { ArtistRow } from "./artist";
import { Chevron, Shelf, TrackTile } from "./tiles";

/** "Best of" a genre: a gradient mesh card with two cards stacked behind it. */
function PlaylistTile({ playlist, onOpen }: { playlist: (typeof GENRE_PLAYLISTS)[number]; onOpen: () => void }) {
  const [from, to] = playlist.colors;
  return (
    <li className="w-[148px] shrink-0 snap-start md:w-[172px]">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <span className="relative block pt-2">
          <span aria-hidden="true" className="absolute inset-x-4 top-0 h-3 rounded-t-[12px] opacity-40" style={{ background: to }} />
          <span aria-hidden="true" className="absolute inset-x-2 top-1 h-3 rounded-t-[12px] opacity-70" style={{ background: from }} />
          <span className="relative block aspect-square overflow-hidden rounded-[14px] transition duration-300 ease-out group-hover:-translate-y-1"
            style={{
              background: `radial-gradient(circle at 25% 30%, ${from} 0%, transparent 55%), radial-gradient(circle at 75% 75%, ${to} 0%, transparent 60%), linear-gradient(135deg, ${to}, ${from})`,
            }}>
            <span className="absolute left-4 top-3 text-2xl font-medium tracking-[-0.03em] text-paper drop-shadow">{playlist.name}</span>
          </span>
        </span>
        <span className="mt-2 block text-sm font-medium">Best of {playlist.name}</span>
        <span className="block text-[13px] text-paper/55">Sonx, {playlist.songs} songs</span>
      </button>
    </li>
  );
}

const matches = (track: ExploreTrack, query: string) => {
  const needle = query.trim().toLowerCase();
  return [track.title, track.artist, genreName(track.genre)].some((field) => field.toLowerCase().includes(needle));
};

const matchesArtist = (artist: ExploreArtist, query: string) => {
  const needle = query.trim().toLowerCase();
  return [artist.name, artist.handle, artist.location].some((field) => field.toLowerCase().includes(needle));
};

const GRID = "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function ExploreView() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { following } = useFollowing();
  const results = query.trim() ? ALL_EXPLORE_TRACKS.filter((track) => matches(track, query)) : null;
  const artistResults = query.trim() ? ARTISTS.filter((artist) => matchesArtist(artist, query)) : [];
  const fromFollowed = following.flatMap((handle) => tracksBy(handle));
  const sections = fromFollowed.length
    ? [{ id: "following", title: "From artists you follow", tracks: fromFollowed }, ...EXPLORE_SECTIONS]
    : EXPLORE_SECTIONS;
  const expandedSection = sections.find((section) => section.id === expanded);
  // Suggestions skip artists already followed, so the row keeps offering someone new.
  const suggested = ARTISTS.filter((artist) => !following.includes(artist.handle));

  const searchGenre = (name: string) => {
    setExpanded(null);
    setQuery(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-10">
      <label className="sticky top-0 z-20 -mx-4 -mb-4 block bg-night/85 px-4 py-3 backdrop-blur-xl md:mx-0 md:px-0">
        <span className="sr-only">Search songs, artists or genres</span>
        <span className="relative block">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/50">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setExpanded(null); }}
            placeholder="Search for songs, artists or genres"
            className="w-full rounded-full bg-paper/[0.07] py-2.5 pl-11 pr-5 text-sm transition placeholder:text-paper/40 hover:bg-paper/10 focus:bg-paper/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-paper/40" />
        </span>
      </label>

      {results ? (
        <>
          {artistResults.length > 0 && <ArtistRow id="artist-results" title="Artists" artists={artistResults} />}
          <section aria-labelledby="results-title">
            <h2 id="results-title" className="mb-3 text-xl font-semibold tracking-[-0.03em]">
              {results.length || artistResults.length ? `Songs for "${query.trim()}"` : `Nothing matches "${query.trim()}"`}
            </h2>
            {results.length > 0 ? (
              <ul className={GRID}>
                {results.map((track) => <TrackTile key={track.id} track={track} queue={results} wide />)}
              </ul>
            ) : (
              <p className="text-paper/60">Try a genre like lo-fi or pop, or an artist name.</p>
            )}
          </section>
        </>
      ) : expandedSection ? (
        <section aria-labelledby="expanded-title">
          <div className="mb-3 flex items-center gap-3">
            <button type="button" aria-label="Back to Explore" onClick={() => setExpanded(null)}
              className="flex size-8 items-center justify-center rounded-full bg-paper/[0.07] transition hover:bg-paper/15">
              <Chevron direction="left" />
            </button>
            <h2 id="expanded-title" className="text-xl font-semibold tracking-[-0.03em]">{expandedSection.title}</h2>
          </div>
          <ul className={GRID}>
            {expandedSection.tracks.map((track) => <TrackTile key={track.id} track={track} queue={expandedSection.tracks} wide />)}
          </ul>
        </section>
      ) : (
        <>
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              <Shelf id={section.id} title={section.title} onSeeAll={() => setExpanded(section.id)}>
                {section.tracks.map((track) => <TrackTile key={track.id} track={track} queue={section.tracks} />)}
              </Shelf>
              {/* Artists to follow sits under the first row of songs. */}
              {index === 0 && suggested.length > 0 && <ArtistRow id="artists" title="Artists to follow" artists={suggested} />}
            </Fragment>
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
