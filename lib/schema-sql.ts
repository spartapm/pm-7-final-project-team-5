export const SCHEMA_SQL = `-- 패턴노트: 계정 / 매매계획 / 매매기록 / 인사이트 카드
-- Dashboard SQL Editor에 붙여넣고 Run 해도 됩니다.

create table if not exists public.accounts (
  id text primary key,
  kakao_id text unique,
  nickname text not null default '회원',
  onboarded boolean not null default false,
  login_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.accounts add column if not exists issue_baseline_buy integer not null default 0;
alter table public.accounts add column if not exists issue_baseline_sell integer not null default 0;

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

alter table public.plans add column if not exists side text not null default 'buy';
alter table public.plans add column if not exists buy_min numeric;
alter table public.plans add column if not exists buy_max numeric;
create index if not exists plans_account_side_idx on public.plans (account_id, side);

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
alter table public.trades add column if not exists plan_snapshot jsonb;
alter table public.trades add column if not exists hidden_plan jsonb not null default '{}'::jsonb;

create index if not exists trades_account_id_idx on public.trades (account_id);
create index if not exists trades_account_side_idx on public.trades (account_id, side);

-- 발행된 인사이트 카드. insert-only (내러티브 수정·행 삭제 없음).
-- 매매기록 삭제와 무관하게 유지. 회원 탈퇴 시에만 accounts cascade로 제거.
create table if not exists public.insight_cards (
  id text primary key,
  account_id text not null references public.accounts(id) on delete cascade,
  side text not null check (side in ('buy', 'sell')),
  issued_at timestamptz not null,
  date_key date not null,
  mood_meta text not null,
  mood_label text not null,
  reason_level text not null check (reason_level in ('sub', 'group')),
  reason_group text not null,
  reason_meta text not null,
  reason_labels jsonb not null default '[]'::jsonb,
  match_count integer not null,
  window_size integer not null,
  score numeric not null,
  narrative1 text not null,
  narrative2 text not null,
  related_trade_ids jsonb not null default '[]'::jsonb,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists insight_cards_account_issued_idx
  on public.insight_cards (account_id, issued_at desc);
create index if not exists insight_cards_account_date_side_idx
  on public.insight_cards (account_id, date_key, side);

alter table public.accounts enable row level security;
alter table public.plans enable row level security;
alter table public.trades enable row level security;
alter table public.insight_cards enable row level security;

drop policy if exists "accounts open" on public.accounts;
create policy "accounts open" on public.accounts for all using (true) with check (true);

drop policy if exists "plans open" on public.plans;
create policy "plans open" on public.plans for all using (true) with check (true);

drop policy if exists "trades open" on public.trades;
create policy "trades open" on public.trades for all using (true) with check (true);

drop policy if exists "insight cards open" on public.insight_cards;
create policy "insight cards open" on public.insight_cards for all using (true) with check (true);

grant all on public.accounts to anon, authenticated, service_role;
grant all on public.plans to anon, authenticated, service_role;
grant all on public.trades to anon, authenticated, service_role;
grant all on public.insight_cards to anon, authenticated, service_role;
`;
