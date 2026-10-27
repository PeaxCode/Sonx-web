// Home page copy. Answers describe how Sonx actually behaves today.

export const WAYS = [
  {
    href: "/create",
    image: "/images/feature-song.png",
    title: "Songs from a sentence",
    text: "Describe a mood, a moment or a story. Sonx writes the lyrics, picks the voice and produces the track.",
  },
  {
    href: "/create",
    image: "/images/feature-lyrics.png",
    title: "Lyrics written for you",
    text: "Bring your own words or start from a topic and edit what comes back.",
  },
  // Hidden pending payment provider review:
  // {
  //   href: "/video",
  //   image: "/images/feature-video.png",
  //   title: "Music videos from a photo",
  //   text: "Pick a portrait and a song. The photo sings along.",
  // },
];

export const STARTERS = [
  { label: "Lo-fi to study to", prompt: "A calm lo-fi beat for a late study session, soft rain and warm keys" },
  { label: "Pop about summer love", prompt: "An upbeat pop song about falling in love on a summer trip" },
  { label: "Rock anthem for game day", prompt: "A loud rock anthem for game day with a chant-along chorus" },
  { label: "Jazz for a rainy café", prompt: "Smooth jazz for a rainy afternoon in a small café" },
  { label: "EDM for a night out", prompt: "An energetic EDM track for getting ready for a night out" },
  { label: "Afrobeat beach party", prompt: "A sunny afrobeat song for a beach party with friends" },
  { label: "R&B slow jam", prompt: "A slow R&B love song with a smooth, soulful voice" },
  { label: "Country road trip", prompt: "A feel-good country song about a road trip with old friends" },
];

export const FAQ = [
  {
    question: "How much does Sonx cost?",
    answer:
      "Your first instrumental and your first song with vocals are free. After that, subscribe or buy credits in the Sonx app. Your plan works on the web as soon as you sign in with the same account.",
  },
  {
    question: "Do I need the app to use the website?",
    answer:
      "No. You can create, play and download songs on the web. For now, subscriptions and credits are bought in the app.",
  },
  {
    question: "How long does a song take?",
    answer:
      "Usually about a minute. You can leave the page while it works; the result waits in your library.",
  },
  {
    question: "Are my songs the same on my phone?",
    answer:
      "Yes. Sign in to the Sonx app with the same account you use here and your songs, credits and plan are shared between the two.",
  },
  {
    question: "Can I download what I make?",
    answer: "Yes. Songs download as MP3, straight from your library.",
  },
  {
    question: "Can I use my own lyrics?",
    answer:
      "Yes. Choose My lyrics and paste them in, or type a topic and let Sonx write the lyrics for you to edit.",
  },
  // Hidden with music video, pending payment provider review:
  // {
  //   question: "What photo works best for a music video?",
  //   answer:
  //     "A clear portrait with one face looking at the camera, in good light. The photo sings along to the part of the song you pick.",
  // },
  {
    question: "How do I delete my account?",
    answer:
      "Open Account and choose Delete account. Your songs and credits are removed everywhere, including the app. Subscriptions are billed by the App Store or Google Play, so cancel yours there to stop future charges.",
  },
];
