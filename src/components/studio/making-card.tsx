"use client";

import { useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconClose, IconPlay } from "@/components/icons";
import { MUSIC_FEATURES, type Generation } from "@/lib/generations";
import { prefersReducedMotion } from "@/lib/motion";
import { useCreateOptional } from "./create-context";
import { useLibrary } from "./library";
import { usePlayer } from "./player";
import { genreName } from "./track-list";

type Phase = "lyrics" | "starting" | "processing" | "completed" | "failed";
type StepState = "todo" | "active" | "done" | "failed";

const FAILED_TEXT = "This one did not work. Your charge was refunded.";

/** "1:05" */
const clock = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

function stepStates(phase: Phase, withLyrics: boolean): [string, StepState][] {
  const composing: StepState =
    phase === "lyrics" ? "todo" : phase === "completed" ? "done" : phase === "failed" ? "failed" : "active";
  return [
    ...(withLyrics ? [["Lyrics", phase === "lyrics" ? "active" : "done"] as [string, StepState]] : []),
    ["Composing", composing],
    ["Ready", phase === "completed" ? "done" : "todo"],
  ];
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-orchid text-night" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="relative flex size-4 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-0 animate-ping rounded-full bg-violet/40 motion-reduce:animate-none" />
        <span className="size-2.5 rounded-full bg-violet" />
      </span>
    );
  }
  return <span className={`size-4 rounded-full border-2 ${state === "failed" ? "border-danger" : "border-paper/20"}`} aria-hidden="true" />;
}

/**
 * The song being made, at the top of Create's right column: from the press of
 * Create (lyrics, then the start request) until the row is ready or failed.
 * Every step is a real state; there is no invented percentage.
 */
export function MakingCard() {
  const create = useCreateOptional();
  const { generations } = useLibrary();
  const { play } = usePlayer();
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  // A song picked up because it was still being made, kept so the card can show it finish.
  const [followed, setFollowed] = useState<string | null>(null);
  // Set from an effect: reading the clock during render is an unstable value for prerendering.
  const [now, setNow] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const making = create?.making ?? null;
  const tracked = create?.tracked ?? null;
  const music = generations.filter((generation) => MUSIC_FEATURES.includes(generation.feature));
  const trackedRow = tracked && !dismissed.has(tracked.id) ? music.find((generation) => generation.id === tracked.id) : undefined;
  // Coming back to /create mid-generation: follow the newest song still being made.
  const followedRow = followed && !dismissed.has(followed) ? music.find((generation) => generation.id === followed) : undefined;
  const processingRow = music.find((generation) => generation.status === "processing" && !dismissed.has(generation.id));
  const row: Generation | undefined = trackedRow ?? followedRow ?? processingRow;
  const pickUp = !trackedRow && !followedRow ? processingRow?.id : undefined;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pickUp) setFollowed(pickUp);
  }, [pickUp]);
  const withLyrics = making ? making.withLyrics : Boolean(trackedRow && tracked?.withLyrics);
  const phase: Phase | null = making ? making.stage : row ? row.status : null;
  const finished = phase === "completed" || phase === "failed";
  const startedAt = making ? create?.startedAt ?? null : trackedRow && tracked ? tracked.startedAt : row ? Date.parse(row.created_at) : null;

  // The timer ticks only while something is being made.
  useEffect(() => {
    if (!phase || finished) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [phase, finished]);

  // Create sits at the bottom of the form (and on phones the card is below it): bring the card into view.
  const isMaking = making !== null;
  useEffect(() => {
    const card = ref.current;
    if (!isMaking || !card) return;
    const { top, bottom } = card.getBoundingClientRect();
    if (top >= 0 && bottom <= window.innerHeight) return;
    card.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [isMaking]);

  if (!phase) return null;

  const title = making ? making.title || "Your new song" : row!.title;
  const genre = genreName(making ? making.genre : row!.genre);
  const instrumental = !making && row!.feature === "PROMPT_MUSIC";
  const stageText = {
    lyrics: "Writing the lyrics",
    starting: "Starting your song",
    processing: instrumental ? "Composing the music" : "Composing and singing",
    completed: "Ready to play",
    failed: row?.error ?? FAILED_TEXT,
  }[phase];
  const timing = phase === "completed"
    ? row?.completed_at ? `Made in ${clock(Date.parse(row.completed_at) - Date.parse(row.created_at))}` : ""
    : phase === "failed" ? "" : `${clock(startedAt === null || now === null ? 0 : now - startedAt)} · usually 1 to 3 minutes`;

  return (
    <div ref={ref} className="mb-8 scroll-mt-20 rounded-[24px] border border-paper/10 bg-paper/[0.04] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fog">{finished ? "Just made" : "Now making"}</p>
        {finished && row && (
          <button type="button" aria-label="Dismiss" onClick={() => {
              setDismissed((current) => new Set(current).add(row.id));
              setFollowed(null);
            }}
            className="-m-1.5 rounded-full p-1.5 text-fog transition hover:bg-paper/10 hover:text-paper">
            <IconClose size={16} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-[14px] shadow-lg">
          <CoverArt seed={row?.id ?? "making"} className={`size-full transition duration-700 ${phase === "completed" ? "" : "opacity-50 grayscale"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-sm text-fog">{genre}</p>
        </div>
        {phase === "completed" && row?.output_url && (
          <button type="button" onClick={() => play(row, [row])} aria-label={`Play ${row.title}`}
            className="bg-signature flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition hover:brightness-110">
            <IconPlay size={16} /> Play
          </button>
        )}
      </div>

      <ol className="mt-4 flex items-center gap-2" aria-label="Progress">
        {stepStates(phase, withLyrics).map(([label, state], index) => (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span className={`h-px w-5 ${state === "todo" ? "bg-paper/15" : "bg-orchid/60"}`} aria-hidden="true" />}
            <StepDot state={state} />
            <span className={`text-sm ${state === "todo" ? "text-paper/40" : state === "failed" ? "text-danger" : "text-paper"}`}>
              {label}<span className="sr-only">{state === "done" ? ", done" : state === "active" ? ", in progress" : ""}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Only the stage is announced; the ticking clock would be read out every second. */}
      <p className={`mt-3 text-sm ${phase === "failed" ? "text-danger" : "text-fog"}`}>
        <span aria-live="polite">{stageText}</span>
        {timing && <span className="tabular-nums text-fog/80"> · {timing}</span>}
      </p>
    </div>
  );
}
