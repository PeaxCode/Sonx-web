import Image from "next/image";
import Link from "next/link";
import { Aurora } from "@/components/aurora";

export const metadata = { title: "Page not found" };

/** Branded 404 for any address that is not a page, with the two ways back in. */
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-5 text-center">
      <Aurora />
      <div className="max-w-md">
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
          <Image src="/images/sonx-icon.png" alt="" width={40} height={40} className="rounded-xl" />
          <span className="font-display text-xl font-semibold">Sonx</span>
        </Link>
        <p className="font-display text-6xl font-semibold tracking-[-0.04em] text-paper/90">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">This page skipped a beat</h1>
        <p className="mt-3 text-fog">The link may be old or mistyped. Make a song instead, or head home.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="bg-signature rounded-full px-6 py-3 text-sm font-semibold transition hover:brightness-110">
            Create a song
          </Link>
          <Link href="/" className="rounded-full bg-paper/10 px-6 py-3 text-sm font-semibold transition hover:bg-paper/15">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
