alter table public.admin_audit_log
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists request_method text,
  add column if not exists request_path text;

create index if not exists admin_audit_log_actor_created_idx
  on public.admin_audit_log (actor_email, created_at desc);

create index if not exists admin_audit_log_action_created_idx
  on public.admin_audit_log (action, created_at desc);
