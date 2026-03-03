import { useFinance } from '../../context/FinanceContext.jsx'
import { Card, Spinner } from '../shared/ui.jsx'
import { pct } from '../../lib/formatters.js'
import theme from '../../lib/theme.js'
import { nextFetchTime } from '../../lib/yahooFinance.js'

function IndexCard({ label, data }) {
  if (!data) return (
    <Card>
      <div style={{ fontSize: 11, color: theme.muted, fontFamily: theme.mono, marginBottom: 8 }}>{label}</div>
      <Spinner />
    </Card>
  )
  const up = data.changePct >= 0
  return (
    <Card style={{ borderColor: up ? theme.accent + '30' : theme.red + '30' }}>
      <div style={{ fontSize: 10, color: theme.muted, fontFamily: theme.mono, marginBottom: 8, textTransform: 'uppercase' }}>{data.label || label}</div>
      <div style={{ fontFamily: theme.head, fontWeight: 800, fontSize: 24, color: theme.text }}>
        {data.price != null ? data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: 14, color: up ? theme.accent : theme.red, marginTop: 6 }}>
        {pct(data.changePct ?? 0)} today
      </div>
      <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted, marginTop: 4 }}>
        {up ? '▲' : '▼'} {Math.abs(data.changeAmt ?? 0).toFixed(2)} pts
      </div>
    </Card>
  )
}

export default function Markets() {
  const { indices } = useFinance()

  const indexMap = {
    '^NSEI':  indices['^NSEI'],
    '^BSESN': indices['^BSESN'],
    '^GSPC':  indices['^GSPC'],
    '^IXIC':  indices['^IXIC'],
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Index Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <IndexCard label="NIFTY 50"  data={indexMap['^NSEI']}  />
        <IndexCard label="SENSEX"    data={indexMap['^BSESN']} />
        <IndexCard label="S&P 500"   data={indexMap['^GSPC']}  />
        <IndexCard label="NASDAQ"    data={indexMap['^IXIC']}  />
      </div>

      {/* Market Context */}
      <Card>
        <div style={{ fontFamily: theme.head, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>What to Watch</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            {[
              { label: 'RBI Repo Rate', note: 'Changes affect loan rates & bond yields' },
              { label: 'FII / DII Activity', note: 'Foreign vs domestic institutional flows' },
              { label: 'INR/USD Rate', note: 'Affects import costs and IT sector earnings' },
              { label: 'Inflation (CPI)', note: 'High inflation = tighter RBI policy' },
            ].map(item => (
              <div key={item.label} style={{ padding: '9px 0', borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontFamily: theme.mono, fontSize: 13, color: theme.text }}>{item.label}</div>
                <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted }}>{item.note}</div>
              </div>
            ))}
          </div>
          <div>
            {[
              { label: 'SIP Discipline', note: 'Rupee cost averaging smooths volatility' },
              { label: 'Sector Rotation', note: 'IT, FMCG, Banking lead at different cycles' },
              { label: 'Nifty P/E Ratio', note: '>25 = expensive; <18 = good value zone' },
              { label: 'Gold Prices', note: 'Hedge against INR depreciation & inflation' },
            ].map(item => (
              <div key={item.label} style={{ padding: '9px 0', borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontFamily: theme.mono, fontSize: 13, color: theme.text }}>{item.label}</div>
                <div style={{ fontFamily: theme.mono, fontSize: 11, color: theme.muted }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
