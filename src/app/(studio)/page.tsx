import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { FaqList } from "@/components/faq-list";
import { FAQ, STEPS, WAYS } from "@/components/home/content";
import { Hero } from "@/components/home/hero";
import { ExamplesShelf, RecentShelf, StyleGrid } from "@/components/home/shelves";
import { PlanCards } from "@/components/pricing/plan-cards";
import { StoreBadges } from "@/components/store-badges";
import { STORE_LINKS } from "@/lib/billing-config";
import { SITE_URL } from "@/lib/journal";

// Under 60 characters, so search results show it whole.
const TITLE = "AI Song Generator — Full Songs with Vocals from Text | Sonx";
const DESCRIPTION =
  "Sonx AI turns any idea into a full song in seconds, with AI lyrics and vocals. On the web, iOS and Android. Describe your song and start creating now.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Replaces the layout's openGraph rather than merging with it, so type and siteName are repeated here.
  openGraph: {
    siteName: "Sonx",
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/og-image-v2.png", width: 1200, height: 630 }],
    // Brand video for share previews; only here and on the Journal index, so posts keep their own cover.
    videos: [
      {
        url: "https://getsonx.com/og-video.mp4",
        secureUrl: "https://getsonx.com/og-video.mp4",
        type: "video/mp4",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og-image-v2.png"] },
};

// Same @id values as the Journal posts' publisher, so search engines tie them to one organization.
const ORGANIZATION_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Sonx",
      alternateName: ["Sonx AI", "Sonx Music"],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      sameAs: [
        STORE_LINKS.ios,
        STORE_LINKS.android,
        "https://www.instagram.com/sonxaisong/",
        "https://www.tiktok.com/@sonxofficial",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Sonx",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: "Sonx",
      alternateName: "Sonx AI",
      description: "AI song generator — turn any idea into a full song in seconds, with AI vocals and lyrics.",
      url: `${SITE_URL}/create`,
      applicationCategory: "MusicApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE_URL}/#organization` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "MobileApplication",
      name: "Sonx",
      alternateName: "Sonx AI",
      description: "AI song generator — turn any idea into a full song in seconds, with AI vocals and lyrics.",
      url: `${SITE_URL}/`,
      applicationCategory: "MusicApplication",
      operatingSystem: "iOS, Android",
      publisher: { "@id": `${SITE_URL}/#organization` },
      installUrl: [STORE_LINKS.ios, STORE_LINKS.android],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

/** Home inside the studio: a prompt to start from, music to listen to, ways in. */
export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-6 md:px-8 lg:py-10">
      <Hero />
      <RecentShelf />
      <ExamplesShelf />
      <StyleGrid />

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="font-display text-xl font-semibold md:text-2xl">From idea to song in about a minute</h2>
        <ol className="relative mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
          {/* A playback track under the steps; the filled part is the song coming together. */}
          <span aria-hidden="true" className="absolute top-[7px] right-0 left-0 hidden h-0.5 bg-line md:block" />
          <span aria-hidden="true" className="bg-signature absolute top-[7px] left-0 hidden h-0.5 w-2/3 md:block" />
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 md:block">
              <span aria-hidden="true"
                className={`relative mt-0.5 block size-4 shrink-0 rounded-full border-2 md:mt-0 ${index < 2 ? "border-violet bg-violet" : "border-fog bg-night"}`} />
              <div className="md:mt-5">
                <p className="text-sm text-fog tabular-nums"><span className="sr-only">At </span>{step.time}</p>
                <p className="mt-1 font-display font-semibold">{step.title}</p>
                <p className="mt-2 max-w-xs text-sm text-fog">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ways-title">
        <h2 id="ways-title" className="mb-4 font-display text-xl font-semibold">Ways to start</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {WAYS.map((way) => (
            <li key={way.title}>
              <Link href={way.href}
                className="group relative flex min-h-64 flex-col justify-end overflow-hidden rounded-[var(--radius-panel)] border border-line">
                <Image src={way.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover opacity-70 transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-night via-night/60 to-transparent" />
                <span className="relative p-6">
                  <span className="block font-display text-lg font-semibold">{way.title}</span>
                  <span className="mt-2 block text-sm text-fog">{way.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-pricing-title" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="home-pricing-title" className="font-display text-xl font-semibold md:text-2xl">Pick a plan, or pay as you go</h2>
            <p className="mt-2 text-fog">Each dot is one song. Credit packs need no subscription.</p>
          </div>
          <Link href="/pricing" className="text-sm font-medium text-violet hover:text-orchid">See credit packs and pricing details</Link>
        </div>
        <PlanCards />
      </section>

      <section aria-labelledby="app-title"
        className="flex flex-col gap-8 rounded-[28px] bg-plum p-7 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-lg">
          <h2 id="app-title" className="font-display text-xl font-semibold md:text-2xl">The same songs on your phone</h2>
          <p className="mt-3 text-fog">
            Sign in with the same account in the Sonx app. Everything you make here is there, and the other way around.
          </p>
          <StoreBadges className="mt-6" />
        </div>
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <div className="rounded-2xl bg-paper p-3"><QRCodeSVG value={STORE_LINKS.ios} size={104} /></div>
          <p className="max-w-32 text-sm text-fog">Scan with your iPhone camera</p>
        </div>
      </section>

      <FaqList id="faq-title" title="Questions, answered" items={FAQ} />

      <section aria-labelledby="cta-title"
        className="relative overflow-hidden rounded-[28px] border border-line px-7 py-12 text-center md:py-16">
        <span aria-hidden="true" className="bg-signature absolute inset-x-0 -bottom-24 mx-auto h-48 w-2/3 rounded-full opacity-30 blur-3xl" />
        <h2 id="cta-title" className="relative font-display text-2xl font-semibold md:text-4xl">Your next song starts with one sentence</h2>
        <p className="relative mx-auto mt-4 max-w-md text-fog">Describe it and hear it in about a minute.</p>
        <Link href="/create"
          className="bg-signature relative mt-8 inline-block rounded-[var(--radius-control)] px-7 py-3.5 font-display text-sm font-semibold tracking-wide transition hover:brightness-110">
          Create a song
        </Link>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-fog">
        <p>© Sonx</p>
        <nav className="flex gap-6">
          {/* Plain links: the Journal and legal pages are static HTML, not app routes. */}
          <Link href="/pricing" className="hover:text-paper">Pricing</Link>
          <a href="/blog/" className="hover:text-paper">Journal</a>
          <a href="/privacy.html" className="hover:text-paper">Privacy</a>
          <a href="/terms.html" className="hover:text-paper">Terms</a>
        </nav>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_GRAPH).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
