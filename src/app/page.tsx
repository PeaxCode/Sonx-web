import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Hero } from "@/components/landing/hero";
import { STORE_LINKS } from "@/lib/billing-config";
import { HeaderAction } from "@/components/landing/header-action";

const FEATURES = [
  {
    image: "/images/feature-song.png",
    title: "Songs from a sentence",
    text: "Describe a mood, a moment or a story. Sonx writes the lyrics, picks the voice and produces the track.",
  },
  {
    image: "/images/feature-lyrics.png",
    title: "Lyrics written for you",
    text: "Bring your own words or start from a topic and edit what comes back.",
  },
  {
    image: "/images/feature-video.png",
    title: "Music videos from a photo",
    text: "Pick a portrait and a song. The photo sings along.",
  },
];

export default function Home() {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/sonx-icon.png" alt="" width={34} height={34} className="rounded-lg" />
          <span className="font-display text-lg font-semibold">Sonx</span>
        </Link>
        <HeaderAction />
      </header>

      <main>
        <Hero />

        <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <h2 id="features-title" className="max-w-xl font-display text-3xl font-semibold leading-tight md:text-4xl">
            One idea, three ways to hear it
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-5 md:grid-rows-2">
            {FEATURES.map((feature, index) => (
              <article key={feature.title}
                className={`group relative flex min-h-72 flex-col justify-end overflow-hidden border border-line ${
                  index === 0 ? "rounded-[28px] md:col-span-3 md:row-span-2 md:min-h-[34rem]" : "rounded-[var(--radius-panel)] md:col-span-2"
                }`}>
                <Image src={feature.image} alt="" fill sizes={index === 0 ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 768px) 40vw, 100vw"}
                  className="object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-transparent" />
                <div className="relative p-6 md:p-8">
                  <h3 className={`font-display font-semibold ${index === 0 ? "text-2xl md:text-3xl" : "text-xl"}`}>{feature.title}</h3>
                  <p className="mt-2 max-w-md text-fog">{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="app-title" className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
          <div className="flex flex-col gap-8 rounded-[28px] bg-plum p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div className="max-w-lg">
              <h2 id="app-title" className="font-display text-2xl font-semibold md:text-3xl">The same songs on your phone</h2>
              <p className="mt-3 text-fog">
                Sign in with the same account in the Sonx app. Everything you make here is there, and the other way around.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={STORE_LINKS.ios} target="_blank" rel="noreferrer"
                  className="rounded-[var(--radius-control)] bg-paper px-5 py-3 text-sm font-semibold text-night">
                  Download on the App Store
                </a>
                <a href={STORE_LINKS.android} target="_blank" rel="noreferrer"
                  className="rounded-[var(--radius-control)] border border-line px-5 py-3 text-sm font-semibold">
                  Get it on Google Play
                </a>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-4 md:flex">
              <div className="rounded-2xl bg-paper p-3"><QRCodeSVG value={STORE_LINKS.ios} size={112} /></div>
              <p className="max-w-32 text-sm text-fog">Scan with your iPhone camera</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-fog md:px-8">
          <p>© Sonx</p>
          <nav className="flex gap-6">
            <a href="https://www.getsonx.com/privacy.html" className="hover:text-paper">Privacy</a>
            <a href="https://www.getsonx.com/terms.html" className="hover:text-paper">Terms</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
