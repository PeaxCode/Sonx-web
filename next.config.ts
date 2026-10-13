import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Journal's URLs end in a slash (/blog/<slug>/) and are already indexed
  // that way, so proxy.ts decides which paths get one instead of Next.js.
  skipTrailingSlashRedirect: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      // The Journal is static HTML carried over from the old landing site (public/blog).
      beforeFiles: [
        { source: "/blog/", destination: "/blog/index.html" },
        { source: "/blog/:slug/", destination: "/blog/:slug/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
