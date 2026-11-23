"use client";

import { useEffect, useState } from "react";
import { StoreBadges } from "@/components/store-badges";
import { useBilling } from "@/components/studio/billing";
import { useSession } from "@/components/studio/session";
import { PLAN_LABELS, songsIn, type Plan } from "@/lib/billing-config";
import {
  fetchWebPrices,
  formatMoney,
  planPriceId,
  webCheckoutEnabled,
  type BillingCycle,
  type WebPrice,
  type WebTier,
} from "@/lib/paddle";
import { useCheckout } from "./use-checkout";

interface TierInfo {
  tier: WebTier;
  name: string;
  /** Server plan whose quota this tier grants. */
  plan: Plan;
  pitch: string;
  badge: string;
}

export const TIERS: TierInfo[] = [
  { tier: "PRO", name: "Pro", plan: "MONTHLY", pitch: "For making songs every week.", badge: "Most popular" },
  { tier: "STUDIO", name: "Studio", plan: "STUDIO", pitch: "For creators who make music every day.", badge: "Best value" },
];


const METER_COLUMNS = 25;
const DOT = 5;
const GAP = 3;

/** One dot per song a month, so the tiers compare at a glance. */
function SongMeter({ songs }: { songs: number }) {
  const rows = Math.ceil(songs / METER_COLUMNS);
  const width = METER_COLUMNS * (DOT + GAP) - GAP;
  const height = rows * (DOT + GAP) - GAP;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="block max-w-[200px]" aria-hidden="true"
      style={{ aspectRatio: `${width} / ${height}` }}>
      {Array.from({ length: songs }, (_, index) => (
        <rect key={index} x={(index % METER_COLUMNS) * (DOT + GAP)} y={Math.floor(index / METER_COLUMNS) * (DOT + GAP)}
          width={DOT} height={DOT} rx={1.5} className="fill-orchid" opacity={0.5 + 0.5 * ((index % METER_COLUMNS) / METER_COLUMNS)} />
      ))}
    </svg>
  );
}

function Feature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2.5 ${included ? "" : "text-fog/60"}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true" className={`mt-0.5 shrink-0 ${included ? "text-orchid" : ""}`}>
        {included ? <path d="m5 12 5 5L20 7" /> : <path d="M7 7l10 10M17 7 7 17" />}
      </svg>
      <span><span className="sr-only">{included ? "Included: " : "Not included: "}</span>{children}</span>
    </li>
  );
}

export function usePrices() {
  const [prices, setPrices] = useState<Record<string, WebPrice> | null>(null);
  useEffect(() => {
    let active = true;
    fetchWebPrices().then((result) => active && setPrices(result));
    return () => {
      active = false;
    };
  }, []);
  return prices;
}

/** "$0" in the visitor's currency, without decimals. */
function freePrice(prices: Record<string, WebPrice> | null) {
  const currency = prices ? Object.values(prices)[0]?.currency : undefined;
  if (!currency) return "$0";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(0);
}

/** Percent a tier saves by paying yearly, from the live prices (Pro and Studio differ). */
function yearlySaving(prices: Record<string, WebPrice> | null, tier: WebTier) {
  const monthly = prices?.[planPriceId(tier, "monthly") ?? ""];
  const yearly = prices?.[planPriceId(tier, "yearly") ?? ""];
  if (!monthly || !yearly) return null;
  // Rounded down, so the badge never promises more than the price gives.
  const saving = Math.floor((1 - yearly.amount / (monthly.amount * 12)) * 100);
  return saving > 0 ? saving : null;
}

/** The best saving across tiers, for the toggle: "Save up to 20%". */
function bestSaving(prices: Record<string, WebPrice> | null) {
  const savings = TIERS.map(({ tier }) => yearlySaving(prices, tier)).filter((value): value is number => value !== null);
  return savings.length ? Math.max(...savings) : null;
}

// Where an app subscription is managed, for subscribers who cannot change plans here.
const APP_STORES: Record<string, string> = {
  app_store: "the App Store",
  mac_app_store: "the App Store",
  play_store: "Google Play",
};

export function BillingToggle({ cycle, onChange, saving }: {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  saving: number | null;
}) {
  return (
    <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-line bg-plum p-1 text-sm">
      {(["monthly", "yearly"] as const).map((option) => (
        <button key={option} type="button" role="radio" aria-checked={cycle === option} onClick={() => onChange(option)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition ${
            cycle === option ? "bg-paper text-night" : "text-fog hover:text-paper"
          }`}>
          {option === "monthly" ? "Monthly" : "Yearly"}
          {option === "yearly" && saving && (
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${cycle === option ? "bg-orchid text-paper" : "bg-orchid/20 text-orchid"}`}>
              Save up to {saving}%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Free, Pro and Studio with a monthly/yearly switch. Without web checkout configured they point to the app. */
export function PlanCards() {
  const prices = usePrices();
  const { billing, pending } = useBilling();
  const { signedIn, requestSignIn } = useSession();
  const { buy, opening } = useCheckout();
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const saving = bestSaving(prices);
  // App subscribers manage their plan in the store; the web shows it and sells them credit packs only.
  const appStore = billing?.isPro && billing.store ? APP_STORES[billing.store] : undefined;
  const appPlan = appStore && billing ? billing.currentPlan : null;

  return (
    <div className="flex flex-col gap-6">
      {webCheckoutEnabled && <div className="flex justify-center"><BillingToggle cycle={cycle} onChange={setCycle} saving={saving} /></div>}
      {appPlan && (
        <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-plum px-4 py-3 text-sm">
          <p>
            You are on <strong>{PLAN_LABELS[appPlan]}</strong>, billed by {appStore}. Change or cancel it in the Sonx app.
          </p>
          <a href="/pricing#credits-title" className="font-semibold text-orchid hover:text-paper">Top up with credits</a>
        </div>
      )}
      {pending === "plan" && (
        <p role="status" className="rounded-[var(--radius-control)] border border-orchid/40 bg-raised px-4 py-3 text-sm">
          Payment received. Activating your plan, this takes up to a minute.
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-3">
        <li className="order-last flex flex-col rounded-[var(--radius-panel)] border border-line p-6 lg:order-none">
          <h3 className="font-display text-lg font-semibold">Free</h3>
          <p className="mt-1 min-h-10 text-sm text-fog">Try Sonx with a free song every month.</p>
          <p className="mt-5 flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-semibold">{freePrice(prices)}</span>
            <span className="text-fog">/ month</span>
          </p>
          <p className="min-h-5 text-sm text-fog">Free forever</p>
          <div className="mt-6">
            {signedIn ? (
              <p className="rounded-full border border-line py-3 text-center text-sm font-medium">
                {billing?.isPro ? "Included in your plan" : "Your plan"}
              </p>
            ) : (
              <button type="button" onClick={() => requestSignIn({ next: "/create", title: "Create your free account" })}
                className="w-full rounded-full border border-line py-3 text-sm font-semibold transition hover:bg-raised">
                Create free account
              </button>
            )}
          </div>
          <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-6 text-sm">
            <Feature included>1 song a month</Feature>
            <Feature included>AI lyrics writer</Feature>
            <Feature included={false}>MP3 downloads</Feature>
            <Feature included={false}>Commercial use</Feature>
            <Feature included={false}>Credit packs</Feature>
          </ul>
        </li>

        {TIERS.map(({ tier, name, plan, pitch, badge }) => {
          const priceId = planPriceId(tier, cycle);
          const price = priceId ? prices?.[priceId] : undefined;
          const monthlyPrice = prices?.[planPriceId(tier, "monthly") ?? ""];
          const perMonth = price ? (cycle === "yearly" ? price.amount / 12 : price.amount) : null;
          const songs = songsIn(plan);
          const featured = tier === "PRO";
          // Only a web plan matches a card: app plans (weekly, yearly...) are their own, shown in the note above.
          const isCurrent = billing?.isPro && !appPlan && (tier === "STUDIO" ? billing.currentPlan === "STUDIO" : billing.currentPlan === "MONTHLY");
          const tierSaving = cycle === "yearly" ? yearlySaving(prices, tier) : null;
          return (
            <li key={tier}
              className={`relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] border p-6 ${
                featured ? "border-orchid/60 bg-plum shadow-[0_0_60px_-20px] shadow-orchid/50" : "border-line"
              }`}>
              <div className="relative flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">{name}</h3>
                <span className="flex items-center gap-1.5">
                  {tierSaving && <span className="rounded-full bg-orchid/20 px-2.5 py-1 text-xs font-semibold text-orchid">Save {tierSaving}%</span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${featured ? "bg-paper text-night" : "bg-orchid/15 text-orchid"}`}>{badge}</span>
                </span>
              </div>
              <p className="relative mt-1 min-h-10 text-sm text-fog">{pitch}</p>

              <p className="relative mt-5 flex min-h-10 items-baseline gap-1.5">
                {!webCheckoutEnabled ? (
                  <span className="font-display text-2xl font-semibold">In the app</span>
                ) : price && perMonth !== null ? (
                  <>
                    {cycle === "yearly" && monthlyPrice && (
                      <span className="text-lg text-fog line-through tabular-nums">{monthlyPrice.formatted}</span>
                    )}
                    <span className="font-display text-3xl font-semibold tabular-nums">{formatMoney(price, perMonth)}</span>
                    <span className="text-fog">/ month</span>
                  </>
                ) : (
                  <span className="h-9 w-32 animate-pulse rounded-lg bg-raised" aria-label="Loading price" />
                )}
              </p>
              <p className="relative min-h-5 text-sm text-fog tabular-nums">
                {price ? (cycle === "yearly" ? `Billed ${price.formatted} a year` : "Billed monthly") : ""}
              </p>

              <div className="relative mt-6">
                {!webCheckoutEnabled ? null : isCurrent ? (
                  <p className="rounded-full border border-line py-3 text-center text-sm font-medium">Your plan</p>
                ) : appPlan ? (
                  <p className="rounded-full border border-line px-4 py-3 text-center text-sm text-fog">Your plan is managed in the Sonx app</p>
                ) : billing?.isPro ? (
                  <p className="rounded-full border border-line px-4 py-3 text-center text-sm text-fog">Switch plans from Account, Manage subscription</p>
                ) : (
                  <button type="button" onClick={() => priceId && buy(priceId, "plan")}
                    disabled={!priceId || opening !== null || Boolean(billing?.isPro) || pending === "plan"}
                    className={`w-full rounded-full py-3 text-sm font-semibold transition disabled:opacity-40 ${
                      featured ? "bg-paper text-night hover:bg-paper/90" : "bg-signature text-paper hover:brightness-110"
                    }`}>
                    {opening === priceId ? "Opening checkout" : `Get ${name}`}
                  </button>
                )}
              </div>

              <div className="relative mt-6 border-t border-line pt-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl font-semibold tabular-nums">{songs}</p>
                    <p className="text-sm text-fog">songs every month</p>
                  </div>
                  {price && perMonth !== null && (
                    <p className="text-right text-sm text-fog tabular-nums">{formatMoney(price, perMonth / songs)}<br />per song</p>
                  )}
                </div>
                <div className="mt-4"><SongMeter songs={songs} /></div>
              </div>

              <ul className="relative mt-6 flex flex-col gap-2.5 text-sm">
                <Feature included>{songs} songs a month, with vocals or instrumental</Feature>
                <Feature included>Commercial use license</Feature>
                <Feature included>MP3 downloads</Feature>
                <Feature included>AI lyrics writer</Feature>
                <Feature included>Same plan in the Sonx app</Feature>
                <Feature included>Top up with credit packs</Feature>
              </ul>
            </li>
          );
        })}
      </ul>
      {!webCheckoutEnabled && (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-fog">Subscribe in the Sonx app. Your plan works here as soon as you sign in.</p>
          <StoreBadges />
        </div>
      )}
      {webCheckoutEnabled && (
        <p className="text-center text-sm text-fog">Plans renew automatically. Cancel anytime. Songs reset every month, also on yearly billing.</p>
      )}
    </div>
  );
}
