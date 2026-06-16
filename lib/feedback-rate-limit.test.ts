import { describe, expect, it } from 'vitest';
import { evaluateRouteFeedbackRateLimit, recordRouteFeedbackSubmission, routeFeedbackRetryMessage } from '@/lib/feedback-rate-limit';

describe('feedback rate limit', () => {
  it('allows the first submission and blocks the next one during cooldown', () => {
    const key = `cooldown-${Date.now()}`;
    const now = 1_700_000_000_000;

    expect(evaluateRouteFeedbackRateLimit(key, now)).toEqual({ allowed: true });

    recordRouteFeedbackSubmission(key, now);
    const blocked = evaluateRouteFeedbackRateLimit(key, now + 1_000);

    expect(blocked.allowed).toBe(false);
    if (blocked.allowed) return;
    expect(blocked.reason).toBe('cooldown');
    expect(routeFeedbackRetryMessage(blocked)).toContain('You can send another note');
  });

  it('blocks after three submissions in 24 hours once cooldown has passed', () => {
    const key = `daily-${Date.now()}`;
    const now = 1_700_000_000_000;
    const elevenMinutes = 11 * 60 * 1000;

    recordRouteFeedbackSubmission(key, now - elevenMinutes);
    recordRouteFeedbackSubmission(key, now - elevenMinutes * 2);
    recordRouteFeedbackSubmission(key, now - elevenMinutes * 3);

    const blocked = evaluateRouteFeedbackRateLimit(key, now + 5_000);

    expect(blocked.allowed).toBe(false);
    if (blocked.allowed) return;
    expect(blocked.reason).toBe('daily_limit');
    expect(routeFeedbackRetryMessage(blocked)).toContain('last 24 hours');
  });

  it('forgets submissions older than 24 hours', () => {
    const key = `expiry-${Date.now()}`;
    const now = 1_700_000_000_000;
    const day = 24 * 60 * 60 * 1000;

    recordRouteFeedbackSubmission(key, now - day - 60_000);

    expect(evaluateRouteFeedbackRateLimit(key, now)).toEqual({ allowed: true });
  });
});
