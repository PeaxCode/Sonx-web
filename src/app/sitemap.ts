import type { MetadataRoute } from "next";
import { JOURNAL_POSTS, JOURNAL_UPDATED, SITE_URL, postUrl } from "@/lib/journal";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: "2026-10-13", changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/create`, lastModified: "2026-10-13", changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/video`, lastModified: "2026-10-13", changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog/`, lastModified: JOURNAL_UPDATED, changeFrequency: "weekly", priority: 0.8 },
    ...JOURNAL_POSTS.map((post) => ({
      url: postUrl(post.slug),
      lastModified: post.updated,
      changeFrequency: "monthly" as const,
      priority: post.priority,
    })),
    { url: `${SITE_URL}/privacy.html`, lastModified: "2026-03-30", changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms.html`, lastModified: "2026-03-30", changeFrequency: "monthly", priority: 0.3 },
  ];
}
