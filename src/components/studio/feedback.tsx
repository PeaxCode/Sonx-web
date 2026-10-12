"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { STORE_LINKS } from "@/lib/billing-config";

interface FeedbackValue {
  notify: (message: string, tone?: "info" | "error") => void;
  openPaywall: () => void;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

/** Toast messages and the "get Pro in the app" paywall. */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: "info" | "error"; id: number } | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const notify = useCallback((message: string, tone: "info" | "error" = "info") => {
    const id = Date.now();
    setToast({ message, tone, id });
    setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 4500);
  }, []);

  const value = useMemo(() => ({ notify, openPaywall: () => setPaywallOpen(true) }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
        {toast && (
          <p
            className={`pointer-events-auto max-w-md rounded-[var(--radius-control)] border px-4 py-3 text-sm shadow-2xl ${
              toast.tone === "error" ? "border-danger/40 bg-raised text-paper" : "border-line bg-raised text-paper"
            }`}
          >
            {toast.message}
          </p>
        )}
      </div>

      {paywallOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="paywall-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPaywallOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-panel)] border border-line bg-plum p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="paywall-title" className="font-display text-xl font-semibold">
              You are out of songs for now
            </h2>
            <p className="mt-3 text-fog">
              Subscribe or buy credits in the Sonx app. Sign in there with the same account and your plan works here too.
            </p>
            <div className="mt-6 flex items-center gap-5">
              <div className="rounded-xl bg-paper p-2">
                <QRCodeSVG value={STORE_LINKS.ios} size={96} />
              </div>
              <p className="text-sm text-fog">Scan with your iPhone camera to open the App Store.</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a href={STORE_LINKS.ios} target="_blank" rel="noreferrer"
                className="rounded-[var(--radius-control)] bg-paper px-4 py-3 text-center text-sm font-semibold text-night">
                App Store
              </a>
              <a href={STORE_LINKS.android} target="_blank" rel="noreferrer"
                className="rounded-[var(--radius-control)] border border-line px-4 py-3 text-center text-sm font-semibold">
                Google Play
              </a>
            </div>
            <button type="button" onClick={() => setPaywallOpen(false)} className="mt-5 w-full py-2 text-sm text-fog hover:text-paper">
              Not now
            </button>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useFeedback must be used inside FeedbackProvider");
  return value;
}
