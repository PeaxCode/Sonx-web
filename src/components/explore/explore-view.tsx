"use client";

import { Fragment, useEffect, useState } from "react";
import { genreName } from "@/lib/song-labels";
import { useSession } from "@/components/studio/session";
import { fetchExplore, fetchFollowingSongs, type ExploreData, type PublicArtist, type PublicSong } from "@/lib/profiles";
import { ArtistRow } from "./artist";
import { Chevron, Shelf, TrackTile } from "./tiles";
import { Loading } from "@/components/spinner";

// Two colours per genre for the "Best of" tiles; genres not listed use the signature pair.
const GENRE_COLORS: Record<string, [string, string]> = {
  pop: ["#ff4fd8", "#7b5cff"], hiphop: ["#ff7a59", "#8e1f5b"], lofi: ["#5ad1c6", "#2c3e8f"], edm: ["#3cf2ff", "#6a2cff"],
  rnb: ["#ffb36b", "#c2185b"], jazz: ["#ffd166", "#d1495b"], rock: ["#ff5a5a", "#2b1055"], kpop: ["#ff9de2", "#5b8cff"],
  country: ["#f4a261", "#6b3e26"], latin: ["#ff6b6b", "#ffb347"], reggae: ["#7bd389", "#1b7f3b"], folk: ["#c9a66b", "#4a5d3a"],
  blues: ["#4f8cff", "#1a2a6c"], metal: ["#9a9a9a", "#1c1c1c"], punk: ["#ff2e63", "#252a34"], indie: ["#a29bfe", "#2d3436"],
  afrobeat: ["#fdcb6e", "#e17055"], classical: ["#dfe6e9", "#636e72"],
};
const DEFAULT_COLORS: [string, string] = ["#e563f1", "#6c5ce7"];

/** "Best of" a genre: a gradient mesh card with two cards stacked behind it. */
function PlaylistTile({ genre, count, onOpen }: { genre: string; count: number; onOpen: () => void }) {
  const [from, to] = GENRE_COLORS[genre] ?? DEFAULT_COLORS;
  const name = genreName(genre);
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
            <span className="absolute left-4 top-3 text-2xl font-medium tracking-[-0.03em] text-paper drop-shadow">{name}</span>
          </span>
        </span>
        <span className="mt-2 block text-sm font-medium">Best of {name}</span>
        <span className="block text-[13px] text-paper/55">{count} {count === 1 ? "song" : "songs"}</span>
      </button>
    </li>
  );
}

const matches = (song: PublicSong, needle: string) =>
  [song.title, song.display_name, song.handle, genreName(song.genre)].some((field) => field.toLowerCase().includes(needle));
const matchesArtist = (artist: PublicArtist, needle: string) =>
  [artist.display_name, artist.handle].some((field) => field.toLowerCase().includes(needle));

const GRID = "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

interface Section { id: string; title: string; songs: PublicSong[] }

/** Explore from songs people published: newest, most played, followed artists, genres. */
export function ExploreView() {
  const { signedIn } = useSession();
  const [data, setData] = useState<ExploreData | null>(null);
  const [failed, setFailed] = useState(false);
  const [followingSongs, setFollowingSongs] = useState<PublicSong[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchExplore().then((value) => active && setData(value)).catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetchFollowingSongs().then((value) => active && setFollowingSongs(value)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [signedIn]);

  if (failed) return <p className="py-20 text-center text-paper/60">Explore could not load. Refresh to try again.</p>;
  if (!data) return <Loading label="Loading songs" className="py-20" />;

  const played = data.top.filter((song) => song.play_count > 0);
  const genres = Object.entries(data.byGenre).sort((a, b) => b[1].length - a[1].length);
  const sections: Section[] = [
    ...(signedIn && followingSongs.length ? [{ id: "following", title: "From artists you follow", songs: followingSongs }] : []),
    { id: "new", title: "New on Sonx", songs: data.newest },
    // Only songs someone has listened to; before any plays it would repeat New on Sonx.
    ...(played.length ? [{ id: "top", title: "Most played", songs: played }] : []),
  ];
  const genreSections: Section[] = genres.map(([genre, songs]) => ({ id: `genre-${genre}`, title: `Best of ${genreName(genre)}`, songs }));
  const expandedSection = [...sections, ...genreSections].find((section) => section.id === expanded);

  const needle = query.trim().toLowerCase();
  const allSongs = Object.values(data.byGenre).flat();
  const results = needle ? allSongs.filter((song) => matches(song, needle)) : null;
  const artistResults = needle ? data.artists.filter((artist) => matchesArtist(artist, needle)) : [];

  if (!data.newest.length) {
    return <p className="py-20 text-center text-paper/60">No songs published yet. Publish one from your Account to be the first.</p>;
  }

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
                {results.map((song) => <TrackTile key={song.id} track={song} queue={results} wide />)}
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
            {expandedSection.songs.map((song) => <TrackTile key={song.id} track={song} queue={expandedSection.songs} wide />)}
          </ul>
        </section>
      ) : (
        <>
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              <Shelf id={section.id} title={section.title} onSeeAll={() => setExpanded(section.id)}>
                {section.songs.map((song) => <TrackTile key={song.id} track={song} queue={section.songs} />)}
              </Shelf>
              {/* Artists to follow sits under the first row of songs. */}
              {index === 0 && data.artists.length > 0 && <ArtistRow id="artists" title="Artists to follow" artists={data.artists} />}
            </Fragment>
          ))}
          {genres.length > 0 && (
            <Shelf id="best-of" title="Best of">
              {genres.map(([genre, songs]) => (
                <PlaylistTile key={genre} genre={genre} count={songs.length} onOpen={() => { setExpanded(`genre-${genre}`); window.scrollTo({ top: 0 }); }} />
              ))}
            </Shelf>
          )}
        </>
      )}
    </div>
  );
}
