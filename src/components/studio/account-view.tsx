"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAN_LABELS, PLAN_LIMITS, STORE_LINKS, type Feature } from "@/lib/billing-config";
import { Aurora } from "@/components/aurora";
import { webCheckoutEnabled, webCreditsEnabled } from "@/lib/paddle";
import { getSupabase } from "@/lib/supabase/client";
import { useBilling } from "./billing";
import { useFeedback } from "./feedback";

const STORE_NAMES: Record<string, string> = {
  paddle: "Paddle (web)",
  app_store: "the App Store",
  mac_app_store: "the App Store",
  play_store: "Google Play",
};

const USAGE_ROWS: { feature: Feature; label: string }[] = [
  { feature: "PROMPT_MUSIC", label: "Instrumentals" },
  { feature: "LYRICS_MUSIC", label: "Songs with vocals" },
  // Hidden with music video, pending payment provider review:
  // { feature: "AI_MUSIC_VIDEO", label: "Music videos" },
];

export function AccountView({ email, name, avatarUrl }: { email: string | null; name: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const { billing } = useBilling();
  const { notify } = useFeedback();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    await getSupabase().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account? Your songs and credits are deleted everywhere, including the app. " +
      "Deleting does not cancel a subscription: cancel it first with Manage subscription on this page " +
      "(web plans) or in the App Store or Google Play to stop future charges.",
    );
    if (!confirmed) return;
    setBusy(true);
    const { error } = await getSupabase().functions.invoke("delete-account", { body: {} });
    if (error) {
      setBusy(false);
      notify("Your account could not be deleted. Try again in a moment.", "error");
      return;
    }
    await getSupabase().auth.signOut({ scope: "local" });
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-center gap-4">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={64} height={64} unoptimized className="rounded-full ring-2 ring-paper/10" />
        ) : (
          <span className="bg-signature flex size-16 items-center justify-center rounded-full text-2xl font-semibold">
            {(name ?? email ?? "S").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tracking-[-0.02em]">{name ?? email}</p>
          {name && email && <p className="truncate text-paper/60">{email}</p>}
        </div>
      </section>

      <section aria-labelledby="plan-title" className="relative isolate overflow-hidden rounded-[28px] border border-paper/[0.06] p-6 md:p-8">
        <Aurora className="opacity-40" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-paper/60">Your plan</p>
            <h2 id="plan-title" className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{billing ? PLAN_LABELS[billing.currentPlan] : "Plan"}</h2>
          </div>
          {/* Credits are a subscriber top-up, so the balance stays hidden until there is a plan. */}
          {billing?.isPro && (
            <p className="rounded-full bg-paper/10 px-4 py-1.5 text-sm font-medium tabular-nums backdrop-blur">{billing.credits} credits</p>
          )}
        </div>
        {billing && !billing.isPro && (
          <p className="mt-4 text-sm text-paper/70">Subscribe to start creating songs every month.</p>
        )}
        {billing?.isPro && (
          <dl className="mt-7 grid gap-5">
            {USAGE_ROWS.map(({ feature, label }) => {
              const limit = PLAN_LIMITS[billing.currentPlan][feature];
              const used = Math.min(billing.usage[feature] ?? 0, limit);
              return (
                <div key={feature}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-paper/70">{label}</dt>
                    <dd className="font-medium tabular-nums">{limit === 0 ? "Credits only" : `${limit - used} of ${limit} left`}</dd>
                  </div>
                  {limit > 0 && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/10" aria-hidden="true">
                      <div className="bg-signature h-full rounded-full" style={{ width: `${((limit - used) / limit) * 100}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </dl>
        )}
        {billing?.isPro && (
          <p className="mt-6 text-sm text-paper/60">
            {billing.store && STORE_NAMES[billing.store] ? `Billed by ${STORE_NAMES[billing.store]}. ` : ""}
            {billing.managementUrl ? (
              <a href={billing.managementUrl} target="_blank" rel="noreferrer" className="font-medium text-paper underline-offset-4 hover:underline">
                Manage subscription
              </a>
            ) : (
              "Manage it where you subscribed."
            )}
          </p>
        )}
        {billing && (webCheckoutEnabled || webCreditsEnabled) ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {!billing.isPro && webCheckoutEnabled && (
              <Link href="/pricing" className="rounded-full bg-paper px-6 py-2.5 text-sm font-semibold text-night transition hover:bg-paper/90">
                See plans
              </Link>
            )}
            {billing.isPro && webCreditsEnabled && (
              <Link href="/pricing#credits-title" className="rounded-full bg-paper/10 px-6 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-paper/15">
                Buy credits
              </Link>
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm text-fog">
            Plans and credits are available in the Sonx app.{" "}
            <a href={STORE_LINKS.ios} target="_blank" rel="noreferrer" className="text-violet hover:text-orchid">App Store</a>
            {" or "}
            <a href={STORE_LINKS.android} target="_blank" rel="noreferrer" className="text-violet hover:text-orchid">Google Play</a>.
          </p>
        )}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 border-t border-paper/[0.06] pt-8">
        <button type="button" disabled={busy} onClick={signOut}
          className="rounded-full bg-paper/[0.06] px-6 py-2.5 text-sm font-medium transition hover:bg-paper/10 disabled:opacity-50">
          Sign out
        </button>
        <button type="button" disabled={busy} onClick={deleteAccount}
          className="rounded-full px-4 py-2.5 text-sm text-danger transition hover:bg-danger/10 disabled:opacity-50">
          Delete account
        </button>
      </section>
    </div>
  );
}
