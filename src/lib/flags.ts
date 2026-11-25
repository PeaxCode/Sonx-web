// Build-time switches for live-site features.

/**
 * Explore and public profiles (/explore, /artist/*) run on published songs and real
 * follows. They are on everywhere; set NEXT_PUBLIC_EXPLORE_ENABLED=false to hide them
 * (takes effect on the next build).
 */
export const exploreEnabled = process.env.NEXT_PUBLIC_EXPLORE_ENABLED !== "false";
