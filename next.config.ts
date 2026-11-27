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
  // Don't tell visitors which framework serves the site.
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Browser security rules for every response. No page is meant to be shown
        // inside another site's frame (checkout included), so framing is refused.
        // Paddle's form is a frame inside our page, which these rules do not affect.
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
      {
        // dev.getsonx.com is a private test deployment (the dev branch): keep every
        // response out of search engines. proxy.ts also serves it a blocking robots.txt.
        source: "/:path*",
        has: [{ type: "host", value: DEV_HOST }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
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
