"use client";

import { useEffect } from "react";
import { saveBlogSource } from "@/lib/draft";

/**
 * Takes ?prompt= and ?from= (a Journal post's CTA) out of the address bar, so
 * what people typed never reaches GA's page_location. The form already has the
 * prompt from the server. This sits outside the form's Suspense boundary so it
 * runs in the same hydration pass as <GoogleAnalytics />, ahead of its page_view.
 */
export function CreateLinkParams() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("prompt") && !params.has("from")) return;
    const from = params.get("from");
    if (from && /^[a-z0-9-]{1,80}$/.test(from)) saveBlogSource(from);
    params.delete("prompt");
    params.delete("from");
    params.delete("genre");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);

  return null;
}
