// src/components/Admin/AdminPage.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { Card, Btn, Input, Select, Spinner } from "../shared/ui.jsx";
import { inr, pct } from "../../lib/formatters.js";
import theme from "../../lib/theme.js";
import {
  Database,
  RefreshCw,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  Activity,
  BarChart3,
  Shield,
  TrendingUp,
} from "lucide-react";
import InstrumentsManager from "./InstrumentsManager.jsx";

// Helper to calculate returns from historical data
function calculateReturns(prices) {
  if (!prices || prices.length < 2) return null;
  
  const dailyReturns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] && prices[i]) {
      dailyReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
  }
  
  const totalReturn = prices.length > 1 
    ? (prices[prices.length-1] - prices[0]) / prices[0]
    : 0;
  
  // Calculate annualized return (252 trading days)
  const annualizedReturn = dailyReturns.length > 0
    ? (1 + dailyReturns.reduce((a, b) => a * (1 + b), 1)) ** (252 / dailyReturns.length) - 1
    : 0;
  
  return {
    daily: dailyReturns,
    total: totalReturn,
    annualized: annualizedReturn,
    startPrice: prices[0],
    endPrice: prices[prices.length-1],
    dataPoints: prices.length,
    volatility: calculateVolatility(dailyReturns),
    sharpeRatio: calculateSharpeRatio(dailyReturns, annualizedReturn)
  };
}

function calculateVolatility(returns) {
  if (!returns || returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance * 252); // Annualized volatility
}

function calculateSharpeRatio(returns, annualizedReturn, riskFreeRate = 0.06) {
  if (!returns || returns.length === 0) return 0;
  const volatility = calculateVolatility(returns);
  return volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [priceCache, setPriceCache] = useState([]);
  const [filteredCache, setFilteredCache] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExchange, setFilterExchange] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingTickers, setRefreshingTickers] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    totalTickers: 0,
    uniqueTickers: 0,
    todayUpdates: 0,
    oldestCache: null,
    newestCache: null,
    avgReturns: 0,
    bestPerformer: null,
  });
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("cache"); // "cache" or "instruments"

  // Load all price cache data (no user filter)
  const loadPriceCache = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("price_cache")
        .select("*")
        .order("fetched_at", { ascending: false })
        .limit(1000);

      if (error) throw error;

      setPriceCache(data || []);

      // Calculate stats
      const uniqueTickers = new Set(data?.map((d) => d.ticker)).size;
      const today = new Date().toISOString().split("T")[0];
      const todayUpdates =
        data?.filter((d) => d.fetch_date === today).length || 0;
      const timestamps =
        data?.map((d) => new Date(d.fetched_at).getTime()) || [];

      // Calculate average returns
      const returns = data?.filter(d => d.returns_1y?.annualized).map(d => d.returns_1y.annualized) || [];
      const avgReturns = returns.length > 0 
        ? returns.reduce((a, b) => a + b, 0) / returns.length * 100
        : 0;

      // Find best performer
      const bestPerformer = data?.filter(d => d.returns_1y?.annualized)
        .sort((a, b) => (b.returns_1y?.annualized || 0) - (a.returns_1y?.annualized || 0))[0];

      setStats({
        totalTickers: data?.length || 0,
        uniqueTickers,
        todayUpdates,
        oldestCache: timestamps.length
          ? new Date(Math.min(...timestamps))
          : null,
        newestCache: timestamps.length
          ? new Date(Math.max(...timestamps))
          : null,
        avgReturns: avgReturns.toFixed(2),
        bestPerformer: bestPerformer ? `${bestPerformer.ticker} (${pct(bestPerformer.returns_1y?.annualized * 100)}%)` : 'N/A',
      });
    } catch (error) {
      console.error("Error loading price cache:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...priceCache];

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.short_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterExchange !== "all") {
      filtered = filtered.filter((d) => d.exchange === filterExchange);
    }

    setFilteredCache(filtered);
  }, [priceCache, searchTerm, filterExchange]);

  // Fetch USD/INR rate
  const fetchUSDINR = async () => {
    try {
      // Try to get from cache first
      const { data: cached } = await supabase
        .from("price_cache")
        .select("*")
        .eq("ticker", "USDINR")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.fetched_at).getTime();
        if (cacheAge < 60 * 60 * 1000) {
          return cached.price;
        }
      }

      const response = await fetch(
        "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ticker: "INR=X" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch USD/INR rate");
      }

      const data = await response.json();
      const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

      if (!rate) {
        throw new Error("Invalid rate data");
      }

      await supabase.from("price_cache").upsert(
        {
          ticker: "USDINR",
          exchange: "FOREX",
          price: rate,
          short_name: "USD/INR",
          fetched_at: new Date().toISOString(),
          fetch_date: new Date().toISOString().split("T")[0],
          session: "forex",
        },
        {
          onConflict: "ticker, fetch_date, session",
          ignoreDuplicates: false,
        }
      );

      return rate;
    } catch (error) {
      console.error("Error fetching USD/INR rate:", error);
      return 91.57;
    }
  };

  // Fetch 1-year historical data for a ticker
  const fetchHistoricalData = async (ticker) => {
    try {
      const response = await fetch(
        "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ticker, period: "1y" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }

      const data = await response.json();
      
      // Extract the closing prices from the response
      const result = data?.chart?.result?.[0];
      const timestamps = result?.timestamp;
      const quotes = result?.indicators?.quote?.[0];
      
      if (!timestamps || !quotes?.close) {
        console.error('Invalid historical data format:', data);
        return null;
      }
      
      // Filter out null values and map to prices
      const prices = quotes.close.filter(price => price !== null);
      
      if (prices.length < 2) {
        console.log(`Not enough price data for ${ticker}: ${prices.length} points`);
        return null;
      }
      
      console.log(`Fetched ${prices.length} price points for ${ticker}`);
      return calculateReturns(prices);
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      return null;
    }
  };

  // Manual refresh for a single ticker
  const refreshTicker = async (ticker, exchange) => {
    setRefreshingTickers((prev) => ({ ...prev, [ticker]: true }));
    setMessage({ type: "", text: "" });

    try {
      const yahooTicker = ticker;
      console.log(`Fetching: ${yahooTicker}`);

      // Fetch current price
      const response = await fetch(
        "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ticker: yahooTicker }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch");
      }

      const data = await response.json();

      if (!data?.chart?.result?.[0]?.meta) {
        throw new Error("Invalid data format from Yahoo");
      }

      const meta = data.chart.result[0].meta;
      console.log("Got data:", meta);

      // Fetch historical data for returns
      const returns = await fetchHistoricalData(yahooTicker);

      const prevClose =
        meta.chartPreviousClose ||
        meta.previousClose ||
        meta.regularMarketPrice;

      let currentPrice = meta.regularMarketPrice;
      let displayPrevClose = prevClose;
      let displayChange = currentPrice - prevClose;
      let displayChangePct =
        prevClose !== 0 ? (displayChange / prevClose) * 100 : 0;

      // Convert to INR if it's a US stock
      if (exchange === "NYSE" || exchange === "NASDAQ" || exchange === "PCX") {
        const usdInrRate = await fetchUSDINR();
        currentPrice = currentPrice * usdInrRate;
        displayPrevClose = prevClose * usdInrRate;
        displayChange = currentPrice - displayPrevClose;
        displayChangePct =
          displayPrevClose !== 0 ? (displayChange / displayPrevClose) * 100 : 0;
      }

      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("price_cache")
        .select("id")
        .eq("ticker", ticker)
        .eq("fetch_date", today)
        .eq("session", "admin_manual")
        .maybeSingle();

      let error;

      if (existing) {
        const { error: updateError } = await supabase
          .from("price_cache")
          .update({
            price: currentPrice,
            prev_close: displayPrevClose,
            change_amt: displayChange,
            change_pct: displayChangePct,
            short_name: meta.shortName || meta.longName || ticker,
            returns_1y: returns,
            fetched_at: new Date().toISOString(),
            exchange: exchange,
          })
          .eq("id", existing.id);

        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("price_cache")
          .insert({
            ticker: ticker,
            exchange: exchange,
            price: currentPrice,
            prev_close: displayPrevClose,
            change_amt: displayChange,
            change_pct: displayChangePct,
            short_name: meta.shortName || meta.longName || ticker,
            returns_1y: returns,
            fetched_at: new Date().toISOString(),
            fetch_date: today,
            session: "admin_manual",
          });

        error = insertError;
      }

      if (error) throw error;

      setMessage({
        type: "success",
        text: `✅ ${ticker} updated: ${inr(currentPrice)} (${pct(displayChangePct)})${
          returns ? ` · 1Y Return: ${pct(returns.annualized * 100)}` : ''
        }`,
      });

      await loadPriceCache();
    } catch (error) {
      console.error(`Error refreshing ${ticker}:`, error);
      setMessage({
        type: "error",
        text: `❌ Failed to update ${ticker}: ${error.message}`,
      });
    } finally {
      setRefreshingTickers((prev) => ({ ...prev, [ticker]: false }));
    }
  };

  // Refresh all tickers in the filtered list
  const refreshAllTickers = async () => {
    if (filteredCache.length === 0) {
      setMessage({ type: "error", text: "No tickers to update" });
      return;
    }

    if (
      !confirm(
        `Update all ${filteredCache.length} tickers from Yahoo? This may take a few minutes.`,
      )
    )
      return;

    setRefreshing(true);
    setMessage({ type: "", text: "" });

    const usdInrRate = await fetchUSDINR();

    const tickersToUpdate = filteredCache.map((item) => ({
      ticker: item.ticker,
      exchange: item.exchange,
    }));
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const { ticker, exchange } of tickersToUpdate) {
      setRefreshingTickers((prev) => ({ ...prev, [ticker]: true }));

      try {
        console.log(`Fetching: ${ticker}`);

        // Fetch current price
        const response = await fetch(
          "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ ticker }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch");
        }

        const data = await response.json();

        if (!data?.chart?.result?.[0]?.meta) {
          throw new Error("Invalid data format from Yahoo");
        }

        const meta = data.chart.result[0].meta;
        
        // Fetch historical data
        const returns = await fetchHistoricalData(ticker);

        const prevClose =
          meta.chartPreviousClose ||
          meta.previousClose ||
          meta.regularMarketPrice;
        let currentPrice = meta.regularMarketPrice;
        let displayPrevClose = prevClose;

        if (
          exchange === "NYSE" ||
          exchange === "NASDAQ" ||
          exchange === "PCX"
        ) {
          currentPrice = currentPrice * usdInrRate;
          displayPrevClose = prevClose * usdInrRate;
        }

        const change = currentPrice - displayPrevClose;
        const changePct =
          displayPrevClose !== 0 ? (change / displayPrevClose) * 100 : 0;

        const today = new Date().toISOString().split("T")[0];

        const { data: existing } = await supabase
          .from("price_cache")
          .select("id")
          .eq("ticker", ticker)
          .eq("fetch_date", today)
          .eq("session", "admin_manual")
          .maybeSingle();

        let error;

        if (existing) {
          const { error: updateError } = await supabase
            .from("price_cache")
            .update({
              price: currentPrice,
              prev_close: displayPrevClose,
              change_amt: change,
              change_pct: changePct,
              short_name: meta.shortName || meta.longName || ticker,
              returns_1y: returns,
              fetched_at: new Date().toISOString(),
              exchange: exchange,
            })
            .eq("id", existing.id);

          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from("price_cache")
            .insert({
              ticker: ticker,
              exchange: exchange,
              price: currentPrice,
              prev_close: displayPrevClose,
              change_amt: change,
              change_pct: changePct,
              short_name: meta.shortName || meta.longName || ticker,
              returns_1y: returns,
              fetched_at: new Date().toISOString(),
              fetch_date: today,
              session: "admin_manual",
            });

          error = insertError;
        }

        if (error) throw error;

        successCount++;
        results.push(`✅ ${ticker}: ${inr(currentPrice)} (${pct(changePct)}) - 1Y: ${returns ? pct(returns.annualized * 100) : 'N/A'}`);
      } catch (error) {
        console.error(`Error refreshing ${ticker}:`, error);
        failCount++;
        results.push(`❌ ${ticker}: ${error.message}`);
      } finally {
        setRefreshingTickers((prev) => ({ ...prev, [ticker]: false }));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await loadPriceCache();

    setMessage({
      type: successCount > 0 ? "success" : "error",
      text: `✅ ${successCount} successful, ❌ ${failCount} failed`,
    });

    console.log("Update results:", results);
    setRefreshing(false);
  };

  // Clear old cache entries
  const clearOldCache = async (days = 7) => {
    if (!confirm(`Delete cache entries older than ${days} days?`)) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { error } = await supabase
      .from("price_cache")
      .delete()
      .lt("fetched_at", cutoffDate.toISOString());

    if (error) {
      alert("Error clearing cache: " + error.message);
    } else {
      alert(`Cleared cache entries older than ${days} days`);
      loadPriceCache();
    }
  };

  // Export cache as CSV with returns data
  const exportCache = () => {
    const csv = [
      [
        "Ticker",
        "Exchange",
        "Price",
        "Change %",
        "Short Name",
        "1Y Return %",
        "Annualized Return %",
        "Volatility %",
        "Sharpe Ratio",
        "Fetched At",
        "Fetch Date",
        "Session",
      ].join(","),
      ...filteredCache.map((d) =>
        [
          d.ticker,
          d.exchange || "N/A",
          d.price,
          d.change_pct?.toFixed(2) || "",
          d.short_name || "",
          d.returns_1y?.total ? (d.returns_1y.total * 100).toFixed(2) : "",
          d.returns_1y?.annualized ? (d.returns_1y.annualized * 100).toFixed(2) : "",
          d.returns_1y?.volatility ? (d.returns_1y.volatility * 100).toFixed(2) : "",
          d.returns_1y?.sharpeRatio?.toFixed(2) || "",
          d.fetched_at,
          d.fetch_date,
          d.session || "auto",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `price_cache_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  useEffect(() => {
    loadPriceCache();
  }, []);

  const deleteCacheEntry = async (id) => {
    if (!id) {
      setMessage({ type: "error", text: "❌ Invalid entry ID" });
      return;
    }

    if (!confirm("Are you sure you want to delete this cache entry?")) return;

    setDeletingId(id);

    try {
      console.log("Attempting to delete entry with ID:", id);

      const { error, data } = await supabase
        .from("price_cache")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }

      console.log("Delete response:", data);

      setMessage({
        type: "success",
        text: "✅ Cache entry deleted successfully",
      });

      setPriceCache((prev) => prev.filter((item) => item.id !== id));
      setFilteredCache((prev) => prev.filter((item) => item.id !== id));
      await loadPriceCache();
    } catch (error) {
      console.error("Error deleting cache entry:", error);
      setMessage({
        type: "error",
        text: `❌ Failed to delete: ${error.message}`,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const exchanges = [
    "all",
    ...new Set(priceCache.map((d) => d.exchange).filter(Boolean)),
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: `1px solid ${theme.border}` }}>
        <button
          onClick={() => setActiveTab("cache")}
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "cache" ? `2px solid ${theme.accent}` : "none",
            color: activeTab === "cache" ? theme.accent : theme.muted,
            fontFamily: theme.mono,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Price Cache
        </button>
        <button
          onClick={() => setActiveTab("instruments")}
          style={{
            padding: "8px 16px",
            background: "transparent",
            border: "none",
            borderBottom: activeTab === "instruments" ? `2px solid ${theme.accent}` : "none",
            color: activeTab === "instruments" ? theme.accent : theme.muted,
            fontFamily: theme.mono,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Instruments Manager
        </button>
      </div>

      {activeTab === "cache" ? (
        <div style={{ padding: "20px 0" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: theme.syne,
                  fontSize: 28,
                  fontWeight: 800,
                  color: theme.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <Shield size={28} color={theme.accent} />
                Admin Dashboard
              </h1>
              <p
                style={{ fontFamily: theme.mono, fontSize: 12, color: theme.muted }}
              >
                System-wide price cache management and monitoring
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                onClick={refreshAllTickers}
                color={theme.accent}
                disabled={refreshing || loading || filteredCache.length === 0}
              >
                {refreshing ? (
                  <Spinner size={14} />
                ) : (
                  <RefreshCw size={14} style={{ marginRight: 8 }} />
                )}
                {refreshing
                  ? "Updating..."
                  : `Update All (${filteredCache.length})`}
              </Btn>
              <Btn onClick={loadPriceCache} color={theme.accent} disabled={loading}>
                <RefreshCw size={14} style={{ marginRight: 8 }} />
                Refresh View
              </Btn>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              style={{
                padding: "12px 16px",
                background:
                  message.type === "success"
                    ? theme.green + "20"
                    : theme.red + "20",
                border: `1px solid ${message.type === "success" ? theme.green : theme.red}`,
                borderRadius: 8,
                marginBottom: 16,
                color: message.type === "success" ? theme.green : theme.red,
                fontFamily: theme.mono,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {message.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Card style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <Database size={20} color={theme.accent} />
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: 11,
                    color: theme.muted,
                  }}
                >
                  TOTAL ENTRIES
                </span>
              </div>
              <div
                style={{ fontFamily: theme.syne, fontSize: 32, fontWeight: 700 }}
              >
                {stats.totalTickers}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                {stats.uniqueTickers} unique tickers
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <Activity size={20} color={theme.green} />
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: 11,
                    color: theme.muted,
                  }}
                >
                  TODAY'S UPDATES
                </span>
              </div>
              <div
                style={{ fontFamily: theme.syne, fontSize: 32, fontWeight: 700 }}
              >
                {stats.todayUpdates}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                {((stats.todayUpdates / stats.totalTickers) * 100 || 0).toFixed(1)}%
                of cache
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <TrendingUp size={20} color={theme.blue} />
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: 11,
                    color: theme.muted,
                  }}
                >
                  AVG 1Y RETURN
                </span>
              </div>
              <div
                style={{ fontFamily: theme.syne, fontSize: 32, fontWeight: 700 }}
              >
                {stats.avgReturns}%
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                Best: {stats.bestPerformer}
              </div>
            </Card>

            <Card style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <Clock size={20} color={theme.yellow} />
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: 11,
                    color: theme.muted,
                  }}
                >
                  NEWEST CACHE
                </span>
              </div>
              <div
                style={{ fontFamily: theme.syne, fontSize: 18, fontWeight: 600 }}
              >
                {stats.newestCache?.toLocaleTimeString() || "N/A"}
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                {stats.newestCache?.toLocaleDateString()}
              </div>
            </Card>
          </div>

          {/* Admin Actions */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Card>
              <div
                style={{
                  fontFamily: theme.syne,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Cache Management
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn sm ghost onClick={() => clearOldCache(30)}>
                  <Trash2 size={12} style={{ marginRight: 4 }} />
                  Clear 30 days
                </Btn>
                <Btn sm ghost onClick={() => clearOldCache(7)}>
                  <Trash2 size={12} style={{ marginRight: 4 }} />
                  Clear 7 days
                </Btn>
                <Btn sm ghost onClick={exportCache}>
                  <Download size={12} style={{ marginRight: 4 }} />
                  Export CSV
                </Btn>
              </div>
            </Card>

            <Card>
              <div
                style={{
                  fontFamily: theme.syne,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Quick Actions
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn
                  sm
                  ghost
                  color={theme.accent}
                  onClick={() => window.open("https://app.supabase.com", "_blank")}
                >
                  <Database size={12} style={{ marginRight: 4 }} />
                  Supabase Dashboard
                </Btn>
                <Btn
                  sm
                  ghost
                  color={theme.accent}
                  onClick={() => window.open("https://finance.yahoo.com", "_blank")}
                >
                  <BarChart3 size={12} style={{ marginRight: 4 }} />
                  Yahoo Finance
                </Btn>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 250 }}>
                <Input
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by ticker or name..."
                >
                  <Search size={14} />
                </Input>
              </div>
              <div style={{ width: 150 }}>
                <Select value={filterExchange} onChange={setFilterExchange}>
                  {exchanges.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex === "all" ? "All Exchanges" : ex}
                    </option>
                  ))}
                </Select>
              </div>
              <div style={{ color: theme.muted, fontSize: 12 }}>
                <Filter size={12} style={{ display: "inline", marginRight: 4 }} />
                {filteredCache.length} results
              </div>
            </div>
          </Card>

          {/* Price Cache Table */}
          <Card style={{ overflow: "auto" }}>
            <div style={{ minWidth: 1200 }}>
              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1.2fr 1.2fr 1.5fr 1.2fr 1.2fr 2fr 1fr 100px",
                  gap: 8,
                  padding: "12px 0",
                  borderBottom: `2px solid ${theme.border}`,
                  fontWeight: 600,
                  fontSize: 11,
                  color: theme.muted,
                  fontFamily: theme.mono,
                  textTransform: "uppercase",
                }}
              >
                <div>Ticker</div>
                <div>Exchange</div>
                <div>Price</div>
                <div>Change %</div>
                <div>Short Name</div>
                <div>1Y Return %</div>
                <div>Volatility %</div>
                <div>Fetched At</div>
                <div>Session</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {loading ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <Spinner />
                </div>
              ) : (
                filteredCache.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1.2fr 1.2fr 1.5fr 1.2fr 1.2fr 2fr 1fr 100px",
                      gap: 8,
                      padding: "10px 0",
                      borderBottom: `1px solid ${theme.border}`,
                      alignItems: "center",
                      fontSize: 12,
                      fontFamily: theme.mono,
                      background: i % 2 === 0 ? "transparent" : theme.bg2,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.ticker}</div>
                    <div>{item.exchange || "—"}</div>
                    <div style={{ color: theme.text }}>{inr(item.price)}</div>
                    <div
                      style={{
                        color: item.change_pct >= 0 ? theme.green : theme.red,
                        fontWeight: 500,
                      }}
                    >
                      {item.change_pct ? pct(item.change_pct) : "—"}
                    </div>
                    <div style={{ color: theme.muted }}>
                      {item.short_name || "—"}
                    </div>
                    <div
                      style={{
                        color: item.returns_1y?.annualized >= 0 ? theme.green : theme.red,
                      }}
                    >
                      {item.returns_1y?.annualized ? pct(item.returns_1y.annualized * 100) : "—"}
                    </div>
                    <div>
                      {item.returns_1y?.volatility ? (item.returns_1y.volatility * 100).toFixed(1) + '%' : "—"}
                    </div>
                    <div style={{ fontSize: 11 }}>
                      {new Date(item.fetched_at).toLocaleString()}
                    </div>
                    <div>
                      <span
                        style={{
                          background:
                            item.session === "admin_manual"
                              ? theme.accent + "20"
                              : theme.bg,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                        }}
                      >
                        {item.session || "auto"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => refreshTicker(item.ticker, item.exchange)}
                        disabled={refreshingTickers[item.ticker]}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: refreshingTickers[item.ticker]
                            ? theme.muted
                            : theme.accent,
                          cursor: refreshingTickers[item.ticker]
                            ? "wait"
                            : "pointer",
                          opacity: refreshingTickers[item.ticker] ? 0.5 : 1,
                          padding: 4,
                        }}
                        title="Refresh from Yahoo"
                      >
                        {refreshingTickers[item.ticker] ? (
                          <Spinner size={14} />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                      </button>

                      <button
                        onClick={() => deleteCacheEntry(item.id)}
                        disabled={deletingId === item.id}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.red,
                          cursor: deletingId === item.id ? "wait" : "pointer",
                          padding: 4,
                          opacity: deletingId === item.id ? 0.5 : 0.7,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          !deletingId && (e.currentTarget.style.opacity = 1)
                        }
                        onMouseLeave={(e) =>
                          !deletingId && (e.currentTarget.style.opacity = 0.7)
                        }
                        title="Delete this entry"
                      >
                        {deletingId === item.id ? (
                          <Spinner size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      ) : (
        <InstrumentsManager />
      )}
    </>
  );
}