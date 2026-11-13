import type { Metadata } from "next";
import { ExploreView } from "@/components/explore/explore-view";

// Mock content for now (lib/explore-mock.ts): kept out of search results until the feed is real.
export const metadata: Metadata = { title: "Explore", robots: { index: false } };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 md:px-8">
      <h1 className="sr-only">Explore</h1>
      <ExploreView />
    </div>
  );
}
