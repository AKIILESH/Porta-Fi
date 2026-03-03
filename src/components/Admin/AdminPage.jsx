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
  Users,
  Activity,
  BarChart3,
  Shield,
} from "lucide-react";

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
  });
  const [deletingId, setDeletingId] = useState(null);

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

  // Add this function to fetch USD/INR rate
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

      // If cache is less than 1 hour old, use it
      if (cached) {
        const cacheAge = Date.now() - new Date(cached.fetched_at).getTime();
        if (cacheAge < 60 * 60 * 1000) {
          // 1 hour
          return cached.price;
        }
      }

      // Fetch fresh rate from Yahoo Finance via Edge Function
      const response = await fetch(
        "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ticker: "INR=X" }), // Yahoo Finance symbol for USD/INR
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch USD/INR rate");
      }

      const data = await response.json();
      const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

      if (!rate) {
        throw new Error("Invalid rate data");
      }

      // Cache the rate
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
        },
      );

      return rate;
    } catch (error) {
      console.error("Error fetching USD/INR rate:", error);
      // Fallback to a default rate if fetch fails
      return 91.57; // You can adjust this fallback value
    }
  };

  // Manual refresh for a single ticker
  const refreshTicker = async (ticker, exchange) => {
    setRefreshingTickers((prev) => ({ ...prev, [ticker]: true }));
    setMessage({ type: "", text: "" });

    try {
      // Use the ticker as is - don't modify it
      const yahooTicker = ticker;
      console.log(`Fetching: ${yahooTicker}`);

      // Call your Supabase Edge Function
      const response = await fetch(
        "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ticker: yahooTicker }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch");
      }

      const data = await response.json();

      // Check if we got valid data
      if (!data?.chart?.result?.[0]?.meta) {
        throw new Error("Invalid data format from Yahoo");
      }

      const meta = data.chart.result[0].meta;
      console.log("Got data:", meta);

      // Get previous close - try multiple possible field names
      const prevClose =
        meta.chartPreviousClose ||
        meta.previousClose ||
        meta.regularMarketPrice;

      // Calculate change values
      let currentPrice = meta.regularMarketPrice;
      let displayPrevClose = prevClose;
      let displayChange = currentPrice - prevClose;
      let displayChangePct =
        prevClose !== 0 ? (displayChange / prevClose) * 100 : 0;

      // Convert to INR if it's a US stock
      if (exchange === "NYSE" || exchange === "NASDAQ" || exchange === "PCX") {
        const usdInrRate = await fetchUSDINR();

        // Convert all values to INR
        currentPrice = currentPrice * usdInrRate;
        displayPrevClose = prevClose * usdInrRate;
        displayChange = currentPrice - displayPrevClose;
        displayChangePct =
          displayPrevClose !== 0 ? (displayChange / displayPrevClose) * 100 : 0;
      }

      // Check if a record exists for today
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
        // Update existing record
        const { error: updateError } = await supabase
          .from("price_cache")
          .update({
            price: currentPrice,
            prev_close: displayPrevClose,
            change_amt: displayChange,
            change_pct: displayChangePct,
            short_name: meta.shortName || meta.longName || ticker,
            fetched_at: new Date().toISOString(),
            exchange: exchange,
          })
          .eq("id", existing.id);

        error = updateError;
      } else {
        // Insert new record
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
            fetched_at: new Date().toISOString(),
            fetch_date: today,
            session: "admin_manual",
          });

        error = insertError;
      }

      if (error) throw error;

      setMessage({
        type: "success",
        text: `✅ ${ticker} updated: ${inr(currentPrice)} (${pct(displayChangePct)})`,
      });

      // Reload cache
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

    // Fetch USD/INR rate once for all US stocks
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

        const response = await fetch(
          "https://xrrztzqwugpnnahvqpfb.supabase.co/functions/v1/fetch-yahoo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ ticker }),
          },
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
        const prevClose =
          meta.chartPreviousClose ||
          meta.previousClose ||
          meta.regularMarketPrice;
        let currentPrice = meta.regularMarketPrice;
        let displayPrevClose = prevClose;

        // Convert to INR if US stock
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

        // First, check if a record exists for today
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
          // Update existing record
          const { error: updateError } = await supabase
            .from("price_cache")
            .update({
              price: currentPrice,
              prev_close: displayPrevClose,
              change_amt: change,
              change_pct: changePct,
              short_name: meta.shortName || meta.longName || ticker,
              fetched_at: new Date().toISOString(),
              exchange: exchange,
            })
            .eq("id", existing.id);

          error = updateError;
        } else {
          // Insert new record
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
              fetched_at: new Date().toISOString(),
              fetch_date: today,
              session: "admin_manual",
            });

          error = insertError;
        }

        if (error) throw error;

        successCount++;
        results.push(`✅ ${ticker}: ${inr(currentPrice)} (${pct(changePct)})`);
      } catch (error) {
        console.error(`Error refreshing ${ticker}:`, error);
        failCount++;
        results.push(`❌ ${ticker}: ${error.message}`);
      } finally {
        setRefreshingTickers((prev) => ({ ...prev, [ticker]: false }));
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Reload cache
    await loadPriceCache();

    setMessage({
      type: successCount > 0 ? "success" : "error",
      text: `✅ ${successCount} successful, ❌ ${failCount} failed`,
    });

    // Log detailed results
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

  // Export cache as CSV
  const exportCache = () => {
    const csv = [
      [
        "Ticker",
        "Exchange",
        "Price",
        "Change %",
        "Short Name",
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

  // Add this function with your other functions
  const deleteCacheEntry = async (id) => {
    if (!id) {
      setMessage({ type: "error", text: "❌ Invalid entry ID" });
      return;
    }

    if (!confirm("Are you sure you want to delete this cache entry?")) return;

    // Set a temporary loading state for this specific deletion
    setDeletingId(id);

    try {
      console.log("Attempting to delete entry with ID:", id);

      const { error, data } = await supabase
        .from("price_cache")
        .delete()
        .eq("id", id)
        .select(); // Add select to confirm what was deleted

      if (error) {
        console.error("Supabase delete error:", error);
        throw error;
      }

      console.log("Delete response:", data);

      setMessage({
        type: "success",
        text: "✅ Cache entry deleted successfully",
      });

      // Update local state immediately (optimistic update)
      setPriceCache((prev) => prev.filter((item) => item.id !== id));
      setFilteredCache((prev) => prev.filter((item) => item.id !== id));

      // Also reload from server to ensure consistency
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

  // Get unique exchanges for filter
  const exchanges = [
    "all",
    ...new Set(priceCache.map((d) => d.exchange).filter(Boolean)),
  ];

  return (
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

        <Card style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Users size={20} color={theme.blue} />
            <span
              style={{
                fontFamily: theme.mono,
                fontSize: 11,
                color: theme.muted,
              }}
            >
              SYSTEM HEALTH
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background:
                  stats.newestCache && new Date() - stats.newestCache < 3600000
                    ? theme.green
                    : theme.yellow,
              }}
            />
            <span style={{ fontFamily: theme.mono, fontSize: 13 }}>
              {stats.newestCache && new Date() - stats.newestCache < 3600000
                ? "Active"
                : "Stale"}
            </span>
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
        <div style={{ minWidth: 1000 }}>
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.2fr 1.2fr 1.5fr 2fr 1fr 80px",
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
            <div>Fetched At</div>
            <div>Session</div>
            <div>Actions</div>
          </div>

          {/* Table Rows */}
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
                  gridTemplateColumns:
                    "1fr 1fr 1.2fr 1.2fr 1.5fr 2fr 1fr 100px", // Increased width for delete button
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
                  {/* Refresh button */}
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

                  {/* Delete button */}
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
  );
}
