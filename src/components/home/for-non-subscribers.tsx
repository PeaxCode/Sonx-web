"use client";

import type { ReactNode } from "react";
import { useBilling } from "@/components/studio/billing";

/**
 * Home sections that sell the product (reviews, plans, FAQ). They stay in the
 * server HTML for visitors and search engines, and are hidden once billing shows
 * the signed-in user already has a plan.
 */
export function ForNonSubscribers({ children }: { children: ReactNode }) {
  const { billing } = useBilling();
  if (billing?.isPro) return null;
  return children;
}
