"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/** What the form is doing before the song exists: writing lyrics, then asking the server to start it. */
export type MakingStage = "lyrics" | "starting";

export interface Making {
  stage: MakingStage;
  /** The user's title, or the working title once known; empty while lyrics are written. */
  title: string;
  genre: string;
  /** Sonx writes the lyrics (a described song with vocals), so the card shows a Lyrics step. */
  withLyrics: boolean;
}

/** The song the user just started on this page; the card follows it until they dismiss it. */
export interface Tracked {
  id: string;
  withLyrics: boolean;
  /** When Create was pressed, so the timer includes writing the lyrics. Filled in by the provider. */
  startedAt: number;
}

/** An idea picked from the list, for the form to apply. `nonce` makes picking the same idea twice count. */
export interface PromptFill {
  prompt: string;
  genre: string;
  instrumental: boolean;
  nonce: number;
}

interface CreateValue {
  making: Making | null;
  setMaking: (making: Making | null) => void;
  /** When the current `making` began, for the card's timer. */
  startedAt: number | null;
  tracked: Tracked | null;
  setTracked: (tracked: Omit<Tracked, "startedAt"> | null) => void;
  fill: PromptFill | null;
  requestFill: (fill: Omit<PromptFill, "nonce">) => void;
}

const CreateContext = createContext<CreateValue | null>(null);

/** State shared by the two columns of /create: the form, and the card and ideas beside it. */
export function CreateProvider({ children }: { children: React.ReactNode }) {
  // The start time rides along with `making`, so moving from lyrics to starting keeps the timer running.
  const [current, setCurrent] = useState<(Making & { startedAt: number }) | null>(null);
  const currentRef = useRef(current);
  const [tracked, setTrackedState] = useState<Tracked | null>(null);
  const [fill, setFill] = useState<PromptFill | null>(null);

  const setMaking = useCallback((next: Making | null) => {
    const value = next ? { ...next, startedAt: currentRef.current?.startedAt ?? Date.now() } : null;
    currentRef.current = value;
    setCurrent(value);
  }, []);
  // Called while `making` is still set, so the song keeps the moment Create was pressed.
  const setTracked = useCallback((next: Omit<Tracked, "startedAt"> | null) => {
    setTrackedState(next ? { ...next, startedAt: currentRef.current?.startedAt ?? Date.now() } : null);
  }, []);
  const making = useMemo<Making | null>(() => {
    if (!current) return null;
    const { stage, title, genre, withLyrics } = current;
    return { stage, title, genre, withLyrics };
  }, [current]);
  const startedAt = current?.startedAt ?? null;

  const requestFill = useCallback((next: Omit<PromptFill, "nonce">) => {
    setFill((current) => ({ ...next, nonce: (current?.nonce ?? 0) + 1 }));
  }, []);

  const value = useMemo<CreateValue>(
    () => ({ making, setMaking, startedAt, tracked, setTracked, fill, requestFill }),
    [making, setMaking, startedAt, tracked, setTracked, fill, requestFill],
  );
  return <CreateContext.Provider value={value}>{children}</CreateContext.Provider>;
}

/** The Create page state, or null where the form is rendered outside /create. */
export function useCreateOptional() {
  return useContext(CreateContext);
}
