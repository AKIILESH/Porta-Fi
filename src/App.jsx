// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient.js";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import PortaFi from "./components/Landing/index.jsx";
import Signup from "./components/Auth/Signup.jsx";
import Sidebar from "./components/shared/Sidebar.jsx";
import TickerBar from "./components/shared/TickerBar.jsx";
import Dashboard from "./components/Dashboard/index.jsx";
import Portfolio from "./components/Portfolio/index.jsx";
import Budget from "./components/Budget/index.jsx";
import Goals from "./components/Goals/index.jsx";
import Cash from "./components/Cash/Cash.jsx";
import Debt from "./components/Debt/index.jsx";
import Markets from "./components/Markets/index.jsx";
import AIAgent from "./components/AIAgent/index.jsx";
import TaxCost from "./components/TaxCost/TaxCost.jsx";
import Login from "./components/Auth/Login.jsx";
import ProtectedRoute from "./components/Auth/ProtectedRoute.jsx";
import AdminRoute from "./components/Admin/AdminRoute.jsx";
import AdminPage from "./components/Admin/AdminPage.jsx";
import theme from "./lib/theme.js";
import AnimatedBackground from './components/shared/AnimatedBackground.jsx';
import { useMediaQuery } from 'react-responsive';
import { Menu, X } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext.jsx'


import { supabase } from "./lib/supabase.js";

// ── Inject global styles & fonts ───────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// Add viewport meta tag for mobile
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes';
document.head.appendChild(meta);

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${theme.bg}; color:${theme.text}; overflow-x: hidden; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${theme.bg2}; }
  ::-webkit-scrollbar-thumb { background:${theme.border}; border-radius:2px; }
  
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  
  /* Mobile optimizations */
  @media (max-width: 768px) {
    ::-webkit-scrollbar {
      width: 2px;
      height: 2px;
    }
    input, select, textarea, button {
      font-size: 16px !important; /* Prevents zoom on iOS */
    }
  }
`;
document.head.appendChild(globalStyle);

// ── Mobile Menu Component ────────────────────────────────────────────────────
function MobileMenu({ tab, setTab, onSignOut, isOpen, setIsOpen }) {
  // Close menu when clicking a nav item
  const handleNavClick = (newTab) => {
    setTab(newTab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 998,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          background: theme.bg2,
          borderRight: `1px solid ${theme.border}`,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999,
          overflowY: 'auto',
          boxShadow: `4px 0 30px rgba(0,0,0,0.5), inset -1px 0 0 ${theme.border}`,
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: theme.bg3,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: theme.muted,
            zIndex: 1000,
          }}
        >
          <X size={18} />
        </button>

        <Sidebar 
          tab={tab} 
          setTab={handleNavClick} 
          onSignOut={() => {
            onSignOut();
            setIsOpen(false);
          }} 
          mobile 
        />
      </div>
    </>
  );
}

// ── Page renderer ──────────────────────────────────────────────────────────────
function Page({ tab }) {
  switch (tab) {
    case "dashboard":
      return <Dashboard />;
    case "portfolio":
      return <Portfolio />;
      case "taxcost":
      return <TaxCost />;
    case "budget":
      return <Budget />;
    case "goals":
      return <Goals />;
    case "debt":
      return <Debt />;
    case "markets":
      return <Markets />;
    case "ai":
      return <AIAgent />;
    case "cash":
      return <Cash />;
    default:
      return <Dashboard />;
  }
}

// ── Dashboard App ────────────────────────────────────────────────────────────
function DashboardApp({ userId }) {
  const [tab, setTab] = useState(() => {
    // Get initial tab from URL path
    const path = window.location.pathname.slice(1);
    return path || "dashboard";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });

  // Update tab when URL changes
  useEffect(() => {
    const path = window.location.pathname.slice(1);
    if (path && path !== tab) {
      setTab(path);
    }
  }, [window.location.pathname]);

  if (!userId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: theme.bg,
          color: theme.text,
        }}
      >
        <div style={{ animation: "spin 1s linear infinite" }}>⚡</div>
      </div>
    );
  }

  return (
    <FinanceProvider userId={userId}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: theme.bg,
          fontFamily: theme.mono,
          overflow: "hidden",
        }}
      >
        <AnimatedBackground />
        
        {/* Mobile Header */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: theme.bg2,
              borderBottom: `1px solid ${theme.border}`,
              position: 'sticky',
              top: 0,
              zIndex: 100,
              backdropFilter: 'blur(10px)',
            }}
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text,
                cursor: 'pointer',
                padding: 8,
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.bg3}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Menu size={24} />
            </button>
            
            <div style={{ 
              fontFamily: theme.syne, 
              fontSize: 20, 
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              <span style={{ color: theme.accent }}>Porta</span>
              <span style={{ color: theme.text }}>Fi</span>
            </div>
            
            <div style={{ width: 40 }} /> {/* Spacer for alignment */}
          </div>
        )}

        {/* Mobile Menu */}
        {isMobile && (
          <MobileMenu
            tab={tab}
            setTab={setTab}
            onSignOut={() => supabase.auth.signOut()}
            isOpen={mobileMenuOpen}
            setIsOpen={setMobileMenuOpen}
          />
        )}

        <TickerBar />
        
        <div style={{ 
          display: "flex", 
          flex: 1, 
          overflow: "hidden",
          position: 'relative',
        }}>
          {/* Desktop Sidebar - Hidden on mobile */}
          {!isMobile && (
            <Sidebar
              tab={tab}
              setTab={setTab}
              onSignOut={() => supabase.auth.signOut()}
            />
          )}
          
          {/* Main Content */}
          <main style={{ 
            flex: 1, 
            overflow: "auto", 
            padding: isMobile ? '16px' : isTablet ? '20px 24px' : '24px 28px',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            scrollbarWidth: 'thin',
          }}>
            <Page tab={tab} />
          </main>
        </div>
      </div>
    </FinanceProvider>
  );
}

// ── Root App with Routing ────────────────────────────────────────────────────
export default function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        setUserId(session?.user?.id || null);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: theme.bg,
          color: theme.text,
        }}
      >
        <div style={{ animation: "spin 1s linear infinite" }}>⚡</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortaFi />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes all use DashboardApp */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/taxcost"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debt"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/markets"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cash"
            element={
              <ProtectedRoute>
                <DashboardApp userId={userId} />
              </ProtectedRoute>
            }
          />
          
          {/* Admin route */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          
          {/* Catch all - redirect to dashboard if logged in, otherwise home */}
          <Route
            path="*"
            element={
              userId ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
            }
          />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}