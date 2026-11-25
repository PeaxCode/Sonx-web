"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Generation } from "@/lib/generations";
import { recordPlay } from "@/lib/profiles";

interface PlayerValue {
  current: Generation | null;
  playing: boolean;
  time: number;
  duration: number;
  play: (track: Generation, queue?: Generation[]) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  /** Stops playback and hides the player. */
  close: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  /** Whether the full-screen player is open. */
  expanded: boolean;
  /** Plays the track (unless it is already the current one) and opens the full player. */
  open: (track: Generation, queue?: Generation[]) => void;
  expand: () => void;
  minimize: () => void;
}

const PlayerContext = createContext<PlayerValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Generation[]>([]);
  const [current, setCurrent] = useState<Generation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const index = current ? queue.findIndex((track) => track.id === current.id) : -1;

  const load = useCallback((track: Generation) => {
    const audio = audioRef.current;
    if (!audio || !track.output_url) return;
    setCurrent(track);
    audio.src = track.output_url;
    void audio.play().catch(() => setPlaying(false));
    // Plays from Explore and profiles (published songs, read-only rows) count once per browser
    // session; examples and the owner's own library are not counted.
    if (track.is_sample && track.published_at) recordPlay(track.id);
  }, []);

  const next = useCallback(() => {
    if (index >= 0 && index < queue.length - 1) load(queue[index + 1]);
  }, [index, queue, load]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", next);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", next);
    };
  }, [next]);

  const value = useMemo<PlayerValue>(() => ({
    current,
    playing,
    time,
    duration,
    hasNext: index >= 0 && index < queue.length - 1,
    hasPrevious: index > 0,
    expanded,
    expand: () => setExpanded(true),
    minimize: () => setExpanded(false),
    open: (track, newQueue) => {
      setQueue(newQueue ?? [track]);
      if (current?.id !== track.id) load(track);
      else if (audioRef.current?.paused) void audioRef.current.play();
      setExpanded(true);
    },
    play: (track, newQueue) => {
      setQueue(newQueue ?? [track]);
      if (current?.id === track.id) {
        const audio = audioRef.current;
        if (audio?.paused) void audio.play();
        else audio?.pause();
        return;
      }
      load(track);
    },
    toggle: () => {
      const audio = audioRef.current;
      if (!audio || !current) return;
      if (audio.paused) void audio.play();
      else audio.pause();
    },
    seek: (seconds) => {
      if (audioRef.current) audioRef.current.currentTime = seconds;
    },
    next,
    previous: () => {
      if (index > 0) load(queue[index - 1]);
    },
    close: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      setCurrent(null);
      setExpanded(false);
      setQueue([]);
      setTime(0);
      setDuration(0);
    },
  }), [current, playing, time, duration, expanded, index, queue, load, next]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside PlayerProvider");
  return value;
}
