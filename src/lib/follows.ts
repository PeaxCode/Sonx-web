"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Followed artists, kept in this browser only while Explore runs on mock
 * artists (lib/explore-mock.ts). Move to a Supabase table together with the
 * real public feed.
 */

const KEY = "sonx:following";
const EMPTY: readonly string[] = [];
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cached: readonly string[] = EMPTY;

function read(): readonly string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private mode, disabled site data): nothing followed.
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cached = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(next: readonly string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not persisted; the in-memory copy below still updates this tab.
  }
  cachedRaw = JSON.stringify(next);
  cached = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Other tabs change the list through the storage event.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFollowing() {
  const following = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((handle: string) => {
    const current = read();
    write(current.includes(handle) ? current.filter((item) => item !== handle) : [...current, handle]);
  }, []);
  const isFollowing = useCallback((handle: string) => following.includes(handle), [following]);
  return { following, isFollowing, toggle };
}
