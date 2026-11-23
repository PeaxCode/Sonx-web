import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArtistProfile } from "@/components/explore/artist";
import { Chevron } from "@/components/explore/tiles";
import { ARTISTS, findArtist, tracksBy } from "@/lib/explore-mock";
import { exploreEnabled } from "@/lib/flags";

type Props = { params: Promise<{ handle: string }> };

// Mock artists (lib/explore-mock.ts): every profile is known at build time.
export function generateStaticParams() {
  return ARTISTS.map((artist) => ({ handle: artist.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = findArtist((await params).handle);
  // Kept out of search results with the rest of Explore until profiles are real.
  return { title: artist ? artist.name : "Artist", robots: { index: false } };
}

export default function ArtistPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-8 md:pt-6">
      <Link href="/explore"
        className="mb-6 inline-flex items-center gap-1 rounded-full bg-paper/[0.07] py-1.5 pl-2 pr-3.5 text-xs font-medium text-paper/80 transition hover:bg-paper/15 hover:text-paper">
        <Chevron direction="left" /> Explore
      </Link>
      {/* Reading params streams behind the shell, so navigating here stays instant. */}
      <Suspense fallback={<div className="h-64" />}>
        <Artist params={params} />
      </Suspense>
    </div>
  );
}

async function Artist({ params }: Props) {
  const artist = exploreEnabled ? findArtist((await params).handle) : undefined;
  if (!artist) notFound();
  return <ArtistProfile artist={artist} tracks={tracksBy(artist.handle)} />;
}
