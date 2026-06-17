alter table public.community_events
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_url text,
  add column if not exists external_synced_at timestamptz;

create unique index if not exists community_events_external_source_id_uidx
  on public.community_events (external_source, external_id)
  where external_source is not null and external_id is not null;

create index if not exists community_events_external_source_idx
  on public.community_events (external_source, external_synced_at desc)
  where external_source is not null;

alter table public.community_events
  drop constraint if exists community_events_external_source_not_blank,
  add constraint community_events_external_source_not_blank
    check (external_source is null or length(trim(external_source)) > 0);

alter table public.community_events
  drop constraint if exists community_events_external_id_not_blank,
  add constraint community_events_external_id_not_blank
    check (external_id is null or length(trim(external_id)) > 0);
