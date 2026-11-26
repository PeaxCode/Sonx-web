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
