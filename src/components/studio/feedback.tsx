"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { QRCodeSVG } from "qrcode.react";
import { CreditPacks } from "@/components/pricing/credit-packs";
import { PlanCards } from "@/components/pricing/plan-cards";
import { StoreBadges } from "@/components/store-badges";
import { trackEvent } from "@/lib/analytics";
import { webCheckoutEnabled, webCreditsEnabled } from "@/lib/paddle";
import { useBilling } from "./billing";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface FeedbackValue {
  notify: (message: string, tone?: "info" | "error", action?: ToastAction) => void;
  /** `reason` replaces the paywall's heading, e.g. "MP3 downloads come with a plan". */
  openPaywall: (reason?: string) => void;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

function PaywallDialog({ onClose, reason }: { onClose: () => void; reason?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { billing, pending } = useBilling();
  // Pro members who ran out can't subscribe twice: they get credit packs instead.
  const offer = !billing ? "app" : !billing.isPro && webCheckoutEnabled ? "plans" : billing.isPro && webCreditsEnabled ? "credits" : "app";

  useEffect(() => {
    trackEvent("paywall_view", { offer, page: window.location.pathname, reason: reason ?? "out_of_songs" });
    // Once per opening; the offer settles before the dialog can open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Payment went through: the buyer is taken to Account, which tracks the purchase.
  useEffect(() => {
    if (pending) onClose();
  }, [pending, onClose]);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.2 });
    gsap.from(".paywall-panel", { scale: 0.96, y: 8, opacity: 0, duration: 0.3, ease: "power2.out" });
  }, { scope: ref });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`paywall-panel max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-[var(--radius-panel)] border border-line bg-night p-6 md:p-8 ${
          offer === "plans" ? "max-w-6xl" : offer === "credits" ? "max-w-5xl" : "max-w-md bg-plum"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        {offer === "plans" && (
          <>
            <h2 id="paywall-title" className="font-display text-xl font-semibold md:text-2xl">{reason ?? "Pick a plan to keep creating"}</h2>
            <p className="mt-2 text-fog">Your plan works here and in the Sonx app.</p>
            <div className="mt-6"><PlanCards /></div>
          </>
        )}
        {offer === "credits" && (
          <>
            <h2 id="paywall-title" className="font-display text-xl font-semibold md:text-2xl">You have used this period&apos;s songs</h2>
            <p className="mt-2 text-fog">Add credits to keep creating before your plan renews.</p>
            <div className="mt-6"><CreditPacks /></div>
          </>
        )}
        {offer === "app" && (
          <>
            <h2 id="paywall-title" className="font-display text-xl font-semibold">
              You are out of songs for now
            </h2>
            <p className="mt-3 text-fog">
              {billing?.isPro
                ? "Buy credits in the Sonx app to keep creating before your plan renews. Sign in there with the same account."
                : "Subscribe or buy credits in the Sonx app. Sign in there with the same account and your plan works here too."}
            </p>
            <div className="mt-6 flex items-center gap-5">
              <div className="rounded-xl bg-paper p-2">
                <QRCodeSVG value="https://getsonx.com/get-app" size={96} />
              </div>
              <p className="text-sm text-fog">Scan with your phone camera to get the app.</p>
            </div>
            <StoreBadges className="mt-6" />
          </>
        )}
        <button type="button" onClick={onClose} className="mt-5 w-full py-2 text-sm text-fog hover:text-paper">
          Not now
        </button>
      </div>
    </div>
  );
}

/** Toast messages and the paywall (web plans via Paddle, or the app). */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: "info" | "error"; id: number; action?: ToastAction } | null>(null);
  const [paywall, setPaywall] = useState<{ reason?: string; path: string } | null>(null);

  const notify = useCallback((message: string, tone: "info" | "error" = "info", action?: ToastAction) => {
    const id = Date.now();
    setToast({ message, tone, id, action });
    // A toast with a button stays long enough to reach for it.
    setTimeout(() => setToast((current) => (current?.id === id ? null : current)), action ? 10000 : 4500);
  }, []);

  const closePaywall = useCallback(() => setPaywall(null), []);

  // A plan or pack button navigates to /checkout; the paywall belongs to the page it opened on.
  const pathname = usePathname();

  // Announce a finished web purchase wherever the buyer is, for a few seconds.
  const { outcome } = useBilling();
  const [hiddenOutcome, setHiddenOutcome] = useState<number | null>(null);
  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => setHiddenOutcome(outcome.id), 6000);
    return () => clearTimeout(timer);
  }, [outcome]);
  const purchaseToast = outcome && hiddenOutcome !== outcome.id
    ? outcome.status === "late"
      ? { message: "Your payment went through, but it is not on your account yet. See Account for help.", tone: "error" as const }
      : { message: outcome.kind === "plan" ? "Your plan is active. Create away." : `${outcome.credits.toLocaleString("en-US")} credits added. Create away.`, tone: "info" as const }
    : null;
  const shown: { message: string; tone: "info" | "error"; action?: ToastAction } | null = purchaseToast ?? toast;
  const value = useMemo(() => ({ notify, openPaywall: (reason?: string) => setPaywall({ reason, path: window.location.pathname }) }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
        {shown && (
          <div
            className={`pointer-events-auto flex max-w-md items-center gap-4 rounded-[var(--radius-control)] border px-4 py-3 text-sm shadow-2xl ${
              shown.tone === "error" ? "border-danger/40 bg-raised text-paper" : "border-line bg-raised text-paper"
            }`}
          >
            <p>{shown.message}</p>
            {shown.action && (
              <button type="button" onClick={() => { shown.action!.onClick(); setToast(null); }}
                className="shrink-0 rounded-full bg-paper px-4 py-1.5 font-semibold text-night transition hover:bg-paper/90">
                {shown.action.label}
              </button>
            )}
          </div>
        )}
      </div>

      {paywall && paywall.path === pathname && <PaywallDialog onClose={closePaywall} reason={paywall.reason} />}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useFeedback must be used inside FeedbackProvider");
  return value;
}
