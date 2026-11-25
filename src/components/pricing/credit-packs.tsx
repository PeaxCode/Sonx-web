"use client";

import Link from "next/link";
import { StoreBadges } from "@/components/store-badges";
import { useBilling } from "@/components/studio/billing";
import { SONG_CREDIT_COST } from "@/lib/billing-config";
import { CREDIT_PACKS, formatMoney, webCreditsEnabled } from "@/lib/paddle";
import { usePrices } from "./plan-cards";
import { useCheckout } from "./use-checkout";
import { Spinner } from "@/components/spinner";


/**
 * One-time credit packs, sold only to subscribers as a top-up. Credits are
 * shared with the app and are spent after the plan's monthly songs.
 */
export function CreditPacks({ onSubscribeClick }: { onSubscribeClick?: () => void }) {
  const prices = usePrices();
  const { billing, pending } = useBilling();
  const { buy, opening } = useCheckout();
  const subscribed = Boolean(billing?.isPro);

  if (!webCreditsEnabled) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-panel)] border border-line p-6">
        <p className="text-fog">Credit packs are sold in the Sonx app for now. Credits you buy there work here too.</p>
        <StoreBadges />
      </div>
    );
  }

  return (
    <div>
      {pending === "credits" && (
        <p role="status" className="mb-4 flex items-center gap-3 rounded-[var(--radius-control)] border border-orchid/40 bg-raised px-4 py-3 text-sm">
          <Spinner size={18} />
          Payment received. Adding your credits, this takes up to a minute.
        </p>
      )}
      {/* Packs cost more per song than a bigger plan; web Pro members can switch, app members manage plans in the app. */}
      {subscribed && billing?.store === "paddle" && billing.currentPlan !== "STUDIO" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-plum px-4 py-3 text-sm">
          <p>Running out every month? Studio gives you more songs for less per song than credit packs.</p>
          <Link href="/account" className="font-semibold text-orchid hover:text-paper">Switch plan</Link>
        </div>
      )}
      {!subscribed && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line bg-plum px-4 py-3 text-sm">
          <p>Credit packs top up a plan. Subscribe to Pro or Studio to buy them.</p>
          <Link href="/pricing#plans-title" onClick={onSubscribeClick} className="font-semibold text-orchid hover:text-paper">
            See plans
          </Link>
        </div>
      )}
      <ol className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${subscribed ? "" : "opacity-60"}`}>
        {CREDIT_PACKS.map((pack, index) => {
          const price = prices?.[pack.priceId];
          const songs = Math.floor(pack.credits / SONG_CREDIT_COST);
          const largest = index === CREDIT_PACKS.length - 1;
          return (
            <li key={pack.priceId}
              className={`flex flex-col rounded-[var(--radius-panel)] border p-5 ${largest ? "border-orchid/50 bg-plum" : "border-line"}`}>
              <p className="font-display text-3xl font-semibold tabular-nums">{pack.credits.toLocaleString("en-US")}</p>
              <p className="text-sm text-fog">credits</p>
              <p className="mt-4 text-sm">{songs} songs, with vocals or instrumental</p>
              <div className="mt-5 flex items-end justify-between gap-3">
                {price ? (
                  <p className="tabular-nums">
                    <span className="text-lg font-semibold">{price.formatted}</span>
                    <span className="block text-xs text-fog">{formatMoney(price, price.amount / songs)} per song</span>
                  </p>
                ) : (
                  <span className="inline-block h-6 w-16 animate-pulse rounded bg-raised" aria-label="Loading price" />
                )}
              </div>
              <button type="button" onClick={() => buy(pack.priceId, "credits")}
                disabled={!subscribed || opening !== null || pending === "credits"}
                aria-describedby={subscribed ? undefined : "credits-locked"}
                className="mt-4 rounded-full border border-line py-2.5 text-sm font-semibold transition hover:bg-raised disabled:cursor-not-allowed disabled:hover:bg-transparent">
                {opening === pack.priceId ? <span className="inline-flex items-center justify-center gap-2"><Spinner size={16} /> Opening checkout</span> : "Buy credits"}
              </button>
            </li>
          );
        })}
      </ol>
      <p id="credits-locked" className="mt-3 text-sm text-fog">
        {billing?.isPro ? `You have ${billing.credits} credits. ` : ""}
        Every song uses {SONG_CREDIT_COST} credits. Credits are used after your plan&apos;s monthly songs.
      </p>
    </div>
  );
}
