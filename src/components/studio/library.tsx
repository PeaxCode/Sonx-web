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

interface LibraryValue {
  generations: Generation[];
  loading: boolean;
  /** Shows a just-started generation before the next poll. */
  track: (generationId: string) => Promise<void>;
  toggleFavorite: (generation: Generation) => Promise<void>;
  rename: (generation: Generation, title: string) => Promise<void>;
  remove: (generation: Generation) => Promise<void>;
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
      let finished = false;
      setGenerations((current) => current.map((generation) => {
        const update = updates.get(generation.id);
        if (!update || update.status === generation.status) return generation;
        finished = true;
        return { ...generation, ...update } as Generation;
      }));
      // The server settled the charge (commit or refund); show the real balance.
      if (finished) void refreshBilling();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [processingIds, generations, refreshBilling]);

  const value = useMemo<LibraryValue>(() => ({
    generations,
    loading,
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
    remove: async (generation) => {
      setGenerations((current) => current.filter((item) => item.id !== generation.id));
      await deleteGeneration(generation.id).catch(() => reload());
    },
  }), [generations, loading, reload, refreshBilling]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
