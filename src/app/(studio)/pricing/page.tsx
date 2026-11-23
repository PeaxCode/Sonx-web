import type { Metadata } from "next";
import { Aurora } from "@/components/aurora";
import { FaqList, type FaqItem } from "@/components/faq-list";
import { CreditPacks } from "@/components/pricing/credit-packs";
import { PlanCards } from "@/components/pricing/plan-cards";
import { ClosingCta, SiteFooter } from "@/components/site-footer";
import { SONG_CREDIT_COST } from "@/lib/billing-config";

const TITLE = "Pricing — Sonx Pro and Studio Plans";
const DESCRIPTION =
  "Make AI songs with vocals from $4.99 a month. Pro and Studio plans bill monthly or yearly, with credit packs to top up. Works on the web and in the Sonx app.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { siteName: "Sonx", type: "website", title: TITLE, description: DESCRIPTION, url: "/pricing" },
};

// Each claim here matches terms.html (refunds, license) and how checkout behaves.
const ASSURANCES = [
  "Secure checkout by Paddle",
  "Refund within 14 days of a web purchase",
  "Cancel anytime from your account",
  "Prices include tax where it applies",
];

const PRICING_FAQ: FaqItem[] = [
  {
    question: "What is the difference between Pro and Studio?",
    answer:
      "Both include every feature, commercial use and MP3 downloads. Studio gives you more songs every month at a lower price per song. Pick Pro to start.",
  },
  {
    question: "Does a yearly plan give me all my songs at once?",
    answer:
      "No. Yearly plans are billed once a year at a lower price, and your songs renew every month, the same as a monthly plan.",
  },
  {
    question: "How do credit packs work?",
    answer: `Credit packs top up a plan when you run out of songs before the month ends. They are available to Pro and Studio members. Every song uses ${SONG_CREDIT_COST} credits, with vocals or instrumental. Your plan's songs are always used first.`,
  },
  {
    question: "I already subscribe in the app. Do I pay again here?",
    answer:
      "No. Sign in with the same Apple or Google account you use in the Sonx app and your plan and credits are already here. A plan bought on the web works in the app the same way.",
  },
  {
    question: "What can I do for free?",
    answer: "Every free account gets one song a month, plus the AI lyrics writer. Free songs play on Sonx but can't be downloaded or used commercially; a plan adds MP3 downloads, commercial use and many more songs.",
  },
  {
    question: "How do I cancel?",
    answer:
      "For a plan bought here, open Account and choose Manage subscription. Plans bought in the app are managed in the App Store or Google Play. You keep your plan until the end of the period you paid for.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Web purchases can be refunded within 14 days. Contact Paddle at paddle.net or email legal@getsonx.com with your order details. App purchases are refunded by Apple or Google.",
  },
  {
    question: "Can I use my songs commercially?",
    answer: "Yes. Pro and Studio include a license to use the songs you make commercially.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-8 md:px-8 lg:py-12">
      <header className="relative isolate -mx-4 overflow-hidden px-4 pb-16 pt-16 text-center md:mx-0 md:rounded-[32px] md:pt-24">
        <Aurora />
        <h1 className="text-4xl font-semibold leading-[0.98] tracking-[-0.045em] md:text-4xl">Make more music for less</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-fog">
          Paid plans include commercial use and MP3 downloads, here and in the Sonx app.
        </p>
      </header>

      <section aria-labelledby="plans-title" className="-mt-8 flex flex-col gap-6">
        <h2 id="plans-title" className="sr-only">Plans</h2>
        <PlanCards />
        {/* Right under the buttons, where the decision is made. */}
        <Assurances />
      </section>

      <section aria-labelledby="credits-title" className="flex flex-col gap-6">
        <div className="max-w-2xl">
          <h2 id="credits-title" className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">Top up with credits</h2>
          <p className="mt-3 text-fog">
            Ran out of songs before the month ends? Credit packs keep you going until your plan renews. For Pro and Studio members.
          </p>
        </div>
        <CreditPacks />
      </section>

      <FaqList id="pricing-faq-title" title="Pricing questions" items={PRICING_FAQ} />
      <ClosingCta />
      <SiteFooter />
    </div>
  );
}

function Assurances() {
  return (
    <ul aria-label="Buying on Sonx" className="grid gap-3 rounded-[var(--radius-panel)] bg-plum p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
  );
}
