import type { Generation } from "@/lib/generations";

/*
 * MOCK DATA for the Explore page while there is no public feed. The titles,
 * artists and counts are invented, and every track plays one of the two bundled
 * sample recordings. Replace with a real query (public generations) before launch.
 */

export interface ExploreTrack extends Generation {
  artist: string;
  plays: number;
  likes: number;
}

export interface ExploreSection {
  id: string;
  title: string;
  tracks: ExploreTrack[];
}

const AUDIO = { vocals: "/samples/midnight-wanderer.mp3", instrumental: "/samples/stable-diffusion-beats.mp3" };

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
