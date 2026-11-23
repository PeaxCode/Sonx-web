import { createClient } from "@supabase/supabase-js";
import type { Feature } from "@/lib/billing-config";

/** What the public page may show of a shared song (the columns the anon role can read). */
export interface SharedSong {
  id: string;
  title: string;
  genre: string | null;
  feature: Feature;
  output_url: string;
  created_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A song its owner shared, read without any session through the
 * get_shared_song function, which returns display columns of one shared song.
 */
export async function fetchSharedSong(id: string): Promise<SharedSong | null> {
  if (!UUID.test(id)) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // One row by ID through get_shared_song; the anon role has no table access, so songs cannot be listed.
  const { data: rows, error } = await supabase.rpc("get_shared_song", { p_id: id });
  const data = Array.isArray(rows) ? rows[0] : null;
  if (error || !data?.output_url) return null;
  return data as SharedSong;
}
