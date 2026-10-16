-- Blumbook starter database — run in Supabase SQL Editor.
-- No service role key is used in the browser.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 30),
  display_name text not null check (char_length(display_name) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 160),
  location text not null default '',
  avatar_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_author_idx on public.posts(author_id,created_at desc);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
create table if not exists public.reposts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
create table if not exists public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id)
);
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id,following_id),
  constraint no_self_follow check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments(post_id,created_at);

-- Automatically create a safe, unique username when a user signs up.
create or replace function public.handle_new_blumbook_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare base_name text;
begin
  base_name := lower(regexp_replace(split_part(coalesce(new.email,'member'), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base_name) < 3 then base_name := 'member'; end if;
  insert into public.profiles(id,username,display_name)
  values (
    new.id,
    left(base_name,19) || '_' || left(replace(new.id::text,'-',''),8),
    left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),base_name),50)
  )
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_blumbook_auth_user_created on auth.users;
create trigger on_blumbook_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_blumbook_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.reposts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Public profiles can be read" on public.profiles;
create policy "Public profiles can be read" on public.profiles for select using (true);
drop policy if exists "Members edit their own profiles" on public.profiles;
create policy "Members edit their own profiles" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Prevent self-verification and changes to an identity column.
revoke update on public.profiles from authenticated;
grant update (display_name,bio,location,avatar_url) on public.profiles to authenticated;
grant select on public.profiles to anon,authenticated;

drop policy if exists "Posts are public" on public.posts;
create policy "Posts are public" on public.posts for select using (true);
drop policy if exists "Members add their own posts" on public.posts;
create policy "Members add their own posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Members remove their own posts" on public.posts;
create policy "Members remove their own posts" on public.posts for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "Likes can be read" on public.likes;
create policy "Likes can be read" on public.likes for select using (true);
drop policy if exists "Members like posts" on public.likes;
create policy "Members like posts" on public.likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members remove own likes" on public.likes;
create policy "Members remove own likes" on public.likes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Reposts can be read" on public.reposts;
create policy "Reposts can be read" on public.reposts for select using (true);
drop policy if exists "Members repost" on public.reposts;
create policy "Members repost" on public.reposts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members remove reposts" on public.reposts;
create policy "Members remove reposts" on public.reposts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Members read their bookmarks" on public.bookmarks;
create policy "Members read their bookmarks" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Members save bookmarks" on public.bookmarks;
create policy "Members save bookmarks" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members remove bookmarks" on public.bookmarks;
create policy "Members remove bookmarks" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Follows are public" on public.follows;
create policy "Follows are public" on public.follows for select using (true);
drop policy if exists "Members can follow" on public.follows;
create policy "Members can follow" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
drop policy if exists "Members can unfollow" on public.follows;
create policy "Members can unfollow" on public.follows for delete to authenticated using (auth.uid() = follower_id);

drop policy if exists "Comments are public" on public.comments;
create policy "Comments are public" on public.comments for select using (true);
drop policy if exists "Members can reply" on public.comments;
create policy "Members can reply" on public.comments for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Members can delete own replies" on public.comments;
create policy "Members can delete own replies" on public.comments for delete to authenticated using (auth.uid() = author_id);

-- Public images; only authenticated users can write to their own folder.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('post-media','post-media',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
drop policy if exists "Public can view post images" on storage.objects;
create policy "Public can view post images" on storage.objects for select using (bucket_id='post-media');
drop policy if exists "Members can upload to their folder" on storage.objects;
create policy "Members can upload to their folder" on storage.objects
for insert to authenticated
with check (bucket_id='post-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Members can delete their images" on storage.objects;
create policy "Members can delete their images" on storage.objects
for delete to authenticated
using (bucket_id='post-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- NOTE: This schema enables public posts. Before a larger public launch,
-- add rate limits, anti-spam, moderation, reporting, abuse reviews, and GDPR/NDPR procedures.
