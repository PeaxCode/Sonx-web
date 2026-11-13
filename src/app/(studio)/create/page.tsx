import { Suspense } from "react";
import { Aurora } from "@/components/aurora";
import { CreateLinkParams } from "@/components/studio/create-link-params";
import { CreateMusicForm } from "@/components/studio/create-music-form";
import { MusicList } from "@/components/studio/music-list";

export const metadata = { title: "Create a song", alternates: { canonical: "/create" } };

/** A prompt handed over from the landing page fills the form. */
async function PrefilledForm({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const { prompt } = await searchParams;
  return <CreateMusicForm initialPrompt={prompt ?? ""} />;
}

export default function CreatePage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-14 lg:py-14">
      <CreateLinkParams />
      <section aria-labelledby="create-title"
        className="relative isolate overflow-hidden rounded-[32px] border border-paper/[0.06] p-6 md:p-8">
        <Aurora className="opacity-35" />
        <h1 id="create-title" className="mb-6 text-4xl font-semibold tracking-[-0.04em]">Create a song</h1>
        <Suspense fallback={<CreateMusicForm restoreDraft={false} />}>
          <PrefilledForm searchParams={searchParams} />
        </Suspense>
      </section>
      <section aria-labelledby="songs-title">
        <MusicList />
      </section>
    </div>
  );
}
