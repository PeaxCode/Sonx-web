import type { Generation } from "@/lib/generations";

/*
 * MOCK DATA for the Explore page while there is no public feed. The titles,
 * artists and counts are invented, and every track plays one of the two bundled
 * sample recordings. The artists are fictional: their portraits are AI-generated
 * (public/artists, made with Flux 3) and match no real person. Replace with a
 * real query (public generations and profiles) before launch.
 */

export interface ExploreArtist {
  handle: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  followers: number;
}

export interface ExploreTrack extends Generation {
  artist: string;
  artistHandle: string;
  plays: number;
  likes: number;
}

export interface ExploreSection {
  id: string;
  title: string;
  tracks: ExploreTrack[];
}

const AUDIO = { vocals: "/samples/midnight-wanderer.mp3", instrumental: "/samples/stable-diffusion-beats.mp3" };

const artist = (handle: string, name: string, location: string, followers: number, bio: string): ExploreArtist =>
  ({ handle, name, avatar: `/artists/${handle}.jpg`, location, bio, followers });

export const ARTISTS: ExploreArtist[] = [
  artist("mira-wav", "mira.wav", "Seoul", 48_200, "Bedroom pop at 2am. Neon lights, soft synths, louder feelings."),
  artist("tomasz-k", "Tomasz K", "Gdańsk", 21_700, "Indie songs about harbors, trains and people who left."),
  artist("lunarloop", "lunarloop", "Toronto", 18_900, "Loops that never quite land. EDM for headphones."),
  artist("okeke", "Okeke", "Lagos", 15_300, "R&B for golden hour. Writing what I can't say out loud."),
  artist("nightshift", "nightshift", "Los Angeles", 12_800, "Rock for empty freeways after midnight."),
  artist("juniper-ray", "Juniper Ray", "Portland", 11_400, "Lo-fi mornings, plants on the windowsill, tea going cold."),
  artist("bex-moreno", "Bex Moreno", "Madrid", 9_600, "Three chords, loud amps, no apologies."),
  artist("solenne", "solenne", "Martinique", 63_100, "Latin and zouk for long summers. Sun first, then everything else."),
  artist("kayo", "KAYO", "Atlanta", 57_400, "Run it back. Hip-hop from the passenger seat."),
  artist("haneul", "haneul", "Seoul", 44_900, "K-pop for rainy streets and umbrellas."),
  artist("femi-ade", "Femi Ade", "Lagos", 36_200, "Afrobeat for the hours after dark."),
  artist("aster", "Aster", "Stockholm", 24_800, "Cold synths, warm drops."),
  artist("hollis-and-june", "Hollis & June", "Nashville", 19_300, "A duo writing country songs on a porch, one chorus at a time."),
  artist("the-late-set", "The Late Set", "New Orleans", 14_100, "Four of us, one basement, a lot of brass."),
  artist("deskplants", "deskplants", "Osaka", 71_500, "Study beats from a desk full of tiny plants."),
  artist("nova-field", "Nova Field", "Mumbai", 26_600, "Modern classical for deep work."),
  artist("harbor-lights", "harbor lights", "Galway", 22_300, "Slow lo-fi from the coast."),
  artist("mosswood", "Mosswood", "Vermont", 17_800, "Folk instrumentals from a cabin in the woods."),
  artist("ivo", "Ivo", "Zagreb", 13_200, "Night shift keys. Jazz piano when the club empties out."),
  artist("spacebar", "spacebar", "Istanbul", 10_900, "EDM made between game sessions."),
];

const artistByName = new Map(ARTISTS.map((entry) => [entry.name, entry]));

let counter = 0;
const track = (title: string, artist: string, genre: string, vocals: boolean, plays: number, likes: number): ExploreTrack => {
  counter += 1;
  const id = `explore_mock_${counter}`;
  return {
    id,
    client_request_id: id,
    feature: vocals ? "LYRICS_MUSIC" : "PROMPT_MUSIC",
    title,
    genre,
    prompt: null,
    lyrics: null,
    status: "completed",
    output_url: vocals ? AUDIO.vocals : AUDIO.instrumental,
    error: null,
    is_favorite: false,
    created_at: "2026-11-01T00:00:00.000Z",
    completed_at: "2026-11-01T00:00:00.000Z",
    // Not a row in anyone's library: hides favorite and delete.
    is_sample: true,
    artist,
    artistHandle: artistByName.get(artist)!.handle,
    plays,
    likes,
  };
};

export const EXPLORE_SECTIONS: ExploreSection[] = [
  {
    id: "picks",
    title: "Staff picks",
    tracks: [
      track("Neon Lullaby", "mira.wav", "pop", true, 182_400, 9_120),
      track("Glass Harbor", "Tomasz K", "indie", true, 96_300, 4_410),
      track("Paper Satellites", "lunarloop", "edm", false, 74_900, 3_870),
      track("Sunday Static", "Okeke", "rnb", true, 61_200, 2_960),
      track("Velvet Freeway", "nightshift", "rock", true, 55_800, 2_310),
      track("Cloud Atlas Drive", "Juniper Ray", "lofi", false, 48_100, 1_980),
      track("Golden Hour Riot", "Bex Moreno", "punk", true, 39_700, 1_640),
    ],
  },
  {
    id: "trending",
    title: "Trending this week",
    tracks: [
      track("Heatwave Postcard", "solenne", "latin", true, 241_000, 12_800),
      track("Run It Back", "KAYO", "hiphop", true, 198_500, 10_100),
      track("Seoul Rain", "haneul", "kpop", true, 156_200, 8_330),
      track("Lagos After Dark", "Femi Ade", "afrobeat", true, 133_900, 6_720),
      track("Tidal Memory", "Aster", "edm", false, 102_400, 5_050),
      track("Porch Light Waltz", "Hollis & June", "country", true, 87_600, 3_990),
      track("Brass in the Basement", "The Late Set", "jazz", false, 66_300, 2_870),
    ],
  },
  {
    id: "focus",
    title: "Instrumentals to focus",
    tracks: [
      track("Library at 3am", "deskplants", "lofi", false, 312_000, 14_200),
      track("Quiet Algorithm", "Nova Field", "classical", false, 144_700, 6_110),
      track("Slow Tide", "harbor lights", "lofi", false, 121_300, 5_480),
      track("Rain on Tin", "Mosswood", "folk", false, 98_800, 4_020),
      track("Night Shift Keys", "Ivo", "jazz", false, 77_100, 3_330),
      track("Orbit Study", "spacebar", "edm", false, 59_400, 2_610),
    ],
  },
];

/** Genre playlists ("Best of ..."), each a gradient mesh in two colours. */
export const GENRE_PLAYLISTS = [
  { genre: "pop", name: "Pop", songs: 24, colors: ["#ff4fd8", "#7b5cff"] },
  { genre: "hiphop", name: "Hip-hop", songs: 22, colors: ["#ff7a59", "#8e1f5b"] },
  { genre: "lofi", name: "Lo-fi", songs: 30, colors: ["#5ad1c6", "#2c3e8f"] },
  { genre: "edm", name: "EDM", songs: 19, colors: ["#3cf2ff", "#6a2cff"] },
  { genre: "rnb", name: "R&B", songs: 21, colors: ["#ffb36b", "#c2185b"] },
  { genre: "jazz", name: "Jazz", songs: 18, colors: ["#ffd166", "#d1495b"] },
  { genre: "rock", name: "Rock", songs: 20, colors: ["#ff5a5a", "#2b1055"] },
  { genre: "kpop", name: "K-pop", songs: 23, colors: ["#ff9de2", "#5b8cff"] },
];

export const ALL_EXPLORE_TRACKS = EXPLORE_SECTIONS.flatMap((section) => section.tracks);

/** More songs per artist, shown on their profile only. */
const CATALOG: ExploreTrack[] = [
  track("Pillow Talk Static", "mira.wav", "pop", true, 88_100, 4_020),
  track("2AM Group Chat", "mira.wav", "pop", true, 64_700, 3_150),
  track("Last Ferry Home", "Tomasz K", "indie", true, 41_200, 1_870),
  track("Amber Windows", "Tomasz K", "indie", true, 28_900, 1_240),
  track("Moon Phase Error", "lunarloop", "edm", false, 52_300, 2_410),
  track("Echo Garden", "lunarloop", "edm", false, 33_800, 1_520),
  track("Slow Burn Lagos", "Okeke", "rnb", true, 38_400, 1_760),
  track("Say It Twice", "Okeke", "rnb", true, 22_100, 980),
  track("Exit 47", "nightshift", "rock", true, 31_600, 1_340),
  track("Taillight Hymn", "nightshift", "rock", true, 19_200, 820),
  track("Windowsill Tea", "Juniper Ray", "lofi", false, 36_500, 1_610),
  track("Sunbeam Dust", "Juniper Ray", "lofi", false, 24_700, 1_050),
  track("Kitchen Floor Pogo", "Bex Moreno", "punk", true, 21_800, 940),
  track("No Encore", "Bex Moreno", "punk", true, 14_300, 610),
  track("Mango Season", "solenne", "latin", true, 167_200, 8_440),
  track("Salt on My Shoulders", "solenne", "latin", true, 98_600, 4_920),
  track("Passenger Side", "KAYO", "hiphop", true, 121_900, 6_030),
  track("Tinted", "KAYO", "hiphop", true, 84_300, 4_110),
  track("Umbrella Weather", "haneul", "kpop", true, 102_700, 5_380),
  track("Hongdae Lights", "haneul", "kpop", true, 69_500, 3_440),
  track("Danfo Groove", "Femi Ade", "afrobeat", true, 77_800, 3_820),
  track("Island Nights", "Femi Ade", "afrobeat", true, 51_200, 2_390),
  track("Cold Front", "Aster", "edm", false, 61_900, 2_870),
  track("White Nights", "Aster", "edm", false, 39_400, 1_760),
  track("Screen Door Song", "Hollis & June", "country", true, 46_300, 2_080),
  track("Two Lanes, One Radio", "Hollis & June", "country", true, 29_800, 1_310),
  track("Basement Strut", "The Late Set", "jazz", false, 34_700, 1_490),
  track("Last Call Shuffle", "The Late Set", "jazz", false, 21_600, 930),
  track("Fern Notes", "deskplants", "lofi", false, 204_500, 9_310),
  track("Succulent Sundays", "deskplants", "lofi", false, 148_200, 6_720),
  track("Pomodoro", "deskplants", "lofi", false, 96_400, 4_380),
  track("Morning Raga Study", "Nova Field", "classical", false, 72_100, 3_090),
  track("Monsoon Etude", "Nova Field", "classical", false, 48_600, 2_070),
  track("Pier at Dusk", "harbor lights", "lofi", false, 64_300, 2_850),
  track("Fog Horn Lullaby", "harbor lights", "lofi", false, 41_900, 1_820),
  track("Cabin Smoke", "Mosswood", "folk", false, 49_200, 2_110),
  track("Birch & Rain", "Mosswood", "folk", false, 31_500, 1_330),
  track("Closing Time Blues", "Ivo", "jazz", false, 42_800, 1_840),
  track("Adriatic Night", "Ivo", "jazz", false, 27_300, 1_160),
  track("Respawn", "spacebar", "edm", false, 35_100, 1_520),
  track("Low Ping", "spacebar", "edm", false, 22_700, 960),
];

export const findArtist = (handle: string) => ARTISTS.find((entry) => entry.handle === handle);

/** Every song by an artist, most played first. */
export const tracksBy = (handle: string) =>
  [...ALL_EXPLORE_TRACKS, ...CATALOG].filter((entry) => entry.artistHandle === handle).sort((a, b) => b.plays - a.plays);
