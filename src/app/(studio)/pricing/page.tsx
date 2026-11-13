import type { Metadata } from "next";
import { FaqList, type FaqItem } from "@/components/faq-list";
import { CreditPacks } from "@/components/pricing/credit-packs";
import { PlanCards } from "@/components/pricing/plan-cards";
import { CREDIT_COSTS } from "@/lib/billing-config";

const TITLE = "Pricing — Sonx Pro Plans and Credit Packs";
const DESCRIPTION =
  "Subscribe weekly, monthly or yearly for a set number of AI songs, or buy credits with no subscription. Works on the web and in the Sonx app.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { siteName: "Sonx", type: "website", title: TITLE, description: DESCRIPTION, url: "/pricing" },
};

const INCLUDED = [
  { title: "Commercial use", text: "Paid plans include a license to use your songs commercially." },
  { title: "MP3 downloads", text: "Download every song you make, straight from your library." },
  { title: "Lyrics written for you", text: "Start from a topic or bring your own words." },
  { title: "One account everywhere", text: "Your plan, songs and credits are the same in the Sonx app." },
];

// Each claim here matches terms.html (refunds, license) and how checkout behaves.
const ASSURANCES = [
  "Secure checkout by Paddle",
  "Refund within 14 days of a web purchase",
  "Cancel anytime from your account",
  "Prices include tax where it applies",
];

const PRICING_FAQ: FaqItem[] = [
  {
    question: "What is the difference between a plan and credits?",
    answer:
      "A plan gives you a set number of songs every week, month or year and renews until you cancel. Credits are a one-time purchase you spend song by song, with no subscription. If you have both, your plan's songs are used first.",
  },
  {
    question: "How many credits does a song use?",
    answer: `A song with vocals uses ${CREDIT_COSTS.LYRICS_MUSIC} credits and an instrumental uses ${CREDIT_COSTS.PROMPT_MUSIC}. Writing lyrics for you is free.`,
  },
  {
    question: "I already subscribe in the app. Do I pay again here?",
    answer:
      "No. Sign in with the same Apple or Google account you use in the Sonx app and your plan and credits are already here. A plan bought on the web works in the app the same way.",
  },
  {
    question: "How do I cancel?",
    answer:
      "For a plan bought here, open Account and choose Manage subscription. Plans bought in the app are managed in the App Store or Google Play. You keep Pro until the end of the period you paid for.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Web purchases can be refunded within 14 days. Contact Paddle at paddle.net or email legal@getsonx.com with your order details. App purchases are refunded by Apple or Google.",
  },
  {
    question: "Can I use my songs commercially?",
    answer:
      "Yes, with a paid plan: subscribers get a license to use their songs commercially. Songs made without a plan are for personal use.",
  },
  {
    question: "What happens when I run out of songs?",
    answer:
      "Buy a credit pack to keep going, or wait for your plan to renew. Your songs left for the period are shown on your Account page.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-8 md:px-8 lg:py-12">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold leading-tight md:text-5xl">Plans and credits</h1>
        <p className="mt-4 text-lg text-fog">
          Subscribe for a set number of songs each period, or buy credits as you go. Both work here and in the Sonx app.
        </p>
      </header>

      <section aria-labelledby="plans-title" className="flex flex-col gap-6">
        <div>
          <h2 id="plans-title" className="font-display text-xl font-semibold md:text-2xl">Sonx Pro</h2>
          <p className="mt-2 text-fog">Each dot is one song you can make in that period.</p>
        </div>
        <PlanCards />
        <ul className="grid gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED.map((item) => (
            <li key={item.title}>
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-fog">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="credits-title" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <h2 id="credits-title" className="font-display text-xl font-semibold md:text-2xl">Credits, no subscription</h2>
          <p className="mt-2 text-fog">
            Pay once and spend them song by song. Good for a one-off project, or for more songs before your plan renews.
          </p>
        </div>
        <CreditPacks />
      </section>

      <ul aria-label="Buying on Sonx" className="grid gap-3 rounded-[var(--radius-panel)] bg-plum p-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {ASSURANCES.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-violet">
              <path d="m5 12 5 5L20 7" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <FaqList id="pricing-faq-title" title="Pricing questions" items={PRICING_FAQ} />
    </div>
  );
}
