# FinVault — Personal Finance AI Agent

## Tech Stack
- **React 18** + Vite
- **Supabase** — database, auth, realtime
- **Recharts** — charts
- **Claude AI** — financial analysis
- **Yahoo Finance** — stock prices (fetched twice daily)

## Project Structure
```
src/
├── main.jsx
├── App.jsx
├── context/
│   └── FinanceContext.jsx        # Global state + Supabase sync
├── lib/
│   ├── supabase.js               # Supabase client
│   ├── yahooFinance.js           # Price fetching + scheduling
│   └── formatters.js             # Currency, number formatters (INR)
├── hooks/
│   ├── usePortfolio.js
│   ├── useBudget.js
│   ├── useGoals.js
│   ├── useDebt.js
│   └── useMarketPrices.js
├── components/
│   ├── shared/
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   ├── TickerBar.jsx
│   │   ├── Card.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Spinner.jsx
│   ├── Dashboard/
│   │   ├── index.jsx
│   │   ├── NetWorthCard.jsx
│   │   ├── AllocationChart.jsx
│   │   └── RecentTransactions.jsx
│   ├── Portfolio/
│   │   ├── index.jsx
│   │   ├── HoldingsTable.jsx
│   │   ├── AddHoldingForm.jsx
│   │   └── AllocationBar.jsx
│   ├── Budget/
│   │   ├── index.jsx
│   │   ├── AddTransactionForm.jsx
│   │   ├── BudgetLimits.jsx
│   │   └── SpendingChart.jsx
│   ├── Goals/
│   │   ├── index.jsx
│   │   ├── GoalCard.jsx
│   │   └── AddGoalForm.jsx
│   ├── Debt/
│   │   ├── index.jsx
│   │   ├── DebtCard.jsx
│   │   └── AddDebtForm.jsx
│   ├── Markets/
│   │   ├── index.jsx
│   │   └── IndexCard.jsx
│   └── AIAgent/
│       ├── index.jsx
│       ├── ChatWindow.jsx
│       ├── ChatInput.jsx
│       └── QuickPrompts.jsx
```

## Supabase Setup

### 1. Create tables (run in Supabase SQL editor):
See `supabase/schema.sql`

### 2. Environment variables
Create `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ANTHROPIC_API_KEY=your_claude_key
```

## Price Update Schedule
- **NSE/BSE**: Mid-session ~1:00 PM IST · Closing ~3:45 PM IST
- **NYSE/NASDAQ**: Mid-session ~11:30 PM IST · Closing ~2:30 AM IST
- Prices stored in Supabase `price_cache` table with timestamp
- On app load, checks if cache is stale before fetching
