create type public.feedback_kind as enum ('bug', 'confusing', 'suggestion', 'praise');
create type public.feedback_status as enum ('new', 'reviewing', 'done', 'wont_fix');

create table public.feedback_testers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint feedback_testers_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint feedback_testers_display_name_unique unique (display_name)
);

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  tester_id uuid references public.feedback_testers(id) on delete set null,
  tester_name text not null,
  type public.feedback_kind not null,
  message text not null,
  page_path text,
  user_agent text,
  viewport_width integer,
  viewport_height integer,
  status public.feedback_status not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_submissions_tester_name_not_blank check (length(trim(tester_name)) > 0),
  constraint feedback_submissions_message_not_blank check (length(trim(message)) > 0),
  constraint feedback_submissions_message_reasonable_length check (char_length(message) <= 4000),
  constraint feedback_submissions_viewport_width_positive check (viewport_width is null or viewport_width > 0),
  constraint feedback_submissions_viewport_height_positive check (viewport_height is null or viewport_height > 0)
);

create index feedback_testers_active_sort_idx
  on public.feedback_testers (active, sort_order, display_name);

create index feedback_submissions_status_created_idx
  on public.feedback_submissions (status, created_at desc);

create index feedback_submissions_tester_created_idx
  on public.feedback_submissions (tester_id, created_at desc)
  where tester_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_feedback_submissions_updated_at
before update on public.feedback_submissions
for each row
execute function public.set_updated_at();

alter table public.feedback_testers enable row level security;
alter table public.feedback_submissions enable row level security;

create policy "Active feedback testers are public"
on public.feedback_testers
for select
to anon, authenticated
using (active = true);

create policy "Anyone can submit feedback"
on public.feedback_submissions
for insert
to anon, authenticated
with check (
  status = 'new'
  and admin_note is null
  and length(trim(tester_name)) > 0
  and length(trim(message)) > 0
);
