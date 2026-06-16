import { describe, expect, it } from 'vitest';
import { FEEDBACK_TYPE_PLACEHOLDER, feedbackFormSchema } from '@/src/lib/feedback-form';

describe('feedback form schema', () => {
  it('requires a real feedback type, a name, and enough detail', () => {
    const invalid = feedbackFormSchema.safeParse({
      tester_name: '',
      type: FEEDBACK_TYPE_PLACEHOLDER,
      message: 'too short',
    });

    expect(invalid.success).toBe(false);
    if (invalid.success) return;
    expect(invalid.error.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
      'Add your name before sending feedback.',
      'Choose the kind of feedback you are sending.',
      'Add a bit more detail so we can act on it (12+ characters).',
    ]));
  });

  it('accepts a valid route feedback payload', () => {
    const valid = feedbackFormSchema.safeParse({
      tester_name: 'Ada',
      type: 'bug',
      message: 'The archive search gets stuck after typing.',
    });

    expect(valid.success).toBe(true);
  });
});
