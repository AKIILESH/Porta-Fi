// src/components/dashboard/PerformanceChart.jsx
import { useState, useMemo, useId, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useFinance } from "../../context/FinanceContext.jsx";
import { usePortfolioSnapshots } from "../../hooks/usePortfolioSnapshots";
import { inrCompact } from "../../lib/formatters.js";
import { TrendingUp, TrendingDown } from "lucide-react";

// ─── useWindowWidth Hook ─────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

// ─── Glass helpers ─────────────────────────────────────────────────────────
const makeGlass = (isDark, o = 0.04, b = 20) => ({
  background: isDark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o * 0.7})`,
  backdropFilter: `blur(${b}px) saturate(160%)`,
  WebkitBackdropFilter: `blur(${b}px) saturate(160%)`,
});
const makeShine = (isDark) => ({
  position: "absolute",
  top: 0,
  left: "10%",
  right: "10%",
  height: 1,
  background: isDark
    ? "linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)"
    : "linear-gradient(90deg,transparent,rgba(0,0,0,0.05),transparent)",
  pointerEvents: "none",
});
const makeInset = (isDark) =>
  isDark
    ? `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.10)`
    : `inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.04)`;

// ─── Range toggle ──────────────────────────────────────────────────────────
const RANGES = ["1W", "1M", "3M", "1Y"];

function RangePill({ range, active, onClick, theme, isDark, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: isMobile ? "4px 6px" : "6px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? theme.accent + "60" : theme.border}`,
        background: active
          ? isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(0,0,0,0.07)"
          : "transparent",
        color: active ? theme.accent : theme.muted,
        fontFamily: theme.mono,
        fontSize: isMobile ? "5px !important" : "0.6rem",
        letterSpacing: "0.06em",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: active ? `0 0 10px ${theme.accent}20` : "none",
        flex: 1,
        maxWidth: isMobile ? "35px" : "70px",
        minWidth: isMobile ? "30px" : "auto",
        textAlign: "center",
        lineHeight: 0.3,
      }}
    >
      {range}
    </button>
  );
}

// ─── Custom tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, theme, isDark }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const value = d?.total_value_inr ?? 0;
  const cost = d?.total_cost_inr ?? 0;
  const gain = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
  const isUp = gain >= 0;

  return (
    <div
      style={{
        ...makeGlass(isDark, 0.16, 20),
        border: `1px solid ${isUp ? theme.green : theme.red}40`,
        borderRadius: 12,
        padding: "8px 12px",
        boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontFamily: theme.mono,
          fontSize: "0.5rem",
          color: theme.muted,
          marginBottom: 4,
        }}
      >
        {d?.date}
      </div>
      <div
        style={{
          fontFamily: theme.display,
          fontSize: "1rem",
          fontWeight: 700,
          color: theme.text,
          marginBottom: 2,
        }}
      >
        {inrCompact(value)}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: theme.mono,
            fontSize: "0.55rem",
            color: isUp ? theme.green : theme.red,
          }}
        >
          {isUp ? "+" : ""}
          {inrCompact(gain)}
        </span>
        <span
          style={{
            fontFamily: theme.mono,
            fontSize: "0.5rem",
            color: isUp ? theme.green : theme.red,
          }}
        >
          ({isUp ? "+" : ""}
          {gainPct.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

function buildGradientStops(data, green, red) {
  if (!data?.length) return { stops: [], offset: "50%" };

  const values = data.map((d) => d.total_value_inr);
  const costs = data.map((d) => d.total_cost_inr);
  const min = Math.min(...values, ...costs);
  const max = Math.max(...values, ...costs);
  const range = max - min;

  if (range === 0)
    return {
      stops: [
        { offset: "0%", color: green },
        { offset: "100%", color: green },
      ],
      offset: "0%",
    };

  const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
  const crossover = ((max - avgCost) / range) * 100;
  const clipped = Math.max(0, Math.min(100, crossover));
  const offsetStr = `${clipped.toFixed(1)}%`;

  return {
    stops: [
      { offset: "0%", color: green, opacity: 0.9 },
      { offset: offsetStr, color: green, opacity: 0.9 },
      { offset: offsetStr, color: red, opacity: 0.9 },
      { offset: "100%", color: red, opacity: 0.9 },
    ],
    offset: offsetStr,
  };
}

function EmptyChart({ theme, isDark }) {
  return (
    <div
      style={{
        height: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          ...makeGlass(isDark, 0.06, 10),
          border: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.muted,
        }}
      >
        <TrendingUp size={18} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: theme.mono,
            fontSize: "0.65rem",
            color: theme.text,
            marginBottom: 4,
          }}
        >
          No snapshots yet
        </div>
        <div
          style={{
            fontFamily: theme.mono,
            fontSize: "0.55rem",
            color: theme.muted,
          }}
        >
          Chart appears after first EOD snapshot
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton({ isDark, theme }) {
  return (
    <div style={{ height: 180, position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes gpulse{0%,100%{opacity:.3}50%{opacity:.7}}`}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          borderRadius: 8,
          animation: "gpulse 1.8s infinite",
        }}
      />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function PerformanceChart() {
  const { theme, isDark } = useTheme();
  const { userId } = useFinance();
  const [range, setRange] = useState("1M");
  const gradientId = `perf-gradient-${useId().replace(/:/g, "")}`;
  const windowWidth = useWindowWidth();

  const isMobile = windowWidth <= 768;

  const { data: snapshots = [], isLoading } = usePortfolioSnapshots(
    userId,
    range,
  );

  const gi = makeInset(isDark);

  // ── Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!snapshots.length) return null;
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const gain = last.total_value_inr - last.total_cost_inr;
    const gainPct =
      last.total_cost_inr > 0 ? (gain / last.total_cost_inr) * 100 : 0;
    const rangeGain = last.total_value_inr - first.total_value_inr;
    const rangeGainPct =
      first.total_value_inr > 0 ? (rangeGain / first.total_value_inr) * 100 : 0;
    return { gain, gainPct, rangeGain, rangeGainPct, last };
  }, [snapshots]);

  // ── Gradient stops ───────────────────────────────────────────────────────
  const { stops } = useMemo(
    () => buildGradientStops(snapshots, theme.green, theme.red),
    [snapshots, theme.green, theme.red],
  );

  // ── Y-axis domain with padding ───────────────────────────────────────────
  const yDomain = useMemo(() => {
    if (!snapshots.length) return ["auto", "auto"];
    const allValues = snapshots.flatMap((d) => [
      d.total_value_inr,
      d.total_cost_inr,
    ]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.08 || max * 0.05;
    return [min - pad, max + pad];
  }, [snapshots]);

  // ── X-axis tick formatter ─────────────────────────────────────────────────
  const fmtXAxis = (dateStr) => {
    const d = new Date(dateStr);
    if (range === "1W")
      return d.toLocaleDateString("en-IN", { weekday: "short" });
    if (range === "1Y")
      return d.toLocaleDateString("en-IN", { month: "short" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // ── X-axis tick interval ──────────────────────────────────────────────────
  const tickInterval =
    range === "1W" ? 0 : range === "1M" ? 4 : range === "3M" ? 13 : 30;

  const isUp = (stats?.gain ?? 0) >= 0;

  return (
    <div
      style={{
        ...makeGlass(isDark, 0.04, 20),
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: isMobile ? "16px" : "20px 24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: gi,
      }}
    >
      <div style={makeShine(isDark)} />

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          {/* Section label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 3,
                height: 14,
                background: theme.accent,
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontFamily: theme.mono,
                fontSize: isMobile ? "0.52rem" : "0.56rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: theme.accent,
              }}
            >
              Performance
            </span>
          </div>

          {/* Stats */}
          {stats && (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: isMobile ? 8 : 10,
                flexWrap: "wrap",
                flexDirection: "row",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontFamily: theme.display,
                    fontSize: isMobile ? "1.3rem" : "1.5rem",
                    fontWeight: 700,
                    color: theme.text,
                  }}
                >
                  {inrCompact(stats.last.total_value_inr)}
                </span>

                <span
                  style={{
                    fontFamily: theme.display,
                    fontSize: isMobile ? "0.75rem" : "0.9rem",
                    fontWeight: 500,
                    color: theme.muted,
                  }}
                >
                  {inrCompact(stats.last.total_cost_inr)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexWrap: "wrap",
                }}
              >
                {isUp ? (
                  <TrendingUp
                    size={isMobile ? 12 : 15}
                    style={{ color: theme.green }}
                  />
                ) : (
                  <TrendingDown
                    size={isMobile ? 12 : 15}
                    style={{ color: theme.red }}
                  />
                )}
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: isMobile ? "0.58rem" : "0.8rem",
                    color: isUp ? theme.green : theme.red,
                  }}
                >
                  {isUp ? "+" : ""}
                  {stats.gainPct.toFixed(1)}%
                </span>
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: isMobile ? "0.5rem" : "0.8rem",
                    color: theme.muted,
                  }}
                >
                  overall
                </span>
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: "0.5rem",
                    color: theme.muted,
                  }}
                >
                  ·
                </span>
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: isMobile ? "0.58rem" : "0.8rem",
                    color: stats.rangeGain >= 0 ? theme.green : theme.red,
                  }}
                >
                  {stats.rangeGain >= 0 ? "+" : ""}
                  {stats.rangeGainPct.toFixed(1)}%
                </span>
                <span
                  style={{
                    fontFamily: theme.mono,
                    fontSize: isMobile ? "0.5rem" : "0.8rem",
                    color: theme.muted,
                  }}
                >
                  {range}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart body ── */}
      {isLoading ? (
        <ChartSkeleton isDark={isDark} theme={theme} />
      ) : snapshots.length === 0 ? (
        <EmptyChart theme={theme} isDark={isDark} />
      ) : (
        <div
          style={{
            marginLeft: isMobile ? -8 : 0,
            marginRight: isMobile ? -8 : 0,
          }}
        >
          <ResponsiveContainer width="100%" height={isMobile ? 150 : 180}>
            <LineChart
              data={snapshots}
              margin={{
                top: 4,
                right: isMobile ? 8 : 4,
                left: isMobile ? 0 : 0,
                bottom: 0,
              }}
            >
              <defs>
                {/* Green/red gradient — vertical, switches at cost basis crossover */}
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  {stops.map((s, i) => (
                    <stop
                      key={i}
                      offset={s.offset}
                      stopColor={s.color}
                      stopOpacity={s.opacity ?? 1}
                    />
                  ))}
                </linearGradient>

                {/* Area fill gradient — same color but faded */}
                <linearGradient
                  id={`${gradientId}-area`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={isUp ? theme.green : theme.red}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="100%"
                    stopColor={isUp ? theme.green : theme.red}
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={fmtXAxis}
                interval={tickInterval}
                tick={{
                  fontFamily: theme.mono,
                  fontSize: isMobile ? 8 : 9,
                  fill: theme.muted,
                }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />

              <YAxis
                domain={yDomain}
                tickFormatter={(v) => inrCompact(v)}
                tick={{
                  fontFamily: theme.mono,
                  fontSize: isMobile ? 8 : 9,
                  fill: theme.muted,
                }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 60 : 65}
                dx={isMobile ? -2 : 0}
              />

              <Tooltip
                content={<ChartTooltip theme={theme} isDark={isDark} />}
                cursor={{
                  stroke: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.10)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Cost basis reference line */}
              {snapshots.length > 0 && (
                <ReferenceLine
                  y={snapshots[snapshots.length - 1].total_cost_inr}
                  stroke={
                    isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.15)"
                  }
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: "Cost",
                    position: "insideTopRight",
                    fontFamily: theme.mono,
                    fontSize: isMobile ? 7 : 9,
                    fill: theme.muted,
                    dy: -4,
                  }}
                />
              )}

              {/* Performance line */}
              <Line
                type="monotone"
                dataKey="total_value_inr"
                stroke={`url(#${gradientId})`}
                strokeWidth={isMobile ? 1.5 : 2}
                dot={false}
                activeDot={{
                  r: isMobile ? 3 : 4,
                  fill: isUp ? theme.green : theme.red,
                  stroke: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)",
                  strokeWidth: isMobile ? 1 : 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Range pills - MOVED BELOW CHART in mobile ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          width: "100%",
          justifyContent: isMobile ? "center" : "flex-end",
          marginTop: isMobile ? 16 : 10,
          marginBottom: isMobile ? 8 : 0,
        }}
      >
        {RANGES.map((r) => (
          <RangePill
            key={r}
            range={r}
            active={range === r}
            onClick={() => setRange(r)}
            theme={theme}
            isDark={isDark}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* ── Legend ── */}
      {snapshots.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: isMobile ? 12 : 16,
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${theme.border}`,
            flexWrap: "wrap",
            justifyContent: isMobile ? "center" : "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 16,
                height: 2,
                background: theme.green,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                fontFamily: theme.mono,
                fontSize: isMobile ? "0.45rem" : "0.5rem",
                color: theme.muted,
              }}
            >
              Profit
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 16,
                height: 2,
                background: theme.red,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                fontFamily: theme.mono,
                fontSize: isMobile ? "0.45rem" : "0.5rem",
                color: theme.muted,
              }}
            >
              Loss
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 16,
                height: 1,
                background: isDark
                  ? "rgba(255,255,255,0.20)"
                  : "rgba(0,0,0,0.15)",
                borderRadius: 1,
                borderTop: "1px dashed",
              }}
            />
            <span
              style={{
                fontFamily: theme.mono,
                fontSize: isMobile ? "0.45rem" : "0.5rem",
                color: theme.muted,
              }}
            >
              Cost
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
