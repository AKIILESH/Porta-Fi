import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { Btn, Spinner } from '../shared/ui.jsx'
import { inr, inrCompact, pct, currentMonth } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { Copy, Clock, Check } from 'lucide-react'

// Enhanced quick prompts with categories
const QUICK_PROMPTS = [
  { text: 'Analyze my portfolio', category: 'portfolio', icon: '📊' },
  { text: 'Market trends impact', category: 'markets', icon: '📈' },
  { text: 'Debt payoff strategy', category: 'debt', icon: '💰' },
  { text: 'Review my budget', category: 'budget', icon: '📝' },
  { text: 'Savings goals progress', category: 'goals', icon: '🎯' },
  { text: 'Financial health report', category: 'health', icon: '🏥' },
  { text: 'Portfolio rebalancing', category: 'portfolio', icon: '⚖️' },
  { text: 'Tax-saving options', category: 'tax', icon: '🔖' },
  { text: 'SIP calculator', category: 'calculator', icon: '🧮' },
  { text: 'FD vs Equity compare', category: 'compare', icon: '⚖️' },
]

// ── Advanced Financial Advisor Engine ───────────────────────────────────────
class FinancialAdvisor {
  constructor(finance) {
    this.finance = finance
  }

  // Helper to format currency
  formatMoney(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Smart query routing with keyword scoring
  routeQuery(query) {
    const lower = query.toLowerCase()
    
    // Define keyword scores for each category
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

    // Find category with highest score
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
  calculateFD(principal, years, rate, compounding = 'yearly') {
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
    const { holdings, quotesMap, portfolioValue, portfolioCost, portfolioGain } = this.finance
    const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0

    let analysis = `📊 **Portfolio Analysis**\n\n`
    analysis += `• Total Value: ${this.formatMoney(portfolioValue)}\n`
    analysis += `• Total Cost: ${this.formatMoney(portfolioCost)}\n`
    analysis += `• Unrealized P&L: ${this.formatMoney(portfolioGain)} (${pct(portfolioGainPct)})\n\n`

    // Top performers
    const performers = holdings.map(h => {
      const price = quotesMap[h.ticker]?.price ?? h.avg_cost
      const gainPct = ((price - h.avg_cost) / h.avg_cost) * 100
      return { ...h, gainPct, currentPrice: price }
    })

    const winners = performers.filter(p => p.gainPct > 10).sort((a, b) => b.gainPct - a.gainPct)
    const losers = performers.filter(p => p.gainPct < -5).sort((a, b) => a.gainPct - b.gainPct)

    if (winners.length > 0) {
      analysis += `🏆 **Top Performers (>10%):**\n`
      winners.slice(0, 3).forEach(w => {
        analysis += `  • ${w.ticker}: ${pct(w.gainPct)} return\n`
      })
    }

    if (losers.length > 0) {
      analysis += `\n⚠️ **Underperformers (<-5%):**\n`
      losers.slice(0, 3).forEach(l => {
        analysis += `  • ${l.ticker}: ${pct(l.gainPct)} return\n`
      })
    }

    // Recommendations
    analysis += `\n💡 **Recommendations:**\n`
    
    // Check concentration
    const topHolding = performers.sort((a, b) => b.currentPrice * b.quantity - a.currentPrice * a.quantity)[0]
    if (topHolding) {
      const topValue = topHolding.currentPrice * topHolding.quantity
      const topPct = (topValue / portfolioValue) * 100
      if (topPct > 25) {
        analysis += `  • Your position in ${topHolding.ticker} is ${topPct.toFixed(1)}% of portfolio. Consider reducing to manage risk.\n`
      }
    }

    // Check losers
    if (losers.length > 2) {
      analysis += `  • Multiple holdings are down >5%. Review if these are still good long-term bets.\n`
    }

    return analysis
  }

  // Analyze portfolio with asset allocation
  analyzePortfolioDetailed() {
    const { holdings, quotesMap, portfolioValue, byAssetClass } = this.finance
    
    let analysis = `📊 **Detailed Portfolio Analysis**\n\n`
    analysis += `• Total Value: ${this.formatMoney(portfolioValue)}\n\n`

    // Asset allocation pie
    analysis += `**Asset Allocation:**\n`
    const allocation = Object.entries(byAssetClass)
      .sort((a, b) => b[1] - a[1])
    
    allocation.forEach(([asset, value]) => {
      const pct = (value / portfolioValue * 100).toFixed(1)
      analysis += `  • ${this.getAssetLabel(asset)}: ${this.formatMoney(value)} (${pct}%)\n`
    })

    // Top holdings
    analysis += `\n**Top 5 Holdings:**\n`
    const topHoldings = holdings
      .map(h => ({
        ...h,
        value: (quotesMap[h.ticker]?.price || h.avg_cost) * h.quantity
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    topHoldings.forEach(h => {
      const pct = (h.value / portfolioValue * 100).toFixed(1)
      analysis += `  • ${h.name || h.ticker}: ${this.formatMoney(h.value)} (${pct}%)\n`
    })

    return analysis
  }

  // Analyze market trends
  analyzeMarketTrends() {
    const { indices, holdings } = this.finance
    
    let analysis = `📈 **Market Trends Analysis**\n\n`
    
    // Indian indices
    analysis += `**Indian Markets:**\n`
    if (indices['^BSESN']) {
      const sensex = indices['^BSESN']
      analysis += `  • SENSEX: ${sensex.price?.toFixed(2)} (${pct(sensex.changePct || 0)} today)\n`
    }
    if (indices['^NSEI']) {
      const nifty = indices['^NSEI']
      analysis += `  • NIFTY 50: ${nifty.price?.toFixed(2)} (${pct(nifty.changePct || 0)} today)\n`
    }

    // Global indices
    analysis += `\n**Global Markets:**\n`
    if (indices['^GSPC']) {
      const sp500 = indices['^GSPC']
      analysis += `  • S&P 500: ${sp500.price?.toFixed(2)} (${pct(sp500.changePct || 0)} today)\n`
    }
    if (indices['^IXIC']) {
      const nasdaq = indices['^IXIC']
      analysis += `  • NASDAQ: ${nasdaq.price?.toFixed(2)} (${pct(nasdaq.changePct || 0)} today)\n`
    }

    // Impact on portfolio
    analysis += `\n💡 **Impact on Your Portfolio:**\n`
    
    const usHoldings = holdings.filter(h => ['NYSE', 'NASDAQ'].includes(h.exchange))
    const indianHoldings = holdings.filter(h => ['NSE', 'BSE'].includes(h.exchange))

    if (indianHoldings.length > 0) {
      const marketTrend = indices['^BSESN']?.changePct || 0
      if (marketTrend > 1) {
        analysis += `  • Indian markets are up today. Good for your ${indianHoldings.length} Indian holdings.\n`
      } else if (marketTrend < -1) {
        analysis += `  • Indian markets are down today. Consider buying opportunities in quality stocks.\n`
      }
    }

    if (usHoldings.length > 0 && indices['^GSPC']) {
      const usTrend = indices['^GSPC'].changePct || 0
      analysis += `  • US markets are ${usTrend > 0 ? 'up' : 'down'} ${pct(Math.abs(usTrend))}. `
      analysis += usTrend > 0 ? 'Your US holdings are gaining value.\n' : 'Consider dollar-cost averaging.\n'
    }

    return analysis
  }

  // Analyze debt
  analyzeDebt() {
    const { debts, totalDebt, monthlyIncome, monthlyExpenses } = this.finance
    
    if (debts.length === 0) {
      return "✅ **Great news!** You have no debts. Focus on investing and building wealth."
    }

    let analysis = `💰 **Debt Analysis**\n\n`
    analysis += `• Total Debt: ${this.formatMoney(totalDebt)}\n`
    
    const debtToIncome = (totalDebt / (monthlyIncome * 12)) * 100
    analysis += `• Debt-to-Income Ratio: ${debtToIncome.toFixed(1)}%\n\n`

    // Sort debts by interest rate (highest first)
    const sortedDebts = [...debts].sort((a, b) => b.rate - a.rate)

    analysis += `**Your Debts (Highest Interest First):**\n`
    sortedDebts.forEach(d => {
      const monthlyPayment = d.min_payment || 0
      analysis += `  • ${d.name}: ${this.formatMoney(d.balance)} @ ${d.rate}% p.a. (EMI: ${this.formatMoney(monthlyPayment)}/mo)\n`
    })

    analysis += `\n💡 **Debt Payoff Strategy:**\n`
    
    // Avalanche method recommendation
    if (sortedDebts.length > 0) {
      const highest = sortedDebts[0]
      analysis += `  • **Avalanche Method:** Pay off ${highest.name} first (${highest.rate}% interest). This saves the most money long-term.\n`
      
      if (highest.rate > 15) {
        analysis += `  • ⚠️ ${highest.rate}% is very high interest. Consider using any surplus to pay this down aggressively.\n`
      }
    }

    // Check if they're paying more than minimum
    const totalMinPayments = debts.reduce((sum, d) => sum + (d.min_payment || 0), 0)
    if (monthlyIncome - monthlyExpenses > totalMinPayments * 1.2) {
      analysis += `  • You have surplus after expenses. Put extra toward your highest-interest debt.\n`
    }

    return analysis
  }

  // Analyze budget and savings
  analyzeBudget() {
    const { monthlyIncome, monthlyExpenses, spendByCategory, budgetLimits } = this.finance
    
    const savings = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0

    let analysis = `📋 **Budget & Savings Analysis**\n\n`
    analysis += `• Monthly Income: ${this.formatMoney(monthlyIncome)}\n`
    analysis += `• Monthly Expenses: ${this.formatMoney(monthlyExpenses)}\n`
    analysis += `• Monthly Savings: ${this.formatMoney(savings)}\n`
    analysis += `• Savings Rate: ${savingsRate.toFixed(1)}%\n\n`

    // Check savings rate against 50/30/20 rule
    analysis += `**50/30/20 Rule Check:**\n`
    analysis += `  • Needs (50%): ${this.formatMoney(monthlyIncome * 0.5)}\n`
    analysis += `  • Wants (30%): ${this.formatMoney(monthlyIncome * 0.3)}\n`
    analysis += `  • Savings (20%): ${this.formatMoney(monthlyIncome * 0.2)}\n\n`

    if (savingsRate >= 20) {
      analysis += `✅ **Excellent!** You're saving ${savingsRate.toFixed(1)}% of your income, above the recommended 20%.\n`
    } else if (savingsRate >= 10) {
      analysis += `👍 **Good start!** You're saving ${savingsRate.toFixed(1)}%. Try to reach 20% by reducing discretionary spending.\n`
    } else {
      analysis += `⚠️ **Warning:** You're only saving ${savingsRate.toFixed(1)}%. Aim for at least 10-20% of income.\n`
    }

    // Budget vs actual
    if (budgetLimits.length > 0) {
      analysis += `\n**Budget vs Actual (This Month):**\n`
      budgetLimits.forEach(b => {
        const spent = spendByCategory[b.category] || 0
        const pctOfLimit = (spent / b.monthly_limit) * 100
        const status = spent > b.monthly_limit ? '🔴 Over' : '✅ On track'
        analysis += `  • ${b.category}: ${this.formatMoney(spent)} / ${this.formatMoney(b.monthly_limit)} (${pctOfLimit.toFixed(0)}%) ${status}\n`
      })
    }

    return analysis
  }

  // Analyze goals
  analyzeGoals() {
    const { goals } = this.finance
    
    if (goals.length === 0) {
      return "🎯 You haven't set any financial goals yet. Consider setting some (e.g., emergency fund, retirement, home down payment)."
    }

    let analysis = `🎯 **Goal Progress**\n\n`

    goals.forEach(g => {
      const progress = (g.saved / g.target) * 100
      const remaining = g.target - g.saved
      analysis += `**${g.name}**\n`
      analysis += `  • Target: ${this.formatMoney(g.target)}\n`
      analysis += `  • Saved: ${this.formatMoney(g.saved)} (${progress.toFixed(1)}%)\n`
      analysis += `  • Remaining: ${this.formatMoney(remaining)}\n`

      if (g.deadline) {
        const deadline = new Date(g.deadline)
        const today = new Date()
        const monthsLeft = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth())
        
        if (monthsLeft > 0) {
          const monthlyNeeded = remaining / monthsLeft
          analysis += `  • Need to save ${this.formatMoney(monthlyNeeded)}/month to reach goal by ${g.deadline}\n`
        }
      }
      analysis += `\n`
    })

    return analysis
  }

  // Generate complete financial health report
  generateHealthReport() {
    const { netWorth, portfolioValue, cashBalance, totalDebt, monthlyIncome, monthlyExpenses } = this.finance
    
    const savings = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0
    const debtToIncome = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0

    let report = `📊 **COMPLETE FINANCIAL HEALTH REPORT**\n\n`
    report += `**Net Worth:** ${this.formatMoney(netWorth)}\n`
    report += `  • Investments: ${this.formatMoney(portfolioValue)}\n`
    report += `  • Cash: ${this.formatMoney(cashBalance)}\n`
    report += `  • Debt: -${this.formatMoney(totalDebt)}\n\n`

    report += `**Income & Expenses:**\n`
    report += `  • Monthly Income: ${this.formatMoney(monthlyIncome)}\n`
    report += `  • Monthly Expenses: ${this.formatMoney(monthlyExpenses)}\n`
    report += `  • Monthly Savings: ${this.formatMoney(savings)}\n`
    report += `  • Savings Rate: ${savingsRate.toFixed(1)}%\n\n`

    report += `**Ratios:**\n`
    report += `  • Debt-to-Income: ${debtToIncome.toFixed(1)}% (should be <36%)\n`
    report += `  • Emergency Fund: ${(cashBalance / monthlyExpenses).toFixed(1)} months (should be 3-6 months)\n\n`

    // Overall assessment
    report += `**Overall Assessment:**\n`
    
    let score = 0
    let maxScore = 5

    // Check emergency fund
    if (cashBalance >= monthlyExpenses * 6) {
      report += `  ✅ Excellent: 6+ months emergency fund\n`
      score++
    } else if (cashBalance >= monthlyExpenses * 3) {
      report += `  ✅ Good: 3-6 months emergency fund\n`
      score++
    } else {
      report += `  ⚠️ Warning: Emergency fund less than 3 months\n`
    }

    // Check debt
    if (debtToIncome < 20) {
      report += `  ✅ Great: Low debt burden\n`
      score++
    } else if (debtToIncome < 36) {
      report += `  ✅ Acceptable: Manageable debt\n`
    } else {
      report += `  ⚠️ High debt: Consider debt reduction strategy\n`
    }

    // Check savings rate
    if (savingsRate >= 20) {
      report += `  ✅ Excellent savings rate\n`
      score++
    } else if (savingsRate >= 10) {
      report += `  ✅ Good savings rate\n`
    } else {
      report += `  ⚠️ Low savings rate\n`
    }

    // Check investments vs cash
    if (portfolioValue > cashBalance) {
      report += `  ✅ Good: More invested than sitting in cash\n`
      score++
    } else {
      report += `  ⚠️ Consider investing excess cash for better returns\n`
    }

    report += `\n**Health Score: ${score}/${maxScore}**\n`

    return report
  }

  // Generate tax advice
  generateTaxAdvice() {
    return "🇮🇳 **Tax-Saving Options for India:**\n\n" +
      "• **ELSS**: Lock-in 3 years, tax benefit u/s 80C, market-linked returns\n" +
      "• **PPF**: 15-year lock-in, tax-free returns, u/s 80C benefit\n" +
      "• **NPS**: Additional ₹50,000 deduction u/s 80CCD(1B), market-linked\n" +
      "• **Tax-saving FDs**: 5-year lock-in, u/s 80C benefit\n" +
      "• **Sukanya Samriddhi Yojana**: For girl child, high interest, u/s 80C\n\n" +
      "**Capital Gains Tax:**\n" +
      "• **LTCG** (held >1 year): 10% over ₹1 lakh\n" +
      "• **STCG** (held <1 year): 15%"
  }

  // Compare FD vs Equity
  compareFDvsEquity(fdAmount = 100000, fdRate = 7.5, years = 10, equityReturn = 12) {
    const fdResult = this.calculateFD(fdAmount, years, fdRate)
    const sipResult = this.calculateSIP(fdAmount / 12, years, equityReturn)
    
    const inflationAdjustedFD = this.calculateInflationAdjusted(fdResult.amount, 0, 6)
    const inflationAdjustedEquity = this.calculateInflationAdjusted(sipResult.totalValue, 0, 6)

    let comparison = `⚖️ **FD vs Equity Comparison**\n\n`
    comparison += `**Fixed Deposit (${fdRate}%):**\n`
    comparison += `  • Principal: ${this.formatMoney(fdAmount)}\n`
    comparison += `  • Maturity: ${this.formatMoney(fdResult.amount)}\n`
    comparison += `  • Interest Earned: ${this.formatMoney(fdResult.interest)}\n`
    comparison += `  • Inflation-adjusted: ${this.formatMoney(inflationAdjustedFD.futureValue)}\n\n`

    comparison += `**Equity SIP (${equityReturn}% expected):**\n`
    comparison += `  • Total Invested: ${this.formatMoney(sipResult.investedAmount)}\n`
    comparison += `  • Expected Value: ${this.formatMoney(sipResult.totalValue)}\n`
    comparison += `  • Expected Returns: ${this.formatMoney(sipResult.estimatedReturns)}\n`
    comparison += `  • Inflation-adjusted: ${this.formatMoney(inflationAdjustedEquity.futureValue)}\n\n`

    const diff = sipResult.totalValue - fdResult.amount
    comparison += `**Verdict:** Equity could potentially give you **${this.formatMoney(Math.abs(diff))}** ${diff > 0 ? 'more' : 'less'} than FD over ${years} years.\n`
    comparison += `\n⚠️ Note: Equity returns are not guaranteed and carry market risk.`

    return comparison
  }

  // Get asset label helper
  getAssetLabel(assetClass) {
    const labels = {
      equity: 'Equity',
      us_equity: 'US Equity',
      etf: 'ETF',
      index_fund: 'Index Fund',
      elss: 'ELSS',
      mutual_fund: 'Mutual Fund',
      debt_fund: 'Debt Fund',
      liquid_fund: 'Liquid Fund',
      hybrid_fund: 'Hybrid Fund',
      gold: 'Gold',
      silver: 'Silver',
      reit: 'REIT',
      invit: 'InvIT',
      crypto: 'Crypto',
      other: 'Other'
    }
    return labels[assetClass] || assetClass
  }

  // Main method with enhanced routing
  answer(query) {
    try {
      const lower = query.toLowerCase()
      const category = this.routeQuery(query)
      
      // Check for specific calculator queries
      if (lower.includes('sip') && lower.includes('calculator')) {
        // Try to extract numbers from query
        const matches = query.match(/\d+/g)
        if (matches && matches.length >= 1) {
          const amount = parseInt(matches[0])
          const years = matches.length >= 2 ? parseInt(matches[1]) : 10
          const result = this.calculateSIP(amount, years, 12)
          return `🧮 **SIP Calculator Results**\n\n` +
            `Monthly SIP: ${this.formatMoney(result.monthlyInvestment)}\n` +
            `Duration: ${result.years} years\n` +
            `Expected Return: ${result.expectedReturn}%\n\n` +
            `Total Invested: ${this.formatMoney(result.investedAmount)}\n` +
            `Estimated Returns: ${this.formatMoney(result.estimatedReturns)}\n` +
            `Total Value: ${this.formatMoney(result.totalValue)}`
        }
      }
      
      if (lower.includes('fd') && lower.includes('equity') && lower.includes('compare')) {
        return this.compareFDvsEquity()
      }
      
      if (lower.includes('fd') && lower.includes('calculator')) {
        const matches = query.match(/\d+/g)
        if (matches && matches.length >= 2) {
          const amount = parseInt(matches[0])
          const years = parseInt(matches[1])
          const result = this.calculateFD(amount, years, 7.5)
          return `🧮 **FD Calculator Results**\n\n` +
            `Principal: ${this.formatMoney(result.principal)}\n` +
            `Duration: ${result.years} years\n` +
            `Interest Rate: ${result.rate}%\n\n` +
            `Maturity Amount: ${this.formatMoney(result.amount)}\n` +
            `Interest Earned: ${this.formatMoney(result.interest)}`
        }
      }
      
      if (lower.includes('inflation')) {
        const matches = query.match(/\d+/g)
        if (matches && matches.length >= 2) {
          const amount = parseInt(matches[0])
          const years = parseInt(matches[1])
          const result = this.calculateInflationAdjusted(amount, years)
          return `📈 **Inflation-Adjusted Projections**\n\n` +
            `Amount: ${this.formatMoney(amount)}\n` +
            `Years: ${years}\n` +
            `Inflation Rate: ${result.inflationRate}%\n\n` +
            `Future Value (with inflation): ${this.formatMoney(result.futureValue)}\n` +
            `Present Value (in today's money): ${this.formatMoney(result.presentValue)}`
        }
      }
      
      // Route based on category
      switch(category) {
        case 'portfolio':
          if (lower.includes('allocation') || lower.includes('breakdown') || lower.includes('detailed')) {
            return this.analyzePortfolioDetailed()
          }
          return this.analyzePortfolio()
        
        case 'markets':
          return this.analyzeMarketTrends()
        
        case 'debt':
          return this.analyzeDebt()
        
        case 'budget':
          return this.analyzeBudget()
        
        case 'goals':
          return this.analyzeGoals()
        
        case 'tax':
          return this.generateTaxAdvice()
        
        case 'calculator':
        case 'compare':
          if (lower.includes('health') || lower.includes('report')) {
            return this.generateHealthReport()
          }
          return "I can help you with calculations! Try:\n" +
            "• 'SIP calculator for ₹5000 for 10 years'\n" +
            "• 'Compare FD vs equity'\n" +
            "• 'FD calculator for ₹1 lakh for 5 years'\n" +
            "• 'Inflation adjustment for ₹1 crore in 20 years'"
        
        default:
          return this.generateHealthReport()
      }
    } catch (error) {
      console.error('Error in advisor:', error)
      return "I encountered an error analyzing your request. Please try rephrasing your question."
    }
  }
}

// ── Enhanced Chat Message with Timestamp and Copy ───────────────────────────
function Message({ msg, index }) {
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

  // Format message with better markdown
  const formattedContent = msg.content.split('\n').map((line, i) => {
    if (line.startsWith('# ')) {
      return <div key={i} style={{ fontFamily: theme.syne, fontWeight: 700, fontSize: 18, marginTop: i > 0 ? 16 : 0, marginBottom: 8 }}>{line.substring(2)}</div>
    }
    if (line.startsWith('## ')) {
      return <div key={i} style={{ fontFamily: theme.syne, fontWeight: 600, fontSize: 16, marginTop: i > 0 ? 14 : 0, marginBottom: 6 }}>{line.substring(3)}</div>
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ fontFamily: theme.syne, fontWeight: 600, fontSize: 14, marginTop: i > 0 ? 12 : 0, marginBottom: 6 }}>{line.replace(/\*\*/g, '')}</div>
    }
    if (line.startsWith('  •')) {
      return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 16, marginBottom: 4 }}>
        <span style={{ color: theme.accent }}>•</span>
        <span>{line.substring(3)}</span>
      </div>
    }
    if (line.match(/^[\d]+\./)) {
      return <div key={i} style={{ display: 'flex', gap: 8, marginLeft: 16, marginBottom: 4 }}>
        <span style={{ color: theme.accent }}>{line.substring(0, line.indexOf('.') + 1)}</span>
        <span>{line.substring(line.indexOf('.') + 1)}</span>
      </div>
    }
    return <div key={i} style={{ marginBottom: 4 }}>{line || <br/>}</div>
  })

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      flexDirection: isAI ? 'row' : 'row-reverse',
      animation: 'fadeUp .3s ease',
      marginBottom: 18,
      position: 'relative',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: isAI ? `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}10)` : `linear-gradient(135deg, ${theme.blue}30, ${theme.blue}10)`,
        border: `1px solid ${isAI ? theme.accent + '40' : theme.blue + '40'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: isAI ? theme.accent : theme.blue,
      }}>
        {isAI ? '✦' : '👤'}
      </div>
      <div style={{
        maxWidth: '78%',
        position: 'relative',
      }}>
        <div style={{
          background: isAI ? theme.bg2 : theme.blue + '15',
          border: `1px solid ${isAI ? theme.border : theme.blue + '30'}`,
          borderRadius: 12, 
          padding: '14px 18px',
          fontFamily: theme.mono, 
          fontSize: 13, 
          lineHeight: 1.75,
          color: theme.text, 
          whiteSpace: 'pre-wrap',
        }}>
          {formattedContent}
        </div>
        
        {/* Message footer with timestamp and copy button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          fontSize: 10,
          color: theme.muted,
          fontFamily: theme.mono,
          opacity: 0.6,
          transition: 'opacity 0.2s',
        }}>
          <Clock size={10} />
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
              gap: 2
            }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Enhanced Quick Prompts with Scroll ──────────────────────────────────────
function QuickPrompts({ onSelect }) {
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
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            background: `linear-gradient(90deg, ${theme.card}, ${theme.card}80)`,
            border: 'none',
            width: 30,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            cursor: 'pointer',
            color: theme.accent
          }}
        >
          ◀
        </button>
      )}
      
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 0',
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
              gap: 6,
              background: theme.bg2,
              border: `1px solid ${theme.border}`,
              borderRadius: 20,
              color: theme.text,
              fontFamily: theme.mono,
              fontSize: 11,
              padding: '6px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all .15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = theme.accent + '60'
              e.target.style.background = theme.accent + '10'
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = theme.border
              e.target.style.background = theme.bg2
            }}
          >
            <span>{p.icon}</span>
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
            zIndex: 2,
            background: `linear-gradient(270deg, ${theme.card}, ${theme.card}80)`,
            border: 'none',
            width: 30,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            cursor: 'pointer',
            color: theme.accent
          }}
        >
          ▶
        </button>
      )}
    </div>
  )
}

// ── AI Agent Index ─────────────────────────────────────────────────────────────
export default function AIAgent() {
  const finance = useFinance()
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '👋 Hi! I\'m your personal finance AI agent.\n\nI have access to your live portfolio, budgets, debts, and savings goals. I can analyze market trends, calculate SIP returns, compare FD vs equity, and much more.\n\nWhat would you like to explore today?',
    timestamp: Date.now()
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // Memoized advisor to prevent unnecessary recalculations
  const advisor = useMemo(() => new FinancialAdvisor(finance), [finance])

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debounced input handler
  const [debouncedInput, setDebouncedInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input)
    }, 300)
    return () => clearTimeout(timer)
  }, [input])

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

    // Simulate processing for better UX
    setTimeout(() => {
      try {
        const response = advisor.answer(query)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response,
          timestamp: Date.now()
        }])
      } catch (error) {
        console.error('Error in handleQuery:', error)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ Sorry, I encountered an error analyzing your data. Please try again.',
          timestamp: Date.now()
        }])
      } finally {
        setLoading(false)
        setTypingIndicator(false)
      }
    }, 800)
  }, [advisor, loading])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', gap: 12 }}>
      <QuickPrompts onSelect={handleQuery} />

      {/* Chat Window */}
      <div style={{
        flex: 1,
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        overflow: 'auto',
        padding: 20,
      }}>
        {messages.map((m, i) => (
          <Message key={i} msg={m} index={i} />
        ))}
        
        {/* Typing Indicator */}
        {typingIndicator && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: theme.accent + '20',
              border: `1px solid ${theme.accent + '40'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.accent, fontSize: 16
            }}>
              ✦
            </div>
            <div style={{
              background: theme.bg2,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              gap: 4,
              alignItems: 'center'
            }}>
              <Spinner size={14} />
              <span style={{ 
                fontFamily: theme.mono, 
                fontSize: 13, 
                color: theme.muted,
                animation: 'pulse 1.5s infinite'
              }}>
                Analyzing your finances
              </span>
              <span style={{ animation: 'ellipsis 1.5s infinite' }}>...</span>
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>

      {/* Input with suggestions */}
      <div style={{ position: 'relative' }}>
        {debouncedInput && !loading && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: 8,
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: '8px',
            zIndex: 10
          }}>
            <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>
              Try asking:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_PROMPTS
                .filter(p => p.text.toLowerCase().includes(debouncedInput.toLowerCase()))
                .slice(0, 3)
                .map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuery(p.text)}
                    style={{
                      background: theme.bg2,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 16,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontFamily: theme.mono,
                      color: theme.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>{p.icon}</span>
                    {p.text}
                  </button>
                ))}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleQuery(input)}
            placeholder="Ask about your portfolio, SIP calculator, FD vs equity, tax-saving..."
            style={{
              flex: 1,
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              color: theme.text,
              fontFamily: theme.mono,
              fontSize: 13,
              padding: '12px 16px',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = theme.accent + '80')}
            onBlur={e => (e.target.style.borderColor = theme.border)}
          />
          <Btn 
            onClick={() => handleQuery(input)} 
            disabled={loading || !input.trim()} 
            color={theme.accent} 
            style={{ padding: '12px 22px' }}
          >
            {loading ? <Spinner size={14} /> : 'Send ▶'}
          </Btn>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes ellipsis {
          0% { opacity: .2; }
          20% { opacity: 1; }
          100% { opacity: .2; }
        }
      `}</style>
    </div>
  )
}