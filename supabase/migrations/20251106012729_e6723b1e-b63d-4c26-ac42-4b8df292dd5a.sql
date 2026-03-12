-- Fix critical privilege escalation vulnerability
-- Create enum for roles
create type public.app_role as enum ('admin', 'moderator', 'official', 'expert', 'journalist', 'citizen');

-- Create secure user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null default 'citizen',
  assigned_at timestamp with time zone default now(),
  assigned_by uuid references auth.users(id),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Users can view their own roles
create policy "Users can view their own roles"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

-- Only admins can assign roles (via has_role function we'll create)
create policy "Admins can manage roles"
  on public.user_roles
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Create SECURITY DEFINER function to safely check roles
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
insert into public.user_roles (user_id, role)
select id, role::public.app_role
from public.profiles
where role is not null
on conflict (user_id, role) do nothing;

-- Update RLS policies to use has_role function
drop policy if exists "Moderators can manage comment flairs" on public.comment_flairs;
create policy "Moderators can manage comment flairs"
  on public.comment_flairs
  for all
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

drop policy if exists "Moderators can view moderation logs" on public.comment_moderation_log;
create policy "Moderators can view moderation logs"
  on public.comment_moderation_log
  for select
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

drop policy if exists "Moderators can manage comment awards" on public.comment_awards;
create policy "Moderators can manage comment awards"
  on public.comment_awards
  for all
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));

drop policy if exists "Verified users can view private official contacts" on public.official_contacts;
create policy "Verified users can view private official contacts"
  on public.official_contacts
  for select
  using (
    (is_public = false) 
    and auth.uid() is not null 
    and (
      public.has_role(auth.uid(), 'official') 
      or public.has_role(auth.uid(), 'journalist') 
      or public.has_role(auth.uid(), 'expert')
      or public.has_role(auth.uid(), 'admin')
    )
    and exists (
      select 1 from profiles
      where id = auth.uid() and is_verified = true
    )
  );

drop policy if exists "Community moderators can manage flairs" on public.community_flairs;
create policy "Community moderators can manage flairs"
  on public.community_flairs
  for all
  using (
    exists (
      select 1 from community_moderators cm
      where cm.community_id = community_flairs.community_id 
        and cm.user_id = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Community admins can manage moderators" on public.community_moderators;
create policy "Community admins can manage moderators"
  on public.community_moderators
  for all
  using (
    exists (
      select 1 from community_moderators cm
      where cm.community_id = community_moderators.community_id 
        and cm.user_id = auth.uid() 
        and cm.role = 'admin'
    )
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Community moderators can manage rules" on public.community_rules;
create policy "Community moderators can manage rules"
  on public.community_rules
  for all
  using (
    exists (
      select 1 from community_moderators cm
      where cm.community_id = community_rules.community_id 
        and cm.user_id = auth.uid()
    )
    or public.has_role(auth.uid(), 'admin')
  );

-- Make storage buckets private and add RLS policies
update storage.buckets set public = false where id in ('media', 'comment-media');

-- RLS for media bucket
create policy "Users can upload their own media"
  on storage.objects
  for insert
  with check (
    bucket_id = 'media' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view media they have access to"
  on storage.objects
  for select
  using (
    bucket_id = 'media'
    and (
      -- Own files
      auth.uid()::text = (storage.foldername(name))[1]
      -- Or public posts
      or exists (
        select 1 from post_media pm
        join posts p on p.id = pm.post_id
        where pm.file_path = name
      )
    )
  );

create policy "Users can delete their own media"
  on storage.objects
  for delete
  using (
    bucket_id = 'media' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS for comment-media bucket  
create policy "Users can upload their own comment media"
  on storage.objects
  for insert
  with check (
    bucket_id = 'comment-media' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view comment media they have access to"
  on storage.objects
  for select
  using (
    bucket_id = 'comment-media'
    and (
      -- Own files
      auth.uid()::text = (storage.foldername(name))[1]
      -- Or accessible comments
      or exists (
        select 1 from comment_media cm
        join comments c on c.id = cm.comment_id
        where cm.file_path = name
      )
    )
  );

create policy "Users can delete their own comment media"
  on storage.objects
  for delete
  using (
    bucket_id = 'comment-media' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );