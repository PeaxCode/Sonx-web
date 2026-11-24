import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArtistProfile } from "@/components/explore/artist";
import { Chevron } from "@/components/explore/tiles";
import { exploreEnabled } from "@/lib/flags";
import { fetchProfile, fetchProfileSongs, type PublicProfile } from "@/lib/profiles";

type Props = { params: Promise<{ handle: string }> };

// Profiles are created after deploys, so none are known at build time. One placeholder
// (an invalid handle, read without a network call) gives the shell a route to prerender.
export function generateStaticParams() {
  return [{ handle: "--" }];
}

/** The profile, or null when Explore is off, the handle is malformed or nobody has it. */
async function profileFor(handle: string): Promise<PublicProfile | null> {
  if (!exploreEnabled || !/^[a-z0-9][a-z0-9-]{2,29}$/i.test(handle)) return null;
  return fetchProfile(handle).catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await profileFor((await params).handle);
  // Kept out of search results with the rest of Explore until launch.
  return { title: profile ? `${profile.display_name} (@${profile.handle})` : "Artist", robots: { index: false } };
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
  const profile = await profileFor((await params).handle);
  if (!profile) notFound();
  const songs = await fetchProfileSongs(profile).catch(() => []);
  return <ArtistProfile profile={profile} songs={songs} />;
}
