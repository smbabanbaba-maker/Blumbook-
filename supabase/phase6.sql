-- BLUMBOOK PHASE 6 — Stories, Polls, Live directory, Verification,
-- Earnings waitlist, scheduled publishing, and AI quotas.
-- Apply ONCE after schema.sql + phase2.sql through phase5.sql.
-- RLS is enforced for every new client-accessible table.
-- No public or authenticated account can approve verification or credit earnings.

-- 1. 24-hour stories; physical media may outlive the public story row.
create table if not exists public.stories (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 media_url text not null check (media_url ~ '^https://'),
 media_type text not null check (media_type in ('image','video')),
 caption text not null default '' check(char_length(caption)<=180),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '24 hours'),
 constraint story_expiry_valid check(expires_at<=created_at+interval '24 hours' and expires_at>created_at)
);
create index if not exists stories_expiry_idx on public.stories(expires_at desc);
alter table public.stories enable row level security;
drop policy if exists "Current stories are public" on public.stories;
create policy "Current stories are public" on public.stories for select using(expires_at>now());
drop policy if exists "Members share stories" on public.stories;
create policy "Members share stories" on public.stories for insert to authenticated with check(author_id=auth.uid());
drop policy if exists "Owner deletes stories" on public.stories;
create policy "Owner deletes stories" on public.stories for delete to authenticated using(author_id=auth.uid());
revoke all on public.stories from anon,authenticated;
grant select on public.stories to anon,authenticated;
grant insert(author_id,media_url,media_type,caption) on public.stories to authenticated;
grant delete on public.stories to authenticated;

create table if not exists public.story_views (
 story_id uuid not null references public.stories(id) on delete cascade,
 viewer_id uuid not null references public.profiles(id) on delete cascade,
 viewed_at timestamptz not null default now(),
 primary key(story_id,viewer_id)
);
alter table public.story_views enable row level security;
drop policy if exists "View own story views" on public.story_views;
create policy "View own story views" on public.story_views for select to authenticated
using(viewer_id=auth.uid() or exists(select 1 from public.stories s where s.id=story_id and s.author_id=auth.uid()));
drop policy if exists "Register a story view" on public.story_views;
create policy "Register a story view" on public.story_views for insert to authenticated
with check(viewer_id=auth.uid() and exists(select 1 from public.stories s where s.id=story_id and s.expires_at>now() and s.author_id<>auth.uid()));
revoke all on public.story_views from anon,authenticated;
grant select on public.story_views to authenticated;
grant insert(story_id,viewer_id) on public.story_views to authenticated;

-- 2. Polls: immutable answers, one authenticated vote per member.
create table if not exists public.polls (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 question text not null check(char_length(btrim(question)) between 5 and 180),
 options jsonb not null check(
   jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 4
 ),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 constraint poll_duration_check check(expires_at>created_at and expires_at<=created_at+interval '7 days')
);
create index if not exists polls_latest_idx on public.polls(created_at desc);
alter table public.polls enable row level security;
drop policy if exists "Polls visible to everyone" on public.polls;
create policy "Polls visible to everyone" on public.polls for select using(true);
revoke all on public.polls from anon,authenticated;
grant select on public.polls to anon,authenticated;

create table if not exists public.poll_votes (
 poll_id uuid not null references public.polls(id) on delete cascade,
 voter_id uuid not null references public.profiles(id) on delete cascade,
 option_index integer not null check(option_index between 0 and 3),
 created_at timestamptz not null default now(),
 primary key(poll_id,voter_id)
);
alter table public.poll_votes enable row level security;
drop policy if exists "Only see own vote" on public.poll_votes;
create policy "Only see own vote" on public.poll_votes for select to authenticated using(voter_id=auth.uid());
drop policy if exists "Vote once on an active poll" on public.poll_votes;
create policy "Vote once on an active poll" on public.poll_votes for insert to authenticated
with check(voter_id=auth.uid() and exists(
 select 1 from public.polls p where p.id=poll_id and p.expires_at>now()
 and option_index<jsonb_array_length(p.options)
));
revoke all on public.poll_votes from anon,authenticated;
grant select on public.poll_votes to authenticated;
grant insert(poll_id,voter_id,option_index) on public.poll_votes to authenticated;

create or replace function public.create_blumbook_poll(p_question text,p_options text[],p_days integer default 1)
returns uuid language plpgsql security definer set search_path='' as $$
declare created_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if char_length(btrim(p_question)) not between 5 and 180 then raise exception 'Invalid question'; end if;
 if p_days not in(1,3,7) or array_length(p_options,1) not between 2 and 4 then
   raise exception 'Polls need 2–4 answers and a valid expiry';
 end if;
 if exists(select 1 from unnest(p_options) opt where
   opt is null or char_length(btrim(opt)) not between 1 and 90) then
   raise exception 'Each answer must be 1–90 characters';
 end if;
 if (select count(distinct lower(btrim(opt))) from unnest(p_options) opt) <> array_length(p_options,1) then
   raise exception 'Answers must be different';
 end if;
 insert into public.polls(author_id,question,options,expires_at)
 values(auth.uid(),btrim(p_question),
  (select jsonb_agg(btrim(opt) order by position) from unnest(p_options) with ordinality as a(opt,position)),
  now()+(p_days||' days')::interval)
 returning id into created_id;
 return created_id;
end; $$;
revoke all on function public.create_blumbook_poll(text,text[],integer) from public,anon;
grant execute on function public.create_blumbook_poll(text,text[],integer) to authenticated;

create or replace function public.poll_results()
returns table(poll_id uuid,option_index integer,votes bigint)
language sql stable security definer set search_path='' as $$
 select v.poll_id,v.option_index,count(*)::bigint
 from public.poll_votes v join public.polls p on p.id=v.poll_id
 group by v.poll_id,v.option_index
$$;
revoke all on function public.poll_results() from public;
grant execute on function public.poll_results() to anon,authenticated;

-- 3. Live sessions are a directory for creator-provided external broadcasts.
-- Native real-time video/audio requires a separate streaming provider.
create table if not exists public.live_sessions(
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 5 and 100),
 description text not null default '' check(char_length(description)<=600),
 mode text not null check(mode in('audio','video')),
 starts_at timestamptz not null,
 status text not null default 'scheduled' check(status in('scheduled','live','ended')),
 broadcast_url text check(broadcast_url is null or broadcast_url ~ '^https://'),
 created_at timestamptz not null default now()
);
create index if not exists live_sessions_upcoming_idx on public.live_sessions(status,starts_at);
alter table public.live_sessions enable row level security;
drop policy if exists "Live sessions directory public" on public.live_sessions;
create policy "Live sessions directory public" on public.live_sessions for select using(true);
drop policy if exists "Hosts create sessions" on public.live_sessions;
create policy "Hosts create sessions" on public.live_sessions for insert to authenticated with check(host_id=auth.uid());
drop policy if exists "Hosts manage sessions" on public.live_sessions;
create policy "Hosts manage sessions" on public.live_sessions for update to authenticated using(host_id=auth.uid()) with check(host_id=auth.uid());
drop policy if exists "Hosts remove sessions" on public.live_sessions;
create policy "Hosts remove sessions" on public.live_sessions for delete to authenticated using(host_id=auth.uid());
revoke all on public.live_sessions from anon,authenticated;
grant select on public.live_sessions to anon,authenticated;
grant insert(host_id,title,description,mode,starts_at,broadcast_url,status) on public.live_sessions to authenticated;
grant update(title,description,mode,starts_at,broadcast_url,status) on public.live_sessions to authenticated;
grant delete on public.live_sessions to authenticated;

create table if not exists public.live_attendees(
 session_id uuid not null references public.live_sessions(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(session_id,user_id)
);
alter table public.live_attendees enable row level security;
drop policy if exists "See own live RSVPs" on public.live_attendees;
create policy "See own live RSVPs" on public.live_attendees for select to authenticated
using(user_id=auth.uid() or exists(select 1 from public.live_sessions s where s.id=session_id and s.host_id=auth.uid()));
drop policy if exists "RSVP for live" on public.live_attendees;
create policy "RSVP for live" on public.live_attendees for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "Remove own RSVP" on public.live_attendees;
create policy "Remove own RSVP" on public.live_attendees for delete to authenticated using(user_id=auth.uid());
revoke all on public.live_attendees from anon,authenticated;
grant select on public.live_attendees to authenticated;
grant insert(session_id,user_id) on public.live_attendees to authenticated;
grant delete on public.live_attendees to authenticated;

-- 4. Staff-reviewed verification. A request NEVER sets verified=true.
create table if not exists public.verification_requests(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 category text not null check(category in('creator','organization','public_figure')),
 reason text not null check(char_length(btrim(reason)) between 30 and 900),
 reference_url text not null check(reference_url ~ '^https://'),
 status text not null default 'pending' check(status in('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create unique index if not exists one_pending_verification on public.verification_requests(user_id) where status='pending';
alter table public.verification_requests enable row level security;
drop policy if exists "Read own verification requests" on public.verification_requests;
create policy "Read own verification requests" on public.verification_requests for select to authenticated using(user_id=auth.uid());
drop policy if exists "Apply for verification" on public.verification_requests;
create policy "Apply for verification" on public.verification_requests for insert to authenticated with check(user_id=auth.uid());
revoke all on public.verification_requests from anon,authenticated;
grant select on public.verification_requests to authenticated;
grant insert(user_id,category,reason,reference_url) on public.verification_requests to authenticated;
-- Administrative review must happen with trusted staff credentials via secure backend.

create table if not exists public.creator_earnings_waitlist(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.creator_earnings_waitlist enable row level security;
drop policy if exists "See own earnings interest" on public.creator_earnings_waitlist;
create policy "See own earnings interest" on public.creator_earnings_waitlist for select to authenticated using(user_id=auth.uid());
drop policy if exists "Express earnings interest" on public.creator_earnings_waitlist;
create policy "Express earnings interest" on public.creator_earnings_waitlist for insert to authenticated with check(user_id=auth.uid());
revoke all on public.creator_earnings_waitlist from anon,authenticated;
grant select on public.creator_earnings_waitlist to authenticated;
grant insert(user_id) on public.creator_earnings_waitlist to authenticated;

-- 5. Scheduled posts. Publishing takes place in an admin-only worker RPC.
create table if not exists public.scheduled_posts(
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 500),
 publish_at timestamptz not null,
 status text not null default 'pending' check(status in('pending','published','failed')),
 posted_post_id uuid references public.posts(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists scheduled_pending_idx on public.scheduled_posts(publish_at) where status='pending';
alter table public.scheduled_posts enable row level security;
drop policy if exists "See own schedules" on public.scheduled_posts;
create policy "See own schedules" on public.scheduled_posts for select to authenticated using(author_id=auth.uid());
drop policy if exists "Create own schedule" on public.scheduled_posts;
create policy "Create own schedule" on public.scheduled_posts for insert to authenticated
with check(author_id=auth.uid() and publish_at>now()+interval '4 minutes' and publish_at<now()+interval '91 days');
drop policy if exists "Cancel pending schedule" on public.scheduled_posts;
create policy "Cancel pending schedule" on public.scheduled_posts for delete to authenticated using(author_id=auth.uid() and status='pending');
revoke all on public.scheduled_posts from anon,authenticated;
grant select on public.scheduled_posts to authenticated;
grant insert(author_id,body,publish_at) on public.scheduled_posts to authenticated;
grant delete on public.scheduled_posts to authenticated;

alter table public.posts add column if not exists scheduled_source_id uuid unique references public.scheduled_posts(id) on delete set null;
-- Reserve scheduled_source_id for the trusted worker.
revoke insert on public.posts from authenticated;
grant insert(author_id,body,image_url,video_url) on public.posts to authenticated;

create or replace function public.publish_due_blumbook_posts()
returns integer language plpgsql security definer set search_path='' as $$
declare row public.scheduled_posts%rowtype; new_post_id uuid; published_count integer:=0;
begin
 if current_user<>'postgres' and auth.role()<>'service_role' then
   raise exception 'Service role only';
 end if;
 for row in
  select * from public.scheduled_posts where status='pending' and publish_at<=now()
  order by publish_at asc limit 50 for update skip locked
 loop
  begin
   new_post_id:=null;
   insert into public.posts(author_id,body,scheduled_source_id)
   values(row.author_id,row.body,row.id)
   on conflict(scheduled_source_id) do nothing
   returning id into new_post_id;
   if new_post_id is null then
      select p.id into new_post_id from public.posts p where p.scheduled_source_id=row.id;
   end if;
   update public.scheduled_posts set status='published',posted_post_id=new_post_id where id=row.id;
   published_count:=published_count+1;
  exception when others then
   update public.scheduled_posts set status='failed' where id=row.id;
  end;
 end loop;
 return published_count;
end; $$;
revoke all on function public.publish_due_blumbook_posts() from public,anon,authenticated;
grant execute on function public.publish_due_blumbook_posts() to service_role;

-- 6. AI text generation: atomic ten requests/member/day, no secret API key in client.
create table if not exists public.ai_daily_usage(
 user_id uuid not null references public.profiles(id) on delete cascade,
 usage_day date not null default (now() at time zone 'utc')::date,
 used_count integer not null default 0 check(used_count>=0 and used_count<=10),
 primary key(user_id,usage_day)
);
alter table public.ai_daily_usage enable row level security;
revoke all on public.ai_daily_usage from anon,authenticated;
create or replace function public.claim_ai_daily_quota()
returns boolean language plpgsql security definer set search_path='' as $$
declare new_value integer;
begin
 if auth.uid() is null then return false; end if;
 insert into public.ai_daily_usage(user_id,usage_day,used_count)
 values(auth.uid(),(now() at time zone 'utc')::date,1)
 on conflict(user_id,usage_day) do update set used_count=public.ai_daily_usage.used_count+1
 where public.ai_daily_usage.used_count<10
 returning used_count into new_value;
 return new_value is not null;
end; $$;
revoke all on function public.claim_ai_daily_quota() from public,anon;
grant execute on function public.claim_ai_daily_quota() to authenticated;

-- IMPORTANT: Before public release, validate RLS using three real accounts,
-- provision moderation and abuse controls, enable SMTP verification, review
-- streaming/video-storage costs, and configure the server-side cron and AI provider.
