// src/components/Admin/ManualPriceUpdate.jsx
import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { Btn, Spinner, Card, Input, Select } from '../shared/ui.jsx'
import { inr, pct } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { RefreshCw, Database, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { fetchYahooQuote } from '../../lib/yahooFinance.js'

export default function ManualPriceUpdate() {
  const { holdings, quotesMap, setQuotesMap } = useFinance()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [selectedTicker, setSelectedTicker] = useState('')
  const [customTicker, setCustomTicker] = useState('')
  const [updateMode, setUpdateMode] = useState('all') // 'all', 'selected', 'custom'

  // Get unique tickers from holdings
  const tickers = [...new Set(holdings.map(h => h.ticker))]

  const updatePrice = async (ticker, exchange = 'NSE') => {
    try {
      const yahooTicker = exchange === 'NSE' ? `${ticker}.NS` : 
                         exchange === 'BSE' ? `${ticker}.BO` : ticker
      
      const quote = await fetchYahooQuote(yahooTicker)
      
      if (!quote) throw new Error(`No data for ${ticker}`)

      // Store in cache table
      const { error: cacheError } = await supabase
        .from('price_cache')
        .insert({
          ticker: ticker,
          price: quote.price,
          prev_close: quote.prevClose,
          change_amt: quote.change,
          change_pct: quote.changePct,
          short_name: quote.shortName || ticker,
          fetched_at: new Date().toISOString(),
          fetch_date: new Date().toISOString().split('T')[0],
          session: 'manual',
          exchange: exchange
        })

      if (cacheError) throw cacheError

      return { ticker, success: true, price: quote.price, change: quote.changePct }
    } catch (err) {
      return { ticker, success: false, error: err.message }
    }
  }

  const updateAllPrices = async () => {
    setLoading(true)
    setResults([])
    
    const newResults = []
    
    for (const ticker of tickers) {
      const holding = holdings.find(h => h.ticker === ticker)
      const result = await updatePrice(ticker, holding?.exchange || 'NSE')
      newResults.push(result)
      setResults([...newResults])
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500))
    }
    
    setLoading(false)
  }

  const updateSelectedPrice = async () => {
    if (!selectedTicker) return
    
    setLoading(true)
    setResults([])
    
    const holding = holdings.find(h => h.ticker === selectedTicker)
    const result = await updatePrice(selectedTicker, holding?.exchange || 'NSE')
    setResults([result])
    
    setLoading(false)
  }

  const updateCustomTicker = async () => {
    if (!customTicker) return
    
    setLoading(true)
    setResults([])
    
    // Parse ticker and exchange (format: "TICKER.EX" or just "TICKER")
    let ticker = customTicker
    let exchange = 'NSE'
    
    if (customTicker.includes('.')) {
      const parts = customTicker.split('.')
      ticker = parts[0]
      exchange = parts[1]
    }
    
    const result = await updatePrice(ticker, exchange)
    setResults([result])
    
    setLoading(false)
  }

  const getSuccessCount = () => results.filter(r => r?.success).length
  const getFailCount = () => results.filter(r => r && !r.success).length

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12,
        marginBottom: 16,
        borderBottom: `1px solid ${theme.border}`,
        paddingBottom: 12
      }}>
        <Database size={20} color={theme.accent} />
        <span style={{ fontFamily: theme.syne, fontWeight: 700, fontSize: 16 }}>
          Manual Price Update
        </span>
        <span style={{ 
          fontSize: 11, 
          color: theme.muted, 
          fontFamily: theme.mono,
          background: theme.bg2,
          padding: '4px 8px',
          borderRadius: 4
        }}>
          Admin Only
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Update Mode Selection */}
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: 8,
              color: theme.text,
              fontSize: 12,
              fontFamily: theme.mono
            }}>
              <input
                type="radio"
                name="updateMode"
                value="all"
                checked={updateMode === 'all'}
                onChange={() => setUpdateMode('all')}
              />
              Update All Holdings ({tickers.length} tickers)
            </label>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: 8,
              color: theme.text,
              fontSize: 12,
              fontFamily: theme.mono
            }}>
              <input
                type="radio"
                name="updateMode"
                value="selected"
                checked={updateMode === 'selected'}
                onChange={() => setUpdateMode('selected')}
              />
              Update Selected Ticker
            </label>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              color: theme.text,
              fontSize: 12,
              fontFamily: theme.mono
            }}>
              <input
                type="radio"
                name="updateMode"
                value="custom"
                checked={updateMode === 'custom'}
                onChange={() => setUpdateMode('custom')}
              />
              Custom Ticker (e.g., "RELIANCE.NS" or "AAPL")
            </label>
          </div>

          {updateMode === 'selected' && (
            <div style={{ marginBottom: 12 }}>
              <Select 
                value={selectedTicker} 
                onChange={setSelectedTicker}
                style={{ width: '100%' }}
              >
                <option value="">Select a ticker</option>
                {tickers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          )}

          {updateMode === 'custom' && (
            <div style={{ marginBottom: 12 }}>
              <Input
                value={customTicker}
                onChange={setCustomTicker}
                placeholder="e.g., RELIANCE.NS or AAPL"
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: 10, color: theme.muted, marginTop: 4 }}>
                Use .NS for NSE, .BO for BSE, or just ticker for US stocks
              </div>
            </div>
          )}

          <Btn
            onClick={() => {
              if (updateMode === 'all') updateAllPrices()
              else if (updateMode === 'selected') updateSelectedPrice()
              else updateCustomTicker()
            }}
            disabled={loading || 
              (updateMode === 'selected' && !selectedTicker) ||
              (updateMode === 'custom' && !customTicker)}
            color={theme.accent}
            style={{ width: '100%' }}
          >
            {loading ? (
              <Spinner size={14} />
            ) : (
              <>
                <RefreshCw size={14} style={{ marginRight: 8 }} />
                Update {updateMode === 'all' ? 'All Prices' : 'Price'}
              </>
            )}
          </Btn>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div style={{ 
            flex: 2,
            background: theme.bg,
            borderRadius: 8,
            padding: 12,
            maxHeight: 200,
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 8
            }}>
              <span style={{ fontSize: 12, color: theme.muted }}>
                Updated: {getSuccessCount()} successful, {getFailCount()} failed
              </span>
              {getSuccessCount() > 0 && (
                <span style={{ fontSize: 12, color: theme.green }}>
                  <Check size={12} style={{ display: 'inline' }} /> Cache updated
                </span>
              )}
            </div>
            
            {results.map((r, i) => r && (
              <div key={i} style={{
                padding: '8px 12px',
                background: r.success ? theme.green + '10' : theme.red + '10',
                borderRadius: 6,
                marginBottom: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                fontFamily: theme.mono
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.success ? (
                    <Check size={12} color={theme.green} />
                  ) : (
                    <AlertCircle size={12} color={theme.red} />
                  )}
                  <span style={{ fontWeight: 600 }}>{r.ticker}</span>
                </div>
                {r.success ? (
                  <div>
                    <span style={{ color: theme.text }}>{inr(r.price)}</span>
                    <span style={{ 
                      marginLeft: 8,
                      color: r.change >= 0 ? theme.green : theme.red 
                    }}>
                      {pct(r.change)}
                    </span>
                  </div>
                ) : (
                  <span style={{ color: theme.red, fontSize: 11 }}>{r.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Cache Stats */}
      <div style={{ 
        marginTop: 16,
        paddingTop: 12,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        gap: 20,
        fontSize: 11,
        color: theme.muted,
        fontFamily: theme.mono
      }}>
        <div>Total Holdings: {tickers.length}</div>
        <div>Recently Updated: {Object.values(quotesMap).filter(q => q?.fromCache).length}</div>
        <div>Live Prices: {Object.values(quotesMap).filter(q => q && !q.fromCache).length}</div>
      </div>
    </Card>
  )
}