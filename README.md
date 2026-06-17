# AnimeHub Official Watch

AnimeHub Official Watch is a Next.js App Router anime discovery and viewing experience built with TypeScript, Tailwind CSS, GSAP, Netlify API routes, and Netlify Blobs.

The public app focuses on browsing, watch history, watchlists, source-aware playback, shared comments, and a local admin catalog workflow. Video playback continues to use supported source players, including official YouTube iframe playback for YouTube videos and native HTML5 video for direct playable video files.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.local.example` to `.env.local` for local development:

```bash
AUTH_SECRET=replace_with_random_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Akukaya123#
YOUTUBE_API_KEY=replace_with_your_youtube_api_key
NETLIFY_BUILD_HOOK_URL=optional_build_hook_url
```

Use a long random value for `AUTH_SECRET`. Do not commit `.env.local`, and do not expose these values through `NEXT_PUBLIC_*` variables.

## Authentication

The app includes simple username/password auth through Next.js route handlers that run as Netlify Functions after deployment.

- Users sign up with username and password only.
- User passwords are hashed with `bcryptjs` before being saved in Netlify Blobs.
- Login creates a signed HTTP-only session cookie.
- Admin login uses the same `/login` page as users.
- Admin defaults are controlled by `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

Default admin credentials for local setup:

```text
username: admin
password: Akukaya123#
```

For production, keep admin credentials in Netlify environment variables.
`ADMIN_PASSWORD` may also be set to a bcrypt hash; the login code detects bcrypt-formatted values and compares them safely.

## Shared Comments

Episode comments are stored in Netlify Blobs and are shared between users after deployment.

- Anyone can read comments.
- Logged-in users can post comments.
- Users can delete their own comments.
- Admin can delete any comment.
- A user can like a comment once.

The API endpoints are:

- `GET /api/comments?animeSlug=...&episodeNumber=...`
- `POST /api/comments`
- `DELETE /api/comments/:id`
- `POST /api/comments/:id/like`

## Netlify Deployment

The project includes `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  node_bundler = "esbuild"
```

Netlify automatically runs the Next.js route handlers as functions for `/api/*`.

### Deploy From GitHub

1. Push this repository to GitHub.
2. Create a new Netlify site from the repository.
3. Use `npm run build` as the build command.
4. Use `.next` as the publish directory.
5. Add the required environment variables in Netlify Site settings.
6. Deploy the site.

### Local Netlify Testing

Install the Netlify CLI if needed:

```bash
npm install -g netlify-cli
```

Run the app with Netlify routing and functions:

```bash
netlify dev
```

Then test:

- `/signup` creates a user.
- `/login` signs in a user.
- `/login` with admin credentials reveals the Admin Panel link.
- `/admin` rejects normal users and allows admin users.
- Comments can be posted, refreshed, liked, and deleted according to role.

## Import Official YouTube Playlists

The importer uses the official YouTube Data API v3 from local Node.js scripts. It does not scrape pages, download videos, proxy videos, or expose the API key to browser code.

Add `YOUTUBE_API_KEY` to `.env.local`, then run:

```bash
npm run youtube:import
```

Import only Muse Indonesia:

```bash
npm run youtube:import:muse
```

Import only Ani-One Indonesia:

```bash
npm run youtube:import:anione
```

Preview matching playlists without importing videos:

```bash
npm run youtube:list-playlists
```

Run metadata enrichment:

```bash
npm run youtube:import:enriched
```

Generated files are saved to:

- `data/generated/youtube-catalog.json`
- `data/generated/anime.generated.ts`

Private, deleted, unavailable, restricted, and non-embeddable videos are not bypassed. Non-embeddable videos are stored with `embeddable: false`, and the app shows an Open on YouTube fallback.

## Admin Catalog

Admin users can open `/admin` after signing in. The admin catalog manager can edit anime, episode metadata, visibility, featured/trending/ongoing settings, image fields, and metadata review markers.

Admin catalog edits are kept as browser-side overrides until exported. Use Export JSON when you want to make a cleaned catalog permanent in project data.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run youtube:import
npm run youtube:import:muse
npm run youtube:import:anione
npm run youtube:list-playlists
npm run youtube:import:enriched
```
