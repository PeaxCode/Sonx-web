// Sonx's own (house) accounts and their published songs on Explore.
// The M9 examples live in /public/samples; the songs generated for the house
// accounts live in /public/samples/house. Titles of vocal songs come from the
// lyrics writer (generate.mjs records them); instrumentals are named here.

export const HOUSE_ACCOUNTS = [
  { handle: "sonx-originals", name: "Sonx Originals", bio: "Songs made by the Sonx team with Sonx. Pop, R&B and everything with a chorus." },
  { handle: "sonx-lofi-lab", name: "Sonx Lo-fi Lab", bio: "Calm instrumentals made with Sonx, for studying, reading and rainy days." },
  { handle: "sonx-beats", name: "Sonx Beats", bio: "Hip-hop, EDM and afrobeat made with Sonx. Turn it up." },
  { handle: "sonx-live-room", name: "Sonx Live Room", bio: "Guitars, drums and voices: country, indie, blues and loud rock, made with Sonx." },
];

// New songs for the house accounts (generate.mjs). Genre ids are from GENRES in billing-config.
export const NEW_SONGS = [
  { slug: "pop-golden-hour", genre: "pop", voice: "female vocals", topic: "driving with the windows down at golden hour, feeling free and in love with life", cover: "a convertible on a coastal road at golden hour, warm sun flare, palm trees, nostalgic film photo" },
  { slug: "rnb-slow-dance", genre: "rnb", voice: "male vocals", topic: "a slow dance in the kitchen at midnight with the one you love", cover: "a dim kitchen lit by candles and a fridge light, two shadows dancing, warm amber tones" },
  { slug: "latin-verano", genre: "latin", voice: "female vocals", topic: "a hot summer night of dancing by the sea, sun-kissed and carefree", cover: "colorful dancers on a seaside promenade at night, string lights, vibrant red and orange tones" },
  { slug: "reggae-island-time", genre: "reggae", voice: "male vocals", topic: "slowing down on island time, good friends and no worries", cover: "a hammock between palm trees on a quiet beach, turquoise water, relaxed sunny afternoon" },
  { slug: "country-front-porch", genre: "country", voice: "female vocals", topic: "summer evenings on the front porch with family, fireflies and sweet tea", cover: "a wooden front porch at dusk with rocking chairs, fireflies glowing over a field, warm light" },
  { slug: "indie-paper-planes", genre: "indie", voice: "male vocals", topic: "growing up, old friends and paper planes thrown from a rooftop", cover: "paper planes floating over a city rooftop at sunrise, soft pastel sky, dreamy grain" },
  { slug: "blues-midnight-train", genre: "blues", voice: "male vocals", topic: "waiting for the midnight train after losing everything, but still hoping", cover: "an empty train platform at night under a single lamp, rain on the tracks, deep blue tones" },
  { slug: "metal-iron-sky", genre: "metal", voice: "male vocals", topic: "standing strong against a storm, refusing to break", cover: "lightning splitting a dark stormy sky over jagged mountains, dramatic and powerful" },
  { slug: "punk-no-sleep", genre: "punk", voice: "female vocals", topic: "a loud, fast anthem about skipping sleep to play shows with your best friends", cover: "a sweaty basement gig, a blurry crowd jumping under red lights, raw energetic photo" },
  { slug: "lofi-night-bus", genre: "lofi", title: "Night Bus Home", instrumental: "Slow lo-fi hip-hop beat, dusty drums, warm Rhodes chords, city rain and distant traffic, late-night bus ride mood", cover: "the inside of a night bus with rain-streaked windows and blurred city lights, cozy illustrated style" },
  { slug: "jazz-blue-cafe", genre: "jazz", title: "Blue Café", instrumental: "Smooth late-night jazz trio, brushed drums, walking upright bass and gentle piano, cozy café atmosphere", cover: "a small jazz café at night, a piano and upright bass on a tiny stage, blue and gold light" },
  { slug: "folk-cabin-morning", genre: "folk", title: "Cabin Morning", instrumental: "Warm acoustic folk instrumental, fingerpicked guitar, soft violin and birdsong, peaceful morning in the woods", cover: "a wooden cabin in a misty pine forest at sunrise, smoke from the chimney, soft golden light" },
  { slug: "edm-neon-pulse", genre: "edm", title: "Neon Pulse", instrumental: "Driving progressive house track, pulsing bass, shimmering arpeggios and a huge euphoric drop, 126 BPM", cover: "abstract neon light trails in magenta and cyan over a dark city highway, motion and speed" },
  { slug: "hiphop-boom-bap", genre: "hiphop", title: "Corner Store Beat", instrumental: "Classic boom bap hip-hop instrumental, crunchy drums, jazzy sample chops and deep bass, head-nodding groove", cover: "a corner store at night with a glowing neon sign, wet street reflections, gritty urban photo" },
];

// Which account publishes which song. Paths are relative to /public.
const m9 = (slug) => ({ slug, dir: "samples" });
const house = (slug) => ({ slug, dir: "samples/house" });

export const PUBLISHED = {
  "sonx-originals": [m9("pop-bonfire"), m9("rnb-late-night"), m9("kpop-own-stage"), m9("rock-starting-over"), house("pop-golden-hour"), house("rnb-slow-dance"), house("latin-verano")],
  "sonx-lofi-lab": [m9("lofi-rainy-study"), m9("classical-new-dawn"), house("lofi-night-bus"), house("jazz-blue-cafe"), house("folk-cabin-morning")],
  "sonx-beats": [m9("hiphop-city"), m9("edm-sunrise"), m9("afrobeat-city-lights"), house("edm-neon-pulse"), house("hiphop-boom-bap"), house("reggae-island-time")],
  "sonx-live-room": [m9("country-dirt-road"), house("country-front-porch"), house("indie-paper-planes"), house("blues-midnight-train"), house("metal-iron-sky"), house("punk-no-sleep")],
};
