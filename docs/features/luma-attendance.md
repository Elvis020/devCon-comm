# Luma Attendance

## Status

Active.

## Overview

Luma Attendance helps organizers import a post-event Luma guest CSV and understand turnout. It is meant for venue planning, no-show follow-up, and month-by-month attendance visibility.

## User Flows

- Organizer opens an event Attendance page.
- Organizer uploads or replaces the Luma CSV export.
- The app parses approved registrations, check-ins, no-shows, source, and ticket information.
- Organizer reviews event-level readouts and the global monthly Attendance Hub.

## Key Files

| File | Purpose |
|---|---|
| `src/views/admin/AdminAttendanceView.vue` | Event-level attendance import and readout |
| `src/views/admin/AdminAttendanceOverviewView.vue` | Monthly attendance ledger |
| `lib/luma-attendance.ts` | CSV parsing and attendance summary logic |
| `lib/mock-db/attendance.ts` | JSON-backed attendance import persistence |
| `server/app.ts` | Attendance API routes |

## Input Policy

- Import one current Luma CSV per event.
- Keep upload size small; current app policy targets lightweight CSV exports.
- Do not upload private data that is not needed for attendance analysis.

## Testing

Manual checks:

- Upload a valid Luma CSV.
- Replace the CSV and verify metrics update.
- Remove the CSV and verify the empty state returns.
- Check the monthly Attendance Hub after event-level changes.
