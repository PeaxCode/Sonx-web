"use client";

import { useEffect } from "react";
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
    // <GoogleAnalytics /> runs gtag('config') after hydration, i.e. after this
    // effect. An event queued before config has no destination and is dropped,
    // so wait for its inline script to define window.gtag (config runs with it).
    let tries = 0;
    const timer = window.setInterval(() => {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) gtag("event", name, { method });
      if (gtag || ++tries > 50) { clear(); window.clearInterval(timer); }
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
