"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { IconArrow, IconPause, IconPlay } from "@/components/icons";
import { MUSIC_FEATURES, type Generation } from "@/lib/generations";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { SAMPLE_GENERATIONS } from "@/lib/samples";
import { useLibrary } from "@/components/studio/library";
import { usePlayer } from "@/components/studio/player";
import { useSession } from "@/components/studio/session";
import { genreName, kindLabel, VideoDialog } from "@/components/studio/track-list";
import { STARTERS } from "./content";

const isVideo = (item: Generation) => item.feature === "AI_MUSIC_VIDEO";

function ShelfHeader({ id, title, href, linkLabel }: { id: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 id={id} className="text-xl font-semibold tracking-[-0.03em] md:text-2xl">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-fog transition hover:text-paper">
          {linkLabel} <IconArrow size={16} />
        </Link>
      )}
    </div>
  );
}

/**
 * A cover with a play button, the way music apps show a track. Songs play in
 * the shared player bar with the shelf as the queue; videos open full size.
 */
function TrackCard({ item, queue, onWatch }: { item: Generation; queue: Generation[]; onWatch: (item: Generation) => void }) {
  const { current, playing, play } = usePlayer();
  const isCurrent = current?.id === item.id;
  const ready = item.status === "completed" && Boolean(item.output_url);
  const label = isVideo(item) ? `Watch ${item.title}` : isCurrent && playing ? `Pause ${item.title}` : `Play ${item.title}`;

  return (
    <li className="w-36 shrink-0 snap-start md:w-auto">
      <button type="button" disabled={!ready} aria-label={label}
        onClick={() => (isVideo(item) ? onWatch(item) : play(item, queue))}
        className="group block w-full text-left disabled:cursor-default">
        <span className="relative block aspect-[3/4] overflow-hidden rounded-[20px] bg-raised shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)] transition duration-300 ease-out group-hover:-translate-y-1 group-enabled:group-hover:shadow-[0_28px_50px_-18px_rgb(229_99_241/0.45)]">
          {item.cover_url ? (
            <Image src={item.cover_url} alt="" fill sizes="(min-width: 768px) 20vw, 160px"
              className="object-cover brightness-90 transition duration-700 ease-out group-hover:scale-110 group-hover:brightness-105" />
          ) : (
            <CoverArt seed={item.id} className={`size-full transition duration-700 ease-out group-hover:scale-110 ${ready ? "" : "opacity-40 grayscale"}`} />
          )}
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent opacity-60 transition duration-300 group-hover:opacity-100" />
          {isVideo(item) && (
            <span className="absolute left-2 top-2 rounded-full bg-night/70 px-2 py-0.5 text-[11px] font-medium backdrop-blur">Video</span>
          )}
          {ready && (
            <span className={`absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-night shadow-xl transition duration-300 ${
              isCurrent ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
            }`}>
              {isCurrent && playing && !isVideo(item) ? <IconPause size={18} /> : <IconPlay size={18} />}
            </span>
          )}
        </span>
        <span className={`mt-2.5 block truncate font-medium ${isCurrent ? "text-orchid" : ""}`}>{item.title}</span>
        <span className="block truncate text-sm text-fog">
          {[kindLabel(item), genreName(item.genre)].filter(Boolean).join(", ")}
        </span>
      </button>
    </li>
  );
}

/** Scrolls sideways on phones, a grid from tablet up. */
function Shelf({ items }: { items: Generation[] }) {
  const [watching, setWatching] = useState<Generation | null>(null);
  const ref = useRef<HTMLUListElement>(null);
  const queue = items.filter((item) => !isVideo(item) && item.status === "completed");

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current!.children, { opacity: 0, y: 12, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity" });
  }, { scope: ref });

  return (
    <>
      <ul ref={ref}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 lg:grid-cols-6">
        {items.map((item) => <TrackCard key={item.id} item={item} queue={queue} onWatch={setWatching} />)}
      </ul>
      {watching && <VideoDialog generation={watching} onClose={() => setWatching(null)} />}
    </>
  );
}

/** The signed-in user's latest songs and videos, so Home doubles as a way back in. */
export function RecentShelf() {
  const { signedIn } = useSession();
  const { generations, loading } = useLibrary();
  const recent = generations.filter((item) => item.status !== "failed").slice(0, 10);
  if (!signedIn || loading || recent.length === 0) return null;
  return (
    <section aria-labelledby="recent-title">
      <ShelfHeader id="recent-title" title="Jump back in" href="/library" linkLabel="Library" />
      <Shelf items={recent} />
    </section>
  );
}

/** The examples the mobile app ships: songs first, then the videos. */
export function ExamplesShelf() {
  const items = [...SAMPLE_GENERATIONS.filter((item) => MUSIC_FEATURES.includes(item.feature)), ...SAMPLE_GENERATIONS.filter(isVideo)];
  return (
    <section aria-labelledby="examples-title">
      <ShelfHeader id="examples-title" title="Made with Sonx" />
      <Shelf items={items} />
    </section>
  );
}

/** Style tiles that open the create form with a prompt ready to go. */
export function StyleGrid() {
  return (
    <section aria-labelledby="styles-title">
      <ShelfHeader id="styles-title" title="Start from a style" href="/create" linkLabel="Blank song" />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STARTERS.map((starter) => (
          <li key={starter.label}>
            <Link href={`/create?prompt=${encodeURIComponent(starter.prompt)}`}
              className="group relative flex h-24 items-end overflow-hidden rounded-[18px] p-4 transition duration-300 hover:-translate-y-0.5 md:h-28">
              <CoverArt seed={starter.label} className="absolute inset-0 size-full opacity-70 transition duration-700 ease-out group-hover:scale-110 group-hover:opacity-100" />
              <span className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/30 to-transparent" />
              <span className="relative text-base font-semibold leading-snug tracking-[-0.01em] md:text-lg">{starter.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
