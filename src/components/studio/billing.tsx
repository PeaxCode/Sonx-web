"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CREDIT_COSTS, PLAN_LIMITS, type Feature } from "@/lib/billing-config";
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
}

export type PendingPurchase = "plan" | "credits";

// RevenueCat receives Paddle's notification within about a minute.
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
  const settled = purchase !== null && billing !== null &&
    (purchase.kind === "plan" ? billing.isPro : billing.credits > purchase.credits);
  const pending = purchase && !settled ? purchase.kind : null;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pending || !purchase) return;
    const poll = async () => {
      await refresh();
      if (Date.now() - purchase.startedAt < PURCHASE_TIMEOUT_MS) {
        timer.current = setTimeout(poll, PURCHASE_POLL_MS);
      } else {
        setPurchase(null);
      }
    };
    timer.current = setTimeout(poll, PURCHASE_POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pending, purchase, refresh]);

  const awaitPurchase = useCallback((kind: PendingPurchase) => {
    setPurchase({ kind, startedAt: Date.now(), credits: billing?.credits ?? 0 });
  }, [billing?.credits]);

  const value = useMemo<BillingValue>(() => {
    const remaining = (feature: Feature) =>
      billing ? Math.max(0, PLAN_LIMITS[billing.currentPlan][feature] - (billing.usage[feature] ?? 0)) : 0;
    return {
      billing,
      refresh,
      remaining,
      pending,
      awaitPurchase,
      accessFor: (feature, creditCost = CREDIT_COSTS[feature]) => {
        if (!billing) return "unknown";
        if (remaining(feature) > 0) return "quota";
        return billing.credits >= creditCost ? "credits" : "none";
      },
    };
  }, [billing, refresh, pending, awaitPurchase]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const value = useContext(BillingContext);
  if (!value) throw new Error("useBilling must be used inside BillingProvider");
  return value;
}
