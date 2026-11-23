import type { NextConfig } from "next";

const DEV_HOST = "dev.getsonx.com";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
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
  // dev.getsonx.com is a private test deployment (the dev branch): keep every
  // response out of search engines. proxy.ts also serves it a blocking robots.txt.
  async headers() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: DEV_HOST }],
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }];
  },
  // AI music video is hidden pending payment provider review; see app/(studio)/video/page.tsx.
  async redirects() {
    return [
      { source: "/video", destination: "/create", permanent: false },
      // People type these; there is one page for signing in and signing up.
      { source: "/signup", destination: "/login", permanent: true },
      { source: "/signin", destination: "/login", permanent: true },
      { source: "/sign-up", destination: "/login", permanent: true },
      { source: "/sign-in", destination: "/login", permanent: true },
      { source: "/register", destination: "/login", permanent: true },
    ];
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
