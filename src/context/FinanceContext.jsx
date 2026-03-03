import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { fetchPrices, fetchIndices } from '../lib/yahooFinance.js'
import { currentMonth } from '../lib/formatters.js'

const FinanceContext = createContext(null)

export function FinanceProvider({ children, userId }) {
  const [accounts,       setAccounts]       = useState([])
  const [transactions,   setTransactions]   = useState([])
  const [holdings,       setHoldings]       = useState([])
  const [trades,         setTrades]         = useState([])
  const [sipPlans,       setSipPlans]       = useState([])
  const [goals,          setGoals]          = useState([])
  const [debts,          setDebts]          = useState([])
  const [budgetLimits,   setBudgetLimitsS]  = useState([])
  const [nwHistory,      setNwHistory]      = useState([])
  const [dividendEvents, setDividendEvents] = useState([])
  const [cashAccounts,   setCashAccounts]   = useState([]) // Add this line
  const [quotesMap,      setQuotesMap]      = useState({})
  const [indices,        setIndices]        = useState({})
  const [loading,        setLoading]        = useState(true)
  const [quotesLoading,  setQuotesLoading]  = useState(false)
  const [error,          setError]          = useState(null)

  useEffect(() => { if (userId) loadAll() }, [userId])

  useEffect(() => {
    const load = async () => { const idx = await fetchIndices(); setIndices(idx) }
    load()
    const iv = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (!holdings.length) return
    const load = async () => {
      setQuotesLoading(true)
      const prices = await fetchPrices(holdings.map(h => ({ ticker: h.ticker, exchange: h.exchange })))
      setQuotesMap(prices)
      setQuotesLoading(false)
    }
    load()
  }, [holdings])

 async function loadAll() {
  setLoading(true); 
  setError(null)
  console.log('🔍 Loading data for user:', userId)
  
  try {
    console.time('⏱️ Data load time')
    
    const [
      { data: acc,  error: e1  },
      { data: txs,  error: e2  },
      { data: hld,  error: e3  },
      { data: trd,  error: e4  },
      { data: sip,  error: e5  },
      { data: gls,  error: e6  },
      { data: dbs,  error: e7  },
      { data: bud,  error: e8  },
      { data: nwh,  error: e9  },
      { data: div,  error: e10 },
      { data: cash, error: e11 },
    ] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('holdings').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('trades').select('*').eq('user_id', userId).order('trade_date', { ascending: false }),
      supabase.from('sip_plans').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('debts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('budget_limits').select('*').eq('user_id', userId).eq('month', currentMonth()),
      supabase.from('net_worth_snapshots').select('*').eq('user_id', userId).order('snapshot_date').limit(12),
      supabase.from('dividend_events').select('*').eq('user_id', userId).order('event_date', { ascending: false }),
      supabase.from('cash_accounts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ])
    
    console.log('📊 Query Results:', {
      accounts: { count: acc?.length, error: e1 },
      transactions: { count: txs?.length, error: e2 },
      holdings: { count: hld?.length, error: e3 },
      trades: { count: trd?.length, error: e4 },
      sipPlans: { count: sip?.length, error: e5 },
      goals: { count: gls?.length, error: e6 },
      debts: { count: dbs?.length, error: e7 },
      budgetLimits: { count: bud?.length, error: e8 },
      nwHistory: { count: nwh?.length, error: e9 },
      dividendEvents: { count: div?.length, error: e10 },
      cashAccounts: { count: cash?.length, error: e11 },
    })
    
    const errs = [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11].filter(Boolean)
    if (errs.length) {
      console.error('❌ Errors:', errs)
      throw errs[0]
    }
    
    // Set all states
    setAccounts(acc || [])
    setTransactions(txs || [])
    setHoldings(hld || [])
    setTrades(trd || [])
    setSipPlans(sip || [])
    setGoals(gls || [])
    setDebts(dbs || [])
    setBudgetLimitsS(bud || [])
    setNwHistory(nwh || [])
    setDividendEvents(div || [])
    setCashAccounts(cash || [])
    
    console.log('✅ State updated:', {
      holdings: hld?.length,
      trades: trd?.length,
      cashAccounts: cash?.length
    })
    
    console.timeEnd('⏱️ Data load time')
    
  } catch (err) { 
    console.error('❌ Load error:', err); 
    setError(err.message) 
  } finally { 
    setLoading(false) 
  }
}
useEffect(() => { 
  console.log('🔄 useEffect triggered, userId:', userId);
  if (userId) {
    console.log('📞 Calling loadAll()');
    loadAll(); 
  } else {
    console.log('⏸️ No userId yet, skipping loadAll');
  }
}, [userId]);
  // ACCOUNTS
  const addAccount    = useCallback(async (data) => { const { data: row, error } = await supabase.from('accounts').insert({ ...data, user_id: userId }).select().single(); if (error) throw error; setAccounts(p => [...p, row]); return row }, [userId])
  const updateAccount = useCallback(async (id, data) => { const { data: row, error } = await supabase.from('accounts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; setAccounts(p => p.map(a => a.id === id ? row : a)); return row }, [])
  const deleteAccount = useCallback(async (id) => { const { error } = await supabase.from('accounts').delete().eq('id', id); if (error) throw error; setAccounts(p => p.filter(a => a.id !== id)) }, [])


    


  // TRANSACTIONS
// More robust version with proper error handling
const addTransaction = useCallback(async (data) => {
  // Validate inputs
  if (!data.account_id) {
    throw new Error('Please select an account')
  }

  // Start a transaction
  const { data: row, error } = await supabase
    .from('transactions')
    .insert({ 
      ...data, 
      user_id: userId,
      created_at: new Date().toISOString() 
    })
    .select()
    .single()
  
  if (error) throw error

  // Update the account balance
  try {
    // Get current account
    const { data: account, error: accountError } = await supabase
      .from('cash_accounts')
      .select('*')
      .eq('id', data.account_id)
      .single()
    
    if (accountError) throw accountError

    // Calculate new balance (amount can be positive or negative)
    const currentBalance = Number(account.balance)
    const transactionAmount = Number(data.amount)
    const newBalance = currentBalance + transactionAmount

    // Prepare updates
    const updates = { 
      balance: newBalance,
      updated_at: new Date().toISOString()
    }

    // For FD/RD accounts, you might want to track current_value separately
    if (['fd', 'rd'].includes(account.type)) {
      updates.current_value = newBalance
    }

    // Update the account
    const { error: updateError } = await supabase
      .from('cash_accounts')
      .update(updates)
      .eq('id', data.account_id)
    
    if (updateError) throw updateError

    // Update local state
    setCashAccounts(prev => prev.map(acc => 
      acc.id === data.account_id 
        ? { ...acc, ...updates }
        : acc
    ))

  } catch (err) {
    // If account update fails, we should probably delete the transaction
    // to maintain consistency
    await supabase.from('transactions').delete().eq('id', row.id)
    throw new Error(`Failed to update account balance: ${err.message}`)
  }

  setTransactions(p => [row, ...p])
  return row
}, [userId])

const deleteTransaction = useCallback(async (id) => {
  // Get the transaction first to know the amount and account
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError

  // Delete the transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  
  if (error) throw error

  // Reverse the balance change if there was an account
  if (transaction.account_id) {
    // Get current account
    const { data: account, error: accountError } = await supabase
      .from('cash_accounts')
      .select('balance, current_value, type')
      .eq('id', transaction.account_id)
      .single()
    
    if (accountError) throw accountError

    // Subtract the transaction amount (reverse the original effect)
    const newBalance = Number(account.balance) - Number(transaction.amount)
    
    const updates = { balance: newBalance }
    
    if (['fd', 'rd'].includes(account.type)) {
      updates.current_value = newBalance
    }

    const { error: updateError } = await supabase
      .from('cash_accounts')
      .update(updates)
      .eq('id', transaction.account_id)
    
    if (updateError) throw updateError

    // Update local state
    setCashAccounts(prev => prev.map(acc => 
      acc.id === transaction.account_id 
        ? { ...acc, ...updates }
        : acc
    ))
  }

  setTransactions(p => p.filter(t => t.id !== id))
}, [])

  // CASH ACCOUNTS (Bank Accounts, FDs, RDs)
  const addCashAccount = useCallback(async (data) => {
    const { data: row, error } = await supabase
      .from('cash_accounts')
      .insert([{
        ...data,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    if (error) throw error
    setCashAccounts(p => [row, ...p])
    return row
  }, [userId])

  const updateCashAccount = useCallback(async (id, updates) => {
    const { data: row, error } = await supabase
      .from('cash_accounts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    setCashAccounts(p => p.map(acc => acc.id === id ? row : acc))
    return row
  }, [userId])

  const deleteCashAccount = useCallback(async (id) => {
    const { error } = await supabase
      .from('cash_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    setCashAccounts(p => p.filter(acc => acc.id !== id))
  }, [userId])

  // HOLDINGS — get or create
  const getOrCreateHolding = useCallback(async (data) => {
    const ticker = data.ticker.toUpperCase()
    const { data: existing } = await supabase.from('holdings').select('*')
      .eq('user_id', userId).eq('ticker', ticker).eq('exchange', data.exchange).single()
    if (existing) return existing
    const { data: row, error } = await supabase.from('holdings').insert({
      user_id: userId, ticker, name: data.name || ticker,
      exchange: data.exchange, asset_class: data.asset_class,
      sub_category: data.sub_category || null, quantity: 0, avg_cost: 0,
      currency: data.currency || 'INR', isin: data.isin || null,
      folio_number: data.folio_number || null,
    }).select().single()
    if (error) throw error
    setHoldings(p => [...p, row])
    return row
  }, [userId])

  const deleteHolding = useCallback(async (id) => {
    const { error } = await supabase.from('holdings').delete().eq('id', id)
    if (error) throw error
    setHoldings(p => p.filter(h => h.id !== id))
  }, [])

  // TRADES — unified buy/sell entry point
  const recordTrade = useCallback(async (tradeData) => {
    const ticker  = tradeData.ticker.toUpperCase()
    const charges = (tradeData.brokerage || 0) + (tradeData.stt || 0)
                  + (tradeData.gst || 0) + (tradeData.stamp_duty || 0) + (tradeData.other_charges || 0)
    const totalVal = tradeData.quantity * tradeData.price
    const isBuy    = ['buy','sip','switch_in','dividend_reinvest'].includes(tradeData.trade_type)
    const netAmt   = isBuy ? totalVal + charges : totalVal - charges

    const holding = await getOrCreateHolding({
      ticker, exchange: tradeData.exchange, asset_class: tradeData.asset_class,
      sub_category: tradeData.sub_category, name: tradeData.name,
      currency: tradeData.currency || 'INR', isin: tradeData.isin,
      folio_number: tradeData.folio_number,
    })

    const { data: tradeRow, error } = await supabase.from('trades').insert({
      user_id: userId, holding_id: holding.id, ticker, exchange: tradeData.exchange,
      asset_class: tradeData.asset_class, trade_date: tradeData.trade_date,
      trade_type: tradeData.trade_type, quantity: tradeData.quantity,
      price: tradeData.price, total_value: totalVal,
      brokerage: tradeData.brokerage || 0, stt: tradeData.stt || 0,
      gst: tradeData.gst || 0, stamp_duty: tradeData.stamp_duty || 0,
      other_charges: tradeData.other_charges || 0, net_amount: netAmt,
      sip_id: tradeData.sip_id || null, notes: tradeData.notes || null,
    }).select().single()

    if (error) throw error

    // Refresh holdings (trigger has updated qty/avg_cost on DB side)
    const { data: refreshed } = await supabase.from('holdings').select('*').eq('user_id', userId).order('created_at')
    setHoldings(refreshed || [])
    setTrades(p => [tradeRow, ...p])
    return tradeRow
  }, [userId, getOrCreateHolding])

  // GOALS
  const addGoal    = useCallback(async (data) => { const { data: row, error } = await supabase.from('goals').insert({ ...data, user_id: userId }).select().single(); if (error) throw error; setGoals(p => [...p, row]); return row }, [userId])
  const updateGoal = useCallback(async (id, data) => { const { data: row, error } = await supabase.from('goals').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; setGoals(p => p.map(g => g.id === id ? row : g)); return row }, [])
  const deleteGoal = useCallback(async (id) => { const { error } = await supabase.from('goals').delete().eq('id', id); if (error) throw error; setGoals(p => p.filter(g => g.id !== id)) }, [])

  // DEBTS
  const addDebt    = useCallback(async (data) => { const { data: row, error } = await supabase.from('debts').insert({ ...data, user_id: userId }).select().single(); if (error) throw error; setDebts(p => [...p, row]); return row }, [userId])
  const updateDebt = useCallback(async (id, data) => { const { data: row, error } = await supabase.from('debts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; setDebts(p => p.map(d => d.id === id ? row : d)); return row }, [])
  const deleteDebt = useCallback(async (id) => { const { error } = await supabase.from('debts').delete().eq('id', id); if (error) throw error; setDebts(p => p.filter(d => d.id !== id)) }, [])

  // BUDGET
  const setBudgetLimit = useCallback(async (category, limit) => {
    const month = currentMonth()
    const { data: row, error } = await supabase.from('budget_limits')
      .upsert({ user_id: userId, category, monthly_limit: limit, month }, { onConflict: 'user_id,category,month' })
      .select().single()
    if (error) throw error
    setBudgetLimitsS(p => { const e = p.find(b => b.category === category); return e ? p.map(b => b.category === category ? row : b) : [...p, row] })
    return row
  }, [userId])

  // SIP PLANS
  const addSipPlan = useCallback(async (data) => {
    const holding = await getOrCreateHolding({ ticker: data.ticker, exchange: data.exchange || 'NSE', asset_class: data.asset_class, sub_category: data.sub_category, name: data.name })
    const { data: row, error } = await supabase.from('sip_plans').insert({ ...data, user_id: userId, holding_id: holding.id, ticker: data.ticker.toUpperCase() }).select().single()
    if (error) throw error
    setSipPlans(p => [...p, row])
    return row
  }, [userId, getOrCreateHolding])
  const updateSipPlan = useCallback(async (id, data) => { const { data: row, error } = await supabase.from('sip_plans').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; setSipPlans(p => p.map(s => s.id === id ? row : s)); return row }, [])
  const deleteSipPlan = useCallback(async (id) => { const { error } = await supabase.from('sip_plans').delete().eq('id', id); if (error) throw error; setSipPlans(p => p.filter(s => s.id !== id)) }, [])

  // DERIVED
  const currentMonthTx  = transactions.filter(t => t.date?.startsWith(currentMonth()))
  const monthlyIncome   = currentMonthTx.filter(t => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0)
  const monthlyExpenses = currentMonthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const spendByCategory = {}
  currentMonthTx.filter(t => t.amount < 0).forEach(t => { spendByCategory[t.category] = (spendByCategory[t.category] || 0) + Math.abs(Number(t.amount)) })

  const portfolioValue = holdings.reduce((s, h) => s + h.quantity * (quotesMap[h.ticker]?.price ?? h.avg_cost), 0)
  const portfolioCost  = holdings.reduce((s, h) => s + h.quantity * h.avg_cost, 0)
  const portfolioGain  = portfolioValue - portfolioCost
  
  // Cash balance from cash_accounts (includes bank accounts, FDs, RDs)
  const cashBalance = cashAccounts.reduce((s, a) => s + Number(a.balance), 0)
  
  const totalDebt      = debts.reduce((s, d) => s + Number(d.balance), 0)
  
  // Net worth includes all cash accounts (bank, FD, RD) + investments - debts
  const netWorth       = cashBalance + portfolioValue - totalDebt
  
  const realisedPnl    = trades.filter(t => ['sell','switch_out'].includes(t.trade_type) && t.realised_pnl != null).reduce((s, t) => s + Number(t.realised_pnl), 0)
  const byAssetClass   = {}
  holdings.forEach(h => { const val = h.quantity * (quotesMap[h.ticker]?.price ?? h.avg_cost); byAssetClass[h.asset_class] = (byAssetClass[h.asset_class] || 0) + val })

// Add this near the top of your FinanceProvider component
const getSnapshotThreshold = useCallback(() => {
  if (!netWorth) return 0.05 // default 5%
  
  if (netWorth < 100000) return 0.10 // 10% for portfolios under ₹1L
  if (netWorth < 1000000) return 0.05 // 5% for portfolios under ₹10L
  if (netWorth < 10000000) return 0.03 // 3% for portfolios under ₹1Cr
  return 0.02 // 2% for portfolios over ₹1Cr
}, [netWorth])

// Add this function to save net worth snapshot
const saveNetWorthSnapshot = useCallback(async () => {
  if (!userId || !netWorth) return
  
  const today = new Date().toISOString().split('T')[0]
  const threshold = getSnapshotThreshold()
  
  // Check if we already have today's snapshot
  const existing = nwHistory.find(s => s.snapshot_date === today)
  
  if (existing) {
    // Update if value changed significantly based on dynamic threshold
    const change = Math.abs(existing.net_worth - netWorth) / existing.net_worth
    if (change > threshold) {
      console.log(`Net worth changed by ${(change * 100).toFixed(1)}% (threshold: ${threshold * 100}%) - updating snapshot`)
      await supabase
        .from('net_worth_snapshots')
        .update({ 
          net_worth: netWorth,
          total_assets: cashBalance + portfolioValue,
          total_debts: totalDebt, // Changed from total_liabilities to total_debts
          portfolio_value: portfolioValue,
          cash_balance: cashBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    }
  } else {
    // Insert new daily snapshot (always capture first snapshot of the day)
    console.log('Creating new net worth snapshot for today')
    await supabase
      .from('net_worth_snapshots')
      .insert({
        user_id: userId,
        snapshot_date: today,
        net_worth: netWorth,
        total_assets: cashBalance + portfolioValue,
        total_debts: totalDebt, // Changed from total_liabilities to total_debts
        portfolio_value: portfolioValue,
        cash_balance: cashBalance,
        created_at: new Date().toISOString()
      })
  }
  
  // Refresh history
  const { data } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(12)
  
  setNwHistory(data || [])
}, [userId, netWorth, cashBalance, portfolioValue, totalDebt, nwHistory, getSnapshotThreshold])

// Call it when net worth changes
useEffect(() => {
  if (netWorth > 0) {
    // Add a small delay to avoid too many calls during rapid changes
    const timeoutId = setTimeout(() => {
      saveNetWorthSnapshot()
    }, 3000) // Wait 3 seconds after changes
    
    return () => clearTimeout(timeoutId)
  }
}, [netWorth]) // Runs when net worth changes

// Also call it on component mount to ensure we have today's snapshot
useEffect(() => {
  if (userId && netWorth > 0) {
    saveNetWorthSnapshot()
  }
}, [userId]) // Runs when userId changes (on login)


  return (
    <FinanceContext.Provider value={{
      accounts, transactions, holdings, trades, sipPlans, goals, debts, budgetLimits, nwHistory, dividendEvents,
      cashAccounts, // Add this
      quotesMap, indices, quotesLoading, loading, error,
      addAccount, updateAccount, deleteAccount,
      addTransaction, deleteTransaction,
      addCashAccount, updateCashAccount, deleteCashAccount, // Add these
      recordTrade, deleteHolding, getOrCreateHolding,
      addGoal, updateGoal, deleteGoal,
      addDebt, updateDebt, deleteDebt,
      setBudgetLimit,
      addSipPlan, updateSipPlan, deleteSipPlan,
      monthlyIncome, monthlyExpenses, spendByCategory,
      portfolioValue, portfolioCost, portfolioGain,
      cashBalance, totalDebt, netWorth, realisedPnl, byAssetClass,
      reload: loadAll,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider')
  return ctx
}