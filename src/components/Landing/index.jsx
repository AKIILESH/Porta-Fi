// src/components/Landing/index.jsx
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import PersonaSection from './PersonaSection'


// Reusable hook for intersection observer
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── NAV ──────────────────────────────────────────────────────────────────────
function Nav() {
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "16px 20px" : "24px 60px",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        background: scrolled ? theme.bg2 : "transparent",
        borderBottom: scrolled ? `1px solid ${theme.border}` : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        {/* Logo */}
        <a href="#" style={{
          fontFamily: theme.display,
          fontSize: isMobile ? "1.3rem" : "1.55rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: theme.text,
          textDecoration: "none"
        }}>
          Porta<span style={{ color: theme.accent }}>Fi</span>
        </a>

        {/* Desktop Buttons */}
        {!isMobile && (
          <div style={{ display: "flex", gap: "12px" }}>
            <a
              href="/signup"
              style={{
                fontFamily: theme.mono,
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: theme.accent,
                border: `1px solid ${theme.accent}`,
                padding: "10px 24px",
                textDecoration: "none",
                transition: "all 0.3s",
                borderRadius: 6,
              }}
              onMouseEnter={e => {
                e.target.style.background = theme.accent;
                e.target.style.color = theme.ink;
              }}
              onMouseLeave={e => {
                e.target.style.background = "transparent";
                e.target.style.color = theme.accent;
              }}
            >
              Get Started
            </a>
            <a
              href="/login"
              style={{
                fontFamily: theme.mono,
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: theme.accent,
                border: `1px solid ${theme.accent}`,
                padding: "10px 24px",
                textDecoration: "none",
                transition: "all 0.3s",
                borderRadius: 6,
              }}
              onMouseEnter={e => {
                e.target.style.background = theme.accent;
                e.target.style.color = theme.ink;
              }}
              onMouseLeave={e => {
                e.target.style.background = "transparent";
                e.target.style.color = theme.accent;
              }}
            >
              Sign In
            </a>
          </div>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: theme.text,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.bg2,
          zIndex: 99,
          padding: '80px 20px 20px',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a
              href="/signup"
              style={{
                fontFamily: theme.mono,
                fontSize: '1rem',
                padding: '16px',
                background: theme.accent,
                color: theme.ink,
                textDecoration: 'none',
                textAlign: 'center',
                borderRadius: 8,
                letterSpacing: '0.1em',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </a>
            <a
              href="/login"
              style={{
                fontFamily: theme.mono,
                fontSize: '1rem',
                padding: '16px',
                background: 'transparent',
                border: `1px solid ${theme.accent}`,
                color: theme.accent,
                textDecoration: 'none',
                textAlign: 'center',
                borderRadius: 8,
                letterSpacing: '0.1em',
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// ── DASHBOARD MOCKUP ─────────────────────────────────────────────────────────
function DashboardCard() {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", maxWidth: isMobile ? "100%" : 520,
        background: theme.bg2,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        position: "relative",
        boxShadow: `0 40px 100px rgba(0,0,0,0.65), 0 0 60px ${theme.accentGlow}`,
        transform: hovered && !isMobile
          ? "perspective(1000px) rotateY(-1deg) rotateX(0deg)"
          : "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
        transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: theme.display, fontSize: "0.95rem", letterSpacing: "0.15em", color: theme.accent }}>PortaFi</span>
        <span style={{ fontFamily: theme.mono, fontSize: "0.58rem", color: theme.muted, letterSpacing: "0.1em" }}>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Live
        </span>
      </div>

      {/* Net Worth */}
      <div style={{ padding: "24px 24px 18px", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ fontFamily: theme.mono, fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: theme.muted, marginBottom: 6 }}>Total Net Worth</div>
        <div style={{ fontFamily: theme.display, fontSize: isMobile ? "2rem" : "2.7rem", fontWeight: 300, color: theme.text, letterSpacing: "-0.02em", lineHeight: 1 }}>₹42,86,340</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontFamily: theme.mono, fontSize: "0.6rem", color: theme.green }}>
          <span>▲</span> +₹3,12,540 this month (7.9%)
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Stocks", val: "₹18.4L", sub: "12 holdings" },
          { label: "Mutual Funds", val: "₹14.2L", sub: "8 schemes" },
          { label: "Fixed Deposits", val: "₹6.0L", sub: "3 FDs active" },
          { label: "Cash", val: "₹4.2L", sub: "2 accounts" },
        ].map((c, i) => (
          <div key={i} style={{
            padding: isMobile ? "12px 16px" : "16px 24px",
            borderRight: i % 2 === 0 ? `1px solid ${theme.border}` : "none",
            borderBottom: i < 2 ? `1px solid ${theme.border}` : "none",
          }}>
            <div style={{ fontFamily: theme.mono, fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: theme.muted, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: theme.display, fontSize: isMobile ? "1.2rem" : "1.45rem", fontWeight: 300, color: theme.text }}>{c.val}</div>
            <div style={{ fontFamily: theme.mono, fontSize: "0.55rem", color: theme.muted, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div style={{ padding: "16px 24px 8px" }}>
        <svg viewBox="0 0 480 55" preserveAspectRatio="none" style={{ width: "100%", height: 52 }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.28" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,48 C40,46 60,42 90,36 C120,30 130,38 160,30 C190,22 210,28 240,16 C270,6 290,12 320,6 C350,0 370,4 400,2 C430,0 460,3 480,2" stroke={theme.accent} strokeWidth="1.4" fill="none" />
          <path d="M0,48 C40,46 60,42 90,36 C120,30 130,38 160,30 C190,22 210,28 240,16 C270,6 290,12 320,6 C350,0 370,4 400,2 C430,0 460,3 480,2 L480,55 L0,55 Z" fill="url(#cg)" />
        </svg>
      </div>

      {/* Insight */}
      <div style={{ margin: "0 20px 20px", padding: "13px 16px", background: theme.accentDim, border: `1px solid ${theme.border}`, borderLeft: `2px solid ${theme.accent}`, display: "flex", gap: 10, borderRadius: 8 }}>
        <span style={{ color: theme.accent, fontSize: "0.7rem", marginTop: 1, flexShrink: 0 }}>✦</span>
        <div style={{ fontSize: "0.72rem", lineHeight: 1.6, color: theme.text, opacity: 0.9 }}>
          <span style={{ color: theme.accentLt, fontWeight: 500 }}>AI Insight: </span>
          Redirecting ₹1.2L cash to ELSS could save you <span style={{ color: theme.accentLt, fontWeight: 500 }}>₹36,000</span> in taxes this year.
        </div>
      </div>
    </div>
  );
}

// ── TICKER ───────────────────────────────────────────────────────────────────
const tickerItems = [
  { name: "RELIANCE", val: "2,841.50", pct: "+1.4%", up: true },
  { name: "TCS", val: "3,612.80", pct: "-0.6%", up: false },
  { name: "HDFC BANK", val: "1,724.30", pct: "+0.9%", up: true },
  { name: "INFOSYS", val: "1,480.55", pct: "+2.1%", up: true },
  { name: "NIFTY 50", val: "22,845.20", pct: "+0.7%", up: true },
  { name: "SENSEX", val: "75,432.10", pct: "-0.2%", up: false },
];

function Ticker() {
  const { theme } = useTheme();
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div style={{
      borderTop: `1px solid ${theme.border}`,
      borderBottom: `1px solid ${theme.border}`,
      overflow: "hidden",
      whiteSpace: "nowrap",
      padding: "13px 0",
      background: theme.bg2
    }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "inline-flex", gap: 56, animation: "ticker 28s linear infinite" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.1em", color: theme.muted }}>
            <span style={{ color: theme.text }}>{t.name}</span>
            <span style={{ color: t.up ? theme.green : theme.red }}>{t.up ? "▲" : "▼"} {t.val}</span>
            {t.pct && <span style={{ color: t.up ? theme.green : theme.red }}>{t.pct}</span>}
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: theme.border, display: "inline-block" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── FEATURES ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: "▣",
    name: "Unified Dashboard",
    desc: "Stocks, mutual funds, FDs, and cash—all in one view. Connect Zerodha, Groww, Kuvera or add manually."
  },
  {
    icon: "◈",
    name: "Live Price Tracking",
    desc: "Real-time updates via Yahoo Finance. Watch your net worth move as markets do, with instant price sync."
  },
  {
    icon: "◎",
    name: "AI-Powered Insights",
    desc: "Personalized recommendations on tax savings, rebalancing opportunities, and goal milestones—automatically."
  },
  {
    icon: "◇",
    name: "Goal Tracking",
    desc: "Set financial goals—retirement, home, education—and watch your progress with predictive milestones."
  },
  {
    icon: "✦",
    name: "Tax Optimisation",
    desc: "Automatic LTCG/STCG classification and actionable suggestions to reduce your tax liability each year."
  },
  {
    icon: "◉",
    name: "Bank-Grade Security",
    desc: "256-bit encryption, read-only API access, and zero storage of credentials. Your data stays safe."
  },
];

function FeatureCard({ f, i }) {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: isMobile ? "32px 20px" : "48px 40px",
        borderBottom: i < (isMobile ? features.length - 1 : 2) ? `1px solid ${theme.border}` : "none",
        position: "relative",
        background: hovered ? theme.accentDim : "transparent",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ${i * 0.07}s ease, transform 0.6s ${i * 0.07}s ease, background 0.4s ease`,
        borderRadius: 8,
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: theme.accent,
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left",
        transition: "transform 0.4s ease",
      }} />
      <div style={{ width: 42, height: 42, border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, color: theme.accent, fontSize: "1.1rem", borderRadius: 8 }}>{f.icon}</div>
      <div style={{ fontFamily: theme.display, fontSize: isMobile ? "1.3rem" : "1.5rem", fontWeight: 400, color: theme.text, marginBottom: 12, letterSpacing: "0.01em" }}>{f.name}</div>
      <p style={{ fontSize: isMobile ? "0.85rem" : "0.83rem", lineHeight: 1.78, color: theme.muted, margin: 0 }}>{f.desc}</p>
    </div>
  );
}

function Features() {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <section style={{ padding: isMobile ? "60px 20px" : "120px 60px" }}>
      <div ref={ref}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: theme.accent, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: theme.accent, display: "inline-block" }} />
          What we offer
        </div>
        <h2 style={{
          fontFamily: theme.display, fontSize: isMobile ? "2rem" : "clamp(2.6rem,4vw,4rem)", fontWeight: 300, lineHeight: 1.08,
          color: theme.text, maxWidth: 420, marginBottom: 40,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Built for the <em style={{ fontStyle: "italic", color: theme.accentLt }}>complete</em> picture
        </h2>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: isMobile ? 16 : 0,
        border: isMobile ? "none" : `1px solid ${theme.border}`,
        borderRadius: isMobile ? 0 : 12,
      }}>
        {features.map((f, i) => <FeatureCard key={i} f={f} i={i} />)}
      </div>
    </section>
  );
}

// ── ASSET TRACKER ────────────────────────────────────────────────────────────
const assets = [
  { tag: "STK", name: "Reliance Industries", sub: "NSE · 28 shares", val: "₹79,562", pct: "+14.2%", up: true },
  { tag: "MF", name: "Mirae Asset ELSS", sub: "Direct Growth · SIP ₹5K/mo", val: "₹3,24,180", pct: "+22.8%", up: true },
  { tag: "FD", name: "HDFC Bank FD", sub: "Matures 14 Aug 2026 · 7.1%", val: "₹2,00,000", pct: "+7.1%", up: true },
  { tag: "US", name: "Apple Inc.", sub: "NASDAQ · 5 shares", val: "₹1,62,400", pct: "-2.4%", up: false },
  { tag: "CASH", name: "Savings Account", sub: "SBI · Liquid reserve", val: "₹4,20,000", pct: "Idle", up: null },
  { tag: "CRYPTO", name: "Ethereum", sub: "10 UNITS", val: "₹1,90,818.69", pct: "+0.81%", up: true },

];

function AssetRow({ a, i }) {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "16px 12px" : "20px 24px",
        borderBottom: i < assets.length - 1 ? `1px solid ${theme.border}` : "none",
        background: hovered ? theme.accentDim : "transparent",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(20px)",
        transition: `opacity 0.5s ${i * 0.08}s ease, transform 0.5s ${i * 0.08}s ease, background 0.3s ease`,
        cursor: "default",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36,
          background: theme.accentDim,
          border: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: theme.mono, fontSize: "0.55rem", color: theme.accent,
          letterSpacing: "0.05em", flexShrink: 0, borderRadius: 6
        }}>
          {a.tag}
        </div>
        <div>
          <div style={{ fontSize: isMobile ? "0.8rem" : "0.85rem", color: theme.text, marginBottom: 2 }}>{a.name}</div>
          <div style={{ fontFamily: theme.mono, fontSize: "0.55rem", color: theme.muted, letterSpacing: "0.07em" }}>{a.sub}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: theme.display, fontSize: isMobile ? "0.9rem" : "1.1rem", color: theme.text }}>{a.val}</div>
        <div style={{ fontFamily: theme.mono, fontSize: "0.55rem", color: a.up === true ? theme.green : a.up === false ? theme.red : theme.muted }}>{a.pct}</div>
      </div>
    </div>
  );
}

function TrackerSection() {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <section style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      borderTop: `1px solid ${theme.border}`,
      borderBottom: `1px solid ${theme.border}`
    }}>
      <div ref={ref} style={{
        padding: isMobile ? "40px 20px" : "100px 60px",
        borderRight: isMobile ? "none" : `1px solid ${theme.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: theme.accent, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: theme.accent, display: "inline-block" }} />
          Every asset class
        </div>
        <h2 style={{
          fontFamily: theme.display, fontSize: isMobile ? "2rem" : "clamp(2.4rem,3.5vw,3.8rem)", fontWeight: 300, lineHeight: 1.08,
          color: theme.text, maxWidth: 360, marginBottom: 28,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Nothing gets <em style={{ fontStyle: "italic", color: theme.accentLt }}>left out</em>
        </h2>
        <p style={{ fontSize: isMobile ? "0.85rem" : "0.88rem", color: theme.muted, lineHeight: 1.82, maxWidth: 360, margin: 0 }}>
          From blue-chip stocks to small-cap bets, from liquid funds to 5-year FDs—PortaFi tracks every rupee, everywhere it lives.
        </p>
      </div>
      <div style={{
        padding: isMobile ? "20px 20px 40px" : "80px 60px",
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{ width: "100%", border: `1px solid ${theme.border}`, borderRadius: 12 }}>
          {assets.map((a, i) => <AssetRow key={i} a={a} i={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── AI CHAT ──────────────────────────────────────────────────────────────────
function AISection() {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  const chatMessages = [
    { user: true, text: "How am I doing against the Nifty 50 this year?" },
    {
      user: false,
      text: (
        <>
          Your portfolio is up <strong style={{ color: theme.accentLt }}>+19.4%</strong> YTD vs Nifty 50's{' '}
          <strong style={{ color: theme.accentLt }}>+11.2%</strong> — outperforming by{' '}
          <strong style={{ color: theme.accentLt }}>820 bps</strong>. Alpha is driven by your mid-cap bets.
        </>
      )
    },
    { user: true, text: "Any FD maturities I should watch out for?" },
    {
      user: false,
      text: (
        <>
          Your <strong style={{ color: theme.accentLt }}>HDFC FD (₹2L)</strong> matures Aug 14. Rates have dipped to 6.8% since you locked in at 7.1%.{' '}
          Consider a short-duration debt fund for better liquidity.
        </>
      )
    },
  ];

  return (
    <section style={{
      padding: isMobile ? "60px 20px" : "120px 60px",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: isMobile ? 40 : 80,
      alignItems: "center"
    }}>
      <div ref={ref}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: theme.accent, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: theme.accent, display: "inline-block" }} />
          Intelligence built-in
        </div>
        <h2 style={{
          fontFamily: theme.display, fontSize: isMobile ? "2rem" : "clamp(2.4rem,3.5vw,3.8rem)", fontWeight: 300, lineHeight: 1.08,
          color: theme.text, maxWidth: 380, marginBottom: 24,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Insights that <em style={{ fontStyle: "italic", color: theme.accentLt }}>think ahead</em>
        </h2>
        <p style={{ fontSize: isMobile ? "0.85rem" : "0.88rem", color: theme.muted, lineHeight: 1.82, maxWidth: 360, marginBottom: 36 }}>
          PortaFi's AI engine analyses your entire portfolio—not just individual holdings—to surface opportunities and risks you'd otherwise miss.
        </p>
        <CTAButton>Coming Soon</CTAButton>
      </div>

      <div style={{
        border: `1px solid ${theme.border}`,
        padding: isMobile ? "24px" : "32px",
        background: theme.bg2,
        position: "relative",
        borderRadius: 12,
      }}>
        <div style={{
          position: "absolute", top: -10, left: 24,
          background: theme.bg2,
          padding: "0 8px",
          fontFamily: theme.mono,
          fontSize: "0.52rem",
          letterSpacing: "0.2em",
          color: theme.accent
        }}>
          AI INSIGHTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {chatMessages.map((m, i) => {
            const [ref, inView] = useInView(0.1);
            return (
              <div key={i} ref={ref} style={{
                display: "flex", flexDirection: m.user ? "row-reverse" : "row", gap: 12, alignItems: "flex-start",
                opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.5s ${i * 0.15}s ease, transform 0.5s ${i * 0.15}s ease`,
              }}>
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  border: `1px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: theme.mono, fontSize: "0.52rem",
                  color: m.user ? theme.muted : theme.accent,
                  background: m.user ? "transparent" : theme.accentDim,
                  borderRadius: 6,
                }}>
                  {m.user ? "U" : "AI"}
                </div>
                <div style={{
                  background: m.user ? theme.bg3 : theme.accentDim,
                  border: `1px solid ${theme.border}`,
                  padding: "11px 15px",
                  fontSize: isMobile ? "0.75rem" : "0.76rem",
                  lineHeight: 1.65,
                  color: m.user ? theme.muted : theme.text,
                  flex: 1,
                  borderRadius: 8,
                }}>
                  {m.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── FEATURE HIGHLIGHTS (replaces pricing/stats) ─────────────────────────────
const highlights = [
  {
    icon: "▣",
    title: "Complete Dashboard",
    desc: "All your investments in one place—stocks, MFs, FDs, and cash. No more switching between apps.",
  },
  {
    icon: "◈",
    title: "Real-time Updates",
    desc: "Live prices from NSE/BSE and global markets. Your net worth updates as markets move.",
  },
  {
    icon: "◎",
    title: "Smart Insights",
    desc: "AI-powered recommendations for tax saving, rebalancing, and goal tracking.",
  },
  {
    icon: "◇",
    title: "Secure by Design",
    desc: "256-bit encryption, read-only access, and zero storage of credentials. Bank-grade security.",
  },
];

function HighlightCard({ h, i }) {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <div
      ref={ref}
      style={{
        padding: isMobile ? "24px 16px" : "32px 24px",
        background: theme.bg2,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ${i * 0.1}s ease, transform 0.6s ${i * 0.1}s ease`,
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        background: theme.accentDim,
        border: `1px solid ${theme.accent}40`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        color: theme.accent,
        marginBottom: 16,
      }}>
        {h.icon}
      </div>
      <h3 style={{ fontFamily: theme.display, fontSize: '1.1rem', color: theme.text, marginBottom: 8 }}>
        {h.title}
      </h3>
      <p style={{ fontSize: '0.85rem', color: theme.muted, lineHeight: 1.6, margin: 0 }}>
        {h.desc}
      </p>
    </div>
  );
}

function FeatureHighlights() {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <section style={{ padding: isMobile ? "60px 20px" : "120px 60px" }}>
      <div ref={ref} style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: theme.accent, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: theme.accent, display: "inline-block" }} />
          Why PortaFi
          <span style={{ width: 24, height: 1, background: theme.accent, display: "inline-block" }} />
        </div>
        <h2 style={{
          fontFamily: theme.display, fontSize: isMobile ? "2rem" : "clamp(2.4rem,4vw,3.5rem)", fontWeight: 300,
          color: theme.text, maxWidth: 600, margin: '0 auto',
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          The <em style={{ fontStyle: "italic", color: theme.accentLt }}>simplest</em> way to track your wealth
        </h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: 20,
      }}>
        {highlights.map((h, i) => <HighlightCard key={i} h={h} i={i} />)}
      </div>
    </section>
  );
}

// ── CTA BUTTON ───────────────────────────────────────────────────────────────
function CTAButton({ children, large, onClick }) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <a href="#"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: theme.accent, color: theme.white,
        padding: large ? (isMobile ? "14px 32px" : "18px 44px") : (isMobile ? "12px 24px" : "15px 34px"),
        fontFamily: theme.mono, fontSize: large ? (isMobile ? "0.7rem" : "0.75rem") : (isMobile ? "0.65rem" : "0.68rem"),
        fontWeight: 400,
        letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none",
        boxShadow: hovered ? `0 0 40px ${theme.accent}60` : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s ease",
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      {children}
      <span style={{ transform: hovered ? "translateX(4px)" : "translateX(0)", transition: "transform 0.3s ease", display: "inline-block" }}>→</span>
    </a>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const isMobile = windowWidth <= 768;

  return (
    <section style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      alignItems: "center",
      padding: isMobile ? "100px 20px 60px" : "0 60px",
      paddingTop: isMobile ? 120 : 120,
      position: "relative",
      overflow: "hidden",
      gap: isMobile ? 40 : 0,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        top: "-15%",
        right: "-8%",
        width: isMobile ? 400 : 700,
        height: isMobile ? 400 : 700,
        background: `radial-gradient(circle, ${theme.accent}15 0%, transparent 65%)`,
        pointerEvents: "none",
        animation: "pulse 9s ease-in-out infinite"
      }} />
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.12);opacity:0.7}} @keyframes floatBadge{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}`}</style>

      <div style={{
        maxWidth: isMobile ? "100%" : 540,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.9s ease, transform 0.9s ease",
        textAlign: isMobile ? 'center' : 'left',
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: isMobile ? 'center' : 'flex-start',
          gap: 12,
          fontFamily: theme.mono,
          fontSize: "0.62rem",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: theme.accent,
          marginBottom: 28,
          width: '100%',
        }}>
          <span style={{ width: 32, height: 1, background: theme.accent, display: "inline-block" }} />
          For Indian Investors
        </div>
        <h1 style={{
          fontFamily: theme.display,
          fontSize: isMobile ? "2.5rem" : "clamp(3rem,5.5vw,5.2rem)",
          fontWeight: 300,
          lineHeight: 1.06,
          letterSpacing: "-0.01em",
          marginBottom: 24,
          color: theme.text
        }}>
          All your money,<br />
          <em style={{ fontStyle: "italic", color: theme.accentLt }}>one</em> dashboard.
        </h1>
        <p style={{
          fontSize: isMobile ? "0.9rem" : "1rem",
          lineHeight: 1.78,
          color: theme.muted,
          maxWidth: isMobile ? "100%" : 430,
          marginBottom: 48
        }}>
          Stocks, mutual funds, FDs, and cash—
          <span style={{ color: theme.text }}> tracked together</span> for the first time.
          AI-powered insights that help you invest smarter.
        </p>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isMobile ? 'center' : 'flex-start',
          gap: isMobile ? 20 : 32,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.9s 0.2s ease, transform 0.9s 0.2s ease",
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <CTAButton large>Coming Soon</CTAButton>
          <a href="#" style={{
            fontFamily: theme.mono,
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: theme.muted,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 7,
            transition: "color 0.3s"
          }}
            onMouseEnter={e => e.currentTarget.style.color = theme.text}
            onMouseLeave={e => e.currentTarget.style.color = theme.muted}
          >
            ▷ Watch demo
          </a>
        </div>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "center",
        position: "relative",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 1s 0.3s ease, transform 1s 0.3s ease",
        marginTop: isMobile ? 20 : 0,
      }}>
        {/* Floating badges - hide on very small screens */}
        {!isMobile && (
          <>
            <div style={{
              position: "absolute", top: -10, left: -20,
              display: "flex", alignItems: "center", gap: 8,
              background: theme.bg2,
              border: `1px solid ${theme.border}`,
              padding: "10px 16px",
              fontFamily: theme.mono, fontSize: "0.58rem",
              letterSpacing: "0.1em", color: theme.text,
              animation: "floatBadge 4s ease-in-out infinite",
              zIndex: 2,
              borderRadius: 30,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: theme.green, display: "inline-block" }} />
              Live prices synced
            </div>
            <div style={{
              position: "absolute", bottom: 80, right: -30,
              display: "flex", alignItems: "center", gap: 8,
              background: theme.bg2,
              border: `1px solid ${theme.border}`,
              padding: "10px 16px",
              fontFamily: theme.mono, fontSize: "0.58rem",
              letterSpacing: "0.1em", color: theme.text,
              animation: "floatBadge 4s 1.5s ease-in-out infinite",
              zIndex: 2,
              borderRadius: 30,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, display: "inline-block" }} />
              AI insight ready
            </div>
          </>
        )}
        <DashboardCard />
      </div>
    </section>
  );
}

// ── CTA SECTION ──────────────────────────────────────────────────────────────
function CTASection() {
  const { theme } = useTheme();
  const [ref, inView] = useInView(0.2);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <section ref={ref} style={{
      padding: isMobile ? "80px 20px" : "160px 60px",
      textAlign: "center",
      borderTop: `1px solid ${theme.border}`,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: isMobile ? 300 : 600,
        height: isMobile ? 300 : 600,
        background: `radial-gradient(circle, ${theme.accent}15 0%, transparent 65%)`,
        pointerEvents: "none"
      }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: theme.mono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: theme.accent, marginBottom: 18 }}>
        <span style={{ width: 24, height: 1, background: theme.accent, display: "inline-block" }} />
        Start today
      </div>
      <h2 style={{
        fontFamily: theme.display, fontSize: isMobile ? "2.2rem" : "clamp(2.8rem,5vw,5rem)", fontWeight: 300, lineHeight: 1.06,
        color: theme.text, maxWidth: 560, margin: "0 auto 28px",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        Your complete<br />financial picture<br /><em style={{ fontStyle: "italic", color: theme.accentLt }}>awaits</em>
      </h2>
      <p style={{
        fontSize: isMobile ? "0.85rem" : "0.9rem",
        color: theme.muted,
        maxWidth: isMobile ? "100%" : 380,
        margin: "0 auto 48px",
        lineHeight: 1.8
      }}>
        Join investors who track everything in one place. No spreadsheets. No juggling apps. Just clarity.
      </p>
      <CTAButton large>Coming Soon</CTAButton>
    </section>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const { theme } = useTheme();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  return (
    <footer style={{
      borderTop: `1px solid ${theme.border}`,
      minHeight: isMobile ? '40vh' : '52vh',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: isMobile ? '56px 20px' : '80px 20px',
      backgroundColor: `${theme.accent}`
    }}>
      <div style={{
        width: '100%',
        textAlign: 'center',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Main Brand Text */}
        <h2 style={{
          fontFamily: theme.display,
          fontSize: isMobile ? '3.55rem' : isTablet ? '6.8rem' : '9.6rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          color: theme.white,
          margin: 0,
          opacity: 1,
        }}>
          PORT<span style={{ color: theme.white }}>A</span>FI
        </h2>

        {/* Tagline */}
        <p style={{
          fontFamily: theme.mono,
          fontSize: isMobile ? '12px' : isTablet ? '14px' : '16px',
          color: theme.bg2,
          maxWidth: isMobile ? '280px' : isTablet ? '500px' : '600px',
          margin: isMobile ? '16px auto 0' : '20px auto 0',
          lineHeight: 1.6,
          letterSpacing: '0.02em',
        }}>
          Personalized. Proactive. <span style={{ color: theme.white }}>Powerful.</span>
        </p>

        {/* CTA Button */}
        <div style={{ marginTop: isMobile ? '24px' : '28px' }}>
          <a
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme.text,
              color: theme.white,
              fontFamily: theme.mono,
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 600,
              padding: isMobile ? '10px 20px' : '12px 24px',
              borderRadius: '999px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = theme.accent;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = theme.text;
            }}
          >
            Get Started
          </a>
        </div>

        {/* Copyright */}
        <div style={{
          marginTop: isMobile ? 32 : 40,
          fontSize: isMobile ? '11px' : '12px',
          color: theme.bg2,
          fontFamily: theme.mono,
          opacity: 0.7,
        }}>
          © 2026 PortaFi · Made in India 🇮🇳
        </div>
      </div>
    </footer>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function PortaFi() {
  const { theme } = useTheme();

  return (
    <div style={{
      background: theme.bg,
      color: theme.text,
      fontFamily: theme.sans,
      fontWeight: 300,
      overflowX: "hidden",
      minHeight: "100vh",
      position: 'relative',
    }}>
      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      <Nav />
      <Hero />
      <Ticker />
      <Features />
      <TrackerSection />
      <PersonaSection />
      <AISection />
      <FeatureHighlights />
      <CTASection />
      <Footer />
    </div>
  );
}

