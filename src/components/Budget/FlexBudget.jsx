// src/components/Budget/FlexBudget.jsx
import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { useFlexBudget } from '../../hooks/useFlexBudget'
import { currentMonth } from '../../lib/formatters'
import { inr } from '../../lib/formatters'
import theme from '../../lib/theme'
import { 
  TrendingUp, TrendingDown, ArrowRight, 
  AlertCircle, Check, X, RefreshCw, Coffee,
  ShoppingBag, Car, Film, Home, Heart, Zap,
  Gift, BookOpen, Plane, Smartphone, Briefcase,
  PiggyBank, Utensils, Hash, Move,BanknoteArrowDown
} from 'lucide-react'

// Category icon mapping
const CATEGORY_ICONS = {
  'Food & Dining': Utensils,
  'Groceries': ShoppingBag,
  'Shopping': ShoppingBag,
  'Transport': Car,
  'Entertainment': Film,
  'Bills & Utilities': Zap,
  'Healthcare': Heart,
  'Housing': Home,
  'Education': BookOpen,
  'Travel': Plane,
  'Electronics': Smartphone,
  'Salary': Briefcase,
  'Freelance': Coffee,
  'Investments': TrendingUp,
  'Savings': PiggyBank,
  'Gifts': Gift,
  'Other': Hash,
  'Loans':BanknoteArrowDown
}

const glass = (o = 0.04, b = 20) => ({
  background: `rgba(255,255,255,${o})`,
  backdropFilter: `blur(${b}px) saturate(180%)`,
})

// Category Bubble Component
function CategoryBubble({ 
  name, 
  data, 
  onDragStart, 
  onDragEnd, 
  onDrop,
  isDragging,
  isOverTarget 
}) {
  const Icon = CATEGORY_ICONS[name] || Hash
  const percent = data.percentUsed
  const isOver = data.isOver
  const color = isOver ? theme.red : percent > 80 ? theme.yellow : theme.green
  
  return (
    <div
      draggable={!data.isFlexReserve}
      onDragStart={(e) => {
        e.dataTransfer.setData('category', name)
        e.dataTransfer.setData('amount', data.remaining)
        onDragStart(name)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const fromCategory = e.dataTransfer.getData('category')
        const amount = parseFloat(e.dataTransfer.getData('amount'))
        if (fromCategory && fromCategory !== name) {
          onDrop(fromCategory, name, Math.min(amount, data.remaining))
        }
      }}
      style={{
        ...glass(0.08, 16),
        border: `2px solid ${isOverTarget ? theme.accent : color}`,
        borderRadius: 16,
        padding: 16,
        cursor: data.isFlexReserve ? 'default' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: 4,
        width: `${Math.min(percent, 100)}%`,
        background: color,
        transition: 'width 0.3s'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          <Icon size={20} />
        </div>
        <div>
          <div style={{ fontFamily: theme.sans, fontSize: '1rem', color: theme.text }}>
            {name}
          </div>
          {!data.isFlexReserve && (
            <div style={{ fontFamily: theme.mono, fontSize: '0.7rem', color: theme.muted }}>
              Limit: {inr(data.limit)}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: theme.display, fontSize: '1.3rem', color: theme.text }}>
            {inr(data.spent)}
          </div>
          {!data.isFlexReserve && (
            <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted }}>
              Spent
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontFamily: theme.display, 
            fontSize: '1.1rem', 
            color: data.isOver ? theme.red : theme.green 
          }}>
            {data.isOver ? `-${inr(data.overAmount)}` : inr(data.remaining)}
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted }}>
            {data.isOver ? 'Overspent' : 'Remaining'}
          </div>
        </div>
      </div>

      {data.isFlexReserve && (
        <div style={{
          marginTop: 8,
          padding: '4px 8px',
          background: `${theme.accent}20`,
          borderRadius: 8,
          textAlign: 'center',
          fontFamily: theme.mono,
          fontSize: '0.6rem',
          color: theme.accent
        }}>
          🎯 Rollover Reserve
        </div>
      )}
    </div>
  )
}

// Smart Suggestion Component
function SmartSuggestion({ suggestion, onAccept, onDecline }) {
  if (!suggestion) return null

  return (
    <div style={{
      ...glass(0.12, 20),
      border: `1px solid ${theme.accent}`,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      animation: 'fadeUp 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <AlertCircle size={20} color={theme.yellow} />
        <h3 style={{ fontFamily: theme.sans, fontSize: '1rem', color: theme.text, margin: 0 }}>
          You're ₹{inr(suggestion.overspent.overAmount)} over in "{suggestion.overspent.name}"
        </h3>
      </div>

      <p style={{ fontFamily: theme.mono, fontSize: '0.8rem', color: theme.muted, marginBottom: 16 }}>
        Where should we pull this from?
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        {suggestion.available.map(cat => (
          <button
            key={cat.name}
            onClick={() => onAccept(cat, Math.min(cat.remaining, suggestion.overspent.overAmount))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: glass(0.06, 10),
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = glass(0.1, 10)
              e.currentTarget.style.borderColor = theme.accent
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = glass(0.06, 10)
              e.currentTarget.style.borderColor = theme.border
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowRight size={14} color={theme.accent} />
              <span style={{ fontFamily: theme.sans, color: theme.text }}>
                Take it from {cat.name}
              </span>
            </div>
            <span style={{ fontFamily: theme.mono, color: theme.green }}>
              {inr(Math.min(cat.remaining, suggestion.overspent.overAmount))} available
            </span>
          </button>
        ))}

        <button
          onClick={() => onDecline()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px',
            background: 'transparent',
            border: `1px dashed ${theme.border}`,
            borderRadius: 12,
            cursor: 'pointer',
            color: theme.muted,
            fontFamily: theme.mono,
            fontSize: '0.7rem'
          }}
        >
          <X size={14} /> Reduce next month's allowance instead
        </button>
      </div>
    </div>
  )
}

// Main Flex Budget Component
export default function FlexBudget() {
  const { userId } = useFinance()
  const month = currentMonth()
  const [draggingFrom, setDraggingFrom] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  
  const {
    flexFund,
    overspentCategories,
    showSuggestion,
    startDrag,
    dropToRebalance,
    acceptSuggestion,
    rolloverToNextMonth,
    isRollingOver
  } = useFlexBudget(userId, month)

  const handleDragStart = (category) => {
    setDraggingFrom(category)
    startDrag(category)
  }

  const handleDragEnd = () => {
    setDraggingFrom(null)
    setDropTarget(null)
  }

  const handleDrop = (from, to, amount) => {
    dropToRebalance(from, to, amount)
    setDraggingFrom(null)
    setDropTarget(null)
  }

  const handleAcceptSuggestion = (fromCategory, amount) => {
    acceptSuggestion(fromCategory, amount)
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: theme.display, fontSize: '2rem', color: theme.text, margin: 0 }}>
            Flex Fund
          </h1>
          <p style={{ fontFamily: theme.mono, fontSize: '0.7rem', color: theme.muted }}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Drag bubbles to rebalance
          </p>
        </div>

        {/* Rollover Button */}
        <button
          onClick={() => rolloverToNextMonth()}
          disabled={isRollingOver}
          style={{
            ...glass(0.08, 12),
            border: `1px solid ${theme.accent}`,
            borderRadius: 10,
            padding: '10px 16px',
            color: theme.accent,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: isRollingOver ? 'not-allowed' : 'pointer',
            opacity: isRollingOver ? 0.5 : 1
          }}
        >
          <RefreshCw size={16} className={isRollingOver ? 'spin' : ''} />
          Rollover to Next Month
        </button>
      </div>

      {/* Smart Suggestions */}
      <SmartSuggestion
        suggestion={showSuggestion}
        onAccept={handleAcceptSuggestion}
        onDecline={() => {}}
      />

      {/* Flex Reserve Stats */}
      <div style={{
        ...glass(0.06, 16),
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20
      }}>
        <div>
          <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted, marginBottom: 4 }}>
            TOTAL ALLOCATED
          </div>
          <div style={{ fontFamily: theme.display, fontSize: '1.5rem', color: theme.text }}>
            {inr(flexFund.totalAllocated)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted, marginBottom: 4 }}>
            TOTAL SPENT
          </div>
          <div style={{ fontFamily: theme.display, fontSize: '1.5rem', color: theme.text }}>
            {inr(flexFund.totalSpent)}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: theme.mono, fontSize: '0.6rem', color: theme.muted, marginBottom: 4 }}>
            FLEX RESERVE
          </div>
          <div style={{ fontFamily: theme.display, fontSize: '1.5rem', color: theme.accent }}>
            {inr(flexFund.flexReserve)}
          </div>
        </div>
      </div>

      {/* Category Bubbles Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16
      }}>
        {/* Regular Categories */}
        {Object.entries(flexFund.categories)
          .filter(([name]) => name !== 'Flex Reserve')
          .map(([name, data]) => (
            <CategoryBubble
              key={name}
              name={name}
              data={data}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragging={draggingFrom === name}
              isOverTarget={dropTarget === name}
            />
          ))}

        {/* Flex Reserve Bubble */}
        {flexFund.flexReserve > 0 && (
          <CategoryBubble
            name="Flex Reserve"
            data={flexFund.categories['Flex Reserve']}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onDrop={() => {}}
          />
        )}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: 24,
        padding: 16,
        ...glass(0.04, 10),
        borderRadius: 12,
        textAlign: 'center',
        fontFamily: theme.mono,
        fontSize: '0.7rem',
        color: theme.muted
      }}>
        💡 Drag a bubble with surplus onto an overspent bubble to rebalance your budget
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}