"use client";

import { useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import Image from "next/image";
import { CoverArt } from "@/components/cover-art";
import { IconClose, IconHeart, IconPause, IconPlay, IconTrash, IconVideo } from "@/components/icons";
import { genreName, kindLabel } from "@/lib/song-labels";
import type { Generation } from "@/lib/generations";
import { AddToAlbumButton } from "./album-picker";
import { DownloadButton } from "./download-button";
import { PublishToggle } from "./publish-toggle";
import { RowMenu, ROW_MENU_ITEM } from "./row-menu";
import { ShareButton } from "./share-button";
import { useFeedback } from "./feedback";
import { useLibrary } from "./library";
import { usePlayer } from "./player";

/** "Today", "Yesterday", "Nov 3" or "Nov 3, 2025": when a song was made. */
function madeOn(iso: string) {
  const date = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

// Row actions appear on hover on desktop; a favorited heart stays visible.
const HOVER_ACTION = "md:opacity-0 md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100";

/** Three bars that bounce while the row's song plays. */
function NowPlaying({ playing }: { playing: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-end gap-[3px]">
      {[0, 1, 2].map((bar) => (
        <span key={bar} className={`w-[3px] rounded-full bg-orchid ${playing ? "animate-[eq_0.9s_ease-in-out_infinite]" : ""}`}
          style={{ height: playing ? undefined : `${5 + bar * 3}px`, animationDelay: `${bar * 0.18}s` }} />
      ))}
    </span>
  );
}

function Writing() {
  return (
    <span className="flex items-center gap-2 text-sm text-fog">
      <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span key={bar} className="w-0.5 animate-pulse rounded-full bg-violet"
            style={{ height: `${6 + bar * 3}px`, animationDelay: `${bar * 150}ms` }} />
        ))}
      </span>
      Making your song, usually 2 to 5 minutes
    </span>
  );
}

export function VideoDialog({ generation, onClose }: { generation: Generation; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.2 });
    gsap.from(".video-panel", { scale: 0.96, opacity: 0, duration: 0.3, ease: "power2.out" });
  }, { scope: ref });

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={generation.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="video-panel relative w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close" onClick={onClose}
          className="absolute -top-11 right-0 rounded-full p-2 text-fog hover:text-paper">
          <IconClose />
        </button>
        <video src={generation.output_url ?? undefined} controls autoPlay playsInline
          className="w-full rounded-[var(--radius-panel)] bg-black" />
      </div>
    </div>
  );
}

export function TrackList({ generations, emptyText }: { generations: Generation[]; emptyText: string }) {
  const { toggleFavorite, removeWithUndo } = useLibrary();
  const { notify } = useFeedback();
  const { current, playing, play, open } = usePlayer();
  const [openVideo, setOpenVideo] = useState<Generation | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const seenIds = useRef<Set<string> | null>(null);
  const idsKey = generations.map((item) => item.id).join(",");

  // First render: a quick stagger of the visible rows. Later renders: only rows
  // that just appeared (a generation the user started) slide in.
  useGSAP(() => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-row]") ?? []);
    if (!prefersReducedMotion()) {
      if (seenIds.current === null) {
        gsap.from(rows.slice(0, 12), {
          opacity: 0, y: 8, duration: 0.3, stagger: 0.03, ease: "power2.out", clearProps: "transform,opacity",
        });
      } else {
        const fresh = rows.filter((row) => !seenIds.current!.has(row.dataset.row!));
        if (fresh.length) gsap.from(fresh, { opacity: 0, x: -14, duration: 0.4, ease: "power3.out", clearProps: "transform,opacity" });
      }
    }
    if (rows.length) seenIds.current = new Set(rows.map((row) => row.dataset.row!));
  }, { scope: listRef, dependencies: [idsKey] });

  const playable = generations.filter((item) => item.status === "completed" && item.feature !== "AI_MUSIC_VIDEO");

  // Undo instead of a confirm box: one tap to delete, one to bring it back.
  const deleteSong = (generation: Generation) => {
    const undo = removeWithUndo(generation);
    notify(`Deleted “${generation.title}” here and in the app.`, "info", { label: "Undo", onClick: undo });
  };

  if (generations.length === 0) {
    return <p className="rounded-[24px] border border-dashed border-paper/10 px-6 py-12 text-center text-paper/60">{emptyText}</p>;
  }

  return (
    <>
      <ul ref={listRef} className="flex flex-col gap-1">
        {generations.map((generation) => {
          const isVideo = generation.feature === "AI_MUSIC_VIDEO";
          const isCurrent = current?.id === generation.id;
          const ready = generation.status === "completed" && generation.output_url;
          return (
            <li key={generation.id} data-row={generation.id}
              className={`group/row -mx-3 flex items-center gap-4 rounded-[18px] px-3 py-2.5 transition-colors hover:bg-paper/[0.04] ${isCurrent ? "bg-paper/[0.06]" : ""}`}>
              <button
                type="button"
                disabled={!ready}
                aria-label={isVideo ? `Watch ${generation.title}` : isCurrent && playing ? `Pause ${generation.title}` : `Play ${generation.title}`}
                onClick={() => (isVideo ? setOpenVideo(generation) : play(generation, playable))}
                className="group relative size-16 shrink-0 overflow-hidden rounded-[14px] shadow-lg disabled:cursor-default"
              >
                {generation.cover_url ? (
                  <Image src={generation.cover_url} alt="" fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-110" />
                ) : (
                  <CoverArt seed={generation.id} className={`size-full transition duration-500 group-hover:scale-110 ${ready ? "" : "opacity-40 grayscale"}`} />
                )}
                {ready && (
                  <span className={`absolute inset-0 flex items-center justify-center bg-night/50 transition-opacity duration-200 ${
                    isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}>
                    {isVideo ? <IconVideo size={20} /> : isCurrent && playing ? <IconPause size={20} /> : <IconPlay size={20} />}
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                {/* The title opens the full player: lyrics and controls for this song. */}
                {ready && !isVideo ? (
                  <button type="button" onClick={() => open(generation, playable)} aria-label={`Open ${generation.title} in the player`}
                    className={`flex max-w-full items-center gap-2 text-left font-medium transition hover:underline ${isCurrent ? "text-orchid" : ""}`}>
                    {isCurrent && <NowPlaying playing={playing} />}
                    <span className="truncate">{generation.title}</span>
                  </button>
                ) : ready && isVideo ? (
                  <button type="button" onClick={() => setOpenVideo(generation)} className="max-w-full truncate text-left font-medium transition hover:underline">
                    {generation.title}
                  </button>
                ) : (
                  <p className="truncate font-medium">{generation.title}</p>
                )}
                {generation.status === "processing" ? (
                  <Writing />
                ) : generation.status === "failed" ? (
                  <p className="truncate text-sm text-danger">{generation.error ?? "This one did not work. Your charge was refunded."}</p>
                ) : (
                  <p className="truncate text-sm text-fog">
                    {[kindLabel(generation), genreName(generation.genre)].filter(Boolean).join(", ")}
                    {!generation.is_sample && <span className="text-fog/70"> · {madeOn(generation.created_at)}</span>}
                  </p>
                )}
              </div>

              {generation.status !== "processing" && (
                <div className="flex items-center gap-0.5 text-paper/50">
                  {ready && (
                    <>
                      {/* A published song keeps its "Public" label in view, like a favorite's heart.
                          On phones an unpublished song's switch lives in the "…" menu instead. */}
                      <span className={generation.published_at ? "mr-1" : `mr-1 hidden md:inline ${HOVER_ACTION}`}>
                        <PublishToggle generation={generation} variant="compact" />
                      </span>
                      {!generation.is_sample && (
                      <button type="button" aria-label={generation.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        aria-pressed={generation.is_favorite} onClick={() => toggleFavorite(generation)}
                        className={`rounded-full p-2 transition hover:bg-paper/10 hover:text-paper ${generation.is_favorite ? "text-orchid" : HOVER_ACTION}`}>
                        <IconHeart size={18} filled={generation.is_favorite} />
                      </button>
                      )}
                      {/* Desktop: icons that appear on hover. Phones: the same actions in a "…" menu,
                          so the title keeps its room at ~370px. */}
                      <span className="hidden items-center gap-0.5 md:flex">
                        <AddToAlbumButton song={generation} className={`rounded-full p-2 transition hover:bg-paper/10 hover:text-paper ${HOVER_ACTION}`} />
                        <ShareButton generation={generation} className={`rounded-full p-2 transition hover:bg-paper/10 hover:text-paper ${HOVER_ACTION}`} />
                        <DownloadButton generation={generation} className={`rounded-full p-2 transition hover:bg-paper/10 hover:text-paper ${HOVER_ACTION}`} />
                      </span>
                    </>
                  )}
                  {/* Examples are not rows in the user's library, so they cannot be deleted. */}
                  {!generation.is_sample && (
                  <button type="button" aria-label={`Delete ${generation.title}`}
                    onClick={() => deleteSong(generation)}
                    className={`hidden rounded-full p-2 transition hover:bg-danger/10 hover:text-danger md:inline-flex ${HOVER_ACTION}`}>
                    <IconTrash size={18} />
                  </button>
                  )}
                  {(ready || !generation.is_sample) && (
                  <span className="md:hidden">
                    <RowMenu title={generation.title}>
                      {ready && !generation.published_at && (
                        <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-paper/85">
                          <span>Profile</span>
                          <PublishToggle generation={generation} variant="compact" />
                        </div>
                      )}
                      {ready && (
                        <>
                          <AddToAlbumButton song={generation} className={ROW_MENU_ITEM} label="Add to album" />
                          <ShareButton generation={generation} className={ROW_MENU_ITEM} label="Share" />
                          <DownloadButton generation={generation} className={ROW_MENU_ITEM} label="Download MP3" />
                        </>
                      )}
                      {!generation.is_sample && (
                        <button type="button" onClick={() => deleteSong(generation)}
                          className={`${ROW_MENU_ITEM} text-danger hover:bg-danger/10 hover:text-danger`}>
                          <IconTrash size={18} />
                          <span>Delete</span>
                        </button>
                      )}
                    </RowMenu>
                  </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {openVideo && <VideoDialog generation={openVideo} onClose={() => setOpenVideo(null)} />}
    </>
  );
}
