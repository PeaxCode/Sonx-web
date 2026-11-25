"use client";

import Link from "next/link";
import { useState } from "react";
import { IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/components/studio/player";
import type { PublicArtist, PublicProfile, PublicSong } from "@/lib/profiles";
import { Avatar, FollowButton } from "./social";
import { artistHref, compact, Shelf, TrackTile } from "./tiles";

/** A round avatar with name and followers, for the "Artists to follow" row. */
export function ArtistTile({ artist }: { artist: PublicArtist }) {
  const [followers, setFollowers] = useState(artist.followers);
  return (
    <li className="flex w-[132px] shrink-0 snap-start flex-col items-center text-center md:w-[148px]">
      <Link href={artistHref(artist.handle)} className="group block w-full">
        <span className="block aspect-square overflow-hidden rounded-full transition duration-500 ease-out group-hover:scale-105">
          <Avatar url={artist.avatar_url} name={artist.display_name} size={148} className="!size-full" />
        </span>
        <span className="mt-2.5 block truncate text-sm font-medium group-hover:underline">{artist.display_name}</span>
      </Link>
      <span className="mb-2 flex items-center gap-1.5 text-xs text-paper/50 tabular-nums">
        {compact.format(followers)} {followers === 1 ? "follower" : "followers"}
      </span>
      <FollowButton handle={artist.handle} name={artist.display_name} size="sm" onChange={(delta) => setFollowers((count) => count + delta)} />
    </li>
  );
}

export function ArtistRow({ id, title, artists }: { id: string; title: string; artists: PublicArtist[] }) {
  return (
    <Shelf id={id} title={title} arrowTop="top-[66px] md:top-[74px]">
      {artists.map((artist) => <ArtistTile key={artist.handle} artist={artist} />)}
    </Shelf>
  );
}

/** Profile page: avatar, bio, follow, then every song they published. */
export function ArtistProfile({ profile, songs }: { profile: PublicProfile; songs: PublicSong[] }) {
  const [followers, setFollowers] = useState(profile.followers);
  const { current, playing, play, toggle } = usePlayer();
  const playingHere = playing && songs.some((song) => song.id === current?.id);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left">
        <Avatar url={profile.avatar_url} name={profile.display_name} size={176} className="shrink-0 shadow-2xl" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-paper/50 md:justify-start">
            Artist
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">{profile.display_name}</h1>
          <p className="mt-2 text-sm text-paper/55">@{profile.handle}</p>
          {profile.bio && <p className="mt-3 max-w-xl text-paper/80">{profile.bio}</p>}
          <p className="mt-3 flex justify-center gap-4 text-sm text-paper/60 tabular-nums md:justify-start">
            <span><strong className="font-semibold text-paper">{compact.format(followers)}</strong> {followers === 1 ? "follower" : "followers"}</span>
            <span><strong className="font-semibold text-paper">{songs.length}</strong> {songs.length === 1 ? "song" : "songs"}</span>
            <span><strong className="font-semibold text-paper">{compact.format(profile.plays)}</strong> {profile.plays === 1 ? "play" : "plays"}</span>
          </p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-3 md:justify-start">
        <button type="button" disabled={!songs.length}
          onClick={() => (playingHere ? toggle() : play(songs[0], songs))}
          aria-label={playingHere ? `Pause ${profile.display_name}` : `Play ${profile.display_name}`}
          className="bg-signature flex size-12 items-center justify-center rounded-full text-paper shadow-lg transition hover:brightness-110 disabled:opacity-40">
          {playingHere ? <IconPause size={20} /> : <IconPlay size={20} />}
        </button>
        <FollowButton handle={profile.handle} name={profile.display_name} onChange={(delta) => setFollowers((count) => count + delta)} />
      </div>

      <section aria-labelledby="songs-title">
        <h2 id="songs-title" className="mb-4 text-xl font-semibold tracking-[-0.03em]">Songs</h2>
        {songs.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {songs.map((song) => <TrackTile key={song.id} track={song} queue={songs} wide />)}
          </ul>
        ) : (
          <p className="rounded-[24px] border border-dashed border-paper/10 px-6 py-12 text-center text-paper/60">No songs published yet.</p>
        )}
      </section>
    </div>
  );
}
