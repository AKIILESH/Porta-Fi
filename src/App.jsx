// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from "./lib/queryClient.js"; // Import the query client
import { FinanceProvider } from "./context/FinanceContext.jsx";
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
import Login from "./components/Auth/Login.jsx";
import ProtectedRoute from "./components/Auth/ProtectedRoute.jsx";
import AdminRoute from "./components/Admin/AdminRoute.jsx";
import AdminPage from "./components/Admin/AdminPage.jsx";
import theme from "./lib/theme.js";
import { supabase } from "./lib/supabase.js";

// ── Inject global styles & fonts ───────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${theme.bg}; color:${theme.text}; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:${theme.bg2}; }
  ::-webkit-scrollbar-thumb { background:${theme.border}; border-radius:2px; }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
`;
document.head.appendChild(globalStyle);

// ── Page renderer ──────────────────────────────────────────────────────────────
function Page({ tab }) {
  switch (tab) {
    case "dashboard":
      return <Dashboard />;
    case "portfolio":
      return <Portfolio />;
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
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  if (!userId) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: theme.bg,
        color: theme.text 
      }}>
        <div style={{ animation: 'spin 1s linear infinite' }}>⚡</div>
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
        <TickerBar />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar tab={tab} setTab={setTab} onSignOut={() => supabase.auth.signOut()} />
          <main style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
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

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUserId(session?.user?.id || null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: theme.bg,
        color: theme.text 
      }}>
        <div style={{ animation: 'spin 1s linear infinite' }}>⚡</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

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
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}