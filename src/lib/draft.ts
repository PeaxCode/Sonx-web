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

// A prompt handed over by link (?prompt=) stays here until the visitor creates
// with it, so a sign-in that returns to the home page still shows it.
const LINKED_PROMPT_KEY = "sonx:linked-prompt";

export function saveLinkedPrompt(prompt: string | null) {
  try {
    if (prompt) sessionStorage.setItem(LINKED_PROMPT_KEY, prompt);
    else sessionStorage.removeItem(LINKED_PROMPT_KEY);
  } catch {
    // Without storage the prompt only lives in the box.
  }
}

export function readLinkedPrompt(): string | null {
  try {
    return sessionStorage.getItem(LINKED_PROMPT_KEY);
  } catch {
    return null;
  }
}

// The Journal post a visitor came from, kept until they press Create so that
// press can be credited to it (create_from_blog), even across a sign-in.
const BLOG_SOURCE_KEY = "sonx:blog-source";

export function saveBlogSource(slug: string) {
  try {
    sessionStorage.setItem(BLOG_SOURCE_KEY, slug);
  } catch {
    // Without storage the press just isn't credited to the post.
  }
}

/** Reads and clears the post. */
export function takeBlogSource(): string | null {
  try {
    const slug = sessionStorage.getItem(BLOG_SOURCE_KEY);
    sessionStorage.removeItem(BLOG_SOURCE_KEY);
    return slug;
  } catch {
    return null;
  }
}
