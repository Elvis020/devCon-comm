import { describe, expect, it } from 'vitest';
import { parseLumaAttendanceCsv, summarizeAttendance } from './luma-attendance';

describe('Luma attendance parsing', () => {
  it('normalizes quoted CSV fields and summarizes approved check-ins', () => {
    const records = parseLumaAttendanceCsv('event-1', [
      'guest_id,name,email,approval_status,checked_in_at,utm_source,ticket_name',
      'guest-1,"Ama, Dev",ama@example.com,approved,2026-06-15T10:00:00Z,instagram,General',
      'guest-2,Kofi Dev,kofi@example.com,approved,,Direct / unknown,General',
      'guest-3,Esi Dev,esi@example.com,pending,,twitter,Waitlist',
    ].join('\n'));

    expect(records[0]).toMatchObject({
      guest_id: 'guest-1',
      event_id: 'event-1',
      name: 'Ama, Dev',
      approval_status: 'approved',
      ticket_name: 'General',
    });

    expect(summarizeAttendance(records)).toMatchObject({
      total_registrations: 3,
      approved_registrations: 2,
      checked_in: 1,
      approved_checked_in: 1,
      approved_no_shows: 1,
      pending_registrations: 1,
      check_in_rate: 0.5,
      registration_to_attendance_gap: 1,
    });
  });

  it('fails fast when the Luma export is missing required columns', () => {
    expect(() => parseLumaAttendanceCsv('event-1', 'name,email\nAma,ama@example.com'))
      .toThrow('Missing Luma columns');
  });
});
