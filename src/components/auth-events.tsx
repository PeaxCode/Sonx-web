"use client";

import { useEffect } from "react";
import { AUTH_EVENT_COOKIE } from "@/lib/auth-event";

/**
 * Sends GA4's recommended `sign_up` / `login` event after OAuth returns. The
 * call is queued on dataLayer like gtag() does, so it is kept even when the
 * GA script has not loaded yet.
 */
export function AuthEvents() {
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_EVENT_COOKIE}=([^;]*)`));
    if (!match) return;
    document.cookie = `${AUTH_EVENT_COOKIE}=; path=/; max-age=0`;

    const [name, method] = decodeURIComponent(match[1]).split(":");
    if (name !== "sign_up" && name !== "login") return;
    window.dataLayer = window.dataLayer || [];
    // gtag reads an `arguments` object, not a plain array.
    // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unused-vars
    (function gtag(..._args: unknown[]) { window.dataLayer!.push(arguments); })("event", name, { method });
  }, []);

  return null;
}
