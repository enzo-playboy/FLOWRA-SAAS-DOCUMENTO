-- ProdFind — schema (INSTÂNCIA PRÓPRIA do Supabase)
-- RLS ligado em todas as tabelas com dados de usuário.
-- Rode este SQL no SQL Editor do seu projeto Supabase.

create extension if not exists "uuid-ossp";

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  email text not null,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists leads_email_idx on public.leads (email);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'trial',
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.searches (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  query text not null,
  results_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_products (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_external_id text not null,
  cost numeric(10,2),
  margin_pct numeric(5,2),
  created_at timestamptz not null default now(),
  unique (user_id, product_external_id)
);

create table if not exists public.alerts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_external_id text not null,
  threshold numeric(10,2),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  status text not null default 'active',
  stripe_sub_id text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.leads enable row level security;
alter table public.users enable row level security;
alter table public.searches enable row level security;
alter table public.saved_products enable row level security;
alter table public.alerts enable row level security;
alter table public.subscriptions enable row level security;

-- leads: escrita anônima permitida (captura de lead); leitura só backend (service role)
create policy "leads insert anon" on public.leads
  for insert to anon, authenticated with check (true);

-- users: o próprio usuário só vê o seu registro
create policy "users self" on public.users
  for select using (auth.uid() = id);

-- saved_products / alerts / subscriptions: só o dono (defesa em profundidade;
-- o backend também reforça user_id a partir da sessão)
create policy "saved_self" on public.saved_products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "alerts_self" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subs_self" on public.subscriptions
  for select using (auth.uid() = user_id);
