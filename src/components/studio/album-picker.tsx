"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconAlbumAdd, IconClose } from "@/components/icons";
import { addToAlbum, albumsWithSong, cleanAlbumTitle, createAlbum, fetchAlbums, removeFromAlbum, type Album } from "@/lib/albums";
import type { Generation } from "@/lib/generations";
import { useFeedback } from "./feedback";
import { useSession } from "./session";

const ALBUM_FEATURES = new Set(["PROMPT_MUSIC", "PHOTO_MUSIC", "LYRICS_MUSIC", "AI_SINGING"]);

/** Whether a song can go in an album: a finished song that is a real row (own or published). */
export function canAddToAlbum(song: Generation) {
  const real = !song.is_sample || Boolean(song.published_at);
  return real && song.status === "completed" && ALBUM_FEATURES.has(song.feature);
}

/** Opens the album picker for a song; visitors get the sign-in window. */
export function AddToAlbumButton({ song, className, size = 18 }: { song: Generation; className: string; size?: number }) {
  const { signedIn, requestSignIn } = useSession();
  const [open, setOpen] = useState(false);
  if (!canAddToAlbum(song)) return null;
  const onClick = () => {
    if (signedIn === false) {
      requestSignIn({ next: window.location.pathname, title: "Sign in to make albums", text: "Collect your songs and the ones you love into albums. Free with your Sonx account." });
      return;
    }
    if (signedIn) setOpen(true);
  };
  return (
    <>
      <button type="button" aria-label={`Add ${song.title} to an album`} title="Add to album" onClick={onClick} className={className}>
        <IconAlbumAdd size={size} />
      </button>
      {open && <AlbumPicker song={song} onClose={() => setOpen(false)} />}
    </>
  );
}

function AlbumPicker({ song, onClose }: { song: Generation; onClose: () => void }) {
  const { notify } = useFeedback();
  const titleId = useId();
  const [albums, setAlbums] = useState<Album[] | null>(null);
  const [holding, setHolding] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);
  // Callers pass a new onClose each render; the effect below must not refetch for that.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchAlbums(), albumsWithSong(song.id)])
      .then(([list, ids]) => {
        if (!active) return;
        setAlbums(list);
        setHolding(new Set(ids));
      })
      .catch((error: Error) => {
        notify(error.message, "error");
        closeRef.current();
      });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      active = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [song.id, notify]);

  const toggle = async (album: Album) => {
    const inside = holding.has(album.id);
    setHolding((current) => {
      const next = new Set(current);
      if (inside) next.delete(album.id);
      else next.add(album.id);
      return next;
    });
    try {
      if (inside) await removeFromAlbum(album.id, song.id);
      else await addToAlbum(album.id, song.id);
      notify(inside ? `Removed from “${album.title}”.` : `Added to “${album.title}”.`);
    } catch (error) {
      setHolding((current) => {
        const next = new Set(current);
        if (inside) next.add(album.id);
        else next.delete(album.id);
        return next;
      });
      notify(error instanceof Error ? error.message : "That did not work.", "error");
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = cleanAlbumTitle(newTitle);
    if (!title || busy) return;
    setBusy(true);
    try {
      const id = await createAlbum(title);
      await addToAlbum(id, song.id);
      notify(`Added to “${title}”.`);
      onClose();
    } catch (error) {
      notify(error instanceof Error ? error.message : "The album could not be created.", "error");
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[var(--radius-panel)] border border-line bg-plum p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold">Add to album</h2>
            <p className="truncate text-sm text-paper/60">{song.title}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="-m-1 rounded-full p-1.5 text-fog hover:bg-paper/10 hover:text-paper">
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={create} className="mt-4 flex gap-2">
          <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={60} placeholder="New album name"
            className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-night px-3 py-2 text-sm focus:border-paper/40 focus:outline-none" />
          <button type="submit" disabled={!cleanAlbumTitle(newTitle) || busy}
            className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-night transition hover:bg-paper/90 disabled:opacity-40">
            Create
          </button>
        </form>

        <ul className="mt-4 max-h-72 overflow-y-auto">
          {albums === null ? (
            <li className="py-3 text-sm text-paper/60">Loading your albums</li>
          ) : albums.length === 0 ? (
            <li className="py-3 text-sm text-paper/60">No albums yet. Name one above to start.</li>
          ) : albums.map((album) => (
            <li key={album.id}>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] px-2 py-2.5 hover:bg-paper/[0.05]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{album.title}</span>
                  <span className="block text-xs text-fog">{album.songs} {album.songs === 1 ? "song" : "songs"}</span>
                </span>
                <input type="checkbox" checked={holding.has(album.id)} onChange={() => void toggle(album)}
                  className="size-4 accent-orchid" />
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
