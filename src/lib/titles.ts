// Working titles for songs the user did not name. The lyrics writer's own
// title wins when it sends one; otherwise the opening phrase of the prompt.

const MAX_WORDS = 7;
const MAX_LENGTH = 32;

// The title is the subject of the prompt; these start the part that describes how it sounds.
const CLAUSE_BREAKS = [
  "in the style of", "in the style", "sung like", "sounding like", "that sounds like",
  "with", "for", "featuring", "feat", "ft", "using", "like", "that", "which", "where", "but",
];

// Never the last word of a title ("Breakup Song In The Style Of").
const DANGLING = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "by", "with", "about", "from", "into", "my", "your", "our", "its", "is",
]);
const LOWERCASE = new Set(["a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "by", "with", "from", "into"]);

function capitalize(word: string, first: boolean) {
  if (!first && LOWERCASE.has(word.toLowerCase())) return word.toLowerCase();
  // Keep words the user wrote in capitals (R&B, EDM, NYC) as they are.
  if (word.length > 1 && word === word.toUpperCase()) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** "A slow R&B love song with a soulful voice" -> "Slow R&B Love Song". */
export function titleFromPrompt(prompt: string): string {
  // Letters, digits and the joiners inside words (R&B, don't, lo-fi) survive; other punctuation ends the phrase.
  const phrase = prompt.trim().split(/[.,;:!?()\n"“”]/)[0] ?? "";
  const words = phrase.split(/\s+/).map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
  // "A pop song about falling in love" is named for what it is about.
  const about = words.findIndex((word, index) => index >= 1 && word.toLowerCase() === "about");
  if (about !== -1 && about < words.length - 1) words.splice(0, about + 1);
  if (words.length > 1 && /^(a|an|the)$/i.test(words[0])) words.shift();

  const lower = words.map((word) => word.toLowerCase());
  let end = words.length;
  for (const marker of CLAUSE_BREAKS) {
    const parts = marker.split(" ");
    // Only after two words, so "With You Tonight" stays whole.
    for (let index = 2; index <= lower.length - parts.length; index++) {
      if (parts.every((part, offset) => lower[index + offset] === part)) {
        end = Math.min(end, index);
        break;
      }
    }
  }

  const kept: string[] = [];
  for (const word of words.slice(0, end)) {
    if (kept.length === MAX_WORDS || (kept.length >= 3 && [...kept, word].join(" ").length > MAX_LENGTH)) break;
    kept.push(word);
  }
  while (kept.length > 1 && DANGLING.has(kept[kept.length - 1].toLowerCase())) kept.pop();
  return kept.map((word, index) => capitalize(word, index === 0)).join(" ");
}

/** The first sung line of a lyric sheet, skipping section labels like [Verse 1]. */
export function titleFromLyrics(lyrics: string): string {
  const line = lyrics.split("\n").map((item) => item.trim()).find((item) => item && !/^[[(].*[\])]$/.test(item) && !/^(verse|chorus|bridge|intro|outro|hook|pre-chorus)\b/i.test(item));
  return line ? titleFromPrompt(line) : "";
}

/** A title the writer sent back, if it is a usable one. */
export function cleanTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  const title = value.replace(/\s+/g, " ").replace(/^["'“”]+|["'“”]+$/g, "").trim();
  return title.length > 0 && title.length <= 80 ? title : "";
}
