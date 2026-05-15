-- 1PhishGuard AI Supabase schema, RLS, triggers, and helper functions.
-- Run this in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'business')),
  scans_used integer default 0 not null,
  scans_limit integer default 5 not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  payment_failed boolean default false,
  created_at timestamptz default now()
);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  email_preview text,
  verdict text check (verdict in ('SAFE', 'SUSPICIOUS', 'PHISHING')),
  risk_score integer check (risk_score >= 0 and risk_score <= 100),
  result_json jsonb,
  created_at timestamptz default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text,
  created_at timestamptz default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

create index if not exists idx_scans_user_created on scans(user_id, created_at desc);
create index if not exists idx_scans_verdict on scans(verdict);
create index if not exists idx_profiles_stripe_customer on profiles(stripe_customer_id);
create index if not exists idx_team_members_user on team_members(user_id);

alter table profiles enable row level security;
alter table scans enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;

create or replace function public.is_team_owner(team_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.teams
    where id = $1
      and owner_id = auth.uid()
  );
$$ language sql security definer set search_path = public;

create or replace function public.is_team_member(team_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.team_members
    where team_id = $1
      and user_id = auth.uid()
  );
$$ language sql security definer set search_path = public;

drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can view own scans" on scans;
create policy "Users can view own scans"
  on scans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own scans" on scans;
create policy "Users can insert own scans"
  on scans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own scans" on scans;
create policy "Users can delete own scans"
  on scans for delete
  using (auth.uid() = user_id);

drop policy if exists "Team owner full access" on teams;
create policy "Team owner full access"
  on teams for all
  using (auth.uid() = owner_id);

drop policy if exists "Team members can view team" on teams;
create policy "Team members can view team"
  on teams for select
  using (public.is_team_member(id));

drop policy if exists "Team owner can manage members" on team_members;
create policy "Team owner can manage members"
  on team_members for all
  using (public.is_team_owner(team_id));

drop policy if exists "Members can view teammates" on team_members;
create policy "Members can view teammates"
  on team_members for select
  using (public.is_team_member(team_id));

drop policy if exists "Members can leave team" on team_members;
create policy "Members can leave team"
  on team_members for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, plan, scans_used, scans_limit)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    'free',
    0,
    5
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function increment_scan_count(user_id uuid)
returns void as $$
begin
  update profiles
  set scans_used = scans_used + 1
  where id = $1;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function reset_monthly_scans()
returns void as $$
begin
  update profiles
  set scans_used = 0
  where plan = 'free';
end;
$$ language plpgsql security definer set search_path = public;

-- Optional avatar bucket for Settings -> avatar upload.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload own avatars" on storage.objects;
create policy "Users can upload own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Avatar images are public" on storage.objects;
create policy "Avatar images are public"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Monthly reset with pg_cron after enabling the extension:
-- create extension if not exists pg_cron;
-- select cron.schedule('reset-scans', '0 0 1 * *', 'select reset_monthly_scans()');
