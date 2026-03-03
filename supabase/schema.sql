-- ============================================================
-- FinVault — Supabase Schema v2
-- Run this fresh in Supabase SQL Editor (replaces old schema)
-- Handles: Buy/Sell, P&L, LTCG/STCG, Indian asset categories,
--          SIPs, Dividends, auto avg_cost recalculation
-- ============================================================

create extension if not exists "uuid-ossp";


-- ─────────────────────────────────────────────────────────────
-- ACCOUNTS  (bank accounts, wallets)
-- ─────────────────────────────────────────────────────────────
create table accounts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  balance     numeric(15,2) default 0,
  type        text check (type in ('savings','current','investment','credit','wallet')) default 'savings',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- TRANSACTIONS  (income / expense ledger)
-- ─────────────────────────────────────────────────────────────
create table transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  account_id  uuid references accounts(id) on delete set null,
  date        date not null default current_date,
  description text not null,
  amount      numeric(15,2) not null,   -- positive = income, negative = expense
  category    text not null,
  created_at  timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- HOLDINGS  (open positions — one row per instrument per user)
--
-- asset_class covers every Indian + US instrument type:
--   equity       → Direct stocks (NSE/BSE)
--   us_equity    → US stocks (NYSE/NASDAQ)
--   etf          → ETFs (Nifty BeES, GoldBees, SilverETF, etc.)
--   index_fund   → Index mutual funds (NAV based, not exchange traded)
--   elss         → Equity Linked Savings Scheme (Section 80C)
--   mutual_fund  → Actively managed equity MF
--   debt_fund    → Debt MF (corporate bond, gilt, credit risk, etc.)
--   liquid_fund  → Liquid / overnight / money market fund
--   hybrid_fund  → Balanced / multi-asset / hybrid fund
--   gold         → Physical gold, Sovereign Gold Bonds (SGB)
--   silver       → Physical silver, Silver ETF
--   reit         → Real Estate Investment Trust
--   invit        → Infrastructure Investment Trust
--   crypto       → Cryptocurrency
--   other        → Anything else
--
-- sub_category gives finer detail:
--   For mutual_fund/elss: large_cap, mid_cap, small_cap, flexi_cap,
--                         value, contra, dividend_yield, focused, sectoral
--   For debt_fund:        gilt, corporate_bond, credit_risk, short_duration,
--                         ultra_short, dynamic_bond, fmp
--   For hybrid_fund:      aggressive, conservative, balanced, dynamic_asset_allocation
--   For gold:             physical, sgb, gold_etf, gold_fund_of_fund
-- ─────────────────────────────────────────────────────────────
create table holdings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,

  ticker        text not null,
  name          text,
  exchange      text check (exchange in ('NSE','BSE','NYSE','NASDAQ','MCX','AMFI','OTHER')) default 'NSE',

  asset_class   text not null check (asset_class in (
    'equity','us_equity','etf','index_fund','elss',
    'mutual_fund','debt_fund','liquid_fund','hybrid_fund',
    'gold','silver','reit','invit','crypto','other'
  )) default 'equity',

  sub_category  text,

  quantity      numeric(15,4) not null default 0,
  avg_cost      numeric(15,4) not null default 0,   -- weighted average buy price (auto-recalculated)

  currency      text default 'INR',
  isin          text,
  folio_number  text,          -- for mutual funds
  notes         text,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  unique (user_id, ticker, exchange)
);


-- ─────────────────────────────────────────────────────────────
-- TRADES  (every buy / sell event — full audit history)
-- ─────────────────────────────────────────────────────────────
create table trades (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  holding_id      uuid references holdings(id) on delete set null,

  ticker          text not null,
  exchange        text default 'NSE',
  asset_class     text not null,
  trade_date      date not null default current_date,

  trade_type      text not null check (trade_type in (
    'buy',                -- regular purchase
    'sell',               -- regular sale
    'sip',                -- SIP instalment (treated as buy)
    'switch_in',          -- MF switch in (treated as buy)
    'switch_out',         -- MF switch out (treated as sell)
    'dividend_reinvest'   -- dividend reinvested as units
  )),

  quantity        numeric(15,4) not null,
  price           numeric(15,4) not null,    -- per unit / per NAV
  total_value     numeric(15,2) not null,    -- quantity × price

  -- Indian market charges
  brokerage       numeric(10,2) default 0,
  stt             numeric(10,2) default 0,   -- Securities Transaction Tax
  gst             numeric(10,2) default 0,   -- GST on brokerage
  stamp_duty      numeric(10,2) default 0,
  other_charges   numeric(10,2) default 0,

  -- Net amount (buy: total + charges paid, sell: total - charges received)
  net_amount      numeric(15,2) not null,

  -- Sell-only: P&L (auto-filled by trigger)
  avg_cost_at_sale    numeric(15,4),
  realised_pnl        numeric(15,2),
  holding_period_days integer,
  is_ltcg             boolean,

  -- SIP link
  sip_id          uuid,

  notes           text,
  created_at      timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- SIP PLANS
-- ─────────────────────────────────────────────────────────────
create table sip_plans (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  holding_id      uuid references holdings(id) on delete set null,

  ticker          text not null,
  name            text,
  asset_class     text not null,
  amount          numeric(15,2) not null,
  frequency       text check (frequency in ('daily','weekly','monthly','quarterly')) default 'monthly',
  sip_date        int check (sip_date between 1 and 28),
  start_date      date not null,
  end_date        date,
  is_active       boolean default true,

  total_invested  numeric(15,2) default 0,
  instalments_done int default 0,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- PRICE CACHE  (twice-daily Yahoo Finance / AMFI NAV cache)
-- session: 'mid' | 'close' for exchange-traded, 'nav' for MF
-- ─────────────────────────────────────────────────────────────
create table price_cache (
  id          uuid primary key default uuid_generate_v4(),
  ticker      text not null,
  exchange    text default 'NSE',
  price       numeric(15,4),
  prev_close  numeric(15,4),
  change_amt  numeric(15,4),
  change_pct  numeric(8,4),
  short_name  text,
  fetched_at  timestamptz default now(),
  fetch_date  date not null default current_date,  -- plain date column for unique index (avoids ::date cast immutability issue)
  session     text check (session in ('mid','close','nav')) default 'close',
  unique (ticker, session, fetch_date)              -- one entry per ticker per session per day
);

create index idx_price_cache_ticker on price_cache (ticker, fetched_at desc);


-- ─────────────────────────────────────────────────────────────
-- SAVINGS GOALS
-- ─────────────────────────────────────────────────────────────
create table goals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  icon        text default '🎯',
  target      numeric(15,2) not null,
  saved       numeric(15,2) default 0,
  deadline    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- DEBTS / LOANS
-- ─────────────────────────────────────────────────────────────
create table debts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade,
  name             text not null,
  lender           text,
  type             text check (type in (
    'home_loan','car_loan','personal_loan','education_loan',
    'credit_card','gold_loan','business_loan','medical','other'
  )) default 'personal_loan',
  balance          numeric(15,2) not null,
  original_balance numeric(15,2) not null,
  rate             numeric(6,3) not null,
  min_payment      numeric(15,2) default 0,
  next_due_date    date,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- BUDGET LIMITS
-- ─────────────────────────────────────────────────────────────
create table budget_limits (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  category      text not null,
  monthly_limit numeric(15,2) not null,
  month         text not null default to_char(now(), 'YYYY-MM'),
  created_at    timestamptz default now(),
  unique (user_id, category, month)
);


-- ─────────────────────────────────────────────────────────────
-- NET WORTH SNAPSHOTS
-- ─────────────────────────────────────────────────────────────
create table net_worth_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  snapshot_date   date default current_date,
  net_worth       numeric(15,2),
  total_assets    numeric(15,2),
  total_debts     numeric(15,2),
  portfolio_value numeric(15,2),
  cash_balance    numeric(15,2),
  created_at      timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- DIVIDEND / CORPORATE ACTION EVENTS
-- ─────────────────────────────────────────────────────────────
create table dividend_events (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade,
  holding_id       uuid references holdings(id) on delete set null,
  ticker           text not null,
  event_date       date not null,
  amount_per_unit  numeric(10,4),
  total_amount     numeric(15,2),
  tax_deducted     numeric(10,2) default 0,
  net_amount       numeric(15,2),
  type             text check (type in ('dividend','interest','bonus','rights','split')) default 'dividend',
  created_at       timestamptz default now()
);


-- ─────────────────────────────────────────────────────────────
-- TRIGGER: auto-fill sell P&L BEFORE inserting a trade
-- ─────────────────────────────────────────────────────────────
create or replace function fill_sell_pnl()
returns trigger as $$
declare
  h         holdings%rowtype;
  buy_date  date;
begin
  if NEW.trade_type in ('sell','switch_out') then
    select * into h from holdings where id = NEW.holding_id;

    if h.id is null then
      raise exception 'Holding not found for sell trade';
    end if;

    if NEW.quantity > h.quantity then
      raise exception 'Cannot sell % units — only % held', NEW.quantity, h.quantity;
    end if;

    NEW.avg_cost_at_sale := h.avg_cost;
    NEW.realised_pnl     := round(
      (NEW.price - h.avg_cost) * NEW.quantity
      - coalesce(NEW.brokerage,0)
      - coalesce(NEW.stt,0)
      - coalesce(NEW.gst,0)
      - coalesce(NEW.stamp_duty,0)
      - coalesce(NEW.other_charges,0),
      2
    );

    select min(trade_date) into buy_date
      from trades
      where holding_id = NEW.holding_id
        and trade_type in ('buy','sip','switch_in','dividend_reinvest');

    if buy_date is not null then
      NEW.holding_period_days := (NEW.trade_date - buy_date);
      NEW.is_ltcg := case
        when NEW.asset_class in ('equity','us_equity','etf','elss','mutual_fund','reit','invit')
          then NEW.holding_period_days > 365
        when NEW.asset_class in ('debt_fund','liquid_fund','hybrid_fund')
          then NEW.holding_period_days > 1095   -- 3 years for debt pre-2023 rule; adjust if needed
        else NEW.holding_period_days > 365
      end;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger trg_fill_sell_pnl
  before insert on trades
  for each row
  execute function fill_sell_pnl();


-- ─────────────────────────────────────────────────────────────
-- TRIGGER: update holding quantity + avg_cost AFTER trade insert
-- ─────────────────────────────────────────────────────────────
create or replace function update_holding_on_trade()
returns trigger as $$
declare
  h         holdings%rowtype;
  new_qty   numeric;
  new_avg   numeric;
begin
  if NEW.holding_id is null then
    return NEW;
  end if;

  select * into h from holdings where id = NEW.holding_id;

  if NEW.trade_type in ('buy','sip','switch_in','dividend_reinvest') then
    new_qty := h.quantity + NEW.quantity;
    new_avg := case
      when new_qty = 0 then 0
      else ((h.quantity * h.avg_cost) + (NEW.quantity * NEW.price)) / new_qty
    end;

    update holdings
      set quantity   = new_qty,
          avg_cost   = round(new_avg, 4),
          updated_at = now()
      where id = NEW.holding_id;

  elsif NEW.trade_type in ('sell','switch_out') then
    new_qty := h.quantity - NEW.quantity;

    update holdings
      set quantity   = new_qty,
          avg_cost   = case when new_qty = 0 then 0 else h.avg_cost end,
          updated_at = now()
      where id = NEW.holding_id;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger trg_update_holding_on_trade
  after insert on trades
  for each row
  when (NEW.holding_id is not null)
  execute function update_holding_on_trade();


-- ─────────────────────────────────────────────────────────────
-- VIEW: portfolio_summary (holdings + live price from cache)
-- ─────────────────────────────────────────────────────────────
create or replace view portfolio_summary as
select
  h.id,
  h.user_id,
  h.ticker,
  h.name,
  h.exchange,
  h.asset_class,
  h.sub_category,
  h.quantity,
  h.avg_cost,
  h.currency,
  h.isin,
  h.folio_number,
  pc.price                                              as current_price,
  pc.change_pct                                         as day_change_pct,
  pc.fetched_at                                         as price_as_of,
  round(h.quantity * h.avg_cost, 2)                     as cost_value,
  round(h.quantity * coalesce(pc.price, h.avg_cost), 2) as market_value,
  round(h.quantity * (coalesce(pc.price, h.avg_cost) - h.avg_cost), 2) as unrealised_pnl,
  case when h.avg_cost > 0
    then round(((coalesce(pc.price, h.avg_cost) - h.avg_cost) / h.avg_cost) * 100, 2)
    else 0
  end                                                   as unrealised_pnl_pct
from holdings h
left join lateral (
  select price, change_pct, fetched_at
  from price_cache
  where ticker = h.ticker
  order by fetched_at desc
  limit 1
) pc on true
where h.quantity > 0;


-- ─────────────────────────────────────────────────────────────
-- VIEW: asset_allocation (grouped by asset_class)
-- ─────────────────────────────────────────────────────────────
create or replace view asset_allocation as
select
  user_id,
  asset_class,
  sum(market_value)    as total_market_value,
  sum(cost_value)      as total_cost,
  sum(unrealised_pnl)  as total_unrealised_pnl,
  count(*)             as num_holdings
from portfolio_summary
group by user_id, asset_class;


-- ─────────────────────────────────────────────────────────────
-- VIEW: realised_pnl_summary (all sell trades with tax category)
-- ─────────────────────────────────────────────────────────────
create or replace view realised_pnl_summary as
select
  t.user_id,
  t.ticker,
  t.asset_class,
  t.trade_date,
  t.quantity,
  t.price                as sell_price,
  t.avg_cost_at_sale,
  t.realised_pnl,
  t.holding_period_days,
  t.is_ltcg,
  case
    when t.is_ltcg = true  and t.asset_class in ('equity','us_equity','etf','elss','mutual_fund','reit')
      then 'LTCG — 12.5% above ₹1.25L exemption'
    when t.is_ltcg = false and t.asset_class in ('equity','us_equity','etf','elss','mutual_fund','reit')
      then 'STCG — 20%'
    when t.asset_class in ('debt_fund','liquid_fund')
      then 'Taxed at income slab rate'
    else 'Verify with CA'
  end as tax_category
from trades t
where t.trade_type in ('sell','switch_out')
  and t.realised_pnl is not null;


-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table accounts             enable row level security;
alter table transactions         enable row level security;
alter table holdings             enable row level security;
alter table trades               enable row level security;
alter table sip_plans            enable row level security;
alter table goals                enable row level security;
alter table debts                enable row level security;
alter table budget_limits        enable row level security;
alter table net_worth_snapshots  enable row level security;
alter table dividend_events      enable row level security;

create policy "own_data" on accounts            for all using (auth.uid() = user_id);
create policy "own_data" on transactions        for all using (auth.uid() = user_id);
create policy "own_data" on holdings            for all using (auth.uid() = user_id);
create policy "own_data" on trades              for all using (auth.uid() = user_id);
create policy "own_data" on sip_plans           for all using (auth.uid() = user_id);
create policy "own_data" on goals               for all using (auth.uid() = user_id);
create policy "own_data" on debts               for all using (auth.uid() = user_id);
create policy "own_data" on budget_limits       for all using (auth.uid() = user_id);
create policy "own_data" on net_worth_snapshots for all using (auth.uid() = user_id);
create policy "own_data" on dividend_events     for all using (auth.uid() = user_id);

alter table price_cache enable row level security;
create policy "public_read"    on price_cache for select using (true);
create policy "service_write"  on price_cache for insert with check (true);
create policy "service_update" on price_cache for update using (true);
