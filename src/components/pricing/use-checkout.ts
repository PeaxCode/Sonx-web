"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { hasDraft } from "@/lib/draft";
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
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);
  const resumed = useRef(false);

  const open = useCallback(async (priceId: string, kind: PendingPurchase) => {
    setOpening(priceId);
    try {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (!user) throw new Error("Sign in again to continue to checkout.");
      await openWebCheckout({
        priceId,
        kind,
        userId: user.id,
        email: user.email ?? null,
        // A song waiting from the paywall is made right away on Create; otherwise the buyer lands
        // on Account, where the balance and plan update as soon as the server has them.
        onCompleted: () => {
          awaitPurchase(kind);
          // On Create the form itself starts the waiting song when the purchase lands.
          if (!(hasDraft() && window.location.pathname === "/create")) router.push("/account");
        },
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Checkout could not open.", "error");
    } finally {
      setOpening(null);
    }
  }, [awaitPurchase, notify, router]);

  const buy = useCallback((priceId: string, kind: PendingPurchase) => {
    if (signedIn === null) return;
    trackEvent("plan_click", { kind, price_id: priceId, signed_in: signedIn });
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
    // Credit packs top up a plan; the cards are disabled, this is the backstop.
    if (kind === "credits" && !billing?.isPro) {
      notify("Subscribe to Pro or Studio to buy credit packs.", "error");
      return;
    }
    void open(priceId, kind);
  }, [billing?.isPro, notify, open, requestSignIn, signedIn]);

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
      notify("You already have a plan on this account.");
      return;
    }
    if (kind === "credits" && !billing.isPro) {
      notify("Subscribe to Pro or Studio to buy credit packs.", "error");
      return;
    }
    // Out of the effect's render pass; resumed.current already stops a second run.
    setTimeout(() => void open(priceId, kind));
  }, [billing, notify, open, signedIn]);

  return { buy, opening };
}
