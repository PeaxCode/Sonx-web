// Build-time switches for work that is not ready for the live site.

/**
 * Explore runs on sample artists and made-up follower and play counts
 * (lib/explore-mock.ts), so it must not reach getsonx.com before the social
 * feed is real. It shows on Vercel previews (dev.getsonx.com) and local dev;
 * production needs NEXT_PUBLIC_EXPLORE_ENABLED=true. Unknown environments stay hidden.
 */
export const exploreEnabled =
  process.env.NEXT_PUBLIC_EXPLORE_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NODE_ENV === "development";
