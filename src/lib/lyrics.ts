import { callProxy } from "@/lib/api";
import { cleanTitle } from "@/lib/titles";

interface PredictionResponse {
  predictionID?: string;
  prediction_id?: string;
  status?: string;
  output?: unknown;
  error?: string;
  details?: string;
  message?: string;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

const firstString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === "string" && value.trim().length > 0);

function extractLyrics(output: unknown): string | undefined {
  if (typeof output === "string") return /^https?:\/\//i.test(output) ? undefined : output;
  if (Array.isArray(output)) return output.map(extractLyrics).find(Boolean);
  if (!output || typeof output !== "object") return undefined;
  const record = output as Record<string, unknown>;
  return firstString(record.lyrics, record.text, record.content, record.result)
    ?? (Array.isArray(record.choices) ? record.choices.map(extractLyrics).find(Boolean) : undefined);
}

/** The writer's own song title, when its output has one. */
function extractTitle(output: unknown): string {
  if (Array.isArray(output)) return output.map(extractTitle).find(Boolean) ?? "";
  if (!output || typeof output !== "object") return "";
  const record = output as Record<string, unknown>;
  return cleanTitle(record.title) || (Array.isArray(record.choices) ? record.choices.map(extractTitle).find(Boolean) ?? "" : "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Writes lyrics for a topic (unbilled). The create call answers "success" as
 * soon as the job is queued, so the lyrics are polled until it finishes.
 */
export async function generateLyrics(topic: string): Promise<string> {
  return (await writeLyrics(topic)).lyrics;
}

/** Lyrics plus the title the writer gave them ("" when it gave none). */
export async function writeLyrics(topic: string): Promise<{ lyrics: string; title: string }> {
  const created = await callProxy<PredictionResponse>("eachlabs-create", {
    model: "mureka-generate-lyrics",
    input: { prompt: topic },
    webhook_url: "",
  });
  const immediate = extractLyrics(created.output);
  if (immediate) return { lyrics: immediate, title: extractTitle(created.output) };

  const predictionId = created.predictionID || created.prediction_id;
  if (!predictionId) throw new Error("Lyrics could not be started. Try again.");

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    const response = await callProxy<PredictionResponse>("eachlabs-get", { predictionId });
    const status = (response.status ?? "").toLowerCase();
    if (["success", "succeeded", "completed"].includes(status)) {
      const lyrics = extractLyrics(response.output);
      if (lyrics) return { lyrics, title: extractTitle(response.output) };
      throw new Error("No lyrics came back. Try a different topic.");
    }
    if (status === "failed" || status === "error") {
      throw new Error(firstString(response.error, response.details, response.message) ?? "Lyrics generation failed.");
    }
  }
  throw new Error("Lyrics took too long. Try again.");
}
