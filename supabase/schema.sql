-- 패턴노트: 계정 / 매매계획 / 매매기록
-- Dashboard SQL Editor에 붙여넣고 Run 해도 됩니다.

create table if not exists public.accounts (
  id text primary key,
  kakao_id text unique,
  nickname text not null default '회원',
  onboarded boolean not null default false,
  login_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  stock_code text not null,
  stock_name text not null,
  market text not null,
  target_buy numeric,
  stop_loss numeric,
  take_profit numeric,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_account_id_idx on public.plans (account_id);

create table if not exists public.trades (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  plan_id text references public.plans(id) on delete set null,
  side text not null check (side in ('buy', 'sell')),
  stock_code text not null,
  stock_name text not null,
  market text not null,
  price numeric not null,
  qty numeric not null,
  traded_at date not null,
  reasons jsonb not null default '[]'::jsonb,
  moods jsonb not null default '[]'::jsonb,
  is_practice boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trades add column if not exists traded_time text;

create index if not exists trades_account_id_idx on public.trades (account_id);
create index if not exists trades_account_side_idx on public.trades (account_id, side);

alter table public.accounts enable row level security;
alter table public.plans enable row level security;
alter table public.trades enable row level security;

drop policy if exists "accounts open" on public.accounts;
create policy "accounts open" on public.accounts for all using (true) with check (true);

drop policy if exists "plans open" on public.plans;
create policy "plans open" on public.plans for all using (true) with check (true);

drop policy if exists "trades open" on public.trades;
create policy "trades open" on public.trades for all using (true) with check (true);

grant all on public.accounts to anon, authenticated, service_role;
grant all on public.plans to anon, authenticated, service_role;
grant all on public.trades to anon, authenticated, service_role;
