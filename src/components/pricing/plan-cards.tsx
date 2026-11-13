"use client";

import { useEffect, useState } from "react";
import { StoreBadges } from "@/components/store-badges";
import { useBilling } from "@/components/studio/billing";
import { PLAN_LIMITS } from "@/lib/billing-config";
import {
  fetchWebPrices,
  formatPerUnit,
  planPriceId,
  webCheckoutEnabled,
  type WebPlan,
  type WebPrice,
} from "@/lib/paddle";
import { useCheckout } from "./use-checkout";

const PLANS: { plan: WebPlan; name: string; period: string; months: number }[] = [
  { plan: "WEEKLY", name: "Weekly", period: "week", months: 12 / 52 },
  { plan: "MONTHLY", name: "Monthly", period: "month", months: 1 },
  { plan: "YEARLY", name: "Yearly", period: "year", months: 12 },
];

/** Songs on the web: instrumentals and songs with vocals draw on separate allowances. */
const songsIn = (plan: WebPlan) => PLAN_LIMITS[plan].PROMPT_MUSIC + PLAN_LIMITS[plan].LYRICS_MUSIC;

const METER_COLUMNS = 25;
const DOT = 5;
const GAP = 3;

/** One dot per song in the period, so plan sizes compare at a glance. */
function SongMeter({ songs }: { songs: number }) {
  const rows = Math.ceil(songs / METER_COLUMNS);
  const width = METER_COLUMNS * (DOT + GAP) - GAP;
  const height = rows * (DOT + GAP) - GAP;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="block max-w-[200px]" aria-hidden="true"
      style={{ aspectRatio: `${width} / ${height}` }}>
      {Array.from({ length: songs }, (_, index) => (
        <rect key={index} x={(index % METER_COLUMNS) * (DOT + GAP)} y={Math.floor(index / METER_COLUMNS) * (DOT + GAP)}
          width={DOT} height={DOT} rx={1.5} className="fill-violet" opacity={0.55 + 0.45 * ((index % METER_COLUMNS) / METER_COLUMNS)} />
      ))}
    </svg>
  );
}

/** Lowest price per song and most songs each month, worked out from the live prices. */
function factualBadges(prices: Record<string, WebPrice>) {
  const perSong = PLANS.map(({ plan }) => {
    const price = prices[planPriceId(plan) ?? ""];
    return { plan, value: price ? price.amount / songsIn(plan) : Infinity };
  });
  const cheapest = perSong.reduce((best, item) => (item.value < best.value ? item : best));
  const perMonth = PLANS.map(({ plan, months }) => ({ plan, value: songsIn(plan) / months }));
  const most = perMonth.reduce((best, item) => (item.value > best.value ? item : best));
  const badges: Partial<Record<WebPlan, string>> = {};
  if (Number.isFinite(cheapest.value)) badges[cheapest.plan] = "Lowest price per song";
  if (!badges[most.plan]) badges[most.plan] = "Most songs each month";
  return badges;
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

/** The three Pro plans. Without web checkout configured they point to the app. */
export function PlanCards() {
  const prices = usePrices();
  const { billing, pending } = useBilling();
  const { buy, opening } = useCheckout();
  const badges = prices ? factualBadges(prices) : {};

  return (
    <div>
      {pending === "plan" && (
        <p role="status" className="mb-4 rounded-[var(--radius-control)] border border-violet/40 bg-raised px-4 py-3 text-sm">
          Payment received. Activating your plan, this takes up to a minute.
        </p>
      )}
      <ul className="grid gap-4 md:grid-cols-3">
        {PLANS.map(({ plan, name, period, months }) => {
          const priceId = planPriceId(plan);
          const price = priceId ? prices?.[priceId] : undefined;
          const songs = songsIn(plan);
          const isCurrent = billing?.isPro && billing.currentPlan === plan;
          const badge = badges[plan];
          // Only the best-value plan is emphasised; other badges stay informational.
          const featured = badge === "Lowest price per song";
          return (
            <li key={plan}
              className={`flex flex-col rounded-[var(--radius-panel)] border p-6 ${featured ? "border-violet/50 bg-plum" : "border-line"}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">{name}</h3>
                {badge && <span className="rounded-full bg-violet/15 px-2.5 py-1 text-xs font-medium text-orchid">{badge}</span>}
              </div>

              <p className="mt-4 flex min-h-12 items-baseline gap-1.5">
                {webCheckoutEnabled ? (
                  price ? (
                    <>
                      <span className="font-display text-4xl font-semibold tabular-nums">{price.formatted}</span>
                      <span className="text-fog">/ {period}</span>
                    </>
                  ) : (
                    <span className="h-9 w-28 animate-pulse rounded-lg bg-raised" aria-label="Loading price" />
                  )
                ) : (
                  <span className="font-display text-2xl font-semibold">In the app</span>
                )}
              </p>
              <p className="min-h-5 text-sm text-fog tabular-nums">
                {price && months > 1 ? `About ${formatPerUnit(price, months)} a month` : ""}
              </p>

              <div className="mt-6 flex items-end md:min-h-[120px]">
                <SongMeter songs={songs} />
              </div>
              <p className="mt-3 font-medium">{songs} songs a {period}</p>
              <p className="text-sm text-fog">
                {PLAN_LIMITS[plan].PROMPT_MUSIC} instrumentals and {PLAN_LIMITS[plan].LYRICS_MUSIC} with vocals
              </p>
              <p className="mt-1 min-h-5 text-sm text-fog tabular-nums">
                {price ? `${formatPerUnit(price, songs)} per song` : ""}
              </p>

              <div className="mt-auto pt-6">
                {!webCheckoutEnabled ? null : isCurrent ? (
                  <p className="rounded-[var(--radius-control)] border border-line py-3 text-center text-sm font-medium">Your plan</p>
                ) : (
                  <button type="button" onClick={() => priceId && buy(priceId, "plan")}
                    disabled={!priceId || opening !== null || Boolean(billing?.isPro) || pending === "plan"}
                    className={`w-full rounded-[var(--radius-control)] py-3 text-sm font-semibold transition disabled:opacity-40 ${
                      featured ? "bg-signature text-paper hover:brightness-110" : "border border-line hover:bg-raised"
                    }`}>
                    {opening === priceId ? "Opening checkout" : billing?.isPro ? "You have Pro" : `Subscribe ${name.toLowerCase()}`}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!webCheckoutEnabled && (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <p className="text-sm text-fog">Subscribe in the Sonx app. Your plan works here as soon as you sign in.</p>
          <StoreBadges />
        </div>
      )}
    </div>
  );
}
