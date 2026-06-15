# Feedback

## Status

Active.

## Overview

Feedback has two related flows:

- Route-level app feedback from testers.
- Event-scoped post-event feedback forms for attendees.

## User Flows

- Testers open the feedback launcher, enter a name or choose Anonymous, and submit route-aware feedback.
- Organizers create or edit an event feedback campaign.
- Attendees complete the public feedback form after an event.
- Organizers review responses in the event Feedback page or global Feedback Hub.

## Key Files

| File | Purpose |
|---|---|
| `src/components/FeedbackBot.vue` | Route-level app feedback launcher |
| `src/views/FeedbackView.vue` | Public event feedback form |
| `src/views/admin/AdminFeedbackView.vue` | Event feedback campaign builder and response review |
| `src/views/admin/AdminFeedbackOverviewView.vue` | Feedback hub and app feedback inbox |
| `lib/mock-db/feedback.ts` | JSON-backed event feedback persistence |
| `supabase/migrations/20260613000000_event_feedback_campaigns.sql` | Event feedback schema |
| `server/app.ts` | Feedback API routes |

## Configuration

Route-level app feedback uses Supabase helpers when configured. Event feedback currently has JSON persistence plus Supabase schema work for migration.

## Testing

Manual checks:

- Submit route-level feedback from a public route.
- Create or edit an event feedback campaign.
- Preview and submit the public event form.
- Confirm organizer response counts and response lists update.
