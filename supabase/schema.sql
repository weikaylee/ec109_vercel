-- Run once in the Supabase SQL editor. Private data is accessible only from the Vercel server.
create table if not exists public.participants (
  key text primary key,
  response_id uuid not null unique default gen_random_uuid(),
  submitted_at timestamptz
);
create table if not exists public.responses (
  id uuid primary key,
  payload jsonb not null,
  created timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.participants enable row level security;
alter table public.responses enable row level security;
revoke all on public.participants, public.responses from anon, authenticated;
grant all on public.participants, public.responses to service_role;
create or replace function public.register_participant(p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare participant public.participants;
begin
  insert into public.participants(key) values(p_key) on conflict(key) do nothing;
  select * into participant from public.participants where key=p_key;
  return jsonb_build_object('response_id',participant.response_id,'submitted_at',participant.submitted_at);
end;
$$;
create or replace function public.submit_response(p_key text,p_id uuid,p_payload jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare participant public.participants;
begin
  select * into participant from public.participants where key=p_key for update;
  if not found or participant.response_id <> p_id then return 'invalid_id'; end if;
  if participant.submitted_at is not null then return 'already_submitted'; end if;
  insert into public.responses(id,payload) values(p_id,p_payload);
  update public.participants set submitted_at=now() where key=p_key;
  return 'saved';
end;
$$;
-- PostgreSQL grants function execution to PUBLIC by default: explicitly remove it.
revoke all on function public.register_participant(text) from public, anon, authenticated;
revoke all on function public.submit_response(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.register_participant(text) to service_role;
grant execute on function public.submit_response(text,uuid,jsonb) to service_role;
