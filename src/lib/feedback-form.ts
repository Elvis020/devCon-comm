import { z } from 'zod';
import type { FeedbackKind } from '@/types/supabase';

export const FEEDBACK_TYPE_PLACEHOLDER = '__select-feedback-kind__';
export const FEEDBACK_MIN_DESCRIPTION_LENGTH = 12;

export const feedbackTypeOptions: Array<{ value: FeedbackKind; label: string }> = [
  { value: 'confusing', label: 'Confusing' },
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
];

export const feedbackFormSchema = z.object({
  tester_name: z
    .string()
    .trim()
    .min(1, 'Add your name before sending feedback.'),
  type: z
    .string()
    .refine((value): value is FeedbackKind => feedbackTypeOptions.some((option) => option.value === value), {
      message: 'Choose the kind of feedback you are sending.',
    }),
  message: z
    .string()
    .trim()
    .min(FEEDBACK_MIN_DESCRIPTION_LENGTH, `Add a bit more detail so we can act on it (${FEEDBACK_MIN_DESCRIPTION_LENGTH}+ characters).`)
    .max(4000, 'Feedback message is too long.'),
});

export type FeedbackFormInput = z.input<typeof feedbackFormSchema>;
export type FeedbackFormPayload = z.output<typeof feedbackFormSchema>;
