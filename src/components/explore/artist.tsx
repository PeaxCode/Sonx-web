"use client";

import Image from "next/image";
import Link from "next/link";
import { IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/components/studio/player";
import type { ExploreArtist, ExploreTrack } from "@/lib/explore-mock";
import { useSession } from "@/components/studio/session";
import { useFollowing } from "@/lib/follows";
import { artistHref, compact, Shelf, TrackTile } from "./tiles";

export function FollowButton({ artist, size = "md" }: { artist: ExploreArtist; size?: "sm" | "md" }) {
  const { isFollowing, toggle } = useFollowing();
  const { signedIn, requestSignIn } = useSession();
  const following = isFollowing(artist.handle);
  // Following is an account feature: visitors are asked to sign up first.
  const onClick = () => {
    if (signedIn === false) {
      requestSignIn({ next: window.location.pathname, title: `Follow ${artist.name} on Sonx`, text: "Create your free account to follow artists and keep the songs you like." });
      return;
    }
    if (signedIn) toggle(artist.handle);
  };
  return (
    <button type="button" onClick={onClick} aria-pressed={following}
      aria-label={following ? `Unfollow ${artist.name}` : `Follow ${artist.name}`}
      className={`rounded-full font-semibold transition ${size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm"} ${
        following ? "border border-paper/25 text-paper hover:border-paper/50" : "bg-paper text-night hover:bg-paper/85"
      }`}>
      {following ? "Following" : "Follow"}
    </button>
  );
}

/** Followers shown on a profile: the mock count plus this visitor's follow. */
export function useFollowerCount(artist: ExploreArtist) {
  const { isFollowing } = useFollowing();
  return artist.followers + (isFollowing(artist.handle) ? 1 : 0);
}

/** A round portrait with name and followers, for the "Artists to follow" row. */
export function ArtistTile({ artist }: { artist: ExploreArtist }) {
  const followers = useFollowerCount(artist);
  return (
    <li className="flex w-[132px] shrink-0 snap-start flex-col items-center text-center md:w-[148px]">
      <Link href={artistHref(artist.handle)} className="group block w-full">
        <span className="relative block aspect-square overflow-hidden rounded-full bg-raised">
          <Image src={artist.avatar} alt="" fill sizes="148px"
            className="object-cover transition duration-500 ease-out group-hover:scale-105" />
        </span>
        <span className="mt-2.5 block truncate text-sm font-medium group-hover:underline">{artist.name}</span>
      </Link>
      <span className="mb-2 block text-xs text-paper/50 tabular-nums">{compact.format(followers)} followers</span>
      <FollowButton artist={artist} size="sm" />
    </li>
  );
}

export function ArtistRow({ id, title, artists }: { id: string; title: string; artists: ExploreArtist[] }) {
  return (
    <Shelf id={id} title={title} arrowTop="top-[66px] md:top-[74px]">
      {artists.map((artist) => <ArtistTile key={artist.handle} artist={artist} />)}
    </Shelf>
  );
}

/** Artist page: portrait, bio, follow, then every song by them. */
export function ArtistProfile({ artist, tracks }: { artist: ExploreArtist; tracks: ExploreTrack[] }) {
  const followers = useFollowerCount(artist);
  const { current, playing, play, toggle } = usePlayer();
  const playingHere = playing && tracks.some((track) => track.id === current?.id);
  const plays = tracks.reduce((sum, track) => sum + track.plays, 0);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left">
        <span className="relative block size-36 shrink-0 overflow-hidden rounded-full bg-raised shadow-2xl md:size-44">
          <Image src={artist.avatar} alt={`${artist.name}`} fill sizes="176px" priority className="object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Artist</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">{artist.name}</h1>
          <p className="mt-2 text-sm text-paper/55">
            @{artist.handle} · {artist.location}
          </p>
          <p className="mt-3 max-w-xl text-paper/80">{artist.bio}</p>
          <p className="mt-3 flex justify-center gap-4 text-sm text-paper/60 tabular-nums md:justify-start">
            <span><strong className="font-semibold text-paper">{compact.format(followers)}</strong> followers</span>
            <span><strong className="font-semibold text-paper">{tracks.length}</strong> {tracks.length === 1 ? "song" : "songs"}</span>
            <span><strong className="font-semibold text-paper">{compact.format(plays)}</strong> plays</span>
          </p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-3 md:justify-start">
        <button type="button" disabled={!tracks.length}
          onClick={() => (playingHere ? toggle() : play(tracks[0], tracks))}
          aria-label={playingHere ? `Pause ${artist.name}` : `Play ${artist.name}`}
          className="bg-signature flex size-12 items-center justify-center rounded-full text-paper shadow-lg transition hover:brightness-110 disabled:opacity-40">
          {playingHere ? <IconPause size={20} /> : <IconPlay size={20} />}
        </button>
        <FollowButton artist={artist} />
      </div>

      <section aria-labelledby="songs-title">
        <h2 id="songs-title" className="mb-4 text-xl font-semibold tracking-[-0.03em]">Songs</h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tracks.map((track) => <TrackTile key={track.id} track={track} queue={tracks} wide />)}
        </ul>
      </section>
    </div>
  );
}
