-- =========================================================================
-- House Manager — Supabase schema
-- Run this SQL once in your Supabase project's SQL Editor.
-- =========================================================================

-- Standing duties: a single row with the recurring Tuesday + Thursday tasks
create table if not exists standing_duties (
  id integer primary key default 1,
  data jsonb not null,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Library of saved weekly plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  week_date date not null,
  data jsonb not null,
  saved_at timestamptz default now()
);

create index if not exists plans_week_date_idx on plans(week_date desc);

-- =========================================================================
-- Row-level security
-- =========================================================================
-- This app is built for personal use. The simplest setup is to leave RLS
-- DISABLED and just keep your Netlify URL private (don't share publicly).
--
-- If you'd rather lock it down, enable RLS and add policies for your
-- authenticated user. See README.md → "Adding authentication" for details.
-- =========================================================================

alter table standing_duties disable row level security;
alter table plans disable row level security;
