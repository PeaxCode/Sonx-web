"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Passwordless sign-in: Supabase emails a one-time link that lands on
 * /auth/callback, then `next`. The same address used with Apple or Google
 * opens the same account (Supabase links identities with a verified email).
 */
export function EmailSignIn({ next = "/create" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setState("error");
      setError("Enter a valid email address.");
      return;
    }
    setState("sending");
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: sendError } = await getSupabase().auth.signInWithOtp({ email: address, options: { emailRedirectTo } });
    if (sendError) {
      setState("error");
      setError(sendError.status === 429 ? "Too many links sent. Wait a minute and try again." : "The link could not be sent. Try again.");
      return;
    }
    trackEvent("signin_email_sent", {});
    setState("sent");
  };

  if (state === "sent") {
    return (
      <div role="status" className="rounded-[var(--radius-control)] border border-line bg-night/40 px-4 py-3 text-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-fog">We sent a sign-in link to {email.trim()}. Open it in this browser to continue.</p>
        <button type="button" onClick={() => setState("idle")} className="mt-2 text-xs font-medium text-orchid hover:text-paper">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate className="flex flex-col gap-2">
      <label htmlFor="signin-email" className="sr-only">Email</label>
      <input id="signin-email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com"
        value={email} onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-[var(--radius-control)] border border-line bg-night/60 px-4 py-3 text-sm placeholder:text-fog/60 focus:border-paper/40 focus:outline-none" />
      <button type="submit" disabled={state === "sending"}
        className="w-full rounded-[var(--radius-control)] border border-line px-5 py-3 text-sm font-semibold transition hover:bg-paper/10 disabled:opacity-60">
        {state === "sending" ? "Sending link" : "Continue with email"}
      </button>
      {state === "error" && <p role="alert" className="text-xs text-danger">{error}</p>}
    </form>
  );
}

/** "or" between the one-tap buttons and the email form. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-fog" aria-hidden="true">
      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
    </div>
  );
}
