import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PieChart,
  Wallet,
  Target,
  CreditCard,
  TrendingUp,
  Bot,
  Settings,
  LogOut,
  Landmark,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sun,
  Moon,
  Scale
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

const NAV = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  { id: "portfolio", icon: PieChart, label: "Portfolio", path: "/portfolio" },
  { id: "taxcost", icon: Scale, label: 'Tax & Costs', path: '/taxcost' },
  { id: "cash", icon: Landmark, label: "Cash", path: "/cash" },
  { id: "budget", icon: Wallet, label: "Budget", path: "/budget" },
  { id: "goals", icon: Target, label: "Goals", path: "/goals" },
  { id: "debt", icon: CreditCard, label: "Debt", path: "/debt" },
  { id: "markets", icon: TrendingUp, label: "Markets", path: "/markets" },
  { id: "ai", icon: Bot, label: "AI Agent", path: "/ai" },
];

// ── Glass helper — reads theme mode ──────────────────────────────────────────
const makeGlass = (isDark, opacity, blur = 20) => {
  const baseColor = isDark 
    ? '15, 20, 25'  // Dark blue-gray for dark mode
    : '250, 250, 255'; // Off-white for light mode
  
  return {
    background: `rgba(${baseColor}, ${opacity})`,
    backdropFilter: `blur(${blur}px) saturate(160%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
    // REMOVED: border shorthand property to avoid conflict
  };
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ children, text, theme, isDark }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: "relative", width: "100%" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 14px)",
            top: "50%",
            transform: "translateY(-50%)",
            ...makeGlass(isDark, 0.95, 20),
            border: `1px solid ${theme.border}`, // Keeping border here is fine (no borderLeft conflict)
            padding: "6px 14px",
            borderRadius: 8,
            fontFamily: theme.mono,
            fontSize: "0.62rem",
            letterSpacing: "0.12em",
            color: theme.text,
            whiteSpace: "nowrap",
            zIndex: 200,
            boxShadow: `0 8px 24px rgba(0,0,0,${isDark ? 0.5 : 0.15})`,
            pointerEvents: "none",
            animation: "tipIn 0.15s ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "100%",
              top: "50%",
              transform: "translateY(-50%)",
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: `5px solid ${theme.border}`,
            }}
          />
          {text}
        </div>
      )}
    </div>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({
  n,
  active,
  collapsed,
  onClick,
  isMobile,
  onItemClick,
  theme,
  isDark,
}) {
  const [hov, setHov] = useState(false);
  const Icon = n.icon;
  const isAI = n.id === "ai";

  const handleClick = () => {
    onClick(n.id, n.path);
    if (isMobile && onItemClick) onItemClick();
  };

  // Base styles without border
  const baseStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: collapsed ? 0 : 12,
    width: "100%",
    padding: collapsed ? "13px 0" : "11px 16px",
    marginBottom: 2,
    borderRadius: collapsed ? 10 : "0 8px 8px 0",
    color: active ? theme.accent : hov ? theme.text : theme.muted,
    fontFamily: theme.mono,
    fontSize: isMobile ? "0.8rem" : "0.68rem",
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.22s ease",
    position: "relative",
    // Individual border properties instead of shorthand
    borderTop: "none",
    borderRight: "none",
    borderBottom: "none",
    borderLeft: `2px solid ${active ? theme.accent : "transparent"}`,
  };

  // Background styles based on state
  const bgStyle = active
    ? makeGlass(isDark, 0.15, 16)
    : hov
      ? makeGlass(isDark, 0.08, 12)
      : { background: "transparent" };

  const btn = (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...baseStyles,
        ...bgStyle,
      }}
    >
      {active && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)`
              : `linear-gradient(90deg, rgba(0,0,0,0.02) 0%, transparent 100%)`,
            pointerEvents: "none",
            borderRadius: "inherit",
          }}
        />
      )}

      <Icon
        size={collapsed ? 18 : isMobile ? 18 : 15}
        strokeWidth={active ? 2 : 1.4}
        style={{ flexShrink: 0 }}
      />

      {!collapsed && (
        <span style={{ flex: 1, position: "relative" }}>{n.label}</span>
      )}

      {isAI && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: theme.green,
            flexShrink: 0,
            boxShadow: `0 0 8px ${theme.green}`,
            animation: "aiPulse 2.2s ease-in-out infinite",
            ...(collapsed ? { position: "absolute", top: 9, right: 14 } : {}),
          }}
        />
      )}
    </button>
  );

  return collapsed && !isMobile ? (
    <Tip text={n.label} theme={theme} isDark={isDark}>
      {btn}
    </Tip>
  ) : (
    btn
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ theme }) {
  return (
    <div
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)`,
        margin: "8px 0",
      }}
    />
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initial, size = 36, theme, isDark }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        ...makeGlass(isDark, 0.2, 16),
        border: `1px solid ${theme.border}`, // Single border property - no conflict
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.display,
        fontSize: size * 0.42,
        fontWeight: 700,
        color: theme.accent,
      }}
    >
      {initial}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({
  tab,
  setTab,
  user,
  onSignOut,
  mobile = false,
  onItemClick,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const { theme, isDark, toggle } = useTheme();

  // Force a re-render when theme changes
  useEffect(() => {
    // This empty effect with theme dependency ensures re-render on theme change
  }, [isDark, theme]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleNav = (id, path) => {
    setTab(id);
    navigate(path);
    setShowProfile(false);
  };

  const initial = user?.email?.[0]?.toUpperCase() || "U";
  const username = user?.email?.split("@")[0] || "User";

  // Shine line — adapts to theme
  const shineLine = {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    height: 1,
    background: isDark
      ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
      : "linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)",
    pointerEvents: "none",
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <aside
        style={{
          width: collapsed ? 72 : 248,
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          height: "100vh",
          background: isDark ? '#0f1217' : '#f8fafc',
          borderRight: `1px solid ${theme?.border || '#e2e8f0'}`,
        }}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes tipIn    { from { opacity:0; transform:translateY(-50%) translateX(-6px) } to { opacity:1; transform:translateY(-50%) translateX(0) } }
        @keyframes aiPulse  { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.4; transform:scale(1.6) } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      <aside
        style={{
          width: mobile ? "100%" : collapsed ? 72 : 248,
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          height: "100vh",
          ...makeGlass(isDark, 0.85, 28),
          borderRight: `1px solid ${theme.border}`, // Individual border property
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "relative",
          opacity: 1,
          transform: "translateX(0)",
          transitionProperty: "width, opacity, transform",
          transitionDuration: "0.32s, 0.5s, 0.5s",
          transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
          overflow: "visible",
          boxShadow: isDark
            ? `inset -1px 0 0 ${theme.border}, 4px 0 32px rgba(0,0,0,0.5)`
            : `inset -1px 0 0 ${theme.border}, 4px 0 20px rgba(0,0,0,0.08)`,
        }}
      >
        <div style={shineLine} />

        {/* ── Logo ── */}
        <div
          style={{
            padding: collapsed && !mobile ? "28px 0 24px" : "28px 24px 24px",
            borderBottom: `1px solid ${theme.border}`, // Individual border property
            textAlign: collapsed && !mobile ? "center" : "left",
            flexShrink: 0,
          }}
        >
          {collapsed && !mobile ? (
            <div
              style={{
                fontFamily: theme.display,
                fontSize: "1.1rem",
                fontWeight: 700,
                color: theme.accent,
                letterSpacing: "0.05em",
              }}
            >
              PFi
            </div>
          ) : (
            <>
              <div
                style={{
                  fontFamily: theme.display,
                  fontSize: mobile ? "1.4rem" : "1.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: theme.accent }}>Porta</span>
                <span style={{ color: theme.text }}>Fi</span>
              </div>
              <div
                style={{
                  fontFamily: theme.mono,
                  fontSize: "0.50rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: theme.muted,
                }}
              >
                Smart Money · Smart Future
              </div>
            </>
          )}
        </div>

        {/* ── Collapse toggle ── */}
        {!mobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              position: "absolute",
              right: -14,
              top: 36,
              width: 28,
              height: 28,
              borderRadius: "50%",
              ...makeGlass(isDark, 0.2, 20),
              border: `1px solid ${theme.border}`, // Single border - no conflict
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: theme.accent,
              zIndex: 50,
              transition: "all 0.2s",
            }}
          >
            {collapsed ? (
              <ChevronRight size={13} strokeWidth={2} />
            ) : (
              <ChevronLeft size={13} strokeWidth={2} />
            )}
          </button>
        )}

        {/* ── Nav ── */}
        <nav
          style={{
            flex: 1,
            padding: collapsed && !mobile ? "16px 8px" : "16px 10px",
            overflowY: "auto",
            overflowX: "visible",
          }}
        >
          {!collapsed && !mobile && (
            <div
              style={{
                fontFamily: theme.mono,
                fontSize: "0.48rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: theme.muted,
                padding: "4px 16px 10px",
              }}
            >
              Navigation
            </div>
          )}

          {NAV.map((n, i) => (
            <div key={n.id}>
              {n.id === "ai" && <Divider theme={theme} />}
              <NavItem
                n={n}
                active={tab === n.id}
                collapsed={collapsed && !mobile}
                onClick={handleNav}
                isMobile={mobile}
                onItemClick={onItemClick}
                theme={theme}
                isDark={isDark}
              />
            </div>
          ))}
        </nav>

        {/* ── Profile ── */}
        <div
          style={{
            borderTop: `1px solid ${theme.border}`, // Individual border property
            padding: collapsed && !mobile ? "16px 8px" : "16px 12px",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {/* Profile dropdown */}
          {showProfile && !collapsed && (
            <div
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 12,
                right: 12,
                ...makeGlass(isDark, 0.95, 24),
                border: `1px solid ${theme.border}`, // Single border - no conflict
                borderRadius: 12,
                padding: "8px",
                zIndex: 100,
                animation: "fadeUp 0.2s ease",
                boxShadow: isDark
                  ? `0 -12px 40px rgba(0,0,0,0.5)`
                  : `0 -12px 40px rgba(0,0,0,0.12)`,
              }}
            >
              <div style={shineLine} />

              {/* Settings */}
              <button
                onClick={() => setShowProfile(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 8,
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: theme.mono,
                  fontSize: "0.63rem",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: theme.muted,
                  transition: "all 0.2s",
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.text;
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.muted;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Settings size={13} strokeWidth={1.5} />
                Settings
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => {
                  toggle();
                  setShowProfile(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 8,
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: theme.mono,
                  fontSize: "0.63rem",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: theme.muted,
                  transition: "all 0.2s",
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.text;
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.muted;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {isDark ? (
                  <Sun size={13} strokeWidth={1.5} />
                ) : (
                  <Moon size={13} strokeWidth={1.5} />
                )}
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>

              <Divider theme={theme} />

              {/* Sign out */}
              <button
                onClick={() => {
                  onSignOut?.();
                  setShowProfile(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 8,
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: theme.mono,
                  fontSize: "0.63rem",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: theme.red,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = `${theme.red}18`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <LogOut size={13} strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          )}

          {/* Collapsed profile button */}
          {collapsed && !mobile ? (
            <Tip text="Profile" theme={theme} isDark={isDark}>
              <button
                onClick={() => onSignOut?.()}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px 0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Avatar
                  initial={initial}
                  size={36}
                  theme={theme}
                  isDark={isDark}
                />
              </button>
            </Tip>
          ) : (
            <button
              onClick={() => setShowProfile((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                ...(showProfile
                  ? makeGlass(isDark, 0.15, 16)
                  : { background: "transparent" }),
                border: `1px solid ${showProfile ? theme.border : "transparent"}`, // Single border
                cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                if (showProfile) return;
                e.currentTarget.style.background = isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.02)";
                e.currentTarget.style.borderColor = theme.border;
              }}
              onMouseLeave={(e) => {
                if (showProfile) return;
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <Avatar
                initial={initial}
                size={34}
                theme={theme}
                isDark={isDark}
              />
              <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                <div
                  style={{
                    fontFamily: theme.sans,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: theme.text,
                    marginBottom: 2,
                  }}
                >
                  {username}
                </div>
                <div
                  style={{
                    fontFamily: theme.mono,
                    fontSize: "0.54rem",
                    color: theme.muted,
                    letterSpacing: "0.06em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: mobile ? 150 : 130,
                  }}
                >
                  {user?.email || "signed in"}
                </div>
              </div>
              <ChevronUp
                size={12}
                strokeWidth={2}
                style={{
                  color: theme.accent,
                  flexShrink: 0,
                  transform: showProfile ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s",
                }}
              />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}