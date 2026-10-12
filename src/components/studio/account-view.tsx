"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAN_LABELS, PLAN_LIMITS, STORE_LINKS, type Feature } from "@/lib/billing-config";
import { getSupabase } from "@/lib/supabase/client";
import { useBilling } from "./billing";
import { useFeedback } from "./feedback";

const USAGE_ROWS: { feature: Feature; label: string }[] = [
  { feature: "PROMPT_MUSIC", label: "Instrumentals" },
  { feature: "LYRICS_MUSIC", label: "Songs with vocals" },
  { feature: "AI_MUSIC_VIDEO", label: "Music videos" },
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
      "Delete your account? Your songs, videos and credits are deleted everywhere, including the app. " +
      "Subscriptions are billed by the App Store or Google Play: cancel yours there to stop future charges.",
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
    <div className="flex flex-col gap-10">
      <section className="flex items-center gap-4">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={56} height={56} unoptimized className="rounded-full" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-raised font-display text-lg">
            {(name ?? email ?? "S").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">{name ?? email}</p>
          {name && email && <p className="truncate text-fog">{email}</p>}
        </div>
      </section>

      <section aria-labelledby="plan-title" className="rounded-[var(--radius-panel)] border border-line p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="plan-title" className="font-display text-lg font-semibold">{billing ? PLAN_LABELS[billing.currentPlan] : "Plan"}</h2>
          <p className="text-fog tabular-nums">{billing ? `${billing.credits} credits` : ""}</p>
        </div>
        {billing && (
          <dl className="mt-5 grid gap-3">
            {USAGE_ROWS.map(({ feature, label }) => {
              const limit = PLAN_LIMITS[billing.currentPlan][feature];
              const used = Math.min(billing.usage[feature] ?? 0, limit);
              return (
                <div key={feature} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-fog">{label}</dt>
                  <dd className="tabular-nums">{limit === 0 ? "Credits only" : `${limit - used} of ${limit} left`}</dd>
                </div>
              );
            })}
          </dl>
        )}
        <p className="mt-5 text-sm text-fog">
          Plans and credits are managed in the Sonx app.{" "}
          <a href={STORE_LINKS.ios} target="_blank" rel="noreferrer" className="text-violet hover:text-orchid">App Store</a>
          {" or "}
          <a href={STORE_LINKS.android} target="_blank" rel="noreferrer" className="text-violet hover:text-orchid">Google Play</a>.
        </p>
      </section>

      <section className="flex flex-col items-start gap-3">
        <button type="button" disabled={busy} onClick={signOut}
          className="rounded-[var(--radius-control)] border border-line px-5 py-2.5 text-sm font-medium transition hover:bg-plum disabled:opacity-50">
          Sign out
        </button>
        <button type="button" disabled={busy} onClick={deleteAccount}
          className="px-1 py-2 text-sm text-danger transition hover:underline disabled:opacity-50">
          Delete account
        </button>
      </section>
    </div>
  );
}
