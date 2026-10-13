// A song draft survives the OAuth round trip in sessionStorage, so signing in
// never loses what someone typed. The home hero and the create form share it.
export type DraftMode = "describe" | "lyrics";
export type DraftVoice = "random" | "female" | "male";

export interface Draft {
  mode: DraftMode;
  prompt: string;
  lyrics: string;
  instrumental: boolean;
  voice: DraftVoice;
  genre: string;
  title: string;
}

const DRAFT_KEY = "sonx:music-draft";

export function saveDraft(draft: Draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Without storage the visitor signs in and retypes; nothing else depends on it.
  }
}

/** Reads and clears the draft. */
export function takeDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    sessionStorage.removeItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
