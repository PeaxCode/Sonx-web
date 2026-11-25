// Sonx's own (house) artists and their published songs on Explore.
// The M9 examples live in /public/samples; the songs generated for the house
// accounts live in /public/samples/house. Titles of vocal songs come from the
// lyrics writer (generate.mjs records them); instrumentals are named here.

// Artists on Explore (is_house in the database). Bios are about the music, never a
// person; avatars are abstract artwork (scripts/house/avatars.mjs), never faces.
// `email` keeps the four original house users; the others are new support+ aliases.
export const ARTISTS = [
  { handle: "nightdrive", name: "Nightdrive", email: "support+originals@getsonx.com", bio: "Late-night pop for open windows and empty highways. Made with Sonx.", avatar: "neon synthwave sunset over an empty highway, abstract shapes, purple and pink glow" },
  { handle: "velvet-hours", name: "Velvet Hours", email: "support+velvet-hours@getsonx.com", bio: "Slow R&B for the hours after midnight. Made with Sonx.", avatar: "abstract flowing velvet fabric in deep burgundy with soft golden light, moody and smooth" },
  { handle: "juniper-lane", name: "Juniper Lane", email: "support+juniper-lane@getsonx.com", bio: "Porch-light country and fingerpicked folk. Made with Sonx.", avatar: "a single juniper tree on a rolling hill at golden hour, warm painterly illustration" },
  { handle: "rooftop-static", name: "Rooftop Static", email: "support+live-room@getsonx.com", bio: "Loud guitars, fast drums, songs about leaving. Made with Sonx.", avatar: "abstract torn paper collage of a city skyline with static noise texture, bold red and black" },
  { handle: "mara-sol", name: "Mara Sol", email: "support+mara-sol@getsonx.com", bio: "Latin, afrobeat and island rhythms for long summers. Made with Sonx.", avatar: "abstract sun over a turquoise sea in bold flat shapes, warm orange and teal, risograph print style" },
  { handle: "lowlight-tapes", name: "Lowlight Tapes", email: "support+lofi-lab@getsonx.com", bio: "Lo-fi, jazz and quiet piano for reading and rain. Made with Sonx.", avatar: "a stack of cassette tapes with blank labels glowing under a desk lamp, cozy illustrated lo-fi style" },
  { handle: "kilo-nine", name: "Kilo Nine", email: "support+beats@getsonx.com", bio: "Hip-hop beats and festival drops. Made with Sonx.", avatar: "abstract graffiti-inspired shapes in electric blue and yellow on dark concrete" },
  { handle: "grey-harbor", name: "Grey Harbor", email: "support+grey-harbor@getsonx.com", bio: "Blues and heavy riffs from the edge of the storm. Made with Sonx.", avatar: "a stormy grey harbor with a lone lighthouse, moody charcoal painting" },
];

export const AVATAR_BASE = "https://dfsxnkfdnyubcigcrycn.supabase.co/storage/v1/object/public/profile-images";

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

// Which artist publishes which song. Paths are relative to /public.
const m9 = (slug) => ({ slug, dir: "samples" });
const house = (slug) => ({ slug, dir: "samples/house" });

export const PUBLISHED = {
  "nightdrive": [m9("pop-bonfire"), house("pop-golden-hour"), m9("kpop-own-stage")],
  "velvet-hours": [m9("rnb-late-night"), house("rnb-slow-dance")],
  "juniper-lane": [m9("country-dirt-road"), house("country-front-porch"), house("folk-cabin-morning")],
  "rooftop-static": [house("indie-paper-planes"), m9("rock-starting-over"), house("punk-no-sleep")],
  "mara-sol": [house("latin-verano"), m9("afrobeat-city-lights"), house("reggae-island-time")],
  "lowlight-tapes": [m9("lofi-rainy-study"), house("lofi-night-bus"), house("jazz-blue-cafe"), m9("classical-new-dawn")],
  "kilo-nine": [m9("hiphop-city"), house("hiphop-boom-bap"), m9("edm-sunrise"), house("edm-neon-pulse")],
  "grey-harbor": [house("blues-midnight-train"), house("metal-iron-sky")],
};
