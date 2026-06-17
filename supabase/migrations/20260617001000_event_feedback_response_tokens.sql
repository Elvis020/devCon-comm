alter table public.feedback_submissions
  add column if not exists response_token_hash text;

create unique index if not exists feedback_submissions_event_response_token_idx
  on public.feedback_submissions (event_id, response_token_hash)
  where event_id is not null
    and response_token_hash is not null
    and trigger_source = 'event_feedback_form';
