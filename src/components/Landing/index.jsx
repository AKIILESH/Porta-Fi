import { useState, useEffect, useRef } from "react";

const colors = {
  ink: "#0a0a0f",
  parchment: "#f0ebe0",
  gold: "#c9a84c",
  goldLight: "#e8c96b",
  goldDim: "rgba(201,168,76,0.12)",
  cream: "#faf7f2",
  muted: "#6e6558",
  border: "rgba(201,168,76,0.18)",
  green: "#5cb87a",
  red: "#d96b6b",
};

const styles = {
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontMono: "'DM Mono', 'Courier New', monospace",
  fontBody: "'DM Sans', system-ui, sans-serif",
};

// Google Fonts loader
function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
}

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
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
  position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "24px 60px",
  backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
  background: scrolled ? "rgba(10,10,15,0.88)" : "transparent",
  borderBottom: scrolled ? `1px solid ${colors.border}` : "1px solid transparent",
  transition: "all 0.4s ease",
}}>
  {/* Logo on left */}
  <a href="#" style={{ 
    fontFamily: styles.fontDisplay, 
    fontSize: "1.55rem", 
    fontWeight: 400, 
    letterSpacing: "0.12em", 
    color: colors.parchment, 
    textDecoration: "none" 
  }}>
    Porta<span style={{ color: colors.gold }}>Fi</span>
  </a>

  {/* Buttons container on right */}
  <div style={{ display: "flex", gap: "12px" }}>
    <a 
      href="/signup" 
      style={{
        fontFamily: styles.fontMono, 
        fontSize: "0.65rem", 
        letterSpacing: "0.18em", 
        textTransform: "uppercase",
        color: colors.gold, 
        border: `1px solid ${colors.gold}`, 
        padding: "10px 24px", 
        textDecoration: "none",
        transition: "all 0.3s",
      }}
      onMouseEnter={e => { 
        e.target.style.background = colors.gold; 
        e.target.style.color = colors.ink; 
      }}
      onMouseLeave={e => { 
        e.target.style.background = "transparent"; 
        e.target.style.color = colors.gold; 
      }}
    >
      Get Started
    </a>
    <a 
      href="/login" 
      style={{
        fontFamily: styles.fontMono, 
        fontSize: "0.65rem", 
        letterSpacing: "0.18em", 
        textTransform: "uppercase",
        color: colors.gold, 
        border: `1px solid ${colors.gold}`, 
        padding: "10px 24px", 
        textDecoration: "none",
        transition: "all 0.3s",
      }}
      onMouseEnter={e => { 
        e.target.style.background = colors.gold; 
        e.target.style.color = colors.ink; 
      }}
      onMouseLeave={e => { 
        e.target.style.background = "transparent"; 
        e.target.style.color = colors.gold; 
      }}
    >
      Sign In
    </a>
  </div>
</nav>
  );
}

// ── DASHBOARD MOCKUP ─────────────────────────────────────────────────────────
function DashboardCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", maxWidth: 520,
        background: "rgba(16,14,10,0.95)",
        border: `1px solid ${colors.border}`,
        position: "relative",
        boxShadow: `0 40px 100px rgba(0,0,0,0.65), 0 0 60px rgba(201,168,76,0.06)`,
        transform: hovered
          ? "perspective(1000px) rotateY(-1deg) rotateX(0deg)"
          : "perspective(1000px) rotateY(-5deg) rotateX(2deg)",
        transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: styles.fontDisplay, fontSize: "0.95rem", letterSpacing: "0.15em", color: colors.gold }}>PortaFi</span>
        <span style={{ fontFamily: styles.fontMono, fontSize: "0.58rem", color: colors.muted, letterSpacing: "0.1em" }}>3 Mar 2026 · 09:42 IST</span>
      </div>

      {/* Net Worth */}
      <div style={{ padding: "24px 24px 18px", borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ fontFamily: styles.fontMono, fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: colors.muted, marginBottom: 6 }}>Total Net Worth</div>
        <div style={{ fontFamily: styles.fontDisplay, fontSize: "2.7rem", fontWeight: 300, color: colors.parchment, letterSpacing: "-0.02em", lineHeight: 1 }}>₹42,86,340</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontFamily: styles.fontMono, fontSize: "0.6rem", color: colors.green }}>
          <span>▲</span> +₹3,12,540 this month (7.9%)
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[
          { label: "Stocks", val: "₹18.4L", sub: "12 holdings" },
          { label: "Mutual Funds", val: "₹14.2L", sub: "8 schemes" },
          { label: "Fixed Deposits", val: "₹6.0L", sub: "3 FDs active" },
          { label: "Cash & Savings", val: "₹4.2L", sub: "2 accounts" },
        ].map((c, i) => (
          <div key={i} style={{
            padding: "16px 24px",
            borderRight: i % 2 === 0 ? `1px solid ${colors.border}` : "none",
            borderBottom: i < 2 ? `1px solid ${colors.border}` : "none",
          }}>
            <div style={{ fontFamily: styles.fontMono, fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", color: colors.muted, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: styles.fontDisplay, fontSize: "1.45rem", fontWeight: 300, color: colors.parchment }}>{c.val}</div>
            <div style={{ fontFamily: styles.fontMono, fontSize: "0.55rem", color: colors.muted, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div style={{ padding: "16px 24px 8px" }}>
        <svg viewBox="0 0 480 55" preserveAspectRatio="none" style={{ width: "100%", height: 52 }}>
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.gold} stopOpacity="0.28" />
              <stop offset="100%" stopColor={colors.gold} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,48 C40,46 60,42 90,36 C120,30 130,38 160,30 C190,22 210,28 240,16 C270,6 290,12 320,6 C350,0 370,4 400,2 C430,0 460,3 480,2" stroke={colors.gold} strokeWidth="1.4" fill="none" />
          <path d="M0,48 C40,46 60,42 90,36 C120,30 130,38 160,30 C190,22 210,28 240,16 C270,6 290,12 320,6 C350,0 370,4 400,2 C430,0 460,3 480,2 L480,55 L0,55 Z" fill="url(#cg)" />
        </svg>
      </div>

      {/* Insight */}
      <div style={{ margin: "0 20px 20px", padding: "13px 16px", background: colors.goldDim, border: `1px solid ${colors.border}`, borderLeft: `2px solid ${colors.gold}`, display: "flex", gap: 10 }}>
        <span style={{ color: colors.gold, fontSize: "0.7rem", marginTop: 1, flexShrink: 0 }}>✦</span>
        <div style={{ fontSize: "0.72rem", lineHeight: 1.6, color: colors.parchment, opacity: 0.9 }}>
          <span style={{ color: colors.goldLight, fontWeight: 500 }}>AI Insight: </span>
          Redirecting ₹1.2L cash to ELSS could save you <span style={{ color: colors.goldLight, fontWeight: 500 }}>₹36,000</span> in taxes this year.
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
  { name: "MIRAE ELSS", val: "42.18 NAV", pct: "+0.3%", up: true },
  { name: "NIFTY 50", val: "22,845.20", pct: "+0.7%", up: true },
  { name: "SENSEX", val: "75,432.10", pct: "-0.2%", up: false },
  { name: "SBI FD 3Y", val: "6.50% p.a.", pct: null, up: true },
];

function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, overflow: "hidden", whiteSpace: "nowrap", padding: "13px 0", background: "rgba(201,168,76,0.025)" }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "inline-flex", gap: 56, animation: "ticker 28s linear infinite" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.1em", color: colors.muted }}>
            <span style={{ color: colors.parchment }}>{t.name}</span>
            <span style={{ color: t.up ? colors.green : colors.red }}>{t.up ? "▲" : "▼"} {t.val}</span>
            {t.pct && <span style={{ color: t.up ? colors.green : colors.red }}>{t.pct}</span>}
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: colors.border, display: "inline-block" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── STATS ────────────────────────────────────────────────────────────────────
function StatsBar() {
  const [ref, inView] = useInView(0.2);
  const stats = [
    { num: "50K+", label: "Active investors" },
    { num: "₹840Cr", label: "Assets tracked" },
    { num: "4.9★", label: "App store rating" },
    { num: "100%", label: "Free forever" },
  ];
  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: `1px solid ${colors.border}` }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: "52px 60px",
          borderRight: i < 3 ? `1px solid ${colors.border}` : "none",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(24px)",
          transition: `opacity 0.7s ${i * 0.12}s ease, transform 0.7s ${i * 0.12}s ease`,
        }}>
          <span style={{ fontFamily: styles.fontDisplay, fontSize: "3rem", fontWeight: 300, color: colors.gold, letterSpacing: "-0.02em", display: "block", marginBottom: 6 }}>{s.num}</span>
          <span style={{ fontFamily: styles.fontMono, fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: colors.muted }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── FEATURES ─────────────────────────────────────────────────────────────────
const features = [
  { num: "01", name: "Unified Dashboard", desc: "Stocks, mutual funds, FDs, cash, and goals—all in one view. Connect Zerodha, Groww, Kuvera or add manually.", icon: "▣" },
  { num: "02", name: "Live Price Tracking", desc: "Real-time updates via Yahoo Finance integration. Watch your net worth move as markets do.", icon: "◈" },
  { num: "03", name: "AI-Powered Insights", desc: "Personalized recommendations on tax savings, rebalancing opportunities, and goal milestones.", icon: "◎" },
  { num: "04", name: "Goal Tracking", desc: "Set financial goals—retirement, home, education—and watch your portfolio progress with predictive milestones.", icon: "◇" },
  { num: "05", name: "Tax Optimisation", desc: "Automatic LTCG/STCG classification and actionable suggestions to reduce your tax liability each year.", icon: "✦" },
  { num: "06", name: "Bank-Grade Security", desc: "256-bit encryption, read-only API access, and zero storage of credentials. Your data stays safe.", icon: "◉" },
];

function FeatureCard({ f, i }) {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  const col = i % 3;
  const row = Math.floor(i / 3);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "48px 40px",
        borderRight: col < 2 ? `1px solid ${colors.border}` : "none",
        borderBottom: row < 1 ? `1px solid ${colors.border}` : "none",
        position: "relative",
        background: hovered ? "rgba(201,168,76,0.03)" : "transparent",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ${i * 0.07}s ease, transform 0.6s ${i * 0.07}s ease, background 0.4s ease`,
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: colors.gold,
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left",
        transition: "transform 0.4s ease",
      }} />
      <div style={{ fontFamily: styles.fontMono, fontSize: "0.58rem", color: colors.gold, letterSpacing: "0.15em", marginBottom: 20, opacity: 0.7 }}>{f.num}</div>
      <div style={{ width: 42, height: 42, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, color: colors.gold, fontSize: "1.1rem" }}>{f.icon}</div>
      <div style={{ fontFamily: styles.fontDisplay, fontSize: "1.5rem", fontWeight: 400, color: colors.parchment, marginBottom: 12, letterSpacing: "0.01em" }}>{f.name}</div>
      <p style={{ fontSize: "0.83rem", lineHeight: 1.78, color: colors.muted, margin: 0 }}>{f.desc}</p>
    </div>
  );
}

function Features() {
  const [ref, inView] = useInView(0.1);
  return (
    <section style={{ padding: "120px 60px" }}>
      <div ref={ref}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: colors.gold, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: colors.gold, display: "inline-block" }} />
          What we offer
        </div>
        <h2 style={{
          fontFamily: styles.fontDisplay, fontSize: "clamp(2.6rem,4vw,4rem)", fontWeight: 300, lineHeight: 1.08,
          color: colors.parchment, maxWidth: 420, marginBottom: 80,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Built for the <em style={{ fontStyle: "italic", color: colors.goldLight }}>complete</em> picture
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: `1px solid ${colors.border}` }}>
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
  { tag: "US", name: "Apple Inc.", sub: "NASDAQ · 5 shares · $AAPL", val: "₹1,62,400", pct: "-2.4%", up: false },
  { tag: "CASH", name: "Savings Account", sub: "SBI · Liquid reserve", val: "₹4,20,000", pct: "Idle", up: null },
];

function AssetRow({ a, i }) {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: i < assets.length - 1 ? `1px solid ${colors.border}` : "none",
        background: hovered ? colors.goldDim : "transparent",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(20px)",
        transition: `opacity 0.5s ${i * 0.08}s ease, transform 0.5s ${i * 0.08}s ease, background 0.3s ease`,
        cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, background: colors.goldDim, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: styles.fontMono, fontSize: "0.55rem", color: colors.gold, letterSpacing: "0.05em", flexShrink: 0 }}>{a.tag}</div>
        <div>
          <div style={{ fontSize: "0.85rem", color: colors.parchment, marginBottom: 2 }}>{a.name}</div>
          <div style={{ fontFamily: styles.fontMono, fontSize: "0.57rem", color: colors.muted, letterSpacing: "0.07em" }}>{a.sub}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: styles.fontDisplay, fontSize: "1.1rem", color: colors.parchment }}>{a.val}</div>
        <div style={{ fontFamily: styles.fontMono, fontSize: "0.58rem", color: a.up === true ? colors.green : a.up === false ? colors.red : colors.muted }}>{a.pct}</div>
      </div>
    </div>
  );
}

function TrackerSection() {
  const [ref, inView] = useInView(0.1);
  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
      <div ref={ref} style={{ padding: "100px 60px", borderRight: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: colors.gold, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: colors.gold, display: "inline-block" }} />
          Every asset class
        </div>
        <h2 style={{
          fontFamily: styles.fontDisplay, fontSize: "clamp(2.4rem,3.5vw,3.8rem)", fontWeight: 300, lineHeight: 1.08,
          color: colors.parchment, maxWidth: 360, marginBottom: 28,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Nothing gets <em style={{ fontStyle: "italic", color: colors.goldLight }}>left out</em>
        </h2>
        <p style={{ fontSize: "0.88rem", color: colors.muted, lineHeight: 1.82, maxWidth: 360, margin: 0 }}>
          From blue-chip stocks to small-cap bets, from liquid funds to 5-year FDs—PortaFi tracks every rupee, everywhere it lives.
        </p>
      </div>
      <div style={{ padding: "80px 60px", display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", border: `1px solid ${colors.border}` }}>
          {assets.map((a, i) => <AssetRow key={i} a={a} i={i} />)}
        </div>
      </div>
    </section>
  );
}

// ── AI CHAT ──────────────────────────────────────────────────────────────────
const chatMessages = [
  { user: true, text: "How am I doing against the Nifty 50 this year?" },
  { user: false, text: <>Your portfolio is up <strong style={{ color: colors.goldLight }}>+19.4%</strong> YTD vs Nifty 50's <strong style={{ color: colors.goldLight }}>+11.2%</strong> — outperforming by <strong style={{ color: colors.goldLight }}>820 bps</strong>. Alpha is driven by your mid-cap bets in LTIM and Persistent.</> },
  { user: true, text: "Any FD maturities I should watch out for?" },
  { user: false, text: <>Your <strong style={{ color: colors.goldLight }}>HDFC FD (₹2L)</strong> matures Aug 14. Rates have dipped to 6.8% since you locked in at 7.1%. Consider <strong style={{ color: colors.goldLight }}>Bajaj Finance FD at 8.05%</strong> or a short-duration debt fund for better liquidity.</> },
];

function AISection() {
  const [ref, inView] = useInView(0.1);
  return (
    <section style={{ padding: "120px 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
      <div ref={ref}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: colors.gold, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: colors.gold, display: "inline-block" }} />
          Intelligence built-in
        </div>
        <h2 style={{
          fontFamily: styles.fontDisplay, fontSize: "clamp(2.4rem,3.5vw,3.8rem)", fontWeight: 300, lineHeight: 1.08,
          color: colors.parchment, maxWidth: 380, marginBottom: 24,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Insights that <em style={{ fontStyle: "italic", color: colors.goldLight }}>think ahead</em>
        </h2>
        <p style={{ fontSize: "0.88rem", color: colors.muted, lineHeight: 1.82, maxWidth: 360, marginBottom: 36 }}>
          PortaFi's AI engine analyses your entire portfolio—not just individual holdings—to surface opportunities and risks you'd otherwise miss.
        </p>
        <CTAButton>Try AI insights free</CTAButton>
      </div>

      <div style={{ border: `1px solid ${colors.border}`, padding: "32px", background: "rgba(16,14,10,0.6)", position: "relative" }}>
        <div style={{ position: "absolute", top: -10, left: 24, background: colors.ink, padding: "0 8px", fontFamily: styles.fontMono, fontSize: "0.52rem", letterSpacing: "0.2em", color: colors.gold }}>AI INSIGHTS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {chatMessages.map((m, i) => {
            const [ref, inView] = useInView(0.1);
            return (
              <div key={i} ref={ref} style={{
                display: "flex", flexDirection: m.user ? "row-reverse" : "row", gap: 12, alignItems: "flex-start",
                opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.5s ${i * 0.15}s ease, transform 0.5s ${i * 0.15}s ease`,
              }}>
                <div style={{ width: 28, height: 28, flexShrink: 0, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: styles.fontMono, fontSize: "0.52rem", color: m.user ? colors.muted : colors.gold, background: m.user ? "transparent" : colors.goldDim }}>
                  {m.user ? "U" : "AI"}
                </div>
                <div style={{ background: m.user ? "rgba(255,255,255,0.03)" : colors.goldDim, border: `1px solid ${colors.border}`, padding: "11px 15px", fontSize: "0.76rem", lineHeight: 1.65, color: m.user ? colors.muted : colors.parchment, flex: 1 }}>
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

// ── PRICING ──────────────────────────────────────────────────────────────────
const plans = [
  {
    tier: "Free", price: "₹0", period: "Forever · No credit card", featured: false,
    features: ["Complete portfolio dashboard", "Stocks, MFs, FDs & cash tracking", "Live price updates", "3 financial goals", "Basic AI insights"],
  },
  {
    tier: "Pro", price: "₹49", period: "Per month · Cancel anytime", featured: true,
    features: ["Everything in Free", "Advanced analytics & reports", "Capital gains tax reports", "Portfolio rebalancing", "Unlimited goals & scenarios", "Priority AI insights"],
  },
];

function PricingCard({ p, i }) {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "52px 44px",
        borderRight: i < 2 ? `1px solid ${colors.border}` : "none",
        background: p.featured ? "rgba(201,168,76,0.04)" : hovered ? "rgba(201,168,76,0.02)" : "transparent",
        position: "relative",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.7s ${i * 0.1}s ease, transform 0.7s ${i * 0.1}s ease, background 0.4s ease`,
      }}
    >
      {p.featured && (
        <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: colors.gold, color: colors.ink, padding: "3px 14px", fontFamily: styles.fontMono, fontSize: "0.52rem", letterSpacing: "0.2em", whiteSpace: "nowrap" }}>
          MOST POPULAR
        </div>
      )}
      <div style={{ fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: colors.gold, marginBottom: 24 }}>{p.tier}</div>
      <div style={{ fontFamily: styles.fontDisplay, fontSize: "3.5rem", fontWeight: 300, color: colors.parchment, lineHeight: 1, marginBottom: 4 }}>{p.price}</div>
      <div style={{ fontFamily: styles.fontMono, fontSize: "0.58rem", color: colors.muted, letterSpacing: "0.12em", marginBottom: 36 }}>{p.period}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px", display: "flex", flexDirection: "column", gap: 14 }}>
        {p.features.map((f, j) => (
          <li key={j} style={{ display: "flex", gap: 10, fontSize: "0.82rem", color: colors.muted, lineHeight: 1.5 }}>
            <span style={{ color: colors.gold, fontFamily: styles.fontMono, fontSize: "0.68rem", flexShrink: 0 }}>—</span>
            {f}
          </li>
        ))}
      </ul>
      <a href="#" style={{
        display: "block", textAlign: "center", padding: "14px 24px",
        fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
        textDecoration: "none",
        border: `1px solid ${colors.gold}`,
        color: p.featured || hovered ? colors.ink : colors.gold,
        background: p.featured || hovered ? colors.gold : "transparent",
        transition: "all 0.3s ease",
      }}>
        {p.tier === "Free" ? "Get started free" : `Start ${p.tier} trial`}
      </a>
    </div>
  );
}

function Pricing() {
  const [ref, inView] = useInView(0.1);
  return (
    <section style={{ padding: "120px 60px", borderTop: `1px solid ${colors.border}` }}>
      <div ref={ref}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: colors.gold, marginBottom: 18 }}>
          <span style={{ width: 24, height: 1, background: colors.gold, display: "inline-block" }} />
          Simple pricing
        </div>
        <h2 style={{
          fontFamily: styles.fontDisplay, fontSize: "clamp(2.4rem,3.5vw,3.8rem)", fontWeight: 300, lineHeight: 1.08,
          color: colors.parchment, maxWidth: 420, marginBottom: 80,
          opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}>
          Free to start, <em style={{ fontStyle: "italic", color: colors.goldLight }}>powerful to grow</em>
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: `1px solid ${colors.border}` }}>
        {plans.map((p, i) => <PricingCard key={i} p={p} i={i} />)}
      </div>
    </section>
  );
}

// ── CTA BUTTON ───────────────────────────────────────────────────────────────
function CTAButton({ children, large }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href="#"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: colors.gold, color: colors.ink,
        padding: large ? "18px 44px" : "15px 34px",
        fontFamily: styles.fontMono, fontSize: large ? "0.75rem" : "0.68rem", fontWeight: 400,
        letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none",
        boxShadow: hovered ? `0 0 40px rgba(201,168,76,0.35)` : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.3s ease",
      }}
    >
      {children}
      <span style={{ transform: hovered ? "translateX(4px)" : "translateX(0)", transition: "transform 0.3s ease", display: "inline-block" }}>→</span>
    </a>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <section style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", padding: "0 60px", paddingTop: 120, position: "relative", overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 700, height: 700, background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)", pointerEvents: "none", animation: "pulse 9s ease-in-out infinite" }} />
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.12);opacity:0.7}} @keyframes floatBadge{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}`}</style>

      <div style={{ maxWidth: 540, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: colors.gold, marginBottom: 28 }}>
          <span style={{ width: 32, height: 1, background: colors.gold, display: "inline-block" }} />
          For Indian Investors
        </div>
        <h1 style={{ fontFamily: styles.fontDisplay, fontSize: "clamp(3rem,5.5vw,5.2rem)", fontWeight: 300, lineHeight: 1.06, letterSpacing: "-0.01em", marginBottom: 24, color: colors.parchment }}>
          All your money,<br />
          <em style={{ fontStyle: "italic", color: colors.goldLight }}>one</em> dashboard.
        </h1>
        <p style={{ fontSize: "1rem", lineHeight: 1.78, color: colors.muted, maxWidth: 430, marginBottom: 48 }}>
          Stocks, mutual funds, FDs, and cash—
          <span style={{ color: colors.parchment }}> tracked together</span> for the first time.
          AI-powered insights that help you invest smarter.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 32, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.9s 0.2s ease, transform 0.9s 0.2s ease" }}>
          <CTAButton>Start tracking in 60s</CTAButton>
          <a href="#" style={{ fontFamily: styles.fontMono, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: colors.muted, textDecoration: "none", display: "flex", alignItems: "center", gap: 7, transition: "color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.color = colors.parchment}
            onMouseLeave={e => e.currentTarget.style.color = colors.muted}
          >
            ▷ Watch demo
          </a>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", position: "relative", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(30px)", transition: "opacity 1s 0.3s ease, transform 1s 0.3s ease" }}>
        {/* Floating badges */}
        <div style={{ position: "absolute", top: -10, left: -20, display: "flex", alignItems: "center", gap: 8, background: "rgba(16,14,10,0.96)", border: `1px solid ${colors.border}`, padding: "10px 16px", fontFamily: styles.fontMono, fontSize: "0.58rem", letterSpacing: "0.1em", color: colors.parchment, animation: "floatBadge 4s ease-in-out infinite", zIndex: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.green, display: "inline-block" }} />
          Live prices synced
        </div>
        <div style={{ position: "absolute", bottom: 80, right: -30, display: "flex", alignItems: "center", gap: 8, background: "rgba(16,14,10,0.96)", border: `1px solid ${colors.border}`, padding: "10px 16px", fontFamily: styles.fontMono, fontSize: "0.58rem", letterSpacing: "0.1em", color: colors.parchment, animation: "floatBadge 4s 1.5s ease-in-out infinite", zIndex: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.gold, display: "inline-block" }} />
          AI insight ready
        </div>
        <DashboardCard />
      </div>
    </section>
  );
}

// ── CTA SECTION ──────────────────────────────────────────────────────────────
function CTASection() {
  const [ref, inView] = useInView(0.2);
  return (
    <section ref={ref} style={{ padding: "160px 60px", textAlign: "center", borderTop: `1px solid ${colors.border}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(201,168,76,0.055) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: styles.fontMono, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: colors.gold, marginBottom: 18 }}>
        <span style={{ width: 24, height: 1, background: colors.gold, display: "inline-block" }} />
        Start today
      </div>
      <h2 style={{
        fontFamily: styles.fontDisplay, fontSize: "clamp(2.8rem,5vw,5rem)", fontWeight: 300, lineHeight: 1.06,
        color: colors.parchment, maxWidth: 560, margin: "0 auto 28px",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        Your complete<br />financial picture<br /><em style={{ fontStyle: "italic", color: colors.goldLight }}>awaits</em>
      </h2>
      <p style={{ fontSize: "0.9rem", color: colors.muted, maxWidth: 380, margin: "0 auto 48px", lineHeight: 1.8 }}>
        Join 50,000+ investors who track everything in one place. No spreadsheets. No juggling apps. Just clarity.
      </p>
      <CTAButton large>Start tracking in 60 seconds</CTAButton>
    </section>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${colors.border}`, padding: "60px 60px 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 60, marginBottom: 48 }}>
        <div>
          <a href="#" style={{ fontFamily: styles.fontDisplay, fontSize: "1.4rem", fontWeight: 400, letterSpacing: "0.12em", color: colors.parchment, textDecoration: "none", display: "block", marginBottom: 16 }}>
            Porta<span style={{ color: colors.gold }}>Fi</span>
          </a>
          <p style={{ fontSize: "0.8rem", color: colors.muted, lineHeight: 1.75, maxWidth: 220 }}>The complete financial dashboard for Indian investors. Free, secure, intelligent.</p>
        </div>
      </div>
    </footer>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function PortaFi() {
  return (
    <div style={{ background: colors.ink, color: colors.parchment, fontFamily: styles.fontBody, fontWeight: 300, overflowX: "hidden", minHeight: "100vh" }}>
      <FontLoader />

      {/* Grain overlay */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      <Nav />
      <Hero />
      <Ticker />
      <StatsBar />
      <Features />
      <TrackerSection />
      <AISection />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
}