"use client";

import { useEffect, useRef } from "react";

/**
 * The end of a paged list: loads the next page when it scrolls into view, with a
 * button as the fallback (and for keyboard users).
 */
export function LoadMore({ hasMore, loading, onLoad }: { hasMore: boolean; loading: boolean; onLoad: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoad();
    }, { rootMargin: "400px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, onLoad]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="mt-6 flex justify-center">
      <button type="button" onClick={onLoad} disabled={loading}
        className="rounded-full bg-paper/[0.06] px-5 py-2.5 text-sm font-medium transition hover:bg-paper/10 disabled:opacity-50">
        {loading ? "Loading" : "Show more"}
      </button>
    </div>
  );
}
