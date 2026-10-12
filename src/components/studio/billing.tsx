"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CREDIT_COSTS, PLAN_LIMITS, type Feature } from "@/lib/billing-config";
import { fetchBilling, syncBillingAccount, type ServerBilling } from "@/lib/generations";

/** How a generation will be paid for, decided the same way the server does. */
export type Access = "quota" | "credits" | "none" | "unknown";

interface BillingValue {
  billing: ServerBilling | null;
  refresh: () => Promise<void>;
  accessFor: (feature: Feature, creditCost?: number) => Access;
  remaining: (feature: Feature) => number;
}

const BillingContext = createContext<BillingValue | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [billing, setBilling] = useState<ServerBilling | null>(null);

  useEffect(() => {
    let active = true;
    // The first call marks a web account migrated; later calls just read it.
    syncBillingAccount()
      .then((state) => active && setBilling(state))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setBilling(await fetchBilling());
    } catch {
      // Keep the last known balance; the next refresh retries.
    }
  }, []);

  const value = useMemo<BillingValue>(() => {
    const remaining = (feature: Feature) =>
      billing ? Math.max(0, PLAN_LIMITS[billing.currentPlan][feature] - (billing.usage[feature] ?? 0)) : 0;
    return {
      billing,
      refresh,
      remaining,
      accessFor: (feature, creditCost = CREDIT_COSTS[feature]) => {
        if (!billing) return "unknown";
        if (remaining(feature) > 0) return "quota";
        return billing.credits >= creditCost ? "credits" : "none";
      },
    };
  }, [billing, refresh]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const value = useContext(BillingContext);
  if (!value) throw new Error("useBilling must be used inside BillingProvider");
  return value;
}
