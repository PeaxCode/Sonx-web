# Sonx Web

The web version of the Sonx app: create songs and music videos, with the same
account, library, credits and plan as the mobile app.

## Run locally

```bash
cp .env.example .env.local   # fill in the public Supabase URL and publishable key
npm install
npm run dev                  # http://localhost:3000
```

Sign in with Google. `http://localhost:3000/**` is in the Supabase Auth redirect
allow list; add every new domain (Vercel previews, production) there too.

## How it fits together

The web app has no backend of its own. It uses the Supabase project and Edge
Functions that live in the mobile repo (`ai-music-generator/supabase`):

- **Auth**: Supabase Auth with Google (PKCE). `src/proxy.ts` refreshes the
  session cookie and keeps `/create`, `/video`, `/library` and `/account`
  behind sign-in. `/auth/callback` exchanges the OAuth code.
- **Generation**: `provider-proxy` `generate` starts a billed generation; the
  server picks the model, charges quota or credits, and EachLabs reports back
  through `eachlabs-webhook`. The browser reads the `generations` row (Row
  Level Security limits it to the user) and calls `generation-refresh` only
  when a webhook is late.
- **Billing**: read-only on the web. The first visit calls `billing-migrate`,
  which marks a web account migrated; purchases happen in the mobile app.
- **Uploads** (music video): files go to the `ai-uploads` bucket under
  `<userId>/images|audio/` and are removed after ten minutes. Audio is trimmed
  in the browser to the chosen 15 or 30 seconds and uploaded as WAV.

## Notes

- Next.js 16 with Cache Components: anything that reads cookies or search
  params must sit behind `<Suspense>`. See `AGENTS.md`.
- Sign in with Apple on the web needs an Apple Services ID and key configured
  in Supabase before it can be added.
