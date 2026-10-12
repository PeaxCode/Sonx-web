import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Hero } from "@/components/landing/hero";
import { STORE_LINKS } from "@/lib/billing-config";
import { FAQ, STARTERS, STEPS } from "@/components/landing/content";
import { HeaderAction } from "@/components/landing/header-action";
import { StoreBadges } from "@/components/store-badges";

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

        <section aria-labelledby="steps-title" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <h2 id="steps-title" className="max-w-xl font-display text-3xl font-semibold leading-tight md:text-4xl">
            From a sentence to a song
          </h2>
          {/* A real sequence, so the steps are numbered. */}
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-line pt-6">
                <span className="font-display text-5xl font-semibold text-violet/70">{index + 1}</span>
                <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-sm text-fog">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="starters-title" className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <h2 id="starters-title" className="font-display text-2xl font-semibold md:text-3xl">Not sure where to start?</h2>
          <p className="mt-2 text-fog">Pick one and change it however you like.</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {STARTERS.map((starter) => (
              <li key={starter.label}>
                <Link href={`/create?prompt=${encodeURIComponent(starter.prompt)}`}
                  className="block rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-violet hover:bg-violet/10">
                  {starter.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:px-8">
          <div>
            <h2 id="faq-title" className="font-display text-3xl font-semibold leading-tight md:sticky md:top-10 md:text-4xl">
              Questions, answered
            </h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span aria-hidden="true"
                    className="relative size-4 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-fog after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-fog after:transition-transform group-open:after:rotate-90" />
                </summary>
                <p className="mt-3 max-w-2xl text-fog">{item.answer}</p>
              </details>
            ))}
          </div>
          {/* Structured data so search engines can show these answers. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQ.map((item) => ({
                  "@type": "Question",
                  name: item.question,
                  acceptedAnswer: { "@type": "Answer", text: item.answer },
                })),
              }).replace(/</g, "\\u003c"),
            }}
          />
        </section>

        <section aria-labelledby="app-title" className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
          <div className="flex flex-col gap-8 rounded-[28px] bg-plum p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div className="max-w-lg">
              <h2 id="app-title" className="font-display text-2xl font-semibold md:text-3xl">The same songs on your phone</h2>
              <p className="mt-3 text-fog">
                Sign in with the same account in the Sonx app. Everything you make here is there, and the other way around.
              </p>
              <StoreBadges className="mt-6" />
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
