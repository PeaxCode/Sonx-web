"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CREDIT_COSTS, PLAN_LIMITS, usageBucket, type Feature } from "@/lib/billing-config";
import { trackEvent } from "@/lib/analytics";
import { fetchBilling, syncBillingAccount, type ServerBilling } from "@/lib/generations";
import { useSession } from "./session";

/** How a generation will be paid for, decided the same way the server does. */
export type Access = "quota" | "credits" | "none" | "unknown";

interface BillingValue {
  billing: ServerBilling | null;
  refresh: () => Promise<void>;
  accessFor: (feature: Feature, creditCost?: number) => Access;
  remaining: (feature: Feature) => number;
  /** A web purchase that is paid but not yet visible on the server. */
  pending: PendingPurchase | null;
  /** Polls the server after a web checkout until the plan or credits show up. */
  awaitPurchase: (kind: PendingPurchase) => void;
  /** How the last web purchase ended: added to the account, or not seen in time. */
  outcome: PurchaseOutcome | null;
  dismissOutcome: () => void;
}

export type PendingPurchase = "plan" | "credits";
export type PurchaseOutcome =
  | { kind: PendingPurchase; status: "added"; credits: number; id: number }
  | { kind: PendingPurchase; status: "late"; id: number };

// Credit packs land within seconds (paddle-webhook); plans go through RevenueCat
// and take up to about a minute. After two minutes the buyer is told and given support.
const PURCHASE_POLL_MS = 3000;
const PURCHASE_TIMEOUT_MS = 2 * 60 * 1000;

const BillingContext = createContext<BillingValue | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { signedIn } = useSession();
  const [fetched, setBilling] = useState<ServerBilling | null>(null);
  // Visitors have no account to bill; the balance loads once they sign in.
  const billing = signedIn ? fetched : null;

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    // The first call marks a web account migrated; later calls just read it.
    syncBillingAccount()
      .then((state) => active && setBilling(state))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [signedIn]);

  const refresh = useCallback(async () => {
    try {
      setBilling(await fetchBilling());
    } catch {
      // Keep the last known balance; the next refresh retries.
    }
  }, []);

  const [purchase, setPurchase] = useState<{ kind: PendingPurchase; startedAt: number; credits: number } | null>(null);
  const [outcome, setOutcome] = useState<PurchaseOutcome | null>(null);
  const pending = purchase ? purchase.kind : null;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!purchase) return;
    let active = true;
    const poll = async () => {
      let state: ServerBilling | null = null;
      try {
        state = await fetchBilling();
      } catch {
        // A failed read is retried on the next tick.
      }
      if (!active) return;
      if (state) setBilling(state);
      const settled = state !== null &&
        (purchase.kind === "plan" ? state.isPro : state.credits > purchase.credits);
      if (settled) {
        setOutcome({ kind: purchase.kind, status: "added", credits: state!.credits - purchase.credits, id: Date.now() });
        setPurchase(null);
      } else if (Date.now() - purchase.startedAt >= PURCHASE_TIMEOUT_MS) {
        // Paid but not on the account: tell the buyer and flag it for the team.
        trackEvent("purchase_not_received", { kind: purchase.kind, waited_seconds: PURCHASE_TIMEOUT_MS / 1000 });
        setOutcome({ kind: purchase.kind, status: "late", id: Date.now() });
        setPurchase(null);
      } else {
        timer.current = setTimeout(poll, PURCHASE_POLL_MS);
      }
    };
    timer.current = setTimeout(poll, PURCHASE_POLL_MS);
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [purchase]);

  const awaitPurchase = useCallback((kind: PendingPurchase) => {
    setOutcome(null);
    setPurchase({ kind, startedAt: Date.now(), credits: billing?.credits ?? 0 });
  }, [billing?.credits]);

  const dismissOutcome = useCallback(() => setOutcome(null), []);

  const value = useMemo<BillingValue>(() => {
    const remaining = (feature: Feature) =>
      billing ? Math.max(0, PLAN_LIMITS[billing.currentPlan][usageBucket(feature)] - (billing.usage[usageBucket(feature)] ?? 0)) : 0;
    return {
      billing,
      refresh,
      remaining,
      pending,
      awaitPurchase,
      outcome,
      dismissOutcome,
      accessFor: (feature, creditCost = CREDIT_COSTS[feature]) => {
        if (!billing) return "unknown";
        if (remaining(feature) > 0) return "quota";
        return billing.credits >= creditCost ? "credits" : "none";
      },
    };
  }, [billing, refresh, pending, awaitPurchase, outcome, dismissOutcome]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const value = useContext(BillingContext);
  if (!value) throw new Error("useBilling must be used inside BillingProvider");
  return value;
}
