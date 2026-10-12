import { LibraryView } from "@/components/studio/library-view";

export const metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 lg:py-12">
      <h1 className="mb-2 font-display text-2xl font-semibold">Library</h1>
      <p className="mb-6 text-fog">Everything you made, on the web and in the Sonx app.</p>
      <LibraryView />
    </div>
  );
}
