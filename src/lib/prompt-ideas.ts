// Starting points under the song list on Create, for visitors and new accounts.
// A tap fills the form; genre values are ids from GENRES in billing-config.

export interface PromptIdea {
  label: string;
  prompt: string;
  genre: string;
  instrumental?: boolean;
}

export const PROMPT_IDEAS: PromptIdea[] = [
  {
    label: "Birthday song for a friend",
    prompt: "A joyful birthday song for my best friend, full of inside jokes, warm memories and a chorus everyone can sing along to",
    genre: "pop",
  },
  {
    label: "Late-night road trip",
    prompt: "Driving down an empty highway at midnight with the windows down, city lights fading behind, a dreamy and hopeful chorus",
    genre: "indie",
  },
  {
    label: "Beats to study to",
    prompt: "Calm lo-fi beat for studying, soft vinyl crackle, mellow piano chords and a slow, steady groove",
    genre: "lofi",
    instrumental: true,
  },
  {
    label: "Moving on after a breakup",
    prompt: "A breakup song about finally letting go and feeling free again, bittersweet verses and a powerful, uplifting chorus",
    genre: "rnb",
  },
  {
    label: "First dance at a wedding",
    prompt: "A tender love song for a first dance at our wedding, about growing old together, gentle acoustic guitar and strings",
    genre: "country",
  },
  {
    label: "Workout hype track",
    prompt: "High-energy workout anthem about pushing past your limits, heavy drops, punchy drums and a chant-along hook",
    genre: "edm",
  },
];
