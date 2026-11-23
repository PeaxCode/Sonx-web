"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAN_LABELS, PLAN_LIMITS, SONG_POOL, STORE_LINKS, type Feature } from "@/lib/billing-config";
import { Aurora } from "@/components/aurora";
import { webCheckoutEnabled, webCreditsEnabled } from "@/lib/paddle";
import { getSupabase } from "@/lib/supabase/client";
import { useBilling } from "./billing";
import { ConfirmDialog } from "./confirm-dialog";
import { useFeedback } from "./feedback";

const STORE_NAMES: Record<string, string> = {
  paddle: "Paddle (web)",
  app_store: "the App Store",
  mac_app_store: "the App Store",
  play_store: "Google Play",
};

const SUPPORT_EMAIL = "support@getsonx.com";
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Web purchase not on my account")}`;

// One row: instrumentals and songs with vocals share the plan's songs.
const USAGE_ROWS: { feature: Feature; label: string }[] = [
  { feature: SONG_POOL, label: "Songs this month" },
  // Hidden with music video, pending payment provider review:
  // { feature: "AI_MUSIC_VIDEO", label: "Music videos" },
];

export function AccountView({ email, name, avatarUrl }: { email: string | null; name: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const { billing, pending, outcome, dismissOutcome, refresh } = useBilling();
  const { notify } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const webPlan = billing?.isPro && billing.store === "paddle";
  const appPlan = billing?.isPro && billing.store && billing.store !== "paddle" ? STORE_NAMES[billing.store] ?? "your app store" : null;

  const signOut = async () => {
    setBusy(true);
    await getSupabase().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const deleteAccount = async () => {
    setBusy(true);
    const { error } = await getSupabase().functions.invoke("delete-account", { body: {} });
    if (error) {
      setBusy(false);
      setConfirmingDelete(false);
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

      {pending && (
        <p role="status" className="rounded-[var(--radius-control)] border border-orchid/40 bg-raised px-4 py-3 text-sm">
          Payment received. {pending === "plan" ? "Activating your plan" : "Adding your credits"}, this usually takes a few seconds.
        </p>
      )}
      {outcome?.status === "added" && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border border-orchid/40 bg-raised px-4 py-3 text-sm">
          <p>
            {outcome.kind === "plan"
              ? "Your plan is active."
              : `${outcome.credits.toLocaleString("en-US")} credits added. You now have ${billing?.credits.toLocaleString("en-US") ?? outcome.credits} credits.`}
          </p>
          <button type="button" onClick={dismissOutcome} className="font-semibold text-paper/70 hover:text-paper">Dismiss</button>
        </div>
      )}
      {outcome?.status === "late" && (
        <div role="alert" className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-danger/40 bg-raised px-4 py-4 text-sm">
          <p className="font-semibold">Your payment went through, but {outcome.kind === "plan" ? "your plan is" : "the credits are"} not on your account yet.</p>
          <p className="text-paper/70">
            You have not been charged twice, and nothing is lost. Check again in a few minutes. If it still has not arrived, email{" "}
            <a href={SUPPORT_MAILTO} className="font-semibold text-orchid hover:text-paper">{SUPPORT_EMAIL}</a>{" "}
            with your Paddle receipt and we will add it.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => { void refresh(); dismissOutcome(); }}
              className="rounded-full bg-paper/10 px-5 py-2 font-semibold transition hover:bg-paper/15">
              Check again
            </button>
            <a href={SUPPORT_MAILTO} className="rounded-full px-5 py-2 font-semibold text-paper/70 transition hover:text-paper">Contact support</a>
          </div>
        </div>
      )}

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
          <p className="mt-4 text-sm text-paper/70">
            {(billing.usage[SONG_POOL] ?? 0) < PLAN_LIMITS.FREE[SONG_POOL]
              ? "Your free song for this month is ready to use. "
              : `You have used this month's free song. The next one arrives on ${new Date(billing.periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. `}
            Subscribe for {PLAN_LIMITS.MONTHLY[SONG_POOL]}+ songs a month, MP3 downloads and commercial use.
          </p>
        )}
        {billing?.isPro && billing.periodEnd > 0 && (
          <p className="mt-2 text-sm text-paper/70">
            Songs reset on {new Date(billing.periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>
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
                {billing.store === "paddle" ? "Manage subscription and invoices" : "Manage subscription"}
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
        <button type="button" disabled={busy} onClick={() => setConfirmingDelete(true)}
          className="rounded-full px-4 py-2.5 text-sm text-danger transition hover:bg-danger/10 disabled:opacity-50">
          Delete account
        </button>
      </section>

      {confirmingDelete && (
        <ConfirmDialog title="Delete your account?" confirmLabel="Delete account" typeToConfirm="DELETE" busy={busy}
          onConfirm={deleteAccount} onCancel={() => setConfirmingDelete(false)}>
          <p>Your songs, lyrics and credits are deleted everywhere, including the Sonx app. This cannot be undone.</p>
          {webPlan && (
            <p className="rounded-[var(--radius-control)] border border-danger/40 px-3 py-2 text-paper">
              Your web plan keeps billing until you cancel it.{" "}
              {billing?.managementUrl ? (
                <a href={billing.managementUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Cancel it first</a>
              ) : "Cancel it first with Manage subscription"}
              , then delete your account.
            </p>
          )}
          {appPlan && (
            <p className="rounded-[var(--radius-control)] border border-danger/40 px-3 py-2 text-paper">
              Deleting does not cancel your plan. Cancel it in {appPlan} first to stop future charges.
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
