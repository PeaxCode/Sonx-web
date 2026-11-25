// Build-time switches for work that is not ready for the live site.

/**
 * Explore and public profiles (/explore, /artist/*) run on published songs and real
 * follows, but stay off getsonx.com until launch. They show on Vercel previews
 * (dev.getsonx.com) and local dev; production needs NEXT_PUBLIC_EXPLORE_ENABLED=true.
 * Unknown environments stay hidden.
 */
export const exploreEnabled =
  process.env.NEXT_PUBLIC_EXPLORE_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NODE_ENV === "development";
