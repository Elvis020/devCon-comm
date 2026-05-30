# Changelog

_Update this file at natural checkpoints: before a commit, before a PR, or when explicitly asked._
_Format: `## YYYY-MM-DD — [Feature / Fix / Refactor]` followed by bullet points._

---

## 2026-05-30 — Supabase feedback foundation

- Added Supabase JS client configuration with browser anon and server service-role helpers.
- Loaded `.env.local` into the Hono dev server so server routes can access Supabase secrets locally.
- Added environment placeholders for Supabase URL, anon key, and server-only service role key.
- Added a Supabase migration for name-selected tester feedback without Supabase sessions or user auth.
- Added `/api/health/supabase` to verify server-side Supabase connectivity.

## 2026-05-30 — Temporary mode switch

- Added a simple masthead switch for testing between the public community experience and the organizer console.

## 2026-05-30 — Admin overview polish

- Reworked the event overview operations area into a calmer program pulse and compact next-action rail.
- Reduced the stretched metric-card feel so counts, status, and actions scan together on wide screens.
- Replaced remaining native Vue dropdowns with the shared app-themed dropdown component across archive filters, event status, and quiz answer selection.
- Fixed admin shell nav highlighting so only the deepest matching event section is marked active.
- Removed redundant event back links from admin event child pages now covered by shell navigation.

## 2026-05-29 — Quieter admin event overview

- Replaced the dominant event lifecycle panel with a compact header status selector.
- Added a calmer organizer overview for talk pipeline, speaker access, quiz state, and event-specific next actions.

## 2026-05-29 — Editorial page scroll fix

- Changed shared editorial pages to fill the available app shell height instead of forcing full viewport height inside the header-offset scroll area.
- Removed the phantom vertical scrollbar on admin pages when content fits the visible area.
- Added contextual admin shell navigation so event routes and the event list expose Overview, Talks, Speakers, Quiz, and Live links for the current/default event.
- Removed duplicate in-page admin event tabs now that event operations live in the admin shell navigation.
- Hid the admin Live nav item unless the selected/default event has a waiting or active quiz session.

## 2026-05-29 — Live quiz nav visibility

- Updated the app header to show the public `Play` navigation item only when `/api/quiz/active` reports a waiting or active quiz session.
- Added periodic quiz availability refresh so the `Play` link can appear during a meetup without reloading the page.
- Removed the redundant "Back to events" link from the admin event detail page because Events is already reachable from the admin navbar.

## 2026-05-29 — Local Navii leaderboard avatars

- Added `@usenavii/core` and a Vue `NaviiAvatar` component so leaderboard avatars render locally as deterministic data URI images.
- Seeded avatars from stable leaderboard identifiers (`user_id`, `device_id`, then nickname/rank fallback) instead of using display names alone.
- Added static 48px mascot avatars to leaderboard rows without enabling repeated avatar animation.

## 2026-05-29 — Motion system pass

- Switched the app motion standard to `$ui-animations` and added shared spring, smooth, and fast motion tokens.
- Replaced active Vue `transition-all` usage with transform/opacity-only motion utilities for press, surface, icon, page, spinner, and quiz answer interactions.
- Removed repeated decorative pulse motion, avoided layout-property transitions, and kept hover movement pointer-gated with reduced-motion fallbacks.

## 2026-05-29 — Landing hero meetup photo

- Replaced the single landing hero image with a three-photo automatic meetup stack.
- Refined the meetup stack into a contact-sheet style zig-zag pile with paper borders, staggered rear prints, external captioning, and transform-only motion.
- Simplified the automatic photo rotation so only the front print shifts to the back before the stack order advances.
- Added a previous meetup photo to the landing hero's "Right now" feature panel.
- Removed the redundant current-event summary from the photo panel so the hero only shows one meetup image.
- Updated the hero photo caption to identify it as the April meetup.
- Renamed the landing leaderboard eyebrow from "Community board" to "Community Kahoot board".

## 2026-05-29 — Configurable organizer route

- Moved organizer-facing Vue routes from the predictable `/admin` prefix to a configurable `VITE_ADMIN_BASE_PATH`, defaulting to `/organizer-console`.
- Updated admin navigation, auth redirects, event tabs, and admin back links to build URLs through the shared route helper.
- Added a catch-all client route so old or unknown paths recover through the branded 404 instead of exposing an admin entry point.

## 2026-05-29 — Branded 404 page

- Added a Vue catch-all route for unknown client paths.
- Added a branded 404 page with the missing path, quick recovery links, and organizer-aware primary navigation.
- Removed the oversized hero glow so the 404 background stays quiet at wide viewport sizes.

## 2026-05-29 — Softer interaction states

- Reworked the app header into a compact app bar with grouped navigation and aligned status/actions.
- Simplified the header into an editorial masthead with plain text navigation and subtle active underlines.
- Removed the public "Community" header label; the masthead now only shows an organizer indicator on admin routes.
- Removed the decorative nav group separator from the public masthead.
- Reworked the public navigation active state from a solid yellow fill to a lighter tinted selection with subtler hover, press, and focus states.
- Reduced the intensity of shared editorial action button hover/active states while preserving the yellow DevCon-Comm accent.
- Removed the nav item hover lift that could clip the selected border inside the horizontal scroller.

## 2026-05-29 — Archive redesign

- Redesigned the public archive from a sparse timeline into event cards with clear titles, descriptions, topic chips, and talk previews.
- Reworked year selection, summary metrics, and filters so desktop and mobile archive browsing are easier to scan.
- Replaced native archive topic/speaker selects with app-themed custom dropdown popovers.
- Removed the redundant "View issue" chip from archive cards because the full card already opens the event.

## 2026-05-29 — Softer admin UI polish

- Reduced hard-edged admin chrome with softer shared panels, controls, tabs, and inputs.
- Removed terminal-style event status decoration from the admin event overview.
- Softened quick action cards and top navigation while keeping the editorial DevCon-Comm identity.
- Simplified the event overview so tabs stay in a consistent position across Overview/Talks/Speakers and the overview no longer repeats navigation as cards.
- Simplified talk review cards into a quieter list with muted metadata and one primary action.
- Redesigned archive event details as a quieter editorial list with restrained slide links and no terminal symbols.
- Added pagination to the public leaderboard table.

## 2026-05-29 — Kahoot-from-paper prototype

- Added an admin-only PDF upload endpoint for quiz sessions that validates PDF type/size, extracts text locally, and appends rule-based draft questions to the existing quiz flow.
- Added Quiz Builder UI for uploading a paper/resource PDF, choosing draft count, viewing generation status, and editing generated questions before opening the lobby.
- Added local PDF extraction dependency and documented the new quiz-generation API surface.

## 2026-05-29 — Community product hardening

- Reframed the Vue landing page as a community hub with CFP/live quiz actions, recent published talks, and top members.
- Added archive search and filters across event text, talk titles, topics, and speakers.
- Improved speaker slide workflow with visible deadlines, upload state, and organizer reminder logging.
- Added local QR-code generation to the live quiz lobby.
- Updated reputation tracking so new quiz participation increments event counts and answers add to user totals.
- Added all-time/monthly leaderboard modes and claimed-profile badges.
- Added same-origin prototype admin cookie auth with `/admin/login`, route redirects, logout, and server-side guards for organizer mutations.
- Added planning/status files for the autonomous community-product pass.

## 2026-05-29 — Stack migration foundation

- Added Satoshi + IBM Plex Mono typography direction and removed the old Lato/JetBrains Mono pairing.
- Introduced editorial UI primitives for page headers, panels, labels, inputs, and actions.
- Made top navigation role-aware and added event-level admin tabs for Overview/Talks/Speakers/Quiz/Live.
- Refined major public/admin surfaces toward a more cohesive editorial tech-conference look.
- Switched package management from npm lockfile to pnpm and added `pnpm-lock.yaml`.
- Added Vue 3 + Vite app shell under `src/` and restored the DEV::CON[] branded landing page with Lato/JetBrains Mono fonts.
- Added Hono API app and Bun production server under `server/` so the UI and `/api/*` run on one same-origin port.
- Ported public Vue routes for archive, event talks, leaderboard, CFP, My Talks, quiz join, and live player gameplay.
- Ported admin Vue routes for event management, event status, talks, speakers, quiz builder, and live quiz controls.
- Added matching Hono endpoints for event CRUD, speaker allowlists, CFP, talks/slides, leaderboard/account tools, quiz sessions/questions, join/state/answer.
- Updated TypeScript, Vite, Tailwind, and docs for the new migration target while keeping the legacy Next implementation as reference.

## 2026-05-01 — Docs sync to current app/api surface

- Updated architecture docs with current public/admin route inventory and complete API route list.
- Updated implementation docs to reflect active route-to-module mappings for CFP, speakers, talks/slides, and quiz workflows.
- Corrected API contract examples to current snake_case payloads (`/api/cfp`, `/api/quiz/join`, `/api/quiz/answer`).
- Added missing major endpoint coverage in docs: speaker management endpoints, quiz question `PATCH`/`DELETE`/`reorder`, and `/api/talks/[talkId]/upload`.

## 2026-03-23 — Initial index

- First scan of codebase; generated all 5 docs
- Project: DevCon-Comm (Next.js 14, JSON mock DB, quiz system)

---

_Future entries go above this line._
