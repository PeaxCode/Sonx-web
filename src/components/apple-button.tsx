"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Sign in with Apple (web OAuth through the same Supabase Apple provider the
 * app uses). Shown only when NEXT_PUBLIC_APPLE_SIGNIN_ENABLED is "true", which
 * should be set once the Services ID and secret are configured in Supabase.
 */
export function AppleSignInButton({ next = "/create" }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  if (process.env.NEXT_PUBLIC_APPLE_SIGNIN_ENABLED !== "true") return null;

  const signIn = async () => {
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await getSupabase().auth.signInWithOAuth({ provider: "apple", options: { redirectTo } });
    if (error) setBusy(false);
  };

  // Apple's guidelines: a black or white button with the Apple logo and "Continue with Apple".
  return (
    <button type="button" onClick={signIn} disabled={busy}
      className="flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] bg-white px-5 py-3.5 font-medium text-black transition hover:bg-white/90 disabled:opacity-60">
      <svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true" fill="currentColor">
        <path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2.1-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.4Z" />
      </svg>
      {busy ? "Opening Apple" : "Continue with Apple"}
    </button>
  );
}
