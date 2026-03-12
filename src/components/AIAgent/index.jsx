import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { Btn, Spinner } from '../shared/ui.jsx'
import { inr, inrCompact, pct, currentMonth } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { 
  Copy, Clock, Check, Sparkles, TrendingUp, 
  TrendingDown, Wallet, Target, PieChart, 
  BarChart3, Shield, Zap, ArrowRight, Send,
  ChevronLeft, ChevronRight, Bot, User
} from 'lucide-react'

// Enhanced quick prompts with categories and colors
const QUICK_PROMPTS = [
  { text: 'Analyze my portfolio', category: 'portfolio', icon: <PieChart size={14} />, color: '#8B5CF6' },
  { text: 'Market trends', category: 'markets', icon: <TrendingUp size={14} />, color: '#10B981' },
  { text: 'Debt payoff strategy', category: 'debt', icon: <Shield size={14} />, color: '#EF4444' },
  { text: 'Review my budget', category: 'budget', icon: <Wallet size={14} />, color: '#F59E0B' },
  { text: 'Savings goals', category: 'goals', icon: <Target size={14} />, color: '#3B82F6' },
  { text: 'Health report', category: 'health', icon: <BarChart3 size={14} />, color: '#EC4899' },
  { text: 'Portfolio rebalance', category: 'portfolio', icon: <TrendingDown size={14} />, color: '#8B5CF6' },
  { text: 'Tax-saving options', category: 'tax', icon: <Shield size={14} />, color: '#14B8A6' },
  { text: 'SIP calculator', category: 'calculator', icon: <Zap size={14} />, color: '#F97316' },
  { text: 'FD vs Equity', category: 'compare', icon: <ArrowRight size={14} />, color: '#6B7280' },
]

// ── Advanced Financial Advisor Engine ───────────────────────────────────────
class FinancialAdvisor {
  constructor(finance) {
    this.finance = finance || {}
  }

  // Helper to safely get property with default
  getProp(prop, defaultValue = null) {
    return this.finance && this.finance[prop] !== undefined ? this.finance[prop] : defaultValue
  }

  // Helper to format currency
  formatMoney(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Helper to format percentage
  formatPercent(value) {
    if (value === undefined || value === null || isNaN(value)) return '0%'
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Smart query routing with keyword scoring
  routeQuery(query) {
    const lower = query.toLowerCase()
    
    const scores = {
      portfolio: ['portfolio', 'holdings', 'investment', 'stock', 'share', 'return', 'profit', 'loss', 'performance'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
      markets: ['market', 'sensex', 'nifty', 'trend', 'index', 'global', 'us market', 'indian market'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
      debt: ['debt', 'loan', 'emi', 'credit card', 'interest', 'liability', 'borrow', 'mortgage'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
      budget: ['budget', 'spend', 'expense', 'saving', 'income', 'cost', 'monthly', 'category'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
      goals: ['goal', 'target', 'aim', 'objective', 'plan', 'future', 'retirement', 'emergency'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
      tax: ['tax', 'it return', 'capital gain', 'ltcg', 'stcg', '80c', 'elss', 'ppf', 'nps'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 2 : 0), 0),
      calculator: ['calculate', 'calculator', 'how much', 'sip', 'fd', 'rd', 'return', 'projection'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
      compare: ['compare', 'vs', 'versus', 'difference', 'better', 'which one'].reduce((acc, kw) => 
        acc + (lower.includes(kw) ? 1 : 0), 0),
    }

    let maxScore = 0
    let bestCategory = 'general'
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        bestCategory = category
      }
    }

    return bestCategory
  }

  // SIP Calculator
  calculateSIP(monthlyInvestment, years, expectedReturn = 12) {
    const months = years * 12
    const monthlyRate = expectedReturn / 12 / 100
    let totalValue = 0
    let investedAmount = monthlyInvestment * months
    
    for (let i = 0; i < months; i++) {
      totalValue = (totalValue + monthlyInvestment) * (1 + monthlyRate)
    }
    
    const estimatedReturns = totalValue - investedAmount
    
    return {
      investedAmount,
      estimatedReturns,
      totalValue,
      monthlyInvestment,
      years,
      expectedReturn
    }
  }

  // FD Calculator
  calculateFD(principal, years, rate = 7.5, compounding = 'yearly') {
    const compoundingsPerYear = {
      yearly: 1,
      half_yearly: 2,
      quarterly: 4,
      monthly: 12
    }
    
    const n = compoundingsPerYear[compounding] || 1
    const r = rate / 100
    const amount = principal * Math.pow(1 + r/n, n * years)
    const interest = amount - principal
    
    return {
      principal,
      amount,
      interest,
      years,
      rate,
      compounding
    }
  }

  // Inflation-adjusted projections
  calculateInflationAdjusted(amount, years, inflationRate = 6) {
    const futureValue = amount * Math.pow(1 + inflationRate / 100, years)
    const presentValue = amount / Math.pow(1 + inflationRate / 100, years)
    
    return {
      futureValue,
      presentValue,
      inflationRate,
      years
    }
  }

  // Analyze portfolio
  analyzePortfolio() {
    try {
      const holdings = this.getProp('holdings', [])
      const quotesMap = this.getProp('quotesMap', {})
      const portfolioValue = this.getProp('portfolioValue', 0)
      const portfolioCost = this.getProp('portfolioCost', 0)
      
      const portfolioGain = portfolioValue - portfolioCost
      const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

      let analysis = `📊 **Portfolio Analysis**\n\n`
      analysis += `┌─────────────────────────────┐\n`
      analysis += `│ Total Value: ${this.formatMoney(portfolioValue).padStart(15)}\n`
      analysis += `│ Total Cost: ${this.formatMoney(portfolioCost).padStart(15)}\n`
      analysis += `│ Unrealized P&L: ${this.formatMoney(portfolioGain).padStart(13)}\n`
      analysis += `│ Return: ${this.formatPercent(portfolioGainPct).padStart(18)}\n`
      analysis += `└─────────────────────────────┘\n`

      if (holdings.length === 0) {
        analysis += `\n✨ No holdings found. Start your investment journey today!`
        return analysis
      }

      // Calculate performers with safe access
      const performers = holdings.map(h => {
        const price = quotesMap[h.ticker]?.price ?? h.avg_cost ?? 0
        const avgCost = h.avg_cost || 0
        const gainPct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0
        const value = price * (h.quantity || 0)
        return { 
          ...h, 
          gainPct, 
          currentPrice: price,
          value 
        }
      })

      // Sort by value for top holdings
      const topHoldings = [...performers].sort((a, b) => b.value - a.value).slice(0, 5)
      
      if (topHoldings.length > 0) {
        analysis += `\n🌟 **Top Holdings:**\n`
        topHoldings.forEach(h => {
          const pctOfPortfolio = portfolioValue > 0 ? (h.value / portfolioValue) * 100 : 0
          analysis += `  • ${h.name || h.ticker || 'Unknown'}: ${this.formatMoney(h.value)} (${pctOfPortfolio.toFixed(1)}%)\n`
        })
      }

      const winners = performers.filter(p => p.gainPct > 10).sort((a, b) => b.gainPct - a.gainPct)
      const losers = performers.filter(p => p.gainPct < -5).sort((a, b) => a.gainPct - b.gainPct)

      if (winners.length > 0) {
        analysis += `\n🚀 **Top Performers (>10%):**\n`
        winners.slice(0, 3).forEach(w => {
          analysis += `  • ${w.ticker || 'Unknown'}: ${this.formatPercent(w.gainPct)}\n`
        })
      }

      if (losers.length > 0) {
        analysis += `\n📉 **Underperformers (<-5%):**\n`
        losers.slice(0, 3).forEach(l => {
          analysis += `  • ${l.ticker || 'Unknown'}: ${this.formatPercent(l.gainPct)}\n`
        })
      }

      // Check concentration
      if (topHoldings[0]) {
        const topPct = portfolioValue > 0 ? (topHoldings[0].value / portfolioValue) * 100 : 0
        if (topPct > 25) {
          analysis += `\n⚠️ **Risk Alert:** ${topHoldings[0].ticker} is ${topPct.toFixed(1)}% of portfolio. Consider diversification.\n`
        }
      }

      return analysis
    } catch (error) {
      console.error('Error in analyzePortfolio:', error)
      return "I encountered an error analyzing your portfolio. Please try again."
    }
  }

  // Generate health report
  generateHealthReport() {
    try {
      const netWorth = this.getProp('netWorth', 0)
      const portfolioValue = this.getProp('portfolioValue', 0)
      const cashBalance = this.getProp('cashBalance', 0)
      const totalDebt = this.getProp('totalDebt', 0)
      const monthlyIncome = this.getProp('monthlyIncome', 0)
      const monthlyExpenses = this.getProp('monthlyExpenses', 0)
      
      const savings = monthlyIncome - monthlyExpenses
      const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0
      const debtToIncome = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0
      const emergencyFundMonths = monthlyExpenses > 0 ? cashBalance / monthlyExpenses : 0

      let report = `🏥 **FINANCIAL HEALTH REPORT**\n\n`
      report += `┌─────────────────────────────┐\n`
      report += `│ Net Worth: ${this.formatMoney(netWorth).padStart(15)}\n`
      report += `│ Investments: ${this.formatMoney(portfolioValue).padStart(14)}\n`
      report += `│ Cash: ${this.formatMoney(cashBalance).padStart(21)}\n`
      report += `│ Debt: -${this.formatMoney(totalDebt).padStart(20)}\n`
      report += `└─────────────────────────────┘\n\n`

      report += `📊 **Key Metrics:**\n`
      report += `  • Monthly Income: ${this.formatMoney(monthlyIncome)}\n`
      report += `  • Monthly Expenses: ${this.formatMoney(monthlyExpenses)}\n`
      report += `  • Monthly Savings: ${this.formatMoney(savings)}\n`
      report += `  • Savings Rate: ${this.formatPercent(savingsRate)}\n`
      report += `  • Debt-to-Income: ${this.formatPercent(debtToIncome)}\n`
      report += `  • Emergency Fund: ${emergencyFundMonths.toFixed(1)} months\n\n`

      // Health score
      let score = 0
      let maxScore = 5
      let recommendations = []

      if (emergencyFundMonths >= 6) {
        score++
        report += `✅ Excellent: 6+ months emergency fund\n`
      } else if (emergencyFundMonths >= 3) {
        score++
        report += `👍 Good: 3-6 months emergency fund\n`
      } else {
        recommendations.push(`Build emergency fund to 3-6 months of expenses`)
      }

      if (debtToIncome < 20) {
        score++
        report += `✅ Great: Low debt burden\n`
      } else if (debtToIncome < 36) {
        report += `⚠️ Manageable debt\n`
      } else {
        recommendations.push(`Consider debt reduction strategy`)
      }

      if (savingsRate >= 20) {
        score++
        report += `✅ Excellent savings rate\n`
      } else if (savingsRate >= 10) {
        score++
        report += `👍 Good savings rate\n`
      } else {
        recommendations.push(`Increase savings rate to at least 10-20%`)
      }

      if (portfolioValue > cashBalance) {
        score++
        report += `✅ Good: More invested than cash\n`
      } else {
        recommendations.push(`Consider investing excess cash for better returns`)
      }

      if (totalDebt === 0) {
        score++
        report += `✅ Debt-free! 🎉\n`
      }

      report += `\n📈 **Health Score: ${score}/${maxScore}**\n`

      if (recommendations.length > 0) {
        report += `\n💡 **Recommendations:**\n`
        recommendations.forEach(r => {
          report += `  • ${r}\n`
        })
      }

      return report
    } catch (error) {
      console.error('Error in generateHealthReport:', error)
      return "I encountered an error generating your health report."
    }
  }

  // Main method
  answer(query) {
    try {
      const lower = query.toLowerCase()
      const category = this.routeQuery(query)
      
      // Check for specific calculator queries
      if (lower.includes('sip') && (lower.includes('calculator') || lower.includes('calculate'))) {
        const matches = query.match(/\d+/g)
        if (matches && matches.length >= 1) {
          const amount = parseInt(matches[0])
          const years = matches.length >= 2 ? parseInt(matches[1]) : 10
          const result = this.calculateSIP(amount, years)
          return `🧮 **SIP Calculator**\n\n` +
            `Monthly SIP: ${this.formatMoney(result.monthlyInvestment)}\n` +
            `Duration: ${result.years} years\n` +
            `Expected Return: ${result.expectedReturn}%\n\n` +
            `┌─────────────────────────────┐\n` +
            `│ Invested: ${this.formatMoney(result.investedAmount).padStart(16)}\n` +
            `│ Returns: ${this.formatMoney(result.estimatedReturns).padStart(17)}\n` +
            `│ Total: ${this.formatMoney(result.totalValue).padStart(19)}\n` +
            `└─────────────────────────────┘`
        }
      }
      
      if (lower.includes('fd') && (lower.includes('calculator') || lower.includes('calculate'))) {
        const matches = query.match(/\d+/g)
        if (matches && matches.length >= 2) {
          const amount = parseInt(matches[0])
          const years = parseInt(matches[1])
          const result = this.calculateFD(amount, years)
          return `🧮 **FD Calculator**\n\n` +
            `Principal: ${this.formatMoney(result.principal)}\n` +
            `Duration: ${result.years} years\n` +
            `Interest Rate: ${result.rate}%\n\n` +
            `┌─────────────────────────────┐\n` +
            `│ Maturity: ${this.formatMoney(result.amount).padStart(16)}\n` +
            `│ Interest: ${this.formatMoney(result.interest).padStart(16)}\n` +
            `└─────────────────────────────┘`
        }
      }
      
      // Route based on category
      switch(category) {
        case 'portfolio':
          return this.analyzePortfolio()
        case 'health':
          return this.generateHealthReport()
        case 'budget':
          return this.analyzeBudget() || this.generateHealthReport()
        case 'debt':
          return this.analyzeDebt() || "I can help with debt analysis once you add your loans."
        case 'goals':
          return this.analyzeGoals() || "Set some financial goals to track your progress!"
        case 'tax':
          return this.generateTaxAdvice()
        default:
          return this.generateHealthReport()
      }
    } catch (error) {
      console.error('Error in advisor answer:', error)
      return "I encountered an error. Please try rephrasing your question."
    }
  }

  // Placeholder methods (implement these as needed)
  analyzeBudget() { return null }
  analyzeDebt() { return null }
  analyzeGoals() { return null }
  analyzeMarketTrends() { return null }
  generateTaxAdvice() { 
    return "🇮🇳 **Tax-Saving Options for India:**\n\n" +
      "• **ELSS**: Lock-in 3 years, tax benefit u/s 80C\n" +
      "• **PPF**: 15-year lock-in, tax-free returns\n" +
      "• **NPS**: Additional ₹50,000 deduction u/s 80CCD(1B)\n" +
      "• **Tax-saving FDs**: 5-year lock-in\n\n" +
      "**Capital Gains Tax:**\n" +
      "• **LTCG** (>1 year): 10% over ₹1 lakh\n" +
      "• **STCG** (<1 year): 15%"
  }
}

// ─── Modern Chat Message Component ─────────────────────────────────────────
function Message({ msg, index, isMobile }) {
  const isAI = msg.role === 'assistant'
  const [copied, setCopied] = useState(false)
  const timestamp = new Date(msg.timestamp || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Format message with modern styling
  const formattedContent = msg.content.split('\n').map((line, i) => {
    if (line.startsWith('┌') || line.startsWith('└') || line.startsWith('│')) {
      return <div key={i} style={{ 
        fontFamily: 'monospace', 
        color: theme.accent,
        fontSize: isMobile ? 11 : 12,
        letterSpacing: '0.5px'
      }}>{line}</div>
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ 
        fontFamily: theme.syne, 
        fontWeight: 700, 
        fontSize: isMobile ? 14 : 16, 
        marginTop: i > 0 ? 16 : 0, 
        marginBottom: 8,
        background: `linear-gradient(135deg, ${theme.accent}, ${theme.blue})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block'
      }}>{line.replace(/\*\*/g, '')}</div>
    }
    if (line.startsWith('  •')) {
      return <div key={i} style={{ 
        display: 'flex', 
        gap: 8, 
        marginLeft: isMobile ? 8 : 16, 
        marginBottom: 4,
        fontSize: isMobile ? 12 : 13
      }}>
        <span style={{ color: theme.accent }}>•</span>
        <span>{line.substring(3)}</span>
      </div>
    }
    if (line.startsWith('✅') || line.startsWith('👍') || line.startsWith('⚠️') || line.startsWith('🚀') || line.startsWith('📉')) {
      return <div key={i} style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        fontSize: isMobile ? 12 : 13,
        background: theme.bg2 + '40',
        padding: '4px 8px',
        borderRadius: 6,
        borderLeft: `2px solid ${theme.accent}`
      }}>{line}</div>
    }
    return <div key={i} style={{ 
      marginBottom: 4,
      fontSize: isMobile ? 12 : 13,
      lineHeight: 1.6
    }}>{line || <br/>}</div>
  })

  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? 8 : 12,
      flexDirection: isAI ? 'row' : 'row-reverse',
      animation: 'fadeUp 0.3s ease',
      marginBottom: 18,
      position: 'relative',
    }}>
      <div style={{
        width: isMobile ? 28 : 36, 
        height: isMobile ? 28 : 36, 
        borderRadius: '50%',
        flexShrink: 0,
        background: isAI 
          ? `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}05)`
          : `linear-gradient(135deg, ${theme.blue}30, ${theme.blue}05)`,
        border: `1px solid ${isAI ? theme.accent + '40' : theme.blue + '40'}`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: isMobile ? 12 : 16,
        color: isAI ? theme.accent : theme.blue,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 4px 12px ${isAI ? theme.accent + '20' : theme.blue + '20'}`,
      }}>
        {isAI ? <Bot size={isMobile ? 14 : 18} /> : <User size={isMobile ? 14 : 18} />}
      </div>
      
      <div style={{
        maxWidth: isMobile ? '85%' : '78%',
        position: 'relative',
      }}>
        <div style={{
          background: isAI ? theme.bg2 : `linear-gradient(135deg, ${theme.blue}15, ${theme.blue}05)`,
          border: `1px solid ${isAI ? theme.border : theme.blue + '30'}`,
          borderRadius: isMobile ? 12 : 16,
          padding: isMobile ? '12px 14px' : '16px 20px',
          fontFamily: theme.mono,
          fontSize: isMobile ? 12 : 13,
          lineHeight: 1.7,
          color: theme.text,
          whiteSpace: 'pre-wrap',
          boxShadow: `0 8px 24px ${isAI ? 'rgba(0,0,0,0.2)' : theme.blue + '20'}`,
          backdropFilter: 'blur(10px)',
          borderBottomRightRadius: isAI ? 16 : 4,
          borderBottomLeftRadius: isAI ? 4 : 16,
        }}>
          {formattedContent}
        </div>
        
        {/* Message footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          paddingRight: 4,
          fontSize: isMobile ? 9 : 10,
          color: theme.muted,
          fontFamily: theme.mono,
          opacity: 0.6,
        }}>
          <Clock size={isMobile ? 10 : 12} />
          <span>{timestamp}</span>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? '#10b981' : theme.muted,
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={isMobile ? 10 : 12} /> : <Copy size={isMobile ? 10 : 12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modern Quick Prompts with Scroll ──────────────────────────────────────
function QuickPrompts({ onSelect, isMobile }) {
  const scrollRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
      handleScroll()
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = isMobile ? 150 : 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div style={{ 
      position: 'relative', 
      marginBottom: isMobile ? 12 : 16,
      padding: '0 4px'
    }}>
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: `linear-gradient(90deg, ${theme.card}, ${theme.card}E6)`,
            border: `1px solid ${theme.border}`,
            borderRadius: '50%',
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme.accent,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <ChevronLeft size={isMobile ? 16 : 18} />
        </button>
      )}
      
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: isMobile ? 6 : 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: isMobile ? '4px 24px' : '4px 32px',
          scrollBehavior: 'smooth',
        }}
      >
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(p.text)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 4 : 6,
              background: `linear-gradient(135deg, ${p.color}10, ${theme.bg2})`,
              border: `1px solid ${p.color}30`,
              borderRadius: isMobile ? 16 : 20,
              color: theme.text,
              fontFamily: theme.mono,
              fontSize: isMobile ? 10 : 11,
              padding: isMobile ? '6px 12px' : '8px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              flexShrink: 0,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 8px 16px ${p.color}30`
              e.currentTarget.style.borderColor = p.color + '80'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = p.color + '30'
            }}
          >
            <span style={{ color: p.color }}>{p.icon}</span>
            {p.text}
          </button>
        ))}
      </div>

      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: `linear-gradient(270deg, ${theme.card}, ${theme.card}E6)`,
            border: `1px solid ${theme.border}`,
            borderRadius: '50%',
            width: isMobile ? 28 : 32,
            height: isMobile ? 28 : 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme.accent,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <ChevronRight size={isMobile ? 16 : 18} />
        </button>
      )}
    </div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────
function TypingIndicator({ isMobile }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: isMobile ? 8 : 12, 
      alignItems: 'center', 
      marginBottom: 18 
    }}>
      <div style={{
        width: isMobile ? 28 : 36, 
        height: isMobile ? 28 : 36, 
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}05)`,
        border: `1px solid ${theme.accent}40`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: theme.accent,
        backdropFilter: 'blur(10px)',
      }}>
        <Bot size={isMobile ? 14 : 18} />
      </div>
      
      <div style={{
        background: `linear-gradient(135deg, ${theme.bg2}, ${theme.bg2}80)`,
        border: `1px solid ${theme.border}`,
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? '10px 16px' : '12px 20px',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        borderBottomLeftRadius: 4,
      }}>
        <Spinner size={isMobile ? 12 : 14} />
        <span style={{ 
          fontFamily: theme.mono, 
          fontSize: isMobile ? 11 : 13, 
          color: theme.muted,
          animation: 'pulse 1.5s infinite'
        }}>
          AI is thinking
        </span>
        <span style={{ 
          animation: 'ellipsis 1.5s infinite',
          fontSize: isMobile ? 11 : 13,
          color: theme.muted
        }}>...</span>
      </div>
    </div>
  )
}

// ─── Main AI Agent Component ───────────────────────────────────────────────
export default function AIAgent() {
  const finance = useFinance()
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '✨ **Welcome to your AI Financial Advisor**\n\nI have access to your live portfolio, budgets, and goals. Ask me anything about your finances!\n\nTry: "Analyze my portfolio" or "Financial health report"',
    timestamp: Date.now()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth <= 768

  // Memoized advisor
  const advisor = useMemo(() => new FinancialAdvisor(finance), [finance])

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleQuery = useCallback(async (query) => {
    if (!query.trim() || loading) return
    
    const userMsg = { 
      role: 'user', 
      content: query,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setTypingIndicator(true)

    setTimeout(() => {
      try {
        const response = advisor.answer(query)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response,
          timestamp: Date.now()
        }])
      } catch (error) {
        console.error('Error:', error)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ I encountered an error. Please try again.',
          timestamp: Date.now()
        }])
      } finally {
        setLoading(false)
        setTypingIndicator(false)
      }
    }, 800)
  }, [advisor, loading])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 170px)',
      gap: isMobile ? 8 : 12,
      position: 'relative',
    }}>
      {/* Background gradient effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '200px',
        background: `radial-gradient(circle at 50% 0%, ${theme.accent}20, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <QuickPrompts onSelect={handleQuery} isMobile={isMobile} />

      {/* Chat Window */}
      <div style={{
        flex: 1,
        background: theme.card + 'CC',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${theme.border}`,
        borderRadius: isMobile ? 16 : 24,
        overflow: 'auto',
        padding: isMobile ? 16 : 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {messages.map((m, i) => (
          <Message key={i} msg={m} index={i} isMobile={isMobile} />
        ))}
        
        {typingIndicator && <TypingIndicator isMobile={isMobile} />}
        
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div style={{
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? 8 : 10,
          background: theme.card + 'CC',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${theme.border}`,
          borderRadius: isMobile ? 16 : 100,
          padding: isMobile ? 4 : 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleQuery(input)}
            placeholder="Ask about your finances..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: theme.text,
              fontFamily: theme.mono,
              fontSize: isMobile ? 13 : 14,
              padding: isMobile ? '12px 16px' : '14px 20px',
              outline: 'none',
              '::placeholder': {
                color: theme.muted + '80',
              }
            }}
          />
          <button
            onClick={() => handleQuery(input)}
            disabled={loading || !input.trim()}
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.blue})`,
              border: 'none',
              borderRadius: isMobile ? 12 : 100,
              color: 'white',
              padding: isMobile ? '0 16px' : '0 24px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: theme.mono,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${theme.accent}40`,
            }}
            onMouseEnter={e => {
              if (!loading && input.trim()) {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = `0 8px 20px ${theme.accent}60`
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent}40`
            }}
          >
            {loading ? <Spinner size={isMobile ? 14 : 16} /> : <Send size={isMobile ? 14 : 16} />}
            {!isMobile && 'Send'}
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes ellipsis {
          0%, 100% { opacity: .2; }
          50% { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${theme.bg2}40;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${theme.accent}40;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.accent}60;
        }
      `}</style>
    </div>
  )
}