"use client";

import { useState } from "react";
import { IconClose, IconDownload, IconHeart, IconPause, IconPlay, IconTrash, IconVideo } from "@/components/icons";
import { GENRES } from "@/lib/billing-config";
import type { Generation } from "@/lib/generations";
import { useLibrary } from "./library";
import { usePlayer } from "./player";

const genreName = (id: string | null) => GENRES.find((genre) => genre.id === id)?.name ?? id ?? "";

const kindLabel = (generation: Generation) => {
  switch (generation.feature) {
    case "AI_MUSIC_VIDEO": return "Music video";
    case "LYRICS_MUSIC": return "Song with vocals";
    case "AI_SINGING": return "AI cover";
    default: return "Instrumental";
  }
};

function Writing() {
  return (
    <span className="flex items-center gap-2 text-sm text-fog">
      <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span key={bar} className="w-0.5 animate-pulse rounded-full bg-violet"
            style={{ height: `${6 + bar * 3}px`, animationDelay: `${bar * 150}ms` }} />
        ))}
      </span>
      Writing your song
    </span>
  );
}

function VideoDialog({ generation, onClose }: { generation: Generation; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={generation.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
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
  const { toggleFavorite, remove } = useLibrary();
  const { current, playing, play } = usePlayer();
  const [openVideo, setOpenVideo] = useState<Generation | null>(null);

  const playable = generations.filter((item) => item.status === "completed" && item.feature !== "AI_MUSIC_VIDEO");

  if (generations.length === 0) {
    return <p className="rounded-[var(--radius-panel)] border border-dashed border-line px-6 py-10 text-center text-fog">{emptyText}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {generations.map((generation) => {
          const isVideo = generation.feature === "AI_MUSIC_VIDEO";
          const isCurrent = current?.id === generation.id;
          const ready = generation.status === "completed" && generation.output_url;
          return (
            <li key={generation.id} className="flex items-center gap-4 py-3">
              <button
                type="button"
                disabled={!ready}
                aria-label={isVideo ? `Watch ${generation.title}` : isCurrent && playing ? `Pause ${generation.title}` : `Play ${generation.title}`}
                onClick={() => (isVideo ? setOpenVideo(generation) : play(generation, playable))}
                className={`flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] transition ${
                  ready ? "bg-raised hover:bg-violet hover:text-night" : "bg-plum text-fog/50"
                } ${isCurrent ? "bg-violet text-night" : ""}`}
              >
                {isVideo ? <IconVideo size={18} /> : isCurrent && playing ? <IconPause size={18} /> : <IconPlay size={18} />}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{generation.title}</p>
                {generation.status === "processing" ? (
                  <Writing />
                ) : generation.status === "failed" ? (
                  <p className="truncate text-sm text-danger">{generation.error ?? "This one did not work. Your charge was refunded."}</p>
                ) : (
                  <p className="truncate text-sm text-fog">
                    {[kindLabel(generation), genreName(generation.genre)].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              {generation.status !== "processing" && (
                <div className="flex items-center gap-1 text-fog">
                  {ready && (
                    <>
                      <button type="button" aria-label={generation.is_favorite ? "Remove from favorites" : "Add to favorites"}
                        aria-pressed={generation.is_favorite} onClick={() => toggleFavorite(generation)}
                        className={`rounded-full p-2 transition hover:text-paper ${generation.is_favorite ? "text-orchid" : ""}`}>
                        <IconHeart size={18} filled={generation.is_favorite} />
                      </button>
                      <a href={generation.output_url!} download target="_blank" rel="noreferrer"
                        aria-label={`Download ${generation.title}`} className="rounded-full p-2 transition hover:text-paper">
                        <IconDownload size={18} />
                      </a>
                    </>
                  )}
                  <button type="button" aria-label={`Delete ${generation.title}`}
                    onClick={() => {
                      if (window.confirm(`Delete "${generation.title}"? This removes it from the app too.`)) void remove(generation);
                    }}
                    className="rounded-full p-2 transition hover:text-danger">
                    <IconTrash size={18} />
                  </button>
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
