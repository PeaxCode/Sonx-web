import { Suspense } from "react";
import { Aurora } from "@/components/aurora";
import { CreateProvider } from "@/components/studio/create-context";
import { CreateLinkParams } from "@/components/studio/create-link-params";
import { CreateMusicForm } from "@/components/studio/create-music-form";
import { MusicList } from "@/components/studio/music-list";

type CreateSearchParams = Promise<{ prompt?: string; genre?: string }>;

const TITLE = "AI Song Maker: Turn Text or Lyrics into a Song | Sonx";
const DESCRIPTION =
  "Describe a song or paste your lyrics and Sonx makes it with AI vocals in 2 to 5 minutes. Pick a genre and voice, then play and download your MP3.";

export const metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/create" },
  openGraph: { siteName: "Sonx", type: "website", title: TITLE, description: DESCRIPTION, url: "/create" },
};

/** A prompt (and its genre) handed over from Home's style tiles or another site fills the form. */
async function PrefilledForm({ searchParams }: { searchParams: CreateSearchParams }) {
  const { prompt, genre } = await searchParams;
  return <CreateMusicForm initialPrompt={prompt ?? ""} initialGenre={genre} />;
}

export default function CreatePage({ searchParams }: { searchParams: CreateSearchParams }) {
  return (
    <CreateProvider>
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:px-8 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <CreateLinkParams />
      <section aria-labelledby="create-title"
        className="relative isolate overflow-hidden rounded-[32px] border border-paper/[0.06] p-6 md:p-8">
        <Aurora className="opacity-35" />
        <h1 id="create-title" className="mb-5 text-3xl font-semibold tracking-[-0.04em]">Create a song</h1>
        <Suspense fallback={<CreateMusicForm restoreDraft={false} />}>
          <PrefilledForm searchParams={searchParams} />
        </Suspense>
      </section>
      <section aria-labelledby="songs-title">
        <MusicList />
      </section>
    </div>
    </CreateProvider>
  );
}
