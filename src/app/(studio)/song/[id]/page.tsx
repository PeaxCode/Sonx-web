import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Aurora } from "@/components/aurora";
import { CoverArt } from "@/components/cover-art";
import { SharedSongPlayButton } from "@/components/studio/shared-song-player";
import { genreName, kindLabel } from "@/lib/song-labels";
import { isGenre } from "@/lib/billing-config";
import { fetchSharedSong } from "@/lib/shared-songs";

type Props = { params: Promise<{ id: string }> };

// Songs are shared after deploys, so none are known at build time. One placeholder
// gives the studio shell (which reads the pathname) a route to prerender; every
// real ID renders on request.
export function generateStaticParams() {
  return [{ id: "00000000-0000-4000-8000-000000000000" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song = await fetchSharedSong((await params).id);
  if (!song) return { title: "Song not found", robots: { index: false } };
  const genre = genreName(song.genre);
  const kind = kindLabel(song).toLowerCase();
  const phrase = genre ? `${genre} ${kind}` : kind;
  const description = `Listen to “${song.title}”, ${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase} made with Sonx AI. Make your own song from one sentence.`;
  const url = `/song/${song.id}`;
  // A page's openGraph replaces the layout's, so the share image is set again here.
  const image = { url: "/og-image-v2.png", width: 1200, height: 630, alt: `${song.title}, made with Sonx` };
  return {
    // The layout template adds " | Sonx".
    title: `${song.title}: ${genre ? `${genre} ` : ""}song made with AI`,
    description,
    alternates: { canonical: url },
    // Shared by its owner for listening; kept out of search until song pages are curated.
    robots: { index: false, follow: true },
    openGraph: { siteName: "Sonx", type: "music.song", title: song.title, description, url, images: [image], audio: song.output_url },
    twitter: { card: "summary_large_image", title: song.title, description, images: [image.url] },
  };
}

/** Public page of a song its owner shared: listen, then make your own. */
export default function SongPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="h-[70vh]" />}>
      <SharedSong params={params} />
    </Suspense>
  );
}

async function SharedSong({ params }: Props) {
  const song = await fetchSharedSong((await params).id);
  if (!song) notFound();
  return (
    <div className="relative isolate mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
      <Aurora />
      <div className="relative size-56 overflow-hidden rounded-[28px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] md:size-64">
        <CoverArt seed={song.id} className="size-full" />
      </div>
      <p className="mt-8 text-sm font-medium text-orchid">{[kindLabel(song), genreName(song.genre)].filter(Boolean).join(" · ")}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-5xl">{song.title}</h1>
      <p className="mt-3 text-fog">Made with Sonx from a few words.</p>
      <div className="mt-8"><SharedSongPlayButton song={song} /></div>
      <div className="mt-14 rounded-[var(--radius-panel)] border border-line bg-plum/70 px-6 py-6 backdrop-blur">
        <p className="font-semibold">Make a song like this</p>
        <p className="mt-1 text-sm text-fog">Describe it in a sentence. Your first song each month is free.</p>
        <Link href={isGenre(song.genre) ? `/create?genre=${encodeURIComponent(song.genre)}` : "/create"}
          className="mt-4 inline-block rounded-full bg-paper px-6 py-3 text-sm font-semibold text-night transition hover:bg-paper/90">
          Create your song
        </Link>
      </div>
    </div>
  );
}
