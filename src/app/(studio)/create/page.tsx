import { Suspense } from "react";
import { CreateMusicForm } from "@/components/studio/create-music-form";
import { MusicList } from "@/components/studio/music-list";

export const metadata = { title: "Create a song" };

/** A prompt handed over from the landing page fills the form. */
async function PrefilledForm({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const { prompt } = await searchParams;
  return <CreateMusicForm initialPrompt={prompt ?? ""} />;
}

export default function CreatePage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:py-12">
      <section aria-labelledby="create-title">
        <h1 id="create-title" className="mb-6 font-display text-2xl font-semibold">Create a song</h1>
        <Suspense fallback={<CreateMusicForm />}>
          <PrefilledForm searchParams={searchParams} />
        </Suspense>
      </section>
      <section aria-labelledby="songs-title">
        <h2 id="songs-title" className="mb-4 font-display text-lg font-semibold">Your songs</h2>
        <MusicList />
      </section>
    </div>
  );
}
