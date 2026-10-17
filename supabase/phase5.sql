-- Blumbook Phase 5: Opportunities, direct messages, notifications and video.
-- Apply after schema.sql, phase2.sql, phase3.sql and phase4.sql.
-- The browser MUST use only public Supabase keys. NEVER put service_role in client env.
alter table public.posts add column if not exists video_url text;
-- Each post contains either an image or video, not both.
alter table public.posts add constraint post_single_media check(image_url is null or video_url is null);

create table if not exists public.opportunities(
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 5 and 110),
 description text not null check(char_length(btrim(description)) between 20 and 2000),
 category text not null check(category in('Collaboration','Mentorship','Project','Freelance','Learning')),
 location_type text not null check(location_type in('Remote','Hybrid','In-person')),
 status text not null default 'open' check(status in('open','closed')),
 created_at timestamptz not null default now()
);
create index if not exists opp_latest_idx on public.opportunities(created_at desc);
alter table public.opportunities enable row level security;
drop policy if exists "Read opportunities" on public.opportunities;
create policy "Read opportunities" on public.opportunities for select using(true);
drop policy if exists "Create opportunities" on public.opportunities;
create policy "Create opportunities" on public.opportunities for insert to authenticated with check(author_id=auth.uid());
drop policy if exists "Edit own opportunities" on public.opportunities;
create policy "Edit own opportunities" on public.opportunities for update to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
drop policy if exists "Delete own opportunities" on public.opportunities;
create policy "Delete own opportunities" on public.opportunities for delete to authenticated using(author_id=auth.uid());
grant select on public.opportunities to anon,authenticated;
grant insert,update,delete on public.opportunities to authenticated;

create table if not exists public.opportunity_interests(
 id uuid primary key default gen_random_uuid(),
 opportunity_id uuid not null references public.opportunities(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 message text not null check(char_length(btrim(message)) between 10 and 600),
 created_at timestamptz not null default now(),
 unique(opportunity_id,sender_id)
);
alter table public.opportunity_interests enable row level security;
drop policy if exists "Read own interest" on public.opportunity_interests;
create policy "Read own interest" on public.opportunity_interests for select to authenticated
using(sender_id=auth.uid() or exists(select 1 from public.opportunities p where p.id=opportunity_id and p.author_id=auth.uid()));
drop policy if exists "Send interest" on public.opportunity_interests;
create policy "Send interest" on public.opportunity_interests for insert to authenticated
with check(sender_id=auth.uid() and exists(select 1 from public.opportunities p where p.id=opportunity_id and p.author_id<>auth.uid() and p.status='open'));
drop policy if exists "Withdraw interest" on public.opportunity_interests;
create policy "Withdraw interest" on public.opportunity_interests for delete to authenticated using(sender_id=auth.uid());
grant select,insert,delete on public.opportunity_interests to authenticated;

create table if not exists public.direct_messages(
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 1500),
 created_at timestamptz not null default now(),
 read_at timestamptz,
 constraint messages_not_to_self check(sender_id<>recipient_id)
);
create index if not exists dm_sender_idx on public.direct_messages(sender_id,created_at desc);
create index if not exists dm_recipient_idx on public.direct_messages(recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
drop policy if exists "Participants read messages" on public.direct_messages;
create policy "Participants read messages" on public.direct_messages for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
drop policy if exists "Send own messages" on public.direct_messages;
create policy "Send own messages" on public.direct_messages for insert to authenticated with check(sender_id=auth.uid());
drop policy if exists "Recipient acknowledges message" on public.direct_messages;
create policy "Recipient acknowledges message" on public.direct_messages for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
revoke update on public.direct_messages from authenticated;
grant select,insert on public.direct_messages to authenticated;
grant update(read_at) on public.direct_messages to authenticated;
-- Immutable text and participants (a recipient can only update read_at).
create or replace function public.validate_message_update()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.sender_id<>old.sender_id or new.recipient_id<>old.recipient_id or
 new.body<>old.body or new.created_at<>old.created_at then
  raise exception 'Message text and participants are immutable';
 end if;
 return new;
end; $$;
drop trigger if exists validate_message_update on public.direct_messages;
create trigger validate_message_update before update on public.direct_messages for each row execute function public.validate_message_update();

create table if not exists public.user_notifications(
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid not null references public.profiles(id) on delete cascade,
 type text not null check(type in('like','follow','reply','message')),
 post_id uuid references public.posts(id) on delete cascade,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index if not exists user_alerts_recipient_idx on public.user_notifications(recipient_id,created_at desc);
alter table public.user_notifications enable row level security;
drop policy if exists "Recipient sees notifications" on public.user_notifications;
create policy "Recipient sees notifications" on public.user_notifications for select to authenticated using(recipient_id=auth.uid());
drop policy if exists "Recipient reads notifications" on public.user_notifications;
create policy "Recipient reads notifications" on public.user_notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
revoke insert,update,delete on public.user_notifications from anon,authenticated;
grant select on public.user_notifications to authenticated;
grant update(read_at) on public.user_notifications to authenticated;
create or replace function public.create_social_notification()
returns trigger language plpgsql security definer set search_path='' as $$
declare who uuid; actor uuid; kind text; targetpost uuid;
begin
 if tg_table_name='likes' then
  actor:=new.user_id;targetpost:=new.post_id;kind:='like';
  select author_id into who from public.posts where id=targetpost;
 elsif tg_table_name='follows' then
  who:=new.following_id;actor:=new.follower_id;kind:='follow';targetpost:=null;
 elsif tg_table_name='comments' then
  actor:=new.author_id;targetpost:=new.post_id;kind:='reply';
  select author_id into who from public.posts where id=targetpost;
 elsif tg_table_name='direct_messages' then
  who:=new.recipient_id;actor:=new.sender_id;kind:='message';targetpost:=null;
 end if;
 if who is not null and who<>actor then
 insert into public.user_notifications(recipient_id,actor_id,type,post_id)
 values(who,actor,kind,targetpost);
 end if;
 return new;
end; $$;
drop trigger if exists blumbook_notify_likes on public.likes;
create trigger blumbook_notify_likes after insert on public.likes for each row execute function public.create_social_notification();
drop trigger if exists blumbook_notify_follows on public.follows;
create trigger blumbook_notify_follows after insert on public.follows for each row execute function public.create_social_notification();
drop trigger if exists blumbook_notify_comments on public.comments;
create trigger blumbook_notify_comments after insert on public.comments for each row execute function public.create_social_notification();
drop trigger if exists blumbook_notify_messages on public.direct_messages;
create trigger blumbook_notify_messages after insert on public.direct_messages for each row execute function public.create_social_notification();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('post-videos','post-videos',true,31457280,array['video/mp4','video/webm'])
on conflict(id) do nothing;
drop policy if exists "Anyone may see post videos" on storage.objects;
create policy "Anyone may see post videos" on storage.objects for select using(bucket_id='post-videos');
drop policy if exists "Members upload own post videos" on storage.objects;
create policy "Members upload own post videos" on storage.objects for insert to authenticated
with check(bucket_id='post-videos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Members delete own videos" on storage.objects;
create policy "Members delete own videos" on storage.objects for delete to authenticated
using(bucket_id='post-videos' and (storage.foldername(name))[1]=auth.uid()::text);
-- Before public launch: video transcoding/CDN, moderation, rate limiting,
-- reporting/blocks, password recovery, legal/privacy compliance and operational backups.
