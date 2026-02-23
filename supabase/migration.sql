-- Syntara Database Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- =============================================================================
-- 1. PROFILES (extends Supabase auth.users with a display name)
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

-- Drop trigger if it exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 2. PROMPTS
-- =============================================================================
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prompts enable row level security;

create policy "Users can view own prompts"
  on public.prompts for select
  using (auth.uid() = user_id);

create policy "Users can insert own prompts"
  on public.prompts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own prompts"
  on public.prompts for update
  using (auth.uid() = user_id);

create policy "Users can delete own prompts"
  on public.prompts for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- 3. PROMPT VERSIONS
-- =============================================================================
create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  content text not null default '',
  score jsonb,          -- { total, breakdown, suggestions }
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.prompt_versions enable row level security;

create policy "Users can view own prompt versions"
  on public.prompt_versions for select
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_versions.prompt_id
        and prompts.user_id = auth.uid()
    )
  );

create policy "Users can insert own prompt versions"
  on public.prompt_versions for insert
  with check (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_versions.prompt_id
        and prompts.user_id = auth.uid()
    )
  );

create policy "Users can delete own prompt versions"
  on public.prompt_versions for delete
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_versions.prompt_id
        and prompts.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4. EXPERIMENTS (A/B compare)
-- =============================================================================
create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  prompt_a text not null default '',
  prompt_b text not null default '',
  score_a jsonb,        -- { total, breakdown, suggestions }
  score_b jsonb,
  created_at timestamptz not null default now()
);

alter table public.experiments enable row level security;

create policy "Users can view own experiments"
  on public.experiments for select
  using (auth.uid() = user_id);

create policy "Users can insert own experiments"
  on public.experiments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own experiments"
  on public.experiments for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- 5. INDEX for faster per-user queries
-- =============================================================================
create index if not exists idx_prompts_user_id on public.prompts(user_id);
create index if not exists idx_prompt_versions_prompt_id on public.prompt_versions(prompt_id);
create index if not exists idx_experiments_user_id on public.experiments(user_id);
