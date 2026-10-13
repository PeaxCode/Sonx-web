import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/journal";

// Pages that only make sense for a signed-in user stay out of search results.
const PRIVATE_PATHS = ["/account", "/auth/"];

// AI crawlers are welcome, as on the old landing site: the Journal is written to be cited.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
