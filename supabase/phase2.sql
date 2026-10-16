-- Blumbook Phase 2 migration. Apply after supabase/schema.sql.
-- All new tables have Row Level Security (RLS). Run in the Supabase SQL Editor.
create table if not exists public.profile_extras (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 headline text not null default '' check(char_length(headline)<=90),
 skills text[] not null default '{}' check(cardinality(skills)<=12),
 portfolio_url text not null default '' check(char_length(portfolio_url)<=300 and (portfolio_url='' or portfolio_url ~ '^https://')),
 updated_at timestamptz not null default now()
);
alter table public.profile_extras enable row level security;
drop policy if exists "Public profile extras" on public.profile_extras;
create policy "Public profile extras" on public.profile_extras for select using(true);
drop policy if exists "Create own extra" on public.profile_extras;
create policy "Create own extra" on public.profile_extras for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "Edit own extra" on public.profile_extras;
create policy "Edit own extra" on public.profile_extras for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
grant select on public.profile_extras to anon,authenticated;
grant insert,update on public.profile_extras to authenticated;

create table if not exists public.bloom_circles (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(btrim(title)) between 3 and 55),
 description text not null check(char_length(btrim(description)) between 10 and 280),
 topic text not null check(topic in ('Learning','Startups','Creators','Technology','Career','Community')),
 icon text not null default '◎' check(char_length(icon)<=4),
 created_by uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index if not exists bloom_circles_created on public.bloom_circles(created_at desc);
create table if not exists public.bloom_circle_members (
 circle_id uuid not null references public.bloom_circles(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(),
 primary key(circle_id,user_id)
);
create index if not exists bloom_members_user on public.bloom_circle_members(user_id);
create table if not exists public.bloom_circle_posts (
 id uuid primary key default gen_random_uuid(),
 circle_id uuid not null references public.bloom_circles(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('Idea','Opportunity','Question')),
 body text not null check(char_length(btrim(body)) between 1 and 500),
 created_at timestamptz not null default now()
);
create index if not exists bloom_posts_feed on public.bloom_circle_posts(circle_id,created_at desc);
alter table public.bloom_circles enable row level security;
alter table public.bloom_circle_members enable row level security;
alter table public.bloom_circle_posts enable row level security;
drop policy if exists "Public circles" on public.bloom_circles;
create policy "Public circles" on public.bloom_circles for select using(true);
drop policy if exists "Create own circles" on public.bloom_circles;
create policy "Create own circles" on public.bloom_circles for insert to authenticated with check(auth.uid()=created_by);
drop policy if exists "Read circle members" on public.bloom_circle_members;
create policy "Read circle members" on public.bloom_circle_members for select using(true);
drop policy if exists "Join as self" on public.bloom_circle_members;
create policy "Join as self" on public.bloom_circle_members for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "Leave as self" on public.bloom_circle_members;
create policy "Leave as self" on public.bloom_circle_members for delete to authenticated using(auth.uid()=user_id);
drop policy if exists "Read circle discussions" on public.bloom_circle_posts;
create policy "Read circle discussions" on public.bloom_circle_posts for select using(true);
drop policy if exists "Members create discussions" on public.bloom_circle_posts;
create policy "Members create discussions" on public.bloom_circle_posts for insert to authenticated
with check(auth.uid()=author_id and exists(select 1 from public.bloom_circle_members m where m.circle_id=bloom_circle_posts.circle_id and m.user_id=auth.uid()));
drop policy if exists "Authors delete discussions" on public.bloom_circle_posts;
create policy "Authors delete discussions" on public.bloom_circle_posts for delete to authenticated using(auth.uid()=author_id);
grant select on public.bloom_circles,public.bloom_circle_members,public.bloom_circle_posts to anon,authenticated;
grant insert on public.bloom_circles,public.bloom_circle_members,public.bloom_circle_posts to authenticated;
grant delete on public.bloom_circle_members,public.bloom_circle_posts to authenticated;

-- Intake table only; there is no staffed moderation dashboard yet.
create table if not exists public.content_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 reason text not null check(reason in ('Spam','Harassment','Hate','Violence','Other')),
 created_at timestamptz not null default now(),
 unique(reporter_id,post_id)
);
alter table public.content_reports enable row level security;
drop policy if exists "Submit own report" on public.content_reports;
create policy "Submit own report" on public.content_reports for insert to authenticated with check(auth.uid()=reporter_id);
grant insert on public.content_reports to authenticated;
-- Deliberately no client SELECT/UPDATE/DELETE report policies.
