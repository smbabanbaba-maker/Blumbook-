-- BLUMBOOK PHASE 4: full profile header / cover photos / pinned posts.
-- Apply after schema.sql, phase2.sql and phase3.sql in your Supabase SQL Editor.
-- IMPORTANT: do not expose a service-role key in the browser.

alter table public.profiles
  add column if not exists banner_url text;

alter table public.profiles
  add column if not exists pinned_post_id uuid references public.posts(id) on delete set null;

-- Users may update their profile media and pinned-post selection but can never update
-- the verified flag, user id, username or registration timestamp through public clients.
revoke update on public.profiles from authenticated;
grant update (display_name,bio,location,avatar_url,banner_url,pinned_post_id)
  on public.profiles to authenticated;

create or replace function public.validate_profile_pinned_post()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pinned_post_id is not null and not exists (
    select 1
    from public.posts p
    where p.id = new.pinned_post_id
      and p.author_id = new.id
  ) then
    raise exception 'Only one of your own posts may be pinned';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_profile_pinned_post on public.profiles;
create trigger validate_profile_pinned_post
  before insert or update of pinned_post_id on public.profiles
  for each row execute function public.validate_profile_pinned_post();

-- Storage bucket "post-media" created in schema.sql is reused for profile imagery.
-- Existing insert RLS restricts uploads to folders prefixed by auth.uid() and
-- restricts MIME types / file size. No additional public write access is granted.

-- Test before launching: attempts to pin another account's post must fail;
-- unauthenticated updates and updates to verified/username must fail.
