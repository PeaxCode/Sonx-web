import { getSupabase } from "@/lib/supabase/client";

// Preset profile pictures. The files live in public/images/avatars (drawn by scripts/avatars.mjs)
// and are saved as getsonx.com URLs, which the database's avatar rule already accepts.

export const PRESET_AVATAR_BASE = "https://getsonx.com/images/avatars/";

export const PRESET_AVATARS = [
  { id: "vinyl", label: "Vinyl" },
  { id: "cassette", label: "Cassette" },
  { id: "beat-blob", label: "Beat blob" },
  { id: "mic", label: "Microphone" },
  { id: "note", label: "Music note" },
  { id: "speaker", label: "Speaker" },
  { id: "guitar", label: "Guitar" },
  { id: "drum", label: "Drum" },
  { id: "boombox", label: "Boombox" },
  { id: "synth", label: "Synth" },
  { id: "dj-cat", label: "DJ cat" },
  { id: "alien", label: "Alien" },
  { id: "ghost", label: "Ghost" },
  { id: "popstar", label: "Pop star" },
  { id: "metronome", label: "Metronome" },
  { id: "sax", label: "Saxophone" },
] as const;

export const presetAvatarUrl = (id: string) => `${PRESET_AVATAR_BASE}${id}.svg`;

/** A new profile's picture when the sign-in account has none (Apple, email). */
export const randomPresetAvatar = () => presetAvatarUrl(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)].id);

/**
 * The address to load an avatar from. Preset avatars load from this site's own copy, so they
 * show on localhost and preview deploys too; every other URL is returned unchanged.
 */
export const avatarSrc = (url: string) =>
  url.startsWith(PRESET_AVATAR_BASE) ? `/images/avatars/${url.slice(PRESET_AVATAR_BASE.length)}` : url;

// Uploaded pictures ----------------------------------------------------------------------
// Users write their own files to the public profile-images bucket as <user id>-<random>.<ext>
// (Storage policies and save_profile enforce the name; Sonx-mobile migration 20261126000001).

const UPLOAD_BUCKET = "profile-images";
const UPLOAD_SIZE = 512;
/** Larger originals are refused before decoding; the stored file is a 512 px square. */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const uploadBase = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${UPLOAD_BUCKET}/`;

/** The bucket file name when `url` is one of the user's own uploads (any user's, by its shape). */
const uploadName = (url: string | null | undefined) => {
  if (!url?.startsWith(uploadBase())) return null;
  const name = url.slice(uploadBase().length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9]{8,32}\.(jpg|png|webp)$/.test(name) ? name : null;
};

export const isUploadedAvatar = (url: string | null | undefined) => uploadName(url) !== null;

/**
 * Centre-crops an image file to a 512 px square and re-encodes it (WebP where the browser can,
 * JPEG otherwise). Re-encoding also drops EXIF data such as the photo's location.
 */
export async function squareAvatar(file: File): Promise<Blob> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That image is too large. Pick one under 15 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That file could not be read as an image. Try a JPG, PNG or WebP.");
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = UPLOAD_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the image.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, UPLOAD_SIZE, UPLOAD_SIZE);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  // Browsers without a WebP encoder return PNG instead; JPEG is far smaller then.
  const webp = await encode("image/webp");
  const blob = webp?.type === "image/webp" ? webp : await encode("image/jpeg");
  if (!blob) throw new Error("Your browser could not prepare the image.");
  return blob;
}

/** Uploads a prepared picture and returns its public URL. */
export async function uploadAvatar(blob: Blob): Promise<string> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to upload a picture.");
  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const name = `${user.id}-${random}.${extension}`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(name, blob, { contentType: blob.type, cacheControl: "31536000" });
  if (error) {
    // Row-level security refuses a sixth file; the web removes old ones, so this is rare.
    throw new Error(/row-level security|policy/i.test(error.message)
      ? "You have too many saved pictures. Try again in a moment."
      : "Your picture could not be uploaded. Try again.");
  }
  return `${uploadBase()}${name}`;
}

/** Removes one of the user's uploaded pictures; other URLs and failures are ignored. */
export async function deleteUploadedAvatar(url: string | null | undefined): Promise<void> {
  const name = uploadName(url);
  if (name) await getSupabase().storage.from(UPLOAD_BUCKET).remove([name]).catch(() => undefined);
}
