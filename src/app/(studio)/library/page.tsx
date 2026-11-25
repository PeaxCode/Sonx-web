import { LibraryView } from "@/components/studio/library-view";

export const metadata = { title: "Library", robots: { index: false } };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">Library</h1>
      <p className="mb-8 mt-2 text-paper/60">Everything you made, on the web and in the Sonx app.</p>
      <LibraryView />
    </div>
  );
}
