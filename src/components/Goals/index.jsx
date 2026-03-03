import { useState, useEffect } from 'react'
import { useFinance } from '../../context/FinanceContext.jsx'
import { Card, Btn, Input, Select, SectionHeader, EmptyState, ProgressBar, Spinner } from '../shared/ui.jsx'
import { inr, inrCompact } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import {
  Target,
  Home,
  Plane,
  GraduationCap,
  Car,
  Heart,
  Laptop,
  Shield,
  TrendingUp,
  Umbrella,
  Dumbbell,
  Music,
  Globe,
  Coins,
  Gift,
  AlertCircle,
  PiggyBank,
  Calendar,
  Plus,
  X,
  CheckCircle
} from 'lucide-react'

// Map Lucide icons to icon names (using emoji fallback for database)
const ICONS = [
  { name: 'Target', icon: Target, emoji: '🎯' },
  { name: 'Home', icon: Home, emoji: '🏠' },
  { name: 'Plane', icon: Plane, emoji: '✈️' },
  { name: 'GraduationCap', icon: GraduationCap, emoji: '🎓' },
  { name: 'Car', icon: Car, emoji: '🚗' },
  { name: 'Heart', icon: Heart, emoji: '💍' },
  { name: 'Laptop', icon: Laptop, emoji: '💻' },
  { name: 'Shield', icon: Shield, emoji: '🛡️' },
  { name: 'TrendingUp', icon: TrendingUp, emoji: '📈' },
  { name: 'Umbrella', icon: Umbrella, emoji: '🏖️' },
  { name: 'Dumbbell', icon: Dumbbell, emoji: '🏋️' },
  { name: 'Music', icon: Music, emoji: '🎸' },
  { name: 'Globe', icon: Globe, emoji: '🌏' },
  { name: 'Coins', icon: Coins, emoji: '💰' },
  { name: 'Gift', icon: Gift, emoji: '🎁' },
]

// ── Emergency Fund Card ──────────────────────────────────────────────────────
function EmergencyFundCard({ emergencyFund, onUpdate }) {
  const { monthlyExpenses, cashBalance } = useFinance() // Add cashBalance here
  const [editing, setEditing] = useState(false)
  const [targetMonths, setTargetMonths] = useState(6)
  
  // Use cashBalance as the current emergency fund amount
  const currentAmount = cashBalance || 0

  const recommendedAmount = monthlyExpenses * targetMonths
  const progress = recommendedAmount > 0 ? Math.min((currentAmount / recommendedAmount) * 100, 100) : 0
  const remaining = Math.max(0, recommendedAmount - currentAmount)
  const isAchieved = currentAmount >= recommendedAmount

  const handleSave = async () => {
    // When saving, we just update the target months
    // The current amount is always from cashBalance
    if (emergencyFund) {
      const newTarget = monthlyExpenses * targetMonths
      await onUpdate({
        target: newTarget,
        saved: currentAmount // Use current cash balance
      })
    }
    setEditing(false)
  }

  return (
    <Card style={{
      border: `2px solid ${isAchieved ? theme.green : theme.yellow}`,
      background: `linear-gradient(135deg, ${theme.card} 0%, ${theme.bg2} 100%)`,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: isAchieved ? theme.green + '20' : theme.yellow + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAchieved ? theme.green : theme.yellow
          }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: theme.syne, fontWeight: 700, fontSize: 18, color: theme.text }}>
              Emergency Fund
            </h2>
            <p style={{ fontSize: 12, color: theme.muted, fontFamily: theme.mono }}>
              {isAchieved 
                ? `✅ Fully funded! (${(currentAmount / monthlyExpenses).toFixed(1)} months)` 
                : `${inr(remaining)} more to reach ${targetMonths} months`}
            </p>
          </div>
        </div>
        {!editing && (
          <Btn sm ghost onClick={() => setEditing(true)} color={theme.accent}>
            Update Target
          </Btn>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>
              TARGET MONTHS
            </div>
            <Select value={targetMonths} onChange={(v) => setTargetMonths(Number(v))}>
              <option value={3}>3 months (Minimum)</option>
              <option value={6}>6 months (Recommended)</option>
              <option value={9}>9 months (Conservative)</option>
              <option value={12}>12 months (Very Safe)</option>
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={handleSave} color={theme.accent}>Save</Btn>
            <Btn ghost onClick={() => setEditing(false)}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: theme.muted }}>
                Monthly Expenses: <strong style={{ color: theme.text }}>{inr(monthlyExpenses)}</strong>
              </span>
              <span style={{ fontSize: 13, color: theme.muted }}>
                Target: <strong style={{ color: theme.text }}>{targetMonths} months</strong>
              </span>
            </div>
            <ProgressBar 
              value={currentAmount} 
              max={recommendedAmount} 
              color={isAchieved ? theme.green : theme.accent}
              height={8}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>
                {inr(currentAmount)}
              </span>
              <span style={{ fontSize: 12, color: theme.muted }}>
                of {inr(recommendedAmount)}
              </span>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 12,
            background: theme.bg,
            borderRadius: 8,
            padding: 12
          }}>
            <div>
              <div style={{ fontSize: 10, color: theme.muted, marginBottom: 2 }}>Status</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isAchieved ? theme.green : theme.yellow }}>
                {isAchieved ? 'Funded' : `${progress.toFixed(0)}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: theme.muted, marginBottom: 2 }}>Monthly Need</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{inr(monthlyExpenses)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: theme.muted, marginBottom: 2 }}>Coverage</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {(currentAmount / monthlyExpenses).toFixed(1)} months
              </div>
            </div>
          </div>

          {/* Quick add buttons */}
          {!isAchieved && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn sm onClick={() => window.location.href = '/cash'} color={theme.accent}>
                Add from Cash
              </Btn>
              <Btn sm ghost onClick={() => window.location.href = '/budget'} color={theme.accent}>
                Adjust Budget
              </Btn>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

// ── Add Goal Form ──────────────────────────────────────────────────────────────
function AddGoalForm({ onDone }) {
  const { addGoal } = useFinance()
  const [form, setForm] = useState({ 
    name: '', 
    icon: '🎯', 
    target: '', 
    saved: '', 
    deadline: '' 
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name || !form.target) { 
      setErr('Name and target required'); 
      return 
    }
    setSaving(true); 
    setErr('')
    try {
      await addGoal({ 
        name: form.name,
        icon: form.icon,
        target: +form.target, 
        saved: +form.saved || 0,
        deadline: form.deadline || null
      })
      onDone()
    } catch (e) { 
      setErr(e.message) 
    } finally { 
      setSaving(false) 
    }
  }

  // Get icon emoji for preview
  const getIconEmoji = (iconName) => {
    const iconObj = ICONS.find(i => i.emoji === iconName)
    return iconObj ? iconObj.emoji : '🎯'
  }

  return (
    <div style={{ 
      background: theme.bg2, 
      border: `1px solid ${theme.border}`, 
      borderRadius: 10, 
      padding: 16, 
      marginBottom: 20 
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <Select value={form.icon} onChange={set('icon')} style={{ width: 56, fontSize: 20, textAlign: 'center', padding: '6px 4px' }}>
          {ICONS.map(ic => (
            <option key={ic.name} value={ic.emoji}>
              {ic.emoji}
            </option>
          ))}
        </Select>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>GOAL NAME</div>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. House Down Payment" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>TARGET (₹)</div>
          <Input value={form.target} onChange={set('target')} placeholder="500000" type="number" min="0" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>ALREADY SAVED (₹)</div>
          <Input value={form.saved} onChange={set('saved')} placeholder="0" type="number" min="0" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 4 }}>DEADLINE</div>
          <Input value={form.deadline} onChange={set('deadline')} type="date" />
        </div>
        <Btn onClick={submit} disabled={saving}>
          {saving ? <Spinner size={14} /> : <Plus size={14} />}
        </Btn>
      </div>
      
      {/* Icon Preview */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: theme.muted }}>Selected Icon:</span>
        <span style={{ fontSize: 20 }}>{getIconEmoji(form.icon)}</span>
      </div>
      
      {err && <div style={{ color: theme.red, fontFamily: theme.mono, fontSize: 11, marginTop: 8 }}>{err}</div>}
    </div>
  )
}

// ── Goal Card ──────────────────────────────────────────────────────────────────
function GoalCard({ goal, onUpdate }) {
  const { updateGoal, deleteGoal } = useFinance()
  const [depositing, setDepositing] = useState(false)
  const [customAmt, setCustomAmt] = useState('')

  const progress  = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0
  const remaining = goal.target - goal.saved
  const done      = progress >= 100

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
    : null

  const deposit = async (amount) => {
    const newSaved = Math.min(goal.saved + amount, goal.target)
    await updateGoal(goal.id, { saved: newSaved })
  }

  const handleCustom = async () => {
    if (!customAmt || isNaN(customAmt)) return
    await deposit(Number(customAmt))
    setCustomAmt('')
    setDepositing(false)
  }

  // Find icon component for display (fallback to emoji)
  const IconComponent = ICONS.find(i => i.emoji === goal.icon)?.icon || Target

  return (
    <Card style={{
      animation: 'fadeUp .4s ease both',
      border: done ? `1px solid ${theme.green}50` : `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: done ? theme.green + '20' : theme.accent + '10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: done ? theme.green : theme.accent
          }}>
            {goal.icon && goal.icon.length > 2 ? <IconComponent size={20} /> : <span style={{ fontSize: 20 }}>{goal.icon}</span>}
          </div>
          <div>
            <div style={{ fontFamily: theme.head, fontWeight: 700, fontSize: 15 }}>{goal.name}</div>
            {daysLeft !== null && (
              <div style={{ fontSize: 11, color: daysLeft < 30 ? theme.yellow : theme.muted, fontFamily: theme.mono, marginTop: 2 }}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
              </div>
            )}
          </div>
        </div>
        <Btn ghost sm onClick={() => deleteGoal(goal.id)} color={theme.red}>
          <X size={14} />
        </Btn>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: theme.mono, fontSize: 15, color: done ? theme.green : theme.accent, fontWeight: 600 }}>
            {inrCompact(goal.saved)}
          </span>
          <span style={{ fontFamily: theme.mono, fontSize: 13, color: theme.muted }}>
            {inrCompact(goal.target)}
          </span>
        </div>
        <ProgressBar 
          value={goal.saved} 
          max={goal.target} 
          color={done ? theme.green : theme.accent} 
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: done ? theme.green : theme.muted, fontFamily: theme.mono }}>
            {progress.toFixed(1)}%
          </span>
          <span style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono }}>
            {done ? (
              <span style={{ color: theme.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Goal reached!
              </span>
            ) : (
              `${inrCompact(remaining)} to go`
            )}
          </span>
        </div>
      </div>

      {!done && (
        depositing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input 
              value={customAmt} 
              onChange={setCustomAmt} 
              placeholder="Enter amount" 
              type="number" 
              min="0" 
            />
            <Btn sm onClick={handleCustom} color={theme.accent}>
              <Plus size={12} />
            </Btn>
            <Btn sm ghost onClick={() => setDepositing(false)}>
              <X size={12} />
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1000, 5000, 10000].map(a => (
              <Btn key={a} sm onClick={() => deposit(a)} color={theme.accent}>
                +{inrCompact(a)}
              </Btn>
            ))}
            <Btn sm ghost onClick={() => setDepositing(true)} color={theme.accent}>
              Custom
            </Btn>
          </div>
        )
      )}
    </Card>
  )
}

// ── Goals Index ────────────────────────────────────────────────────────────────
export default function Goals() {
  const { goals, monthlyExpenses, cashBalance, addGoal, updateGoal } = useFinance() // Add cashBalance here
  const [adding, setAdding] = useState(false)

  // Find or create emergency fund
  const emergencyFund = goals.find(g => g.name === 'Emergency Fund')
  const otherGoals = goals.filter(g => g.name !== 'Emergency Fund')

  const totalSaved = otherGoals.reduce((s, g) => s + Number(g.saved), 0)
  const totalTarget = otherGoals.reduce((s, g) => s + Number(g.target), 0)

 const handleEmergencyUpdate = async (updates) => {
    if (emergencyFund) {
      // Update existing emergency fund
      await updateGoal(emergencyFund.id, updates)
    } else {
      // Create new emergency fund
      await addGoal({
        name: 'Emergency Fund',
        icon: '🛡️',
        target: updates.target || monthlyExpenses * 6,
        saved: cashBalance || 0, // Initialize with current cash balance
        deadline: null
      })
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Emergency Fund Section - Always on top */}
      <EmergencyFundCard 
        emergencyFund={emergencyFund || { saved: 0, target: monthlyExpenses * 6 }}
        onUpdate={handleEmergencyUpdate}
      />

      {/* Goals Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 8, textTransform: 'uppercase' }}>
            Active Goals
          </div>
          <div style={{ fontSize: 22, fontFamily: theme.head, fontWeight: 700, color: theme.accent }}>
            {otherGoals.length}
          </div>
        </div>
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 8, textTransform: 'uppercase' }}>
            Total Saved
          </div>
          <div style={{ fontSize: 22, fontFamily: theme.head, fontWeight: 700, color: theme.accent }}>
            {inrCompact(totalSaved)}
          </div>
        </div>
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 8, textTransform: 'uppercase' }}>
            Total Target
          </div>
          <div style={{ fontSize: 22, fontFamily: theme.head, fontWeight: 700, color: theme.text }}>
            {inrCompact(totalTarget)}
          </div>
        </div>
      </div>

      {/* Add Goal Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={() => setAdding(a => !a)}>
          {adding ? <X size={14} style={{ marginRight: 8 }} /> : <Plus size={14} style={{ marginRight: 8 }} />}
          {adding ? 'Cancel' : 'New Goal'}
        </Btn>
      </div>

      {/* Add Goal Form */}
      {adding && <AddGoalForm onDone={() => setAdding(false)} />}

      {/* Empty State */}
      {otherGoals.length === 0 && !adding && (
        <Card>
          <EmptyState icon={<Target size={24} />} message="No goals yet. Create your first savings goal above." />
        </Card>
      )}

      {/* Goals Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 12 
      }}>
        {otherGoals.map(g => <GoalCard key={g.id} goal={g} />)}
      </div>
    </div>
  )
}