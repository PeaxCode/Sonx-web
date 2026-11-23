import Link from "next/link";
import { Aurora } from "@/components/aurora";

/** The closing call to action shared by Home and Pricing. */
export function ClosingCta() {
  return (
    <section aria-labelledby="cta-title"
      className="relative isolate overflow-hidden rounded-[32px] px-7 py-16 text-center md:py-24">
      <Aurora />
      <h2 id="cta-title" className="relative text-3xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-5xl">Your next song starts<br className="hidden md:block" /> with one sentence</h2>
      <p className="relative mx-auto mt-4 max-w-md text-fog">Describe it and hear it in a few minutes.</p>
      <Link href="/create"
        className="relative mt-8 inline-block rounded-full bg-paper px-8 py-3.5 text-sm font-semibold text-night transition hover:bg-paper/90">
        Create a song
      </Link>
    </section>
  );
}

/** Site footer. Plain <a> for the Blog and legal pages: they are static HTML, not app routes. */
export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-fog">
      <p>© Sonx</p>
      <nav className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/create" className="hover:text-paper">Create</Link>
        <Link href="/pricing" className="hover:text-paper">Pricing</Link>
        <a href="/blog/" className="hover:text-paper">Blog</a>
        <a href="/privacy.html" className="hover:text-paper">Privacy</a>
        <a href="/terms.html" className="hover:text-paper">Terms</a>
      </nav>
    </footer>
  );
}
