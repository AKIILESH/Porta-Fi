// src/hooks/useTaxCosts.js
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// ─── Tax category config ───────────────────────────────────────────────────
const TAX_CONFIG = {
  equity: { stcg: 20, ltcg: 12.5, ltcg_months: 12, ltcg_exempt: 125000 },
  debt: { stcg: null, ltcg: null, ltcg_months: 24, ltcg_exempt: 0 }, // slab rate
  gold: { stcg: null, ltcg: 12.5, ltcg_months: 24, ltcg_exempt: 0 },
  international: { stcg: null, ltcg: 12.5, ltcg_months: 24, ltcg_exempt: 0 },
  reit: { stcg: 20, ltcg: 12.5, ltcg_months: 36, ltcg_exempt: 0 },
  crypto: { stcg: 30, ltcg: 30, ltcg_months: null, ltcg_exempt: 0 },
};

function getTaxConfig(taxCategory) {
  return TAX_CONFIG[taxCategory] || TAX_CONFIG.equity;
}

// ─── Days between two dates ────────────────────────────────────────────────
function daysBetween(dateA, dateB = new Date()) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

// ─── Current FY ───────────────────────────────────────────────────────────
function currentFY() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  // Indian FY: April to March
  return month >= 4
    ? `${year}-${String(year + 1).slice(2)}`
    : `${year - 1}-${String(year).slice(2)}`;
}

// ─── Main hook ─────────────────────────────────────────────────────────────
export function useTaxCosts(userId) {
  return useQuery({
    queryKey: ["taxCosts", userId],
    queryFn: async () => {
      // Fetch all three tables in parallel
      const [lotsRes, instrumentsRes, holdingsRes, tradesRes] =
        await Promise.all([
          supabase
            .from("fund_lots")
            .select("*")
            .eq("user_id", userId)
            .order("purchase_date", { ascending: true }),

          supabase
            .from("instruments")
            .select(
              "symbol, name, asset_class, expense_ratio, exit_load_pct, exit_load_days, stamp_duty_rate, tax_category, ltcg_months, plan_type",
            ),

          supabase
            .from("holdings")
            .select("id, ticker, name, quantity, avg_cost, asset_class")
            .eq("user_id", userId)
            .gt("quantity", 0),

          supabase
            .from("trades")
            .select(
              "id, ticker, trade_date, trade_type, quantity, price, net_amount, stamp_duty, stt, gst, realised_pnl, holding_period_days, is_ltcg",
            )
            .eq("user_id", userId)
            .order("trade_date", { ascending: true }),
        ]);

      if (lotsRes.error) throw lotsRes.error;
      if (instrumentsRes.error) throw instrumentsRes.error;
      if (holdingsRes.error) throw holdingsRes.error;
      if (tradesRes.error) throw tradesRes.error;

      const lots = lotsRes.data || [];
      const instruments = instrumentsRes.data || [];
      const holdings = (holdingsRes.data || []).filter((h) =>
        ["mutual_fund", "debt_fund", "liquid_fund"].includes(h.asset_class),
      );
      const trades = tradesRes.data || [];

      // Build instrument lookup map
      const instrMap = {};
      instruments.forEach((i) => {
        instrMap[i.symbol] = i;
      });

      // ── 1. COST X-RAY ─────────────────────────────────────────────────
      // Per holding: expense ratio annual drag, stamp duty paid, exit load risk
      const costXray = holdings
        .map((h) => {
          const instr = instrMap[h.ticker] || {};
          const holdingLots = lots.filter((l) => l.holding_id === h.id);

          // Current market value (use avg_cost as proxy — replace with live price if available)
          const currentValue = h.quantity * h.avg_cost;

          // Expense ratio annual drag (in INR)
          const expenseRatio = instr.expense_ratio ?? null;
          const annualDragINR =
            expenseRatio != null ? (currentValue * expenseRatio) / 100 : null;

          // Stamp duty paid (sum from all buy trades for this holding)
          const buyTrades = trades.filter(
            (t) => t.ticker === h.ticker && t.trade_type === "buy",
          );
          const stampDutyPaid = buyTrades.reduce((sum, t) => {
            // If stamp_duty column is populated use it, else calculate
            const sd =
              t.stamp_duty > 0
                ? t.stamp_duty
                : (t.net_amount * (instr.stamp_duty_rate ?? 0.0005)) / 100;
            return sum + sd;
          }, 0);

          // Total invested across all buys
          const totalInvested = buyTrades.reduce(
            (s, t) => s + (t.net_amount || 0),
            0,
          );

          // Exit load exposure — value of units still within lock-in
          const today = new Date();
          const lockedLots = holdingLots.filter(
            (l) =>
              l.exit_load_free_date &&
              new Date(l.exit_load_free_date) > today &&
              l.units_remaining > 0,
          );
          const lockedValue = lockedLots.reduce(
            (s, l) => s + l.units_remaining * l.purchase_nav,
            0,
          );
          const exitLoadRisk = instr.exit_load_pct
            ? (lockedValue * instr.exit_load_pct) / 100
            : 0;

          // 10-year expense drag projection (compounding effect)
          const tenYearDrag =
            expenseRatio != null
              ? currentValue * (1 - Math.pow(1 - expenseRatio / 100, 10))
              : null;

          return {
            holding_id: h.id,
            ticker: h.ticker,
            name: h.name,
            asset_class: h.asset_class,
            quantity: h.quantity,
            avg_cost: h.avg_cost,
            current_value: currentValue,
            total_invested: totalInvested,
            expense_ratio: expenseRatio,
            annual_drag_inr: annualDragINR,
            ten_year_drag: tenYearDrag,
            stamp_duty_paid: stampDutyPaid,
            exit_load_pct: instr.exit_load_pct ?? 0,
            exit_load_risk: exitLoadRisk,
            locked_value: lockedValue,
            locked_lots: lockedLots.length,
            plan_type: instr.plan_type ?? "direct",
            tax_category: instr.tax_category ?? h.asset_class,
          };
        })
        .filter(Boolean);

      // Totals for cost x-ray
      const costSummary = {
        total_annual_drag: costXray.reduce(
          (s, h) => s + (h.annual_drag_inr || 0),
          0,
        ),
        total_stamp_duty: costXray.reduce((s, h) => s + h.stamp_duty_paid, 0),
        total_exit_load_risk: costXray.reduce(
          (s, h) => s + h.exit_load_risk,
          0,
        ),
        total_locked_value: costXray.reduce((s, h) => s + h.locked_value, 0),
        total_invested: costXray.reduce((s, h) => s + h.total_invested, 0),
      };

      // ── 2. EXIT LOAD TRACKER ───────────────────────────────────────────
      const today = new Date();
      const exitLots = lots
        .filter((l) => l.exit_load_free_date && l.units_remaining > 0)
        .map((l) => {
          const instr =
            instrMap[holdings.find((h) => h.id === l.holding_id)?.ticker] || {};
          const holding = holdings.find((h) => h.id === l.holding_id);
          const freeDate = new Date(l.exit_load_free_date);
          const isLocked = freeDate > today;
          const daysTotal = instr.exit_load_days || 365;
          const daysSinceBuy = daysBetween(l.purchase_date);
          const daysRemaining = isLocked
            ? Math.ceil((freeDate - today) / 86400000)
            : 0;
          const progressPct = Math.min((daysSinceBuy / daysTotal) * 100, 100);
          const currentVal = l.units_remaining * l.purchase_nav;
          const exitLoadAmount = isLocked
            ? (currentVal * (instr.exit_load_pct || 0)) / 100
            : 0;

          return {
            lot_id: l.id,
            holding_id: l.holding_id,
            ticker: holding?.ticker,
            name: holding?.name,
            purchase_date: l.purchase_date,
            units_remaining: l.units_remaining,
            purchase_nav: l.purchase_nav,
            current_value: currentVal,
            exit_load_pct: instr.exit_load_pct || 0,
            exit_load_amount: exitLoadAmount,
            free_date: l.exit_load_free_date,
            is_locked: isLocked,
            days_remaining: daysRemaining,
            days_total: daysTotal,
            progress_pct: progressPct,
            value_if_redeemed_now: currentVal - exitLoadAmount,
          };
        })
        .sort((a, b) => new Date(a.free_date) - new Date(b.free_date));

      const exitSummary = {
        total_locked: exitLots
          .filter((l) => l.is_locked)
          .reduce((s, l) => s + l.current_value, 0),
        total_exit_risk: exitLots
          .filter((l) => l.is_locked)
          .reduce((s, l) => s + l.exit_load_amount, 0),
        locked_count: exitLots.filter((l) => l.is_locked).length,
        free_count: exitLots.filter((l) => !l.is_locked).length,
        next_free_date: exitLots.find((l) => l.is_locked)?.free_date || null,
      };

      // ── 3. TAX P&L ────────────────────────────────────────────────────
      // Unrealised P&L per holding with STCG/LTCG classification
      const fy = currentFY();

      const unrealisedPnL = holdings.map((h) => {
        const instr = instrMap[h.ticker] || {};
        const taxCat = instr.tax_category || h.asset_class;
        const taxCfg = getTaxConfig(taxCat);
        const holdingLots = lots.filter(
          (l) => l.holding_id === h.id && l.units_remaining > 0,
        );
        const currentVal = h.quantity * h.avg_cost; // proxy — swap for live price

        // Per-lot P&L and classification
        const lotDetails = holdingLots.map((l) => {
          const daysHeld = daysBetween(l.purchase_date);
          const ltcgMonths = instr.ltcg_months ?? taxCfg.ltcg_months ?? 12;
          const isLTCG = ltcgMonths ? daysHeld >= ltcgMonths * 30 : false;
          const lotValue = l.units_remaining * h.avg_cost; // proxy
          const lotCost = l.units_remaining * l.purchase_nav;
          const lotGain = lotValue - lotCost;
          const taxRate = isLTCG ? taxCfg.ltcg : taxCfg.stcg;
          const estimatedTax =
            taxRate && lotGain > 0 ? (lotGain * taxRate) / 100 : 0;

          return {
            lot_id: l.id,
            purchase_date: l.purchase_date,
            days_held: daysHeld,
            units: l.units_remaining,
            purchase_nav: l.purchase_nav,
            current_nav: h.avg_cost,
            lot_cost: lotCost,
            lot_value: lotValue,
            lot_gain: lotGain,
            is_ltcg: isLTCG,
            gain_type: isLTCG ? "LTCG" : "STCG",
            tax_rate: taxRate,
            estimated_tax: estimatedTax,
          };
        });

        const totalGain = lotDetails.reduce((s, l) => s + l.lot_gain, 0);
        const stcgGain = lotDetails
          .filter((l) => !l.is_ltcg)
          .reduce((s, l) => s + l.lot_gain, 0);
        const ltcgGain = lotDetails
          .filter((l) => l.is_ltcg)
          .reduce((s, l) => s + l.lot_gain, 0);
        const estTax = lotDetails.reduce((s, l) => s + l.estimated_tax, 0);

        return {
          holding_id: h.id,
          ticker: h.ticker,
          name: h.name,
          asset_class: h.asset_class,
          tax_category: taxCat,
          current_value: currentVal,
          total_cost: holdingLots.reduce(
            (s, l) => s + l.units_remaining * l.purchase_nav,
            0,
          ),
          total_gain: totalGain,
          stcg_gain: stcgGain,
          ltcg_gain: ltcgGain,
          estimated_tax: estTax,
          tax_config: taxCfg,
          lots: lotDetails,
        };
      });

      // Realised P&L from sell trades (already in trades table)
      const realisedTrades = trades
        .filter((t) => t.trade_type === "sell" && t.realised_pnl != null)
        .map((t) => ({
          trade_id: t.id,
          ticker: t.ticker,
          trade_date: t.trade_date,
          quantity: t.quantity,
          realised_pnl: t.realised_pnl,
          holding_period_days: t.holding_period_days,
          is_ltcg: t.is_ltcg,
          gain_type: t.is_ltcg ? "LTCG" : "STCG",
        }));

      // FY Tax summary
      const totalSTCG = unrealisedPnL.reduce(
        (s, h) => s + Math.max(h.stcg_gain, 0),
        0,
      );
      const totalLTCG = unrealisedPnL.reduce(
        (s, h) => s + Math.max(h.ltcg_gain, 0),
        0,
      );
      const totalLTCGTaxable = Math.max(totalLTCG - 125000, 0); // ₹1.25L exempt for equity
      const totalEstTax = unrealisedPnL.reduce(
        (s, h) => s + h.estimated_tax,
        0,
      );

      const realisedSTCG = realisedTrades
        .filter((t) => !t.is_ltcg && t.realised_pnl > 0)
        .reduce((s, t) => s + t.realised_pnl, 0);
      const realisedLTCG = realisedTrades
        .filter((t) => t.is_ltcg && t.realised_pnl > 0)
        .reduce((s, t) => s + t.realised_pnl, 0);

      const taxSummary = {
        fy,
        unrealised_stcg: totalSTCG,
        unrealised_ltcg: totalLTCG,
        unrealised_ltcg_taxable: totalLTCGTaxable,
        ltcg_exempt_used: Math.min(totalLTCG, 125000),
        ltcg_exempt_remaining: Math.max(125000 - totalLTCG, 0),
        estimated_tax: totalEstTax,
        realised_stcg: realisedSTCG,
        realised_ltcg: realisedLTCG,
        total_realised_pnl: realisedTrades.reduce(
          (s, t) => s + t.realised_pnl,
          0,
        ),
      };

      return {
        costXray,
        costSummary,
        exitLots,
        exitSummary,
        unrealisedPnL,
        realisedTrades,
        taxSummary,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
