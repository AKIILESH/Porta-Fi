import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, PieChart, Wallet, Target,
  CreditCard, TrendingUp, Bot, Settings,
  Palette, LogOut, User, Landmark,
} from "lucide-react"
import theme from "../../lib/theme.js"

// ── GOLD TOKENS ───────────────────────────────────────────────────────────────
const G = {
  ink:       "#09090e",
  surface:   "#0f0e0a",
  card:      "#131109",
  border:    "rgba(201,168,76,0.16)",
  borderHi:  "rgba(201,168,76,0.38)",
  gold:      "#c9a84c",
  goldLight: "#e8c96b",
  goldDim:   "rgba(201,168,76,0.10)",
  goldGlow:  "rgba(201,168,76,0.06)",
  text:      "#f0ebe0",
  muted:     "#6e6558",
  red:       "#d96b6b",
  mono:      "'DM Mono', 'Courier New', monospace",
  display:   "'Cormorant Garamond', Georgia, serif",
  sans:      "'DM Sans', system-ui, sans-serif",
}

const NAV = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard",  path: "/dashboard" },
  { id: "portfolio", icon: PieChart,        label: "Portfolio",  path: "/portfolio" },
  { id: "cash",      icon: Landmark,        label: "Cash",       path: "/cash"      },
  { id: "budget",    icon: Wallet,          label: "Budget",     path: "/budget"    },
  { id: "goals",     icon: Target,          label: "Goals",      path: "/goals"     },
  { id: "debt",      icon: CreditCard,      label: "Debt",       path: "/debt"      },
  { id: "markets",   icon: TrendingUp,      label: "Markets",    path: "/markets"   },
  { id: "ai",        icon: Bot,             label: "AI Agent",   path: "/ai"        },
]

// ── TOOLTIP ───────────────────────────────────────────────────────────────────
function Tip({ children, text }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: "relative", width: "100%" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: "absolute", left: "calc(100% + 14px)", top: "50%",
          transform: "translateY(-50%)",
          background: G.card, border: `1px solid ${G.borderHi}`,
          padding: "6px 14px",
          fontFamily: G.mono, fontSize: "0.62rem", letterSpacing: "0.12em",
          color: G.text, whiteSpace: "nowrap", zIndex: 200,
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${G.border}`,
          pointerEvents: "none",
          animation: "tipIn 0.15s ease",
        }}>
          {/* arrow */}
          <div style={{
            position: "absolute", right: "100%", top: "50%",
            transform: "translateY(-50%)",
            borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
            borderRight: `5px solid ${G.borderHi}`,
          }} />
          {text}
        </div>
      )}
    </div>
  )
}

// ── NAV ITEM ──────────────────────────────────────────────────────────────────
function NavItem({ n, active, collapsed, onClick }) {
  const [hov, setHov] = useState(false)
  const Icon = n.icon
  const isAI = n.id === "ai"

  const btn = (
    <button
      onClick={() => onClick(n.id, n.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: collapsed ? 0 : 13,
        width: "100%",
        padding: collapsed ? "13px 0" : "12px 16px",
        marginBottom: 2,
        background: active ? G.goldDim : hov ? "rgba(255,255,255,0.03)" : "transparent",
        border: "none",
        borderLeft: `2px solid ${active ? G.gold : "transparent"}`,
        color: active ? G.gold : hov ? G.text : G.muted,
        fontFamily: G.mono,
        fontSize: "0.7rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.22s ease",
        position: "relative",
      }}
    >
      {/* active glow sweep */}
      {active && (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, ${G.goldDim} 0%, transparent 100%)`,
          pointerEvents: "none",
        }} />
      )}

      <Icon size={collapsed ? 18 : 15} strokeWidth={active ? 1.8 : 1.4} />

      {!collapsed && (
        <span style={{ flex: 1, position: "relative" }}>{n.label}</span>
      )}

      {/* AI pulse dot */}
      {isAI && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: G.gold, flexShrink: 0,
          boxShadow: `0 0 8px ${G.gold}`,
          animation: "aiPulse 2.2s ease-in-out infinite",
          ...(collapsed ? { position: "absolute", top: 9, right: 14 } : {}),
        }} />
      )}
    </button>
  )

  return collapsed ? <Tip text={n.label}>{btn}</Tip> : btn
}

// ── DIVIDER ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: G.border, margin: "8px 0" }} />
}

// ── MAIN SIDEBAR ──────────────────────────────────────────────────────────────
export default function Sidebar({ tab, setTab, user, onSignOut }) {
  const [collapsed, setCollapsed]         = useState(false)
  const [showProfile, setShowProfile]     = useState(false)
  const [mounted, setMounted]             = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // inject fonts once
    if (!document.getElementById("portafi-fonts")) {
      const l = document.createElement("link")
      l.id   = "portafi-fonts"
      l.rel  = "stylesheet"
      l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap"
      document.head.appendChild(l)
    }
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const handleNav = (id, path) => {
    setTab(id)
    navigate(path)
    setShowProfile(false)
  }

  const initial = user?.email?.[0]?.toUpperCase() || "U"
  const username = user?.email?.split("@")[0] || "User"

  return (
    <>
      <style>{`
        @keyframes tipIn    { from { opacity:0; transform:translateY(-50%) translateX(-6px) } to { opacity:1; transform:translateY(-50%) translateX(0) } }
        @keyframes aiPulse  { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(1.5) } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-12px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      <aside style={{
        width: collapsed ? 72 : 248,
        background: G.ink,
        borderRight: `1px solid ${G.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.32s cubic-bezier(0.4,0,0.2,1)",
        position: "relative",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-8px)",
        transitionProperty: "width, opacity, transform",
        transitionDuration: "0.32s, 0.5s, 0.5s",
        overflow: "visible",
      }}>

        {/* ── LOGO ── */}
        <div style={{
          padding: collapsed ? "28px 0 24px" : "28px 24px 24px",
          borderBottom: `1px solid ${G.border}`,
          textAlign: collapsed ? "center" : "left",
          flexShrink: 0,
        }}>
          {collapsed ? (
            <div style={{
              fontFamily: G.display,
              fontSize: "1.1rem",
              fontWeight: 400,
              color: G.gold,
              letterSpacing: "0.1em",
            }}>
              PFi
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: G.display,
                fontSize: "1.55rem",
                fontWeight: 400,
                letterSpacing: "0.1em",
                lineHeight: 1,
                marginBottom: 6,
                animation: "slideIn 0.4s ease",
              }}>
                <span style={{ color: G.gold }}>Porta</span>
                <span style={{ color: G.text }}>Fi</span>
              </div>
              <div style={{
                fontFamily: G.mono,
                fontSize: "0.52rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: G.muted,
                animation: "slideIn 0.45s ease",
              }}>
                Smart Money · Smart Future
              </div>
            </>
          )}
        </div>

        {/* ── COLLAPSE TOGGLE ── */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: "absolute",
            right: -13,
            top: 38,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: G.card,
            border: `1px solid ${G.borderHi}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: G.gold,
            zIndex: 50,
            transition: "all 0.2s",
            fontSize: "0.6rem",
            boxShadow: `0 2px 12px rgba(0,0,0,0.4)`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = G.gold; e.currentTarget.style.color = G.ink }}
          onMouseLeave={e => { e.currentTarget.style.background = G.card; e.currentTarget.style.color = G.gold }}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* ── NAV ── */}
        <nav style={{
          flex: 1,
          padding: collapsed ? "16px 8px" : "16px 10px",
          overflowY: "auto",
          overflowX: "visible",
        }}>
          {/* Section label */}
          {!collapsed && (
            <div style={{
              fontFamily: G.mono, fontSize: "0.5rem", letterSpacing: "0.25em",
              textTransform: "uppercase", color: G.muted,
              padding: "4px 16px 10px",
            }}>
              Navigation
            </div>
          )}

          {NAV.map((n, i) => (
            <div key={n.id} style={{ animation: `slideIn ${0.1 + i * 0.04}s ease` }}>
              {n.id === "ai" && <Divider />}
              <NavItem
                n={n}
                active={tab === n.id}
                collapsed={collapsed}
                onClick={handleNav}
              />
            </div>
          ))}
        </nav>

        {/* ── PROFILE ── */}
        <div style={{
          borderTop: `1px solid ${G.border}`,
          padding: collapsed ? "16px 8px" : "16px 12px",
          position: "relative",
          flexShrink: 0,
        }}>

          {/* Profile dropdown */}
          {showProfile && !collapsed && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 12, right: 12,
              background: G.card,
              border: `1px solid ${G.borderHi}`,
              padding: "8px",
              zIndex: 100,
              animation: "fadeUp 0.2s ease",
              boxShadow: `0 -12px 40px rgba(0,0,0,0.5)`,
            }}>
              {/* top gold bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${G.gold}, transparent)` }} />

              {[
                { icon: Settings, label: "Settings", action: () => setShowProfile(false) },
                { icon: Palette,  label: "Theme",    action: () => setShowProfile(false) },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 14px", border: "none",
                  background: "transparent", cursor: "pointer",
                  fontFamily: G.mono, fontSize: "0.65rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: G.muted, transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = G.gold; e.currentTarget.style.background = G.goldDim }}
                  onMouseLeave={e => { e.currentTarget.style.color = G.muted; e.currentTarget.style.background = "transparent" }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  {label}
                </button>
              ))}

              <div style={{ height: 1, background: G.border, margin: "4px 0" }} />

              <button onClick={() => { onSignOut?.(); setShowProfile(false) }} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px", border: "none",
                background: "transparent", cursor: "pointer",
                fontFamily: G.mono, fontSize: "0.65rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: G.red, transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${G.red}18`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut size={13} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          )}

          {/* Profile button */}
          {collapsed ? (
            <Tip text="Profile">
              <button onClick={() => onSignOut?.()} style={{
                width: "100%", display: "flex", justifyContent: "center",
                padding: "8px 0", background: "transparent", border: "none", cursor: "pointer",
              }}>
                <Avatar initial={initial} size={36} />
              </button>
            </Tip>
          ) : (
            <button
              onClick={() => setShowProfile(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "10px 12px",
                background: showProfile ? G.goldDim : "transparent",
                border: `1px solid ${showProfile ? G.borderHi : "transparent"}`,
                cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { if (!showProfile) e.currentTarget.style.background = G.goldGlow }}
              onMouseLeave={e => { if (!showProfile) e.currentTarget.style.background = "transparent" }}
            >
              <Avatar initial={initial} size={34} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontFamily: G.sans, fontSize: "0.82rem", fontWeight: 500, color: G.text, marginBottom: 2 }}>{username}</div>
                <div style={{ fontFamily: G.mono, fontSize: "0.55rem", color: G.muted, letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                  {user?.email || "signed in"}
                </div>
              </div>
              <span style={{
                fontFamily: G.mono, fontSize: "0.5rem", color: G.gold,
                transform: showProfile ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>▲</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

// ── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({ initial, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: `linear-gradient(135deg, ${G.gold} 0%, rgba(201,168,76,0.4) 100%)`,
      border: `1px solid ${G.borderHi}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: G.display, fontSize: size * 0.44, fontWeight: 400,
      color: G.ink, letterSpacing: "0.05em",
    }}>
      {initial}
    </div>
  )
}