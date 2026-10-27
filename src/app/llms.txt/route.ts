import { JOURNAL_POSTS, SITE_URL, postUrl } from "@/lib/journal";

// https://llmstxt.org — a map of the site for language models. The longer
// companion, llms-full.txt, is a static file in public/.
export function GET() {
  const body = `# Sonx — AI Music Generator

> Sonx turns text prompts and lyrics into full AI-generated songs. Use it on the web at getsonx.com or in the free iOS and Android apps; one account is shared between them.

## Pages

- [Home](${SITE_URL}/): Start a song from a prompt, listen to examples, and find the apps
- [Create a song](${SITE_URL}/create): Web studio for songs from a description or your own lyrics
- [Privacy Policy](${SITE_URL}/privacy.html): Full data privacy policy
- [Terms of Service](${SITE_URL}/terms.html): Full terms of service
- [Full product overview](${SITE_URL}/llms-full.txt): Features, pricing, comparisons, and original research in one file

## Journal

Long-form articles, original data studies, and practical guides on AI music generation.

${JOURNAL_POSTS.map((post) => `- [${post.title}](${postUrl(post.slug)}): ${post.summary}`).join("\n")}
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
