import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, PieChart, Wallet, Target,
  CreditCard, TrendingUp, Bot, Settings,
  Palette, LogOut, Landmark, ChevronLeft, ChevronRight, ChevronUp,
} from "lucide-react"
import theme from "../../lib/theme.js"

// ── Glass helper ──────────────────────────────────────────────────────────────
const glass = (opacity = 0.04, blur = 20) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: `blur(${blur}px) saturate(180%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
})

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

// ── Tooltip ───────────────────────────────────────────────────────────────────
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
          ...glass(0.12, 20),
          border: `1px solid ${theme.borderHi}`,
          padding: "6px 14px",
          fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.12em",
          color: theme.text, whiteSpace: "nowrap", zIndex: 200,
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${theme.accentGlow}`,
          pointerEvents: "none",
          animation: "tipIn 0.15s ease",
          borderRadius: 8,
        }}>
          <div style={{
            position: "absolute", right: "100%", top: "50%",
            transform: "translateY(-50%)",
            borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
            borderRight: `5px solid ${theme.borderHi}`,
          }} />
          {text}
        </div>
      )}
    </div>
  )
}

// ── NavItem ───────────────────────────────────────────────────────────────────
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
        gap: collapsed ? 0 : 12,
        width: "100%",
        padding: collapsed ? "13px 0" : "11px 16px",
        marginBottom: 2,
        ...(active ? glass(0.08, 16) : hov ? glass(0.05, 12) : { background: "transparent" }),
        border: "none",
        borderLeft: `2px solid ${active ? theme.accent : "transparent"}`,
        borderRadius: collapsed ? 10 : "0 8px 8px 0",
        color: active ? theme.accent : hov ? theme.text : theme.muted,
        fontFamily: theme.mono,
        fontSize: "0.68rem",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.22s ease",
        position: "relative",
        boxShadow: active ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 20px ${theme.accentGlow}` : "none",
      }}
    >
      {/* active glow sweep */}
      {active && (
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, ${theme.accentDim} 0%, transparent 100%)`,
          pointerEvents: "none",
          borderRadius: "inherit",
        }} />
      )}

      <Icon
        size={collapsed ? 18 : 15}
        strokeWidth={active ? 2 : 1.4}
        style={{ filter: active ? `drop-shadow(0 0 6px ${theme.accent})` : "none", flexShrink: 0 }}
      />

      {!collapsed && (
        <span style={{ flex: 1, position: "relative" }}>{n.label}</span>
      )}

      {/* AI pulse dot */}
      {isAI && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: theme.accent, flexShrink: 0,
          boxShadow: `0 0 8px ${theme.accent}`,
          animation: "aiPulse 2.2s ease-in-out infinite",
          ...(collapsed ? { position: "absolute", top: 9, right: 14 } : {}),
        }} />
      )}
    </button>
  )

  return collapsed ? <Tip text={n.label}>{btn}</Tip> : btn
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)`,
      margin: "8px 0",
    }} />
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initial, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      ...glass(0.10, 16),
      border: `1px solid ${theme.borderHi}`,
      borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: theme.display, fontSize: size * 0.42, fontWeight: 700,
      color: theme.accent,
      boxShadow: `0 0 16px ${theme.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    }}>
      {initial}
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({ tab, setTab, user, onSignOut }) {
  const [collapsed, setCollapsed]     = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [mounted, setMounted]         = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!document.getElementById("portafi-fonts")) {
      const l = document.createElement("link")
      l.id   = "portafi-fonts"
      l.rel  = "stylesheet"
      l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Space+Grotesk:wght@300;400;500&family=Space+Mono:wght@400&display=swap"
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

  const initial  = user?.email?.[0]?.toUpperCase() || "U"
  const username = user?.email?.split("@")[0] || "User"

  return (
    <>
      <style>{`
        @keyframes tipIn   { from { opacity:0; transform:translateY(-50%) translateX(-6px) } to { opacity:1; transform:translateY(-50%) translateX(0) } }
        @keyframes aiPulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.4; transform:scale(1.6) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      <aside style={{
        width: collapsed ? 72 : 248,
        ...glass(0.04, 28),
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-8px)",
        transitionProperty: "width, opacity, transform",
        transitionDuration: "0.32s, 0.5s, 0.5s",
        transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
        overflow: "visible",
        boxShadow: `inset -1px 0 0 ${theme.border}, 4px 0 32px rgba(0,0,0,0.3)`,
      }}>

        {/* Top shine */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)`,
          pointerEvents: "none",
        }} />

        {/* ── Logo ── */}
        <div style={{
          padding: collapsed ? "28px 0 24px" : "28px 24px 24px",
          borderBottom: `1px solid ${theme.border}`,
          textAlign: collapsed ? "center" : "left",
          flexShrink: 0,
        }}>
          {collapsed ? (
            <div style={{
              fontFamily: theme.display,
              fontSize: "1.1rem",
              fontWeight: 700,
              color: theme.accent,
              letterSpacing: "0.05em",
              textShadow: `0 0 16px ${theme.accentGlow}`,
            }}>
              PFi
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: theme.display,
                fontSize: "1.55rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                lineHeight: 1,
                marginBottom: 6,
                animation: "slideIn 0.4s ease",
              }}>
                <span style={{ color: theme.accent, textShadow: `0 0 20px ${theme.accentGlow}` }}>Porta</span>
                <span style={{ color: theme.text }}>Fi</span>
              </div>
              <div style={{
                fontFamily: theme.mono,
                fontSize: "0.50rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: theme.muted,
                animation: "slideIn 0.45s ease",
              }}>
                Smart Money · Smart Future
              </div>
            </>
          )}
        </div>

        {/* ── Collapse toggle ── */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: "absolute",
            right: -14,
            top: 36,
            width: 28, height: 28,
            borderRadius: "50%",
            ...glass(0.12, 20),
            border: `1px solid ${theme.borderHi}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: theme.accent,
            zIndex: 50,
            transition: "all 0.2s",
            boxShadow: `0 0 12px ${theme.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `rgba(0,212,255,0.20)`
            e.currentTarget.style.boxShadow  = `0 0 20px ${theme.accent}50, inset 0 1px 0 rgba(255,255,255,0.2)`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = `rgba(255,255,255,0.12)`
            e.currentTarget.style.boxShadow  = `0 0 12px ${theme.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`
          }}
        >
          {collapsed
            ? <ChevronRight size={13} strokeWidth={2} />
            : <ChevronLeft  size={13} strokeWidth={2} />}
        </button>

        {/* ── Nav ── */}
        <nav style={{
          flex: 1,
          padding: collapsed ? "16px 8px" : "16px 10px",
          overflowY: "auto", overflowX: "visible",
        }}>
          {!collapsed && (
            <div style={{
              fontFamily: theme.mono, fontSize: "0.48rem", letterSpacing: "0.28em",
              textTransform: "uppercase", color: theme.muted,
              padding: "4px 16px 10px",
            }}>
              Navigation
            </div>
          )}

          {NAV.map((n, i) => (
            <div key={n.id} style={{ animation: `slideIn ${0.1 + i * 0.04}s ease` }}>
              {n.id === "ai" && <Divider />}
              <NavItem n={n} active={tab === n.id} collapsed={collapsed} onClick={handleNav} />
            </div>
          ))}
        </nav>

        {/* ── Profile ── */}
        <div style={{
          borderTop: `1px solid ${theme.border}`,
          padding: collapsed ? "16px 8px" : "16px 12px",
          position: "relative", flexShrink: 0,
        }}>

          {/* Profile dropdown */}
          {showProfile && !collapsed && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 12, right: 12,
              ...glass(0.12, 24),
              border: `1px solid ${theme.borderHi}`,
              borderRadius: 12,
              padding: "8px",
              zIndex: 100,
              animation: "fadeUp 0.2s ease",
              boxShadow: `0 -12px 40px rgba(0,0,0,0.5), 0 0 24px ${theme.accentGlow}`,
            }}>
              {/* top shine */}
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)`,
                borderRadius: "12px 12px 0 0",
              }} />

              {[
                { icon: Settings, label: "Settings", action: () => setShowProfile(false) },
                { icon: Palette,  label: "Theme",    action: () => setShowProfile(false) },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 14px",
                  border: "none", borderRadius: 8,
                  background: "transparent", cursor: "pointer",
                  fontFamily: theme.mono, fontSize: "0.63rem",
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  color: theme.muted, transition: "all 0.2s",
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color      = theme.accent
                    e.currentTarget.style.background = theme.accentDim
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color      = theme.muted
                    e.currentTarget.style.background = "transparent"
                  }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  {label}
                </button>
              ))}

              <Divider />

              <button onClick={() => { onSignOut?.(); setShowProfile(false) }} style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px",
                border: "none", borderRadius: 8,
                background: "transparent", cursor: "pointer",
                fontFamily: theme.mono, fontSize: "0.63rem",
                letterSpacing: "0.10em", textTransform: "uppercase",
                color: theme.red, transition: "all 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${theme.red}18`}
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
                borderRadius: 10,
                ...(showProfile ? glass(0.08, 16) : { background: "transparent" }),
                border: `1px solid ${showProfile ? theme.borderHi : "transparent"}`,
                cursor: "pointer",
                transition: "all 0.25s",
                boxShadow: showProfile ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 16px ${theme.accentGlow}` : "none",
              }}
              onMouseEnter={e => {
                if (showProfile) return
                e.currentTarget.style.background    = "rgba(255,255,255,0.04)"
                e.currentTarget.style.borderColor   = theme.border
              }}
              onMouseLeave={e => {
                if (showProfile) return
                e.currentTarget.style.background    = "transparent"
                e.currentTarget.style.borderColor   = "transparent"
              }}
            >
              <Avatar initial={initial} size={34} />
              <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                <div style={{
                  fontFamily: theme.sans, fontSize: "0.82rem", fontWeight: 500,
                  color: theme.text, marginBottom: 2,
                }}>
                  {username}
                </div>
                <div style={{
                  fontFamily: theme.mono, fontSize: "0.54rem", color: theme.muted,
                  letterSpacing: "0.06em", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130,
                }}>
                  {user?.email || "signed in"}
                </div>
              </div>
              <ChevronUp
                size={12} strokeWidth={2}
                style={{
                  color: theme.accent, flexShrink: 0,
                  transform: showProfile ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s",
                  filter: `drop-shadow(0 0 4px ${theme.accent})`,
                }}
              />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}