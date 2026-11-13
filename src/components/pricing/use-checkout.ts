"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openWebCheckout } from "@/lib/paddle";
import { getSupabase } from "@/lib/supabase/client";
import { useBilling, type PendingPurchase } from "@/components/studio/billing";
import { useFeedback } from "@/components/studio/feedback";
import { useSession } from "@/components/studio/session";

// A visitor who picks a plan before signing in comes back with ?buy=<price>&kind=<plan|credits>.
const RESUME_KEYS = ["buy", "kind"] as const;

/** Opens Paddle checkout for a price, asking visitors to sign in first. */
export function useCheckout() {
  const { signedIn, requestSignIn } = useSession();
  const { billing, awaitPurchase } = useBilling();
  const { notify } = useFeedback();
  const [opening, setOpening] = useState<string | null>(null);
  const resumed = useRef(false);

  const open = useCallback(async (priceId: string, kind: PendingPurchase) => {
    setOpening(priceId);
    try {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error("Sign in again to continue to checkout.");
      await openWebCheckout({
        priceId,
        userId: user.id,
        email: user.email ?? null,
        onCompleted: () => awaitPurchase(kind),
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Checkout could not open.", "error");
    } finally {
      setOpening(null);
    }
  }, [awaitPurchase, notify]);

  const buy = useCallback((priceId: string, kind: PendingPurchase) => {
    if (signedIn === null) return;
    if (!signedIn) {
      const next = new URL(window.location.href);
      next.searchParams.set("buy", priceId);
      next.searchParams.set("kind", kind);
      requestSignIn({
        next: `${next.pathname}${next.search}`,
        title: kind === "plan" ? "Sign in to subscribe" : "Sign in to buy credits",
        text: "Use the same account as the Sonx app. What you buy here works there too.",
      });
      return;
    }
    void open(priceId, kind);
  }, [open, requestSignIn, signedIn]);

  // Resume the purchase picked before sign-in, once billing has loaded.
  useEffect(() => {
    if (resumed.current || !signedIn || !billing) return;
    const url = new URL(window.location.href);
    const priceId = url.searchParams.get("buy");
    const kind = url.searchParams.get("kind");
    if (!priceId || (kind !== "plan" && kind !== "credits")) return;
    resumed.current = true;
    RESUME_KEYS.forEach((key) => url.searchParams.delete(key));
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    // Someone who turns out to be Pro already must not subscribe twice.
    if (kind === "plan" && billing.isPro) {
      notify("You already have Sonx Pro on this account.");
      return;
    }
    // Out of the effect's render pass; resumed.current already stops a second run.
    setTimeout(() => void open(priceId, kind));
  }, [billing, notify, open, signedIn]);

  return { buy, opening };
}
