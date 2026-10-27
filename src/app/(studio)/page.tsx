import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { FAQ, WAYS } from "@/components/home/content";
import { Hero } from "@/components/home/hero";
import { ExamplesShelf, RecentShelf, StyleGrid } from "@/components/home/shelves";
import { StoreBadges } from "@/components/store-badges";
import { STORE_LINKS } from "@/lib/billing-config";
import { SITE_URL } from "@/lib/journal";

// Title and description carried over from the old getsonx.com landing page, which ranks on them.
const TITLE = "Sonx AI — AI Song Generator App";
const DESCRIPTION =
  "Sonx AI turns any idea into a full song in seconds — AI music, lyrics and vocals. Free on the web, iOS and Android.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", images: [{ url: "/og-image.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
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

      <section aria-labelledby="ways-title">
        <h2 id="ways-title" className="mb-4 font-display text-xl font-semibold">Three ways to create</h2>
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

      <section aria-labelledby="faq-title" className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
        <h2 id="faq-title" className="font-display text-xl font-semibold md:text-2xl">Questions, answered</h2>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true"
                  className="relative size-4 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-fog after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-fog after:transition-transform group-open:after:rotate-90" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm text-fog">{item.answer}</p>
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

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-fog">
        <p>© Sonx</p>
        <nav className="flex gap-6">
          {/* Plain links: the Journal and legal pages are static HTML, not app routes. */}
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
