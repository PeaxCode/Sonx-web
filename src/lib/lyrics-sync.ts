/**
 * Estimated timing for plain-text lyrics. Songs are stored without per-line
 * timestamps, so lines are spread over the track: a short intro and outro are
 * left free, a pause marks each new section, and longer lines get more time.
 * Good enough to follow along; not exact karaoke.
 */

export type LyricKind = "line" | "section" | "gap";

export interface TimedLyric {
  kind: LyricKind;
  text: string;
  /** Seconds. Sections and gaps share the start of the next sung line. */
  start: number;
  end: number;
}

const SECTION = /^\[(.+)\]$/;
const MIN_WEIGHT = 14;
const SECTION_PAUSE = 2.5;

export function timeLyrics(text: string, duration: number): TimedLyric[] {
  const rows = text.split("\n").map((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return { kind: "gap" as const, text: "" };
    const section = SECTION.exec(trimmed);
    return section ? { kind: "section" as const, text: section[1] } : { kind: "line" as const, text: trimmed };
  });

  const sung = rows.filter((row) => row.kind === "line");
  if (!Number.isFinite(duration) || duration <= 0 || sung.length === 0) {
    return rows.map((row) => ({ ...row, start: 0, end: 0 }));
  }

  const intro = Math.min(12, duration * 0.08);
  const outro = Math.min(10, duration * 0.06);
  // Pauses only between sections, never before the first sung line.
  let sawLine = false;
  let pauses = 0;
  for (const row of rows) {
    if (row.kind === "line") sawLine = true;
    else if (row.kind === "section" && sawLine) pauses++;
  }
  const pauseLength = Math.min(SECTION_PAUSE, (duration * 0.2) / Math.max(pauses, 1));
  const singing = Math.max(duration - intro - outro - pauses * pauseLength, duration * 0.5);
  const totalWeight = sung.reduce((sum, row) => sum + Math.max(row.text.length, MIN_WEIGHT), 0);

  let clock = intro;
  sawLine = false;
  const timed: TimedLyric[] = rows.map((row) => {
    if (row.kind === "line") {
      sawLine = true;
      const length = (Math.max(row.text.length, MIN_WEIGHT) / totalWeight) * singing;
      const line = { ...row, start: clock, end: clock + length };
      clock += length;
      return line;
    }
    if (row.kind === "section" && sawLine) clock += pauseLength;
    return { ...row, start: clock, end: clock };
  });
  return timed;
}

/** Index of the sung line playing at `time`, or -1 before the first one. */
export function activeLyricIndex(lines: TimedLyric[], time: number) {
  let active = -1;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.kind !== "line") continue;
    if (time >= line.start) active = index;
    else break;
  }
  return active;
}
