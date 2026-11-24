"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import {
  deleteGeneration,
  fetchGenerations,
  refreshGeneration,
  renameGeneration,
  setFavorite,
  type Generation,
} from "@/lib/generations";
import { useBilling } from "./billing";
import { useSession } from "./session";

const POLL_INTERVAL_MS = 5000;
// The EachLabs webhook normally finishes a generation; only ask the server
// to check the provider once a generation is clearly late.
const REFRESH_AFTER_MS = 3 * 60 * 1000;
const REFRESH_INTERVAL_MS = 60 * 1000;
/** How long a deleted song can be brought back (the undo toast's lifetime). */
export const UNDO_MS = 10_000;

interface LibraryValue {
  generations: Generation[];
  loading: boolean;
  /** Shows a just-started generation before the next poll. */
  track: (generationId: string) => Promise<void>;
  toggleFavorite: (generation: Generation) => Promise<void>;
  rename: (generation: Generation, title: string) => Promise<void>;
  remove: (generation: Generation) => Promise<void>;
  /** Hides the song now and deletes it after UNDO_MS; returns the undo. */
  removeWithUndo: (generation: Generation) => () => void;
  /** Songs that finished (or failed) while this tab was open, newest last; for the ready alert. */
  finished: Generation[];
  /** Reflects a publish or unpublish done on the server. */
  markPublished: (id: string, publishedAt: string | null) => void;
}

const LibraryContext = createContext<LibraryValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { refresh: refreshBilling } = useBilling();
  const { signedIn } = useSession();
  const [fetched, setGenerations] = useState<Generation[]>([]);
  const [fetching, setLoading] = useState(true);
  // Visitors have an empty library; the studio shows the examples instead.
  const generations = useMemo(() => (signedIn ? fetched : []), [signedIn, fetched]);
  const loading = signedIn === null || (signedIn && fetching);
  const lastRefresh = useRef(new Map<string, number>());
  const [finished, setFinished] = useState<Generation[]>([]);
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Leaving the page commits any delete still waiting out its undo window.
  useEffect(() => {
    const pending = pendingDeletes.current;
    const flush = () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        void deleteGeneration(id);
      });
      pending.clear();
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const reload = useCallback(async () => {
    const rows = await fetchGenerations();
    setGenerations(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetchGenerations()
      .then((rows) => {
        if (!active) return;
        setGenerations(rows);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [signedIn]);

  const processingIds = useMemo(
    () => generations.filter((generation) => generation.status === "processing").map((generation) => generation.id),
    [generations],
  );

  // Poll only the processing rows; reading them costs no Edge Function call.
  useEffect(() => {
    if (processingIds.length === 0) return;
    const timer = setInterval(async () => {
      const now = Date.now();
      const late = generations.filter((generation) =>
        generation.status === "processing" &&
        now - Date.parse(generation.created_at) > REFRESH_AFTER_MS &&
        now - (lastRefresh.current.get(generation.id) ?? 0) > REFRESH_INTERVAL_MS
      );
      for (const generation of late) {
        lastRefresh.current.set(generation.id, now);
        await refreshGeneration(generation.id).catch(() => undefined);
      }

      const { data } = await getSupabase()
        .from("generations")
        .select("id,status,output_url,error,completed_at")
        .in("id", processingIds);
      if (!data) return;
      const updates = new Map(data.map((row) => [row.id, row]));
      const done = generations.flatMap((generation) => {
        const update = updates.get(generation.id);
        return update && update.status !== generation.status ? [{ ...generation, ...update } as Generation] : [];
      });
      if (done.length === 0) return;
      const byId = new Map(done.map((generation) => [generation.id, generation]));
      setGenerations((current) => current.map((generation) => byId.get(generation.id) ?? generation));
      setFinished((current) => [...current, ...done].slice(-10));
      // The server settled the charge (commit or refund); show the real balance.
      void refreshBilling();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [processingIds, generations, refreshBilling]);

  const value = useMemo<LibraryValue>(() => ({
    generations,
    loading,
    finished,
    track: async () => {
      await reload();
      void refreshBilling();
    },
    toggleFavorite: async (generation) => {
      setGenerations((current) => current.map((item) =>
        item.id === generation.id ? { ...item, is_favorite: !generation.is_favorite } : item));
      await setFavorite(generation.id, !generation.is_favorite).catch(() => reload());
    },
    rename: async (generation, title) => {
      setGenerations((current) => current.map((item) => (item.id === generation.id ? { ...item, title } : item)));
      await renameGeneration(generation.id, title).catch(() => reload());
    },
    removeWithUndo: (generation) => {
      setGenerations((current) => current.filter((item) => item.id !== generation.id));
      const timer = setTimeout(() => {
        pendingDeletes.current.delete(generation.id);
        deleteGeneration(generation.id).catch(() => reload());
      }, UNDO_MS);
      pendingDeletes.current.set(generation.id, timer);
      return () => {
        if (!pendingDeletes.current.has(generation.id)) return;
        clearTimeout(timer);
        pendingDeletes.current.delete(generation.id);
        setGenerations((current) => [...current, generation].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      };
    },
    markPublished: (id, publishedAt) => {
      setGenerations((current) => current.map((item) => (item.id === id ? { ...item, published_at: publishedAt } : item)));
    },
    remove: async (generation) => {
      setGenerations((current) => current.filter((item) => item.id !== generation.id));
      await deleteGeneration(generation.id).catch(() => reload());
    },
  }), [generations, loading, finished, reload, refreshBilling]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
