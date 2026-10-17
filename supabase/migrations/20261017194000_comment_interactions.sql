-- BLUMBOOK: Comment conversations and engagement (October 2026)
-- Apply once in Supabase SQL editor before enabling these actions for signed-in users.
-- Existing comments and post interactions are preserved.

alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments(parent_comment_id,created_at);

-- A reply must belong to the same post. Restrict to one visual nested level for
-- the MVP and prevent malformed parent links.
create or replace function public.validate_blumbook_comment_parent()
returns trigger language plpgsql set search_path = '' as $$
declare parent_post uuid; grandparent uuid;
begin
  if new.parent_comment_id is null then return new; end if;
  select post_id,parent_comment_id into parent_post,grandparent
  from public.comments where id=new.parent_comment_id;
  if parent_post is null or parent_post<>new.post_id then
    raise exception 'A comment reply must belong to the same post';
  end if;
  if grandparent is not null then
    raise exception 'Reply directly to the parent comment in this version';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_blumbook_comment_parent_trigger on public.comments;
create trigger validate_blumbook_comment_parent_trigger
before insert or update of parent_comment_id,post_id on public.comments
for each row execute function public.validate_blumbook_comment_parent();

create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);
create index if not exists comment_likes_user_idx on public.comment_likes(user_id);
create table if not exists public.comment_reposts (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);
create index if not exists comment_reposts_user_idx on public.comment_reposts(user_id);
create table if not exists public.comment_bookmarks (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);
create index if not exists comment_bookmarks_user_idx on public.comment_bookmarks(user_id);

alter table public.comment_likes enable row level security;
alter table public.comment_reposts enable row level security;
alter table public.comment_bookmarks enable row level security;
grant select on public.comment_likes,public.comment_reposts,public.comment_bookmarks to anon,authenticated;
grant insert,delete on public.comment_likes,public.comment_reposts,public.comment_bookmarks to authenticated;

drop policy if exists "Comment likes are readable" on public.comment_likes;
create policy "Comment likes are readable" on public.comment_likes for select using (true);
drop policy if exists "Members like comments" on public.comment_likes;
create policy "Members like comments" on public.comment_likes for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Members unlike own comment likes" on public.comment_likes;
create policy "Members unlike own comment likes" on public.comment_likes for delete to authenticated using (auth.uid()=user_id);

drop policy if exists "Comment reposts are readable" on public.comment_reposts;
create policy "Comment reposts are readable" on public.comment_reposts for select using (true);
drop policy if exists "Members repost comments" on public.comment_reposts;
create policy "Members repost comments" on public.comment_reposts for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Members undo own comment reposts" on public.comment_reposts;
create policy "Members undo own comment reposts" on public.comment_reposts for delete to authenticated using (auth.uid()=user_id);

drop policy if exists "Comment bookmarks are readable" on public.comment_bookmarks;
create policy "Comment bookmarks are readable" on public.comment_bookmarks for select using (true);
drop policy if exists "Members bookmark comments" on public.comment_bookmarks;
create policy "Members bookmark comments" on public.comment_bookmarks for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "Members remove own comment bookmarks" on public.comment_bookmarks;
create policy "Members remove own comment bookmarks" on public.comment_bookmarks for delete to authenticated using (auth.uid()=user_id);

-- The current schema has no verified impression model for comment views.
-- The UI therefore shows view numbers ONLY in explicitly marked demo mode.
