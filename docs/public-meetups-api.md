# Public Meetups API

This app exposes a read-only meetup API for the future `devcongress.org` Astro integration. The website should consume this app as a data source only after the API contract passes local verification.

## Source Of Truth

When Supabase is configured and the `community_events` table exists, the public meetup API reads from Supabase first. The table is modeled from the current `devcongress.org` Astro meetup collection in `/Users/TT/Documents/personal/forks/website/content/meetups/*.yaml`.

The first Supabase event migration seeds the existing website meetups into `community_events` so the API can be tested before the Astro repo is changed. If Supabase is unavailable or the table has not been migrated yet, the API falls back to the local JSON event/talk data so development still works.

Only rows with `publish_to_website = true` are returned from the Supabase-backed public endpoint.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/public/meetups` | Lists public meetup summaries and page data |
| `GET /api/public/meetups/:slug` | Returns one meetup by slug or event id |
| `GET /api/public/meetups/:slug/talks` | Returns the published talks for a meetup |

All public meetup endpoints:

- are unauthenticated read-only endpoints
- send permissive CORS headers for static-site consumption
- send short public cache headers
- return JSON objects with a top-level `data` field

## List Response

```json
{
  "data": [
    {
      "id": "event-id",
      "slug": "devcon-comm-march-2026-a1a7b2e5",
      "name": "DevCon-Comm March 2026",
      "status": "upcoming",
      "start": "2026-03-15T18:00:00+00:00",
      "end": "2026-03-15T21:00:00+00:00",
      "description": "A DevCongress community meetup...",
      "cover": "/images/apr-meetup.jpg",
      "location": {
        "name": "Accra, Ghana",
        "url": null
      },
      "stream_url": null,
      "embed_stream": false,
      "registration_url": "http://localhost:3000/cfp/event-id",
      "speakers": [],
      "schedule": [],
      "photos": [],
      "videos": [],
      "talks_count": 0,
      "published_talks_count": 0,
      "cfp_url": "http://localhost:3000/cfp/event-id",
      "archive_url": "http://localhost:3000/archive/event-id",
      "updated_at": "2026-06-13T00:00:00+00:00"
    }
  ],
  "meta": {
    "source": "devcongress-comm",
    "version": 1
  }
}
```

The meetup DTO follows the current `devcongress.org` Astro meetup schema where practical:

- `start`, `end`, and `updated_at` use `YYYY-MM-DDTHH:mm:ss+00:00` datetime strings.
- `location.url`, `stream_url`, `registration_url`, speaker images, schedule resource URLs, videos, `cfp_url`, and `archive_url` are full URLs when present.
- `cover` and `photos[].url` may be app-relative paths because the Astro schema allows relative image paths.
- `photos[]` supports direct image links and shared gallery/folder links. Each item uses `{ "url": string, "type": "image" | "folder" }`.
- Supabase rows are exposed only when `publish_to_website` is true.

The consuming website should resolve relative image paths against this app's deployed origin.

## Supabase Setup Check

Apply the event-source migration before testing the Supabase path:

```sh
supabase/migrations/20260615000000_community_events.sql
```

Apply the media bucket migration before testing Supabase Storage uploads:

```sh
supabase/migrations/20260615001000_meetup_media_bucket.sql
```

If the Supabase CLI is unavailable, paste each SQL file into the Supabase SQL editor for the project and run them in that order.

Then check the event table directly:

```sh
curl http://localhost:3000/api/health/supabase/community-events
```

Expected response:

```json
{"ok":true,"configured":true}
```

Then check the media bucket:

```sh
curl http://localhost:3000/api/health/supabase/storage
```

Expected response:

```json
{"ok":true,"configured":true}
```

Organizer media uploads use the public `meetup-media` bucket. Uploads are admin-only and server-validated. In the browser, selected images are resized to a maximum 1600px edge and encoded as WebP when supported, with a 2MB target. The server still enforces AVIF/JPEG/PNG/WebP input and a 5MB hard upload cap before writing to Supabase Storage. The app stores the resulting public Supabase Storage URL in `cover` or `photos[]`.

## Local Verification

Start this app first:

```sh
pnpm dev
```

Then verify the public API contract:

```sh
pnpm verify:public-api
```

To verify a non-default host:

```sh
PUBLIC_API_BASE_URL=https://meetup-api.example.com pnpm verify:public-api
```

When deployed behind a proxy or static-site build job, set `PUBLIC_APP_URL` on this app so generated full URLs point at the public app origin rather than an internal host.

Do not modify the `devcongress.org` Astro repo until this verification passes against the intended source endpoint.
