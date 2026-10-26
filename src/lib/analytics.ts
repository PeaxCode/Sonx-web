type Gtag = (...args: unknown[]) => void;

/**
 * Sends a GA4 event once gtag is ready. <GoogleAnalytics /> runs
 * gtag('config') after hydration, and an event queued before config has no
 * destination and is dropped, so this waits for its inline script to define
 * window.gtag (config runs with it). Gives up after ~10s, e.g. with GA blocked.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}, onDone?: () => void) {
  let tries = 0;
  const timer = window.setInterval(() => {
    const gtag = (window as Window & { gtag?: Gtag }).gtag;
    if (gtag) gtag("event", name, params);
    if (gtag || ++tries > 50) {
      window.clearInterval(timer);
      onDone?.();
    }
  }, 200);
  return () => window.clearInterval(timer);
}
