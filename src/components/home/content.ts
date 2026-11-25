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

// A real sequence, timed the way a song usually comes together.
export const STEPS = [
  { time: "0:00", title: "Describe it", text: "A mood, a moment or a story in one sentence. Or paste your own lyrics." },
  { time: "0:05", title: "Sonx writes and sings", text: "Lyrics, voice and arrangement come together while you wait or browse." },
  { time: "2–5 min", title: "Play, download, share", text: "The song lands in your library as an MP3, on the web and in the app." },
];

// Each starter sets the genre too, so the form never says Pop under an R&B prompt.
export const STARTERS = [
  { label: "Lo-fi to study to", genre: "lofi", prompt: "A calm lo-fi beat for a late study session, soft rain and warm keys" },
  { label: "Pop about summer love", genre: "pop", prompt: "An upbeat pop song about falling in love on a summer trip" },
  { label: "Rock anthem for game day", genre: "rock", prompt: "A loud rock anthem for game day with a chant-along chorus" },
  { label: "Jazz for a rainy café", genre: "jazz", prompt: "Smooth jazz for a rainy afternoon in a small café" },
  { label: "EDM for a night out", genre: "edm", prompt: "An energetic EDM track for getting ready for a night out" },
  { label: "Afrobeat beach party", genre: "afrobeat", prompt: "A sunny afrobeat song for a beach party with friends" },
  { label: "R&B slow jam", genre: "rnb", prompt: "A slow R&B love song with a smooth, soulful voice" },
  { label: "Country road trip", genre: "country", prompt: "A feel-good country song about a road trip with old friends" },
];

export const FAQ = [
  {
    question: "How much does Sonx cost?",
    answer:
      "Creating songs needs a plan. Pro and Studio bill monthly or yearly, here or in the Sonx app, and subscribers can top up with credit packs. Listening and the AI lyrics writer are free. See Pricing for plans and prices.",
  },
  {
    question: "Do I need the app to use the website?",
    answer:
      "No. You can subscribe, buy credits, create, play and download songs on the web. The app is there when you want your songs on your phone.",
  },
  {
    question: "How long does a song take?",
    answer:
      "Usually 2 to 5 minutes. You can leave the page or keep browsing while it works; we let you know when it is ready, and it waits in your library.",
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
      "Open Account and choose Delete account. Your songs and credits are removed everywhere, including the app. Deleting does not cancel a subscription: cancel it first from Account (web plans) or in the App Store or Google Play.",
  },
];

// Real App Store reviews of the Sonx app (US storefront), quoted as written.
// Only ones about features the web has too; refresh from the App Store when updating.
export const REVIEWS = [
  { author: "Noriko_Lashondal", title: "I saved my first song", text: "Most apps like this get one try and then I delete them. I actually saved a track from this one, so yeah that says a lot." },
  { author: "Khadijah_Waitec", title: "Actually made me smile", text: "Not even gonna lie, hearing my own silly idea turn into a full song made me smile." },
  { author: "Librada Hiatt", title: "Late night prompt dump", text: "Used this when I had a random idea before bed and it turned into a full track lol. Kinda cool how fast it gives you something to hear." },
  { author: "AhmadMeadowsq", title: "Simple and still fun", text: "The app does not bury you in stuff. You get to the fun part fast, which I really like." },
  { author: "rider_hullp", title: "Better than a lot of apps like this", text: "I have tried a few song apps and a lot felt rough or slow. This one feels a lot smoother to use." },
  { author: "Hedwig Tanner", title: "Kept pressing generate", text: "I said one more time like five times. It is weirdly hard to stop once you get a result you almost like." },
];

export const APP_STORE_RATING = { value: "4.5", count: 45 };

export const FEATURES = [
  {
    image: "/images/feature-song.png",
    alt: "Illustration of a glowing AI beat machine with music notes rising from it",
    title: "A whole song from one sentence",
    text: "Describe a mood, a moment or a story. Sonx writes the lyrics, picks a voice and produces the track, in a few minutes.",
    points: ["18 genres, from lo-fi to K-pop", "Vocals or instrumental", "MP3 download for every song"],
    cta: "Describe a song",
  },
  {
    image: "/images/feature-lyrics.png",
    alt: "Illustration of a tablet showing song lyrics being written, with music notes flowing out",
    title: "Your words, sung back to you",
    text: "Paste lyrics you wrote, or start from a topic and edit what Sonx writes. Pick a male or female voice and hear it sung.",
    points: ["Write lyrics with AI for free", "Keep full control of every line", "Commercial use on paid plans"],
    cta: "Bring your lyrics",
  },
];
