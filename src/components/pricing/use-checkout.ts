"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { useBilling, type PendingPurchase } from "@/components/studio/billing";
import { useFeedback } from "@/components/studio/feedback";
import { useSession } from "@/components/studio/session";

/** The Sonx checkout page for a price: our summary with Paddle's payment form inline. */
export const checkoutHref = (priceId: string) => `/checkout?price=${encodeURIComponent(priceId)}`;

/**
 * Plan and credit buttons. Every purchase goes to /checkout, which asks visitors
 * to sign up in place and then shows the payment form, so a buyer is never sent
 * to a plans page twice.
 */
export function useCheckout() {
  const { signedIn } = useSession();
  const { billing } = useBilling();
  const { notify } = useFeedback();
  const router = useRouter();
  const resumed = useRef(false);

  const buy = useCallback((priceId: string, kind: PendingPurchase) => {
    if (signedIn === null) return;
    trackEvent("plan_click", { kind, price_id: priceId, signed_in: signedIn });
    // Credit packs top up a plan; the cards are disabled, this is the backstop.
    if (signedIn && kind === "credits" && !billing?.isPro) {
      notify("Subscribe to Pro or Studio to buy credit packs.", "error");
      return;
    }
    router.push(checkoutHref(priceId));
  }, [billing?.isPro, notify, router, signedIn]);

  // Links from before the checkout page (?buy=<price>) still lead to it.
  useEffect(() => {
    if (resumed.current) return;
    const priceId = new URL(window.location.href).searchParams.get("buy");
    if (!priceId) return;
    resumed.current = true;
    router.replace(checkoutHref(priceId));
  }, [router]);

  return { buy, opening: null as string | null };
}
