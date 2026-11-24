"use client";

import { useEffect, useId, useRef } from "react";
import { IconClose } from "@/components/icons";
import { trackEvent } from "@/lib/analytics";
import { PLAN_LABELS, PLAN_LIMITS, SONG_POOL, type Plan } from "@/lib/billing-config";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

const SUPPORT_MAILTO = `mailto:support@getsonx.com?subject=${encodeURIComponent("Help with my Sonx plan")}`;

/** "week", "month" or "year": the plan's period, from the length of the current billing period. */
function periodName(periodStart: number, periodEnd: number) {
  const days = (periodEnd - periodStart) / 86_400_000;
  return days <= 10 ? "week" : days <= 45 ? "month" : "year";
}

/**
 * Shown before the subscription manager (where cancelling happens): what the plan
 * keeps until the period ends and what goes after it. Continuing is one click; the
 * dialog never stands between the user and cancelling.
 */
export function RetentionDialog({ plan, periodStart, periodEnd, managementUrl, onClose }: {
  plan: Plan;
  periodStart: number;
  periodEnd: number;
  managementUrl: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const label = PLAN_LABELS[plan];
  const songs = PLAN_LIMITS[plan][SONG_POOL];
  const until = new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.2 });
    gsap.from(".retention-panel", { scale: 0.96, y: 8, opacity: 0, duration: 0.25, ease: "power2.out" });
  }, { scope: ref });

  useEffect(() => {
    trackEvent("retention_view", { plan });
    keepRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [plan, onClose]);

  const keep = () => {
    trackEvent("retention_keep", { plan });
    onClose();
  };
  const proceed = () => {
    trackEvent("retention_continue", { plan });
    window.open(managementUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={keep}>
      <div className="retention-panel relative w-full max-w-lg rounded-[var(--radius-panel)] border border-line bg-plum p-6 md:p-8"
        onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close" onClick={keep}
          className="absolute right-4 top-4 rounded-full p-1.5 text-fog transition hover:bg-paper/10 hover:text-paper">
          <IconClose size={18} />
        </button>
        <h2 id={titleId} className="font-display text-2xl font-semibold tracking-[-0.02em]">Before you go</h2>
        <p className="mt-2 text-paper/80">
          If you cancel, {label} stays active until <strong className="text-paper">{until}</strong>. After that you lose:
        </p>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-paper/90 marker:text-orchid">
          <li>{songs} songs every {periodName(periodStart, periodEnd)}, with vocals or instrumental (back to one free song a month)</li>
          <li>MP3 downloads of your songs, and the right to use them commercially</li>
          <li>{label} in the Sonx app on your phone, with the same account</li>
        </ul>
        <p className="mt-5 text-sm text-fog">
          Having trouble with a song or a payment?{" "}
          <a href={SUPPORT_MAILTO} className="font-medium text-violet underline underline-offset-4 hover:text-orchid">Write to us</a>{" "}
          and we will sort it out.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button ref={keepRef} type="button" onClick={keep}
            className="bg-signature rounded-full px-6 py-3 text-sm font-semibold text-paper shadow-[0_12px_32px_-12px_rgb(229_99_241/0.8)] transition hover:brightness-110">
            Keep {label}
          </button>
          <button type="button" onClick={proceed}
            className="text-sm text-paper/70 underline underline-offset-4 transition hover:text-paper">
            Continue to manage subscription
          </button>
        </div>
      </div>
    </div>
  );
}
