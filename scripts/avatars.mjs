// Draws the preset profile avatars into public/images/avatars/<id>.svg.
// Run with `node scripts/avatars.mjs` after editing; the ids must match src/lib/avatars.ts.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../public/images/avatars");
const INK = "#1b1530";

/** Two shiny eyes and a smile centred on (x, y); `s` scales it. */
function face(x, y, s = 1, { mouth = "smile", cheeks = "#ff8fb1" } = {}) {
  const e = 9 * s;
  const eyes = [-1, 1].map((d) => `
    <circle cx="${x + d * 22 * s}" cy="${y}" r="${e}" fill="${INK}"/>
    <circle cx="${x + d * 22 * s + 3 * s}" cy="${y - 3.5 * s}" r="${3.2 * s}" fill="#fff"/>`).join("");
  const blush = cheeks ? [-1, 1].map((d) => `<ellipse cx="${x + d * 36 * s}" cy="${y + 15 * s}" rx="${8 * s}" ry="${5 * s}" fill="${cheeks}" opacity=".55"/>`).join("") : "";
  const mouths = {
    smile: `<path d="M${x - 11 * s} ${y + 16 * s} Q${x} ${y + 28 * s} ${x + 11 * s} ${y + 16 * s}" fill="none" stroke="${INK}" stroke-width="${4.5 * s}" stroke-linecap="round"/>`,
    sing: `<ellipse cx="${x}" cy="${y + 22 * s}" rx="${8 * s}" ry="${10 * s}" fill="${INK}"/><ellipse cx="${x}" cy="${y + 27 * s}" rx="${5 * s}" ry="${4 * s}" fill="#ff6b8a"/>`,
    grin: `<path d="M${x - 14 * s} ${y + 15 * s} Q${x} ${y + 34 * s} ${x + 14 * s} ${y + 15 * s} Z" fill="${INK}"/>`,
  };
  return eyes + blush + mouths[mouth];
}

/** Headphones over a head of radius r centred on (x, y). */
function headphones(x, y, r, color) {
  return `
    <path d="M${x - r - 4} ${y + 6} A${r + 6} ${r + 6} 0 0 1 ${x + r + 4} ${y + 6}" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <path d="M${x - r - 4} ${y + 6} A${r + 6} ${r + 6} 0 0 1 ${x + r + 4} ${y + 6}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <rect x="${x - r - 20}" y="${y - 6}" width="30" height="48" rx="13" fill="${color}" stroke="${INK}" stroke-width="5"/>
    <rect x="${x + r - 10}" y="${y - 6}" width="30" height="48" rx="13" fill="${color}" stroke="${INK}" stroke-width="5"/>`;
}

const sparkle = (x, y, s, c = "#fff") =>
  `<path d="M${x} ${y - 10 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 10 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 10 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 10 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 10 * s}Z" fill="${c}"/>`;

const AVATARS = {
  vinyl: ["#ff9a8b", "#ff6a88", `
    <circle cx="128" cy="132" r="88" fill="${INK}"/>
    <circle cx="128" cy="132" r="72" fill="none" stroke="#3a3157" stroke-width="3"/>
    <circle cx="128" cy="132" r="58" fill="none" stroke="#3a3157" stroke-width="3"/>
    <circle cx="128" cy="132" r="44" fill="#ffd166"/>
    ${face(128, 124, 0.8, { cheeks: "#ff6a88" })}`],
  cassette: ["#a1c4fd", "#7f7fd5", `
    <rect x="36" y="68" width="184" height="124" rx="16" fill="#ffe08a" stroke="${INK}" stroke-width="6"/>
    <rect x="58" y="88" width="140" height="54" rx="26" fill="#fff" stroke="${INK}" stroke-width="5"/>
    <circle cx="94" cy="115" r="17" fill="${INK}"/><circle cx="99" cy="110" r="5" fill="#fff"/>
    <circle cx="162" cy="115" r="17" fill="${INK}"/><circle cx="167" cy="110" r="5" fill="#fff"/>
    <path d="M110 160 Q128 176 146 160" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M70 192 L84 170 H172 L186 192" fill="#f4c25b" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`],
  "beat-blob": ["#84fab0", "#3fbf9f", `
    <path d="M58 200 C40 120 76 62 128 62 C180 62 216 120 198 200 Z" fill="#c3f7a6" stroke="${INK}" stroke-width="6"/>
    ${headphones(128, 118, 66, "#ff6b8a")}
    ${face(128, 136, 1)}`],
  mic: ["#f6d365", "#fda085", `
    <rect x="114" y="150" width="28" height="70" rx="10" fill="#4b4370" stroke="${INK}" stroke-width="5"/>
    <circle cx="128" cy="104" r="62" fill="#d9d4ec" stroke="${INK}" stroke-width="6"/>
    <path d="M78 80 H178 M70 104 H186 M78 128 H178" stroke="#b5aed3" stroke-width="4"/>
    ${face(128, 104, 0.9, { mouth: "sing" })}`],
  note: ["#c471f5", "#fa71cd", `
    <path d="M150 50 V170" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M150 50 C180 58 196 80 200 112 C188 92 172 86 150 86" fill="${INK}"/>
    <ellipse cx="112" cy="176" rx="50" ry="40" transform="rotate(-18 112 176)" fill="#fff3b0" stroke="${INK}" stroke-width="6"/>
    ${face(110, 170, 0.8)}`],
  speaker: ["#43e97b", "#38f9d7", `
    <rect x="52" y="40" width="152" height="184" rx="20" fill="#2f2850" stroke="${INK}" stroke-width="6"/>
    <circle cx="128" cy="164" r="44" fill="#4b4370" stroke="#8a7fc0" stroke-width="5"/>
    <circle cx="128" cy="164" r="16" fill="#8a7fc0"/>
    <rect x="72" y="58" width="112" height="56" rx="14" fill="#fff"/>
    ${face(128, 78, 0.75, { cheeks: false })}`],
  guitar: ["#ff9966", "#ff5e62", `
    <rect x="118" y="20" width="20" height="96" rx="6" fill="#7a4a2a" stroke="${INK}" stroke-width="5"/>
    <rect x="110" y="14" width="36" height="22" rx="6" fill="${INK}"/>
    <path d="M128 100 C96 100 84 118 92 140 C66 148 58 188 84 214 C108 238 148 238 172 214 C198 188 190 148 164 140 C172 118 160 100 128 100Z" fill="#ffb347" stroke="${INK}" stroke-width="6"/>
    ${face(128, 168, 0.85)}
    <rect x="104" y="204" width="48" height="10" rx="5" fill="${INK}"/>`],
  drum: ["#5ee7df", "#b490ca", `
    <path d="M52 112 V184 C52 206 204 206 204 184 V112" fill="#ff6b8a" stroke="${INK}" stroke-width="6"/>
    <ellipse cx="128" cy="112" rx="76" ry="24" fill="#f6f2ff" stroke="${INK}" stroke-width="6"/>
    <path d="M64 30 L118 104 M192 30 L138 104" stroke="#a0662f" stroke-width="10" stroke-linecap="round"/>
    <circle cx="64" cy="30" r="9" fill="#f3d2a2" stroke="${INK}" stroke-width="4"/><circle cx="192" cy="30" r="9" fill="#f3d2a2" stroke="${INK}" stroke-width="4"/>
    ${face(128, 150, 0.85, { cheeks: "#fff" })}`],
  boombox: ["#fbc2eb", "#a6c1ee", `
    <path d="M78 76 C78 42 178 42 178 76" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <rect x="28" y="74" width="200" height="130" rx="18" fill="#7c5cff" stroke="${INK}" stroke-width="6"/>
    <circle cx="80" cy="146" r="34" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="80" cy="146" r="16" fill="${INK}"/><circle cx="86" cy="140" r="5" fill="#fff"/>
    <circle cx="176" cy="146" r="34" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="176" cy="146" r="16" fill="${INK}"/><circle cx="182" cy="140" r="5" fill="#fff"/>
    <rect x="106" y="90" width="44" height="22" rx="5" fill="#ffd166"/>
    <path d="M114 160 Q128 174 142 160" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`],
  synth: ["#667eea", "#764ba2", `
    <rect x="30" y="96" width="196" height="104" rx="14" fill="#f0ecff" stroke="${INK}" stroke-width="6"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${44 + i * 24}" y="150" width="20" height="40" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/>`).join("")}
    ${[0, 1, 3, 4, 5].map((i) => `<rect x="${58 + i * 24}" y="150" width="12" height="24" rx="2" fill="${INK}"/>`).join("")}
    <circle cx="200" cy="118" r="9" fill="#ff6b8a" stroke="${INK}" stroke-width="3"/><circle cx="176" cy="118" r="9" fill="#ffd166" stroke="${INK}" stroke-width="3"/>
    ${face(100, 116, 0.6, { cheeks: false })}`],
  "dj-cat": ["#fddb92", "#f6a96b", `
    <path d="M62 112 L70 52 L108 84 Z M194 112 L186 52 L148 84 Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="128" cy="140" r="72" fill="#fff" stroke="${INK}" stroke-width="6"/>
    ${headphones(128, 126, 72, "#7c5cff")}
    ${face(128, 140, 0.95)}
    <path d="M70 156 H44 M72 168 H48 M186 156 H212 M184 168 H208" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`],
  alien: ["#30cfd0", "#330867", `
    <path d="M112 54 L100 24 M144 54 L156 24" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="22" r="9" fill="#ffd166" stroke="${INK}" stroke-width="4"/><circle cx="156" cy="22" r="9" fill="#ffd166" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="128" cy="138" rx="80" ry="86" fill="#9bf59b" stroke="${INK}" stroke-width="6"/>
    ${headphones(128, 126, 80, "#ff6b8a")}
    ${face(128, 136, 1.05, { mouth: "grin" })}`],
  ghost: ["#d4fc79", "#96e6a1", `
    <path d="M60 212 V122 C60 80 92 52 128 52 C164 52 196 80 196 122 V212 L174 196 L152 212 L128 196 L104 212 L82 196 Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    ${headphones(128, 110, 68, "#00b4d8")}
    ${face(128, 128, 0.95, { mouth: "sing" })}`],
  popstar: ["#ff758c", "#ff7eb3", `
    <path d="M128 30 L154 92 L220 96 L170 138 L186 204 L128 168 L70 204 L86 138 L36 96 L102 92 Z" fill="#ffe259" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M86 112 H170" stroke="${INK}" stroke-width="5"/>
    <rect x="88" y="104" width="34" height="22" rx="8" fill="${INK}"/><rect x="134" y="104" width="34" height="22" rx="8" fill="${INK}"/>
    <path d="M114 144 Q128 156 142 144" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    ${sparkle(206, 46, 1.2)}${sparkle(46, 176, 0.9)}`],
  metronome: ["#89f7fe", "#66a6ff", `
    <path d="M96 40 H160 L196 220 H60 Z" fill="#c98b5a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M128 196 L168 70" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <rect x="150" y="96" width="22" height="16" rx="3" transform="rotate(18 161 104)" fill="#ffd166" stroke="${INK}" stroke-width="3"/>
    <rect x="76" y="176" width="104" height="44" fill="#a86f45"/>
    ${face(116, 136, 0.7, { cheeks: "#ff6a88" })}`],
  sax: ["#ffecd2", "#fcb69f", `
    <path d="M150 34 C150 34 160 30 164 40 L166 150 C166 196 140 222 108 222 C76 222 58 198 62 170 L88 170 C86 186 96 198 110 198 C128 198 140 184 140 160 L138 50 Z" fill="#ffc43d" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="75" cy="170" rx="20" ry="9" fill="${INK}"/>
    <path d="M150 34 L178 18" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    ${[80, 104, 128].map((y) => `<circle cx="152" cy="${y}" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/>`).join("")}
    ${face(118, 160, 0.6, { cheeks: false })}`],
};

mkdirSync(OUT, { recursive: true });
for (const [id, [from, to, art]] of Object.entries(AVATARS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
  <rect width="256" height="256" fill="url(#bg)"/>${art}
</svg>
`;
  writeFileSync(join(OUT, `${id}.svg`), svg.replace(/\n\s*\n/g, "\n"));
}
console.log(`Wrote ${Object.keys(AVATARS).length} avatars to ${OUT}`);
