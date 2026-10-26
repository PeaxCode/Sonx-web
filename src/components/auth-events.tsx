"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { AUTH_EVENT_COOKIE } from "@/lib/auth-event";

/**
 * Sends GA4's recommended `sign_up` / `login` event after OAuth returns.
 */
export function AuthEvents() {
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_EVENT_COOKIE}=([^;]*)`));
    if (!match) return;
    // Cleared when the event is sent, so an effect re-run (Strict Mode) still sends it.
    const clear = () => { document.cookie = `${AUTH_EVENT_COOKIE}=; path=/; max-age=0`; };

    const [name, method] = decodeURIComponent(match[1]).split(":");
    if (name !== "sign_up" && name !== "login") return clear();
    return trackEvent(name, { method }, clear);
  }, []);

  return null;
}
