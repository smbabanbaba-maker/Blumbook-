-- Blumbook Phase 3: profile buttons, opt-in collaboration requests, reports.
-- Run AFTER schema.sql and phase2.sql in Supabase SQL Editor.
alter table public.profile_extras add column if not exists open_to_collab boolean not null default false;

create table if not exists public.collaboration_requests (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('Project','Mentorship','Business','Creative work')),
 message text not null check(char_length(btrim(message)) between 10 and 500),
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 constraint cannot_invite_self check(sender_id<>recipient_id)
);
create index if not exists collaboration_requests_to on public.collaboration_requests(recipient_id,created_at desc);
alter table public.collaboration_requests enable row level security;
drop policy if exists "Participants can see collaboration requests" on public.collaboration_requests;
create policy "Participants can see collaboration requests" on public.collaboration_requests
for select to authenticated using(auth.uid()=sender_id or auth.uid()=recipient_id);
drop policy if exists "Sender sends collaboration request to opted-in members" on public.collaboration_requests;
create policy "Sender sends collaboration request to opted-in members" on public.collaboration_requests
for insert to authenticated with check(auth.uid()=sender_id
 and exists (select 1 from public.profile_extras e where e.user_id=recipient_id and e.open_to_collab=true));
grant select,insert on public.collaboration_requests to authenticated;

create table if not exists public.profile_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 reported_id uuid not null references public.profiles(id) on delete cascade,
 reason text not null check(reason in ('Spam','Harassment','Hate','Violence','Impersonation','Other')),
 created_at timestamptz not null default now(),
 constraint cannot_report_self check(reporter_id<>reported_id),
 unique(reporter_id,reported_id)
);
alter table public.profile_reports enable row level security;
drop policy if exists "Authenticated members may report profiles" on public.profile_reports;
create policy "Authenticated members may report profiles" on public.profile_reports
for insert to authenticated with check(auth.uid()=reporter_id);
grant insert on public.profile_reports to authenticated;
-- No member-facing read policy for reports. Human review queue, spam limits,
-- full blocking enforcement and private messaging are NOT implemented.
