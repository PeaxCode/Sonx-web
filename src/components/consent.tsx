"use client";

import { useEffect, useState } from "react";

// Google Consent Mode v2. Analytics stays off where consent is required (EEA, UK,
// Switzerland, Turkey) until the visitor accepts; elsewhere it runs as before.
// Ads storage is off everywhere: Sonx runs no ad pixels.
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT",
  "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH", "TR",
];
const STORAGE_KEY = "sonx:consent";

type Choice = "granted" | "denied";

/**
 * Runs before GA loads (root layout, beforeInteractive). It pushes to dataLayer
 * through a local gtag so window.gtag stays undefined until GA's own config,
 * which lib/analytics.ts waits for.
 */
export const CONSENT_DEFAULTS_SCRIPT = `(function(){
window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments);}
var off={ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
g('consent','default',Object.assign({analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)},wait_for_update:500},off));
g('consent','default',Object.assign({analytics_storage:'granted'},off));
try{var c=localStorage.getItem('${STORAGE_KEY}');if(c==='granted'||c==='denied')g('consent','update',{analytics_storage:c});}catch(e){}
})();`;

function update(choice: Choice) {
  const dataLayer = ((window as Window & { dataLayer?: unknown[] }).dataLayer ??= []);
  // gtag's queue reads `arguments` objects, so push one, as gtag itself does.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (function push(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  })("consent", "update", { analytics_storage: choice });
}

/** Asks visitors in Europe (by time zone) once; the choice is kept in this browser. */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    // Storage and time zone are only readable in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!stored && (zone.startsWith("Europe/") || zone === "Atlantic/Reykjavik")) setOpen(true);
  }, []);

  if (!open) return null;

  const choose = (choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Not remembered; the banner returns next visit.
    }
    update(choice);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-xl rounded-[var(--radius-control)] border border-line bg-raised p-4 text-sm shadow-2xl md:bottom-6">
      <p>
        We use cookies for sign-in and, with your permission, for anonymous usage statistics (Google Analytics).{" "}
        <a href="/privacy.html" className="underline hover:text-paper">Privacy policy</a>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => choose("denied")} className="rounded-full px-4 py-2 font-medium text-paper/80 hover:bg-paper/10 hover:text-paper">
          Only necessary
        </button>
        <button type="button" onClick={() => choose("granted")} className="rounded-full bg-paper px-4 py-2 font-semibold text-night hover:bg-paper/90">
          Accept
        </button>
      </div>
    </div>
  );
}
