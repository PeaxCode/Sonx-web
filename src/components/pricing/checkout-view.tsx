"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppleSignInButton } from "@/components/apple-button";
import { EmailSignIn, OrDivider } from "@/components/email-sign-in";
import { GoogleSignInButton } from "@/components/google-button";
import { useBilling } from "@/components/studio/billing";
import { useFeedback } from "@/components/studio/feedback";
import { useSession } from "@/components/studio/session";
import { PLAN_LABELS, SONG_CREDIT_COST, songsIn } from "@/lib/billing-config";
import { hasDraft } from "@/lib/draft";
import {
  closeWebCheckout,
  describePrice,
  formatMoney,
  onCheckoutTotals,
  openWebCheckout,
  planPriceId,
  switchCheckoutPrice,
  type BillingCycle,
  type CheckoutTotals,
  type WebPrice,
} from "@/lib/paddle";
import { getSupabase } from "@/lib/supabase/client";
import { TIERS, usePrices } from "./plan-cards";
import { checkoutHref } from "./use-checkout";

const FRAME_CLASS = "sonx-checkout-frame";

const ASSURANCES = [
  "Secure payment by Paddle, our reseller",
  "Refund within 14 days of a web purchase",
  "Cancel anytime from Account",
  "Works here and in the Sonx app",
];

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-orchid">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

const money = (currency: string, amount: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);

/**
 * Sonx's own checkout: what you are buying, in our design, beside Paddle's
 * payment form embedded inline. Visitors sign up in the same place, and the
 * form opens as soon as they are back.
 */
export function CheckoutView({ priceId }: { priceId: string }) {
  const info = describePrice(priceId);
  const router = useRouter();
  const prices = usePrices();
  const { signedIn } = useSession();
  const { billing, awaitPurchase } = useBilling();
  const { notify } = useFeedback();
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [failed, setFailed] = useState(false);
  const opened = useRef<string | null>(null);

  // Who may buy this: a plan needs no plan yet, a credit pack needs one.
  const blocked = !billing || !info ? null
    : info.kind === "plan" && billing.isPro
      ? billing.store === "paddle" ? "web-plan" : "app-plan"
      : info.kind === "credits" && !billing.isPro ? "needs-plan" : null;
  const ready = Boolean(signedIn && billing && info && !blocked);

  useEffect(() => onCheckoutTotals(setTotals), []);

  // Open Paddle's form in the frame once the buyer is known; it stays open while the price switches.
  useEffect(() => {
    if (!ready || !info || opened.current) return;
    opened.current = priceId;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (cancelled || !user) return;
      try {
        await openWebCheckout({
          priceId,
          kind: info.kind,
          userId: user.id,
          email: user.email ?? null,
          inlineTarget: FRAME_CLASS,
          // A song waiting from the paywall is made right away; otherwise Account shows the plan or credits arriving.
          onCompleted: () => {
            awaitPurchase(info.kind);
            router.push(hasDraft() ? "/create?resume=1" : "/account");
          },
        });
      } catch (error) {
        setFailed(true);
        notify(error instanceof Error ? error.message : "Checkout could not open.", "error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, info, priceId, awaitPurchase, notify, router]);

  useEffect(() => () => void closeWebCheckout(), []);

  if (!info) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">This checkout link is not valid</h1>
        <p className="mt-3 text-fog">Pick a plan or credit pack to start again.</p>
        <Link href="/pricing" className="bg-signature mt-8 inline-block rounded-full px-6 py-3 text-sm font-semibold">See plans</Link>
      </div>
    );
  }

  const tier = info.kind === "plan" ? TIERS.find((item) => item.tier === info.tier)! : null;
  const price: WebPrice | undefined = prices?.[priceId];
  const otherCycle: BillingCycle | null = info.kind === "plan" ? (info.cycle === "yearly" ? "monthly" : "yearly") : null;
  const songs = tier ? songsIn(tier.plan) : info.kind === "credits" ? Math.floor(info.credits / SONG_CREDIT_COST) : 0;
  const perMonth = price && info.kind === "plan" ? (info.cycle === "yearly" ? price.amount / 12 : price.amount) : null;

  const switchCycle = (cycle: BillingCycle) => {
    if (info.kind !== "plan") return;
    const next = planPriceId(info.tier, cycle);
    if (!next) return;
    router.replace(checkoutHref(next), { scroll: false });
    void switchCheckoutPrice(next);
  };

  const title = tier ? `Sonx ${tier.name}` : `${info.kind === "credits" ? info.credits.toLocaleString("en-US") : ""} credits`;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:gap-14 lg:py-14">
      <section aria-labelledby="checkout-title" className="flex flex-col gap-6">
        <Link href="/pricing" className="text-sm text-fog transition hover:text-paper">&larr; All plans</Link>
        <div>
          <p className="text-sm font-medium text-orchid">{tier ? tier.badge : "Credit pack"}</p>
          <h1 id="checkout-title" className="mt-1 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">{title}</h1>
          <p className="mt-2 text-fog">{tier ? tier.pitch : "A one-time top-up, used after your plan's monthly songs."}</p>
        </div>

        {info.kind === "plan" && otherCycle && (
          <div role="radiogroup" aria-label="Billing period" className="inline-flex w-fit rounded-full border border-line bg-plum p-1 text-sm">
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button key={cycle} type="button" role="radio" aria-checked={info.cycle === cycle} onClick={() => switchCycle(cycle)}
                className={`rounded-full px-4 py-2 font-medium transition ${info.cycle === cycle ? "bg-paper text-night" : "text-fog hover:text-paper"}`}>
                {cycle === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-[var(--radius-panel)] border border-line bg-plum/60 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-3xl font-semibold tabular-nums">{songs}</p>
              <p className="text-sm text-fog">{info.kind === "plan" ? "songs every month" : "songs, with vocals or instrumental"}</p>
            </div>
            {price && (
              <p className="text-right text-sm text-fog tabular-nums">
                {formatMoney(price, (perMonth ?? price.amount) / songs)}<br />per song
              </p>
            )}
          </div>
          <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fog">{info.kind === "plan" ? (info.cycle === "yearly" ? "Billed yearly" : "Billed monthly") : "One-time payment"}</dt>
              <dd className="tabular-nums">{price ? price.formatted : "…"}</dd>
            </div>
            {perMonth !== null && info.kind === "plan" && info.cycle === "yearly" && price && (
              <div className="flex justify-between gap-4">
                <dt className="text-fog">Per month</dt>
                <dd className="tabular-nums">{formatMoney(price, perMonth)}</dd>
              </div>
            )}
            {totals && (
              <>
                {totals.tax > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-fog">Tax included</dt>
                    <dd className="tabular-nums">{money(totals.currency, totals.tax)}</dd>
                  </div>
                )}
                <div className="mt-1 flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold">
                  <dt>Due today</dt>
                  <dd className="tabular-nums">{money(totals.currency, totals.total)}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <ul className="flex flex-col gap-2.5 text-sm">
          {(info.kind === "plan"
            ? [`${songs} songs a month, with vocals or instrumental`, "MP3 downloads", "Commercial use license", "AI lyrics writer", "Top up with credit packs"]
            : [`${info.credits.toLocaleString("en-US")} credits, ${SONG_CREDIT_COST} per song`, "Shared with the Sonx app", "Used after your plan's monthly songs"]
          ).map((item) => <li key={item} className="flex items-start gap-2.5"><Check />{item}</li>)}
        </ul>

        <ul aria-label="Buying on Sonx" className="grid gap-2 border-t border-line pt-6 text-sm text-fog sm:grid-cols-2">
          {ASSURANCES.map((item) => <li key={item} className="flex items-start gap-2.5"><Check />{item}</li>)}
        </ul>
      </section>

      <section aria-label="Payment" className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-[var(--radius-panel)] border border-line bg-plum p-5 md:p-6">
          {signedIn === false ? (
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-lg font-semibold">Create your account to continue</h2>
              <p className="text-sm text-fog">Takes a few seconds. Already use the Sonx app? Use the same account.</p>
              <div className="mt-2 flex flex-col gap-3">
                <GoogleSignInButton next={checkoutHref(priceId)} />
                <AppleSignInButton next={checkoutHref(priceId)} />
                <OrDivider />
                <EmailSignIn next={checkoutHref(priceId)} />
              </div>
            </div>
          ) : blocked === "app-plan" && billing ? (
            <Blocked title={`You are on ${PLAN_LABELS[billing.currentPlan]}`} text="Your plan is billed through the app store, so change it in the Sonx app. You can still top up with credits here."
              href="/pricing#credits-title" label="Buy credits" />
          ) : blocked === "web-plan" ? (
            <Blocked title="You already have a plan" text="Switch between Pro and Studio, or monthly and yearly, from Manage subscription on Account."
              href="/account" label="Go to Account" />
          ) : blocked === "needs-plan" ? (
            <Blocked title="Credit packs top up a plan" text="Subscribe to Pro or Studio first; credits keep you going when the month's songs run out."
              href="/pricing" label="See plans" />
          ) : failed ? (
            <Blocked title="Checkout could not open" text="Check your connection or turn off a blocker for this page, then try again."
              href={checkoutHref(priceId)} label="Try again" />
          ) : (
            <>
              {!totals && <div className="h-[450px] animate-pulse rounded-[var(--radius-control)] bg-raised/60" aria-label="Loading payment form" />}
              {/* Paddle renders the payment form here. */}
              <div className={FRAME_CLASS} />
            </>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-fog">
          Paddle.com is the Merchant of Record for Sonx web purchases and handles payment, tax and invoices.
        </p>
      </section>
    </div>
  );
}

function Blocked({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="text-sm text-fog">{text}</p>
      <Link href={href} className="bg-signature mt-2 w-fit rounded-full px-5 py-2.5 text-sm font-semibold">{label}</Link>
    </div>
  );
}
