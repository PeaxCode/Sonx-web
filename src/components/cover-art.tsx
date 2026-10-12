import { memo } from "react";

// Brand-adjacent palettes; a song always maps to the same one.
const PALETTES = [
  ["#e563f1", "#5b3dff", "#1a0f3d"],
  ["#c94bff", "#ff6fd8", "#2d0f57"],
  ["#9a57ff", "#3d8aff", "#0b1a4a"],
  ["#ff4d8e", "#ffb85c", "#3a0d2e"],
  ["#1fe6c2", "#3d8aff", "#0a2a3a"],
  ["#ff6fd8", "#8c5bff", "#170b33"],
];

/** Small deterministic PRNG (mulberry32) seeded from the song ID. */
function random(seedText: string) {
  let seed = 0;
  for (const char of seedText) seed = (Math.imul(31, seed) + char.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generated cover art: each song gets its own gradient, orbit and waveform,
 * drawn as inline SVG so the library needs no image requests.
 */
export const CoverArt = memo(function CoverArt({ seed, className = "" }: { seed: string; className?: string }) {
  const next = random(seed);
  const [primary, secondary, base] = PALETTES[Math.floor(next() * PALETTES.length)];
  const id = `cover-${seed.replace(/[^a-z0-9]/gi, "").slice(0, 12)}`;
  const angle = Math.floor(next() * 360);
  const orbX = 20 + next() * 60;
  const orbY = 20 + next() * 60;
  const ring = 18 + next() * 22;
  const bars = Array.from({ length: 9 }, () => 8 + next() * 30);

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-bg`} gradientTransform={`rotate(${angle} .5 .5)`}>
          <stop offset="0" stopColor={base} />
          <stop offset="1" stopColor={secondary} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={`${id}-orb`}>
          <stop offset="0" stopColor={primary} />
          <stop offset="1" stopColor={primary} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={base} />
      <rect width="100" height="100" fill={`url(#${id}-bg)`} />
      <circle cx={orbX} cy={orbY} r="42" fill={`url(#${id}-orb)`} opacity="0.8" />
      <circle cx={orbX} cy={orbY} r={ring} fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.2" />
      <g fill="#fff" fillOpacity="0.85">
        {bars.map((height, index) => (
          <rect key={index} x={23 + index * 6} y={78 - height} width="3" height={height} rx="1.5" />
        ))}
      </g>
    </svg>
  );
});
