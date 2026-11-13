"use client";

import { StoreBadges } from "@/components/store-badges";
import { useBilling } from "@/components/studio/billing";
import { CREDIT_COSTS } from "@/lib/billing-config";
import { CREDIT_PACKS, webCreditsEnabled } from "@/lib/paddle";
import { usePrices } from "./plan-cards";
import { useCheckout } from "./use-checkout";

const VOCAL_COST = CREDIT_COSTS.LYRICS_MUSIC;
const INSTRUMENTAL_COST = CREDIT_COSTS.PROMPT_MUSIC;

/** One-time credit packs. Credits are shared with the app and need no subscription. */
export function CreditPacks() {
  const prices = usePrices();
  const { billing, pending } = useBilling();
  const { buy, opening } = useCheckout();

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
        <p role="status" className="mb-4 rounded-[var(--radius-control)] border border-violet/40 bg-raised px-4 py-3 text-sm">
          Payment received. Adding your credits, this takes up to a minute.
        </p>
      )}
      <ol className="divide-y divide-line overflow-hidden rounded-[var(--radius-panel)] border border-line">
        {CREDIT_PACKS.map((pack) => {
          const price = prices?.[pack.priceId];
          const songs = Math.floor(pack.credits / VOCAL_COST);
          return (
            <li key={pack.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 sm:grid-cols-[7rem_1fr_auto_auto] sm:px-6">
              <p className="font-display text-xl font-semibold tabular-nums">
                {pack.credits}
                <span className="ml-1.5 font-sans text-sm font-normal text-fog">credits</span>
              </p>
              <p className="col-start-1 row-start-2 text-sm text-fog sm:col-start-2 sm:row-start-1">
                Up to {songs} songs with vocals or {Math.floor(pack.credits / INSTRUMENTAL_COST)} instrumentals
              </p>
              <p className="col-start-2 row-start-1 text-right tabular-nums sm:col-start-3">
                {price ? (
                  <span className="font-medium">{price.formatted}</span>
                ) : (
                  <span className="inline-block h-5 w-16 animate-pulse rounded bg-raised" aria-label="Loading price" />
                )}
              </p>
              <button type="button" onClick={() => buy(pack.priceId, "credits")}
                disabled={opening !== null || pending === "credits"}
                className="col-span-2 mt-2 rounded-[var(--radius-control)] border border-line px-5 py-2 text-sm font-semibold transition hover:bg-raised disabled:opacity-40 sm:col-span-1 sm:col-start-4 sm:mt-0">
                {opening === pack.priceId ? "Opening checkout" : "Buy"}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-fog">
        {billing ? `You have ${billing.credits} credits. ` : ""}
        A song with vocals uses {VOCAL_COST} credits, an instrumental {INSTRUMENTAL_COST}. Credits are used after your plan&apos;s songs run out.
      </p>
    </div>
  );
}
