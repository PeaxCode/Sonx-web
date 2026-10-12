import { getSupabase } from "@/lib/supabase/client";

const BUCKET = "ai-uploads";
// Long enough for the provider to fetch the file; uploads are removed after
// ten minutes by the cleanup-ai-uploads function.
const SIGNED_URL_TTL_SECONDS = 600;

const folderFor = (mimeType: string) => (mimeType.startsWith("image/") ? "images" : "audio");

/**
 * Uploads a temporary provider input to the user's own folder (Storage RLS
 * requires `<userId>/<images|audio>/...`) and returns a short-lived signed URL.
 */
export async function uploadForGeneration(file: Blob, extension: string): Promise<string> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to upload files.");

  const path = `${user.id}/${folderFor(file.type)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signError || !data) throw new Error("The uploaded file could not be shared with the generator.");
  return data.signedUrl;
}
