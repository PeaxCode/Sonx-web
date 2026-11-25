"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconClose, IconPause, IconPlay } from "@/components/icons";
import { createAlbum, deleteAlbum, fetchAlbums, fetchAlbumSongs, removeFromAlbum, renameAlbum, cleanAlbumTitle, type Album, type AlbumSong } from "@/lib/albums";
import { ConfirmDialog } from "./confirm-dialog";
import { useFeedback } from "./feedback";
import { usePlayer } from "./player";
import { genreName } from "@/lib/song-labels";
import { Loading } from "@/components/spinner";

const field = "min-w-0 rounded-[var(--radius-control)] border border-line bg-night px-3 py-2 text-sm focus:border-paper/40 focus:outline-none";

function Cover({ url, seed, className = "" }: { url: string | null | undefined; seed: string; className?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-raised ${className}`}>
      {url ? <Image src={url} alt="" fill sizes="200px" className="object-cover" /> : <CoverArt seed={seed} className="size-full" />}
    </span>
  );
}

/** Library's Albums tab: the user's albums, and one album's songs when opened. */
export function AlbumsView() {
  const { notify } = useFeedback();
  const [albums, setAlbums] = useState<Album[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(() => {
    fetchAlbums().then(setAlbums).catch((error: Error) => notify(error.message, "error"));
  }, [notify]);
  useEffect(load, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = cleanAlbumTitle(newTitle);
    if (!title) return;
    try {
      const id = await createAlbum(title);
      setNewTitle("");
      load();
      setOpenId(id);
    } catch (error) {
      notify(error instanceof Error ? error.message : "The album could not be created.", "error");
    }
  };

  const open = albums?.find((album) => album.id === openId);
  if (open) return <AlbumDetail album={open} onBack={() => { setOpenId(null); load(); }} onChanged={load} />;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={create} className="flex max-w-md gap-2">
        <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={60} placeholder="New album name" className={`${field} flex-1`} />
        <button type="submit" disabled={!cleanAlbumTitle(newTitle)}
          className="rounded-full bg-paper px-5 py-2 text-sm font-semibold text-night transition hover:bg-paper/90 disabled:opacity-40">
          New album
        </button>
      </form>
      {albums === null ? (
        <Loading label="Loading your albums" />
      ) : albums.length === 0 ? (
        <p className="rounded-[24px] border border-dashed border-paper/10 px-6 py-12 text-center text-paper/60">
          No albums yet. Name one above, or use the album button on any song, here or in Explore.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <li key={album.id}>
              <button type="button" onClick={() => setOpenId(album.id)} className="group block w-full text-left">
                <Cover url={album.cover_url} seed={album.id} className="aspect-square w-full rounded-[14px] transition duration-300 group-hover:-translate-y-1" />
                <span className="mt-2 block truncate text-sm font-medium group-hover:underline">{album.title}</span>
                <span className="block text-xs text-fog">{album.songs} {album.songs === 1 ? "song" : "songs"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AlbumDetail({ album, onBack, onChanged }: { album: Album; onBack: () => void; onChanged: () => void }) {
  const { notify } = useFeedback();
  const { current, playing, play, toggle } = usePlayer();
  const [songs, setSongs] = useState<AlbumSong[] | null>(null);
  const [title, setTitle] = useState(album.title);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const playingHere = playing && Boolean(songs?.some((song) => song.id === current?.id));

  useEffect(() => {
    let active = true;
    fetchAlbumSongs(album.id).then((rows) => active && setSongs(rows)).catch((error: Error) => notify(error.message, "error"));
    return () => {
      active = false;
    };
  }, [album.id, notify]);

  const rename = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = cleanAlbumTitle(title);
    if (!next) return;
    try {
      await renameAlbum(album.id, next);
      setRenaming(false);
      onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "The album could not be renamed.", "error");
    }
  };

  const remove = async (song: AlbumSong) => {
    setSongs((list) => list?.filter((item) => item.id !== song.id) ?? null);
    try {
      await removeFromAlbum(album.id, song.id);
      onChanged();
    } catch (error) {
      setSongs((list) => (list ? [song, ...list] : list));
      notify(error instanceof Error ? error.message : "The song could not be removed.", "error");
    }
  };

  const destroy = async () => {
    setBusy(true);
    try {
      await deleteAlbum(album.id);
      notify(`Deleted “${album.title}”. The songs themselves are kept.`);
      onBack();
    } catch (error) {
      setBusy(false);
      setConfirmDelete(false);
      notify(error instanceof Error ? error.message : "The album could not be deleted.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={onBack} className="self-start rounded-full bg-paper/[0.07] px-3.5 py-1.5 text-xs font-medium text-paper/80 transition hover:bg-paper/15 hover:text-paper">
        ← Albums
      </button>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <Cover url={songs?.find((song) => song.cover_url)?.cover_url ?? album.cover_url} seed={album.id} className="size-40 shrink-0 rounded-[18px] shadow-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-paper/50">Album</p>
          {renaming ? (
            <form onSubmit={rename} className="mt-1 flex gap-2">
              <input value={title} autoFocus maxLength={60} onChange={(event) => setTitle(event.target.value)} className={`${field} flex-1 text-lg`} />
              <button type="submit" className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-night">Save</button>
              <button type="button" onClick={() => { setRenaming(false); setTitle(album.title); }} className="rounded-full px-3 py-2 text-sm text-paper/70">Cancel</button>
            </form>
          ) : (
            <h2 className="mt-1 truncate text-3xl font-semibold tracking-[-0.04em]">{album.title}</h2>
          )}
          <p className="mt-1 text-sm text-fog">{songs?.length ?? album.songs} {(songs?.length ?? album.songs) === 1 ? "song" : "songs"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!songs?.length} onClick={() => (playingHere ? toggle() : songs && play(songs[0], songs))}
              aria-label={playingHere ? "Pause album" : "Play album"}
              className="bg-signature flex size-11 items-center justify-center rounded-full shadow-lg transition hover:brightness-110 disabled:opacity-40">
              {playingHere ? <IconPause size={18} /> : <IconPlay size={18} />}
            </button>
            {!renaming && (
              <button type="button" onClick={() => setRenaming(true)} className="rounded-full bg-paper/[0.08] px-4 py-2 text-sm font-medium hover:bg-paper/15">Rename</button>
            )}
            <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full px-4 py-2 text-sm text-danger hover:bg-danger/10">Delete album</button>
          </div>
        </div>
      </header>

      {songs === null ? (
        <Loading label="Loading songs" />
      ) : songs.length === 0 ? (
        <p className="rounded-[24px] border border-dashed border-paper/10 px-6 py-12 text-center text-paper/60">
          This album is empty. Use the album button on a song to add it.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {songs.map((song) => {
            const isCurrent = current?.id === song.id;
            return (
              <li key={song.id} className={`group/row -mx-3 flex items-center gap-4 rounded-[18px] px-3 py-2.5 hover:bg-paper/[0.04] ${isCurrent ? "bg-paper/[0.06]" : ""}`}>
                <button type="button" onClick={() => play(song, songs)} aria-label={`Play ${song.title}`} className="relative size-14 shrink-0 overflow-hidden rounded-[12px]">
                  <Cover url={song.cover_url} seed={song.id} className="size-full" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${isCurrent ? "text-orchid" : ""}`}>{song.title}</p>
                  <p className="truncate text-sm text-fog">
                    {song.is_mine ? "Your song" : song.handle ? <Link href={`/artist/${song.handle}`} className="hover:text-paper hover:underline">{song.display_name}</Link> : "Sonx artist"}
                    {song.genre && <span className="text-fog/70"> · {genreName(song.genre)}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => void remove(song)} aria-label={`Remove ${song.title} from ${album.title}`} title="Remove from album"
                  className="rounded-full p-2 text-paper/50 transition hover:bg-paper/10 hover:text-paper md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100">
                  <IconClose size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmDialog title={`Delete “${album.title}”?`} confirmLabel="Delete album" busy={busy} onConfirm={destroy} onCancel={() => setConfirmDelete(false)}>
          <p>The album goes away; the songs in it stay in your library and on their artists&apos; profiles.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
