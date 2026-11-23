import { callProxy, ProxyError } from "@/lib/api";
import type { Feature, Plan } from "@/lib/billing-config";
import { getSupabase } from "@/lib/supabase/client";

export type GenerationStatus = "processing" | "completed" | "failed";

/** A row of the shared `generations` table (the same library the mobile app shows). */
export interface Generation {
  id: string;
  client_request_id: string;
  feature: Feature;
  title: string;
  genre: string | null;
  prompt: string | null;
  lyrics: string | null;
  status: GenerationStatus;
  output_url: string | null;
  error: string | null;
  is_favorite: boolean;
  created_at: string;
  completed_at: string | null;
  /** Bundled example from the Sonx app, not a row in the user's library. */
  is_sample?: boolean;
  /** Real artwork when one exists (sample video thumbnails); otherwise CoverArt. */
  cover_url?: string;
}

export const MUSIC_FEATURES: Feature[] = ["PROMPT_MUSIC", "PHOTO_MUSIC", "LYRICS_MUSIC", "AI_SINGING"];

const COLUMNS =
  "id,client_request_id,feature,title,genre,prompt,lyrics,status,output_url,error,is_favorite,created_at,completed_at";

export const newRequestId = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;

/** First call on the web marks the account migrated (there is no on-device wallet). */
export async function syncBillingAccount() {
  return callProxy<ServerBilling>("billing-migrate", {});
}

export interface ServerBilling {
  isPro: boolean;
  currentPlan: Plan;
  credits: number;
  usage: Partial<Record<Feature, number>>;
  periodStart: number;
  periodEnd: number;
  /** Where the active subscription was bought: app_store, play_store, paddle... */
  store?: string | null;
  /** Manage link for that subscription (Paddle portal or store settings). */
  managementUrl?: string | null;
}

export async function fetchBilling() {
  return callProxy<ServerBilling>("billing-state");
}

/**
 * Starts a billed generation. The server picks the model, charges quota or
 * credits and returns the existing generation when the request ID repeats.
 */
export async function startGeneration(
  request: { feature: Feature; clientRequestId: string; title: string; genre?: string } & Record<string, unknown>,
): Promise<{ generationId: string; status: GenerationStatus }> {
  try {
    return await callProxy("generate", request);
  } catch (error) {
    if (!(error instanceof ProxyError) || error.code !== "billing_migration_required") throw error;
    await syncBillingAccount();
    return callProxy("generate", request);
  }
}

export async function fetchGenerations(): Promise<Generation[]> {
  const { data, error } = await getSupabase()
    .from("generations")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Generation[];
}

export async function fetchGeneration(id: string): Promise<Generation | null> {
  const { data, error } = await getSupabase().from("generations").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Generation | null;
}

/** Asks the server to check the provider when a webhook is late. */
export async function refreshGeneration(id: string) {
  return callProxy<{ status: GenerationStatus }>("generation-refresh", { generationId: id });
}

/**
 * Where the download icon points. Users' songs come through /api/download, which
 * names the file after the song; examples are on this origin, so the download
 * attribute names them.
 */
export function downloadLink(generation: Generation): { href: string; filename?: string } {
  if (generation.is_sample || !generation.output_url?.startsWith("http")) {
    return { href: generation.output_url ?? "", filename: `${generation.title}.mp3` };
  }
  return { href: `/api/download/${generation.id}` };
}

/** The public page for a shared song. */
export const songUrl = (id: string) => `${window.location.origin}/song/${id}`;

/** Makes a song readable on its public page (generations.shared_at). */
export async function shareGeneration(id: string) {
  const { error } = await getSupabase()
    .from("generations")
    .update({ shared_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setFavorite(id: string, isFavorite: boolean) {
  const { error } = await getSupabase().from("generations").update({ is_favorite: isFavorite }).eq("id", id);
  if (error) throw error;
}

export async function renameGeneration(id: string, title: string) {
  const { error } = await getSupabase().from("generations").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteGeneration(id: string) {
  const { error } = await getSupabase().from("generations").delete().eq("id", id);
  if (error) throw error;
}
