import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { FaqList } from "@/components/faq-list";
import { APP_STORE_RATING, FAQ, FEATURES, REVIEWS, STEPS } from "@/components/home/content";
import { Hero } from "@/components/home/hero";
import { ExamplesShelf, RecentShelf, StyleGrid } from "@/components/home/shelves";
import { PlanCards } from "@/components/pricing/plan-cards";
import { ClosingCta, SiteFooter } from "@/components/site-footer";
import { StoreBadges } from "@/components/store-badges";
import { STORE_LINKS } from "@/lib/billing-config";
import { SITE_URL } from "@/lib/journal";

// Under 60 characters, so search results show it whole.
const TITLE = "AI Song Generator — Full Songs with Vocals from Text | Sonx";
const DESCRIPTION =
  "Sonx AI turns any idea into a full song with AI lyrics and vocals in 2 to 5 minutes. On the web, iOS and Android. Describe your song and start creating now.";

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
      description: "AI song generator — turn any idea into a full song in minutes, with AI vocals and lyrics.",
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
      description: "AI song generator — turn any idea into a full song in minutes, with AI vocals and lyrics.",
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
    <>
    {/* Full-bleed: the hero runs edge to edge of the main area. */}
    <Hero />
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-6 pt-16 md:gap-28 md:px-8 md:pt-24 lg:pb-10">
      <RecentShelf />
      <ExamplesShelf />
      <StyleGrid />

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">From idea to song in a few minutes</h2>
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
                <p className="mt-1 text-lg font-semibold tracking-[-0.01em]">{step.title}</p>
                <p className="mt-2 max-w-xs text-sm text-fog">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {FEATURES.map((feature, index) => (
        <section key={feature.title} aria-labelledby={`feature-${index}`}
          className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className={`relative aspect-[4/3] overflow-hidden rounded-[32px] border border-line ${index % 2 ? "md:order-2" : ""}`}>
            <Image src={feature.image} alt={feature.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent" />
          </div>
          <div>
            <h2 id={`feature-${index}`} className="text-3xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-4xl">{feature.title}</h2>
            <p className="mt-4 max-w-md text-lg text-fog">{feature.text}</p>
            <ul className="mt-6 flex flex-col gap-3">
              {feature.points.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-orchid" />
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/create"
              className="mt-8 inline-block rounded-full bg-paper px-6 py-3 text-sm font-semibold text-night transition hover:bg-paper/90">
              {feature.cta}
            </Link>
          </div>
        </section>
      ))}

      <section aria-labelledby="reviews-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="reviews-title" className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">People keep pressing create</h2>
          <a href={STORE_LINKS.ios} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-fog hover:text-paper">
            <span aria-hidden="true" className="text-orchid">★</span>
            {APP_STORE_RATING.value} out of 5 from {APP_STORE_RATING.count} ratings on the App Store
          </a>
        </div>
        <ul className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {REVIEWS.map((review) => (
            <li key={review.author} className="mb-4 break-inside-avoid rounded-[var(--radius-panel)] border border-line bg-plum/60 p-6">
              <p className="font-semibold">{review.title}</p>
              <p className="mt-2 text-fog">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-4 text-sm text-fog/70">{review.author}, App Store review</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-pricing-title" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="home-pricing-title" className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">Simple plans, monthly or yearly</h2>
            <p className="mt-2 text-fog">Each dot is one song you can make every month. Pay yearly to save.</p>
          </div>
          <Link href="/pricing" className="text-sm font-medium text-orchid hover:text-paper">Compare plans and credit packs</Link>
        </div>
        <PlanCards />
      </section>

      <section aria-labelledby="app-title"
        className="flex flex-col gap-8 rounded-[28px] bg-plum p-7 md:flex-row md:items-center md:justify-between md:p-10">
        <div className="max-w-lg">
          <h2 id="app-title" className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">The same songs on your phone</h2>
          <p className="mt-3 text-fog">
            Sign in with the same account in the Sonx app. Everything you make here is there, and the other way around.
          </p>
          <StoreBadges className="mt-6" />
        </div>
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <div className="rounded-2xl bg-paper p-3"><QRCodeSVG value={`${SITE_URL}/get-app`} size={104} /></div>
          <p className="max-w-32 text-sm text-fog">Scan with your phone camera</p>
        </div>
      </section>

      <FaqList id="faq-title" title="Questions, answered" items={FAQ} />

      <ClosingCta />
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_GRAPH).replace(/</g, "\\u003c") }}
      />
    </div>
    </>
  );
}
