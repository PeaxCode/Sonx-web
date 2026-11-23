"use client";

import { useEffect, useRef } from "react";
import { useFeedback } from "./feedback";
import { useLibrary } from "./library";
import { usePlayer } from "./player";

/** Tells the user when a song they are waiting for is ready, on whatever page they are, with one tap to play. */
export function ReadyAlerts() {
  const { finished } = useLibrary();
  const { notify } = useFeedback();
  const { play } = usePlayer();
  const announced = useRef(new Set<string>());

  useEffect(() => {
    const latest = finished.at(-1);
    if (!latest || announced.current.has(latest.id)) return;
    announced.current.add(latest.id);
    if (latest.status === "completed" && latest.output_url && latest.feature !== "AI_MUSIC_VIDEO") {
      notify(`“${latest.title}” is ready.`, "info", { label: "Play", onClick: () => play(latest) });
    } else if (latest.status === "failed") {
      notify(`“${latest.title}” did not work. Your song was refunded, so try again.`, "error");
    }
  }, [finished, notify, play]);

  return null;
}
