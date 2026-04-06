// src/components/Admin/InstrumentsManager.jsx
import { useState, useEffect } from "react";
import { useInstruments, useAddInstrument, useUpdateInstrument, useDeleteInstrument } from "../../hooks/useInstruments.js";
import { Card, Btn, Input, Select, Spinner } from "../shared/ui.jsx";
import theme from "../../lib/theme.js";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Your exact data structures (keep these as is)
export const ASSET_CLASSES = [
  { value: 'equity',      label: 'Equity (Direct Stock)',       exchange: 'NSE',    color: '#00f5a0' },
  { value: 'us_equity',   label: 'US Equity',                   exchange: 'NYSE',   color: '#4f8eff' },
  { value: 'etf',         label: 'ETF',                         exchange: 'NSE',    color: '#ffd93d' },
  { value: 'index_fund',  label: 'Index Fund (MF)',             exchange: 'AMFI',   color: '#a8e6cf' },
  { value: 'elss',        label: 'ELSS (Tax Saving MF)',        exchange: 'AMFI',   color: '#9b5cff' },
  { value: 'mutual_fund', label: 'Mutual Fund (Active)',        exchange: 'AMFI',   color: '#ff9f43' },
  { value: 'debt_fund',   label: 'Debt Fund',                   exchange: 'AMFI',   color: '#54a0ff' },
  { value: 'liquid_fund', label: 'Liquid / Overnight Fund',    exchange: 'AMFI',   color: '#48dbfb' },
  { value: 'hybrid_fund', label: 'Hybrid Fund',                exchange: 'AMFI',   color: '#ff6b81' },
  { value: 'gold',        label: 'Gold (Physical / SGB / ETF)', exchange: 'NSE',    color: '#f5c400' },
  { value: 'silver',      label: 'Silver (Physical / ETF)',    exchange: 'NSE',    color: '#b2bec3' },
  { value: 'reit',        label: 'REIT',                        exchange: 'NSE',    color: '#fd79a8' },
  { value: 'invit',       label: 'InvIT',                       exchange: 'NSE',    color: '#e17055' },
  { value: 'crypto',      label: 'Crypto',                      exchange: 'OTHER',  color: '#6c5ce7' },
  { value: 'other',       label: 'Other',                       exchange: 'OTHER',  color: '#636e72' },
];

export const SUB_CATEGORIES = {
  equity:      ['large_cap','mid_cap','small_cap','micro_cap'],
  us_equity:   ['large_cap','mid_cap','small_cap','growth','value'],
  etf:         ['index','sectoral','gold','silver','debt','international'],
  mutual_fund: ['large_cap','mid_cap','small_cap','flexi_cap','value','contra','dividend_yield','focused','sectoral'],
  elss:        ['large_cap','flexi_cap','mid_cap'],
  index_fund:  ['nifty_50','nifty_next_50','sensex','midcap','smallcap','international'],
  debt_fund:   ['gilt','corporate_bond','credit_risk','short_duration','ultra_short','dynamic_bond','fmp'],
  liquid_fund: ['liquid','overnight','money_market'],
  hybrid_fund: ['aggressive','conservative','balanced','dynamic_asset_allocation','multi_asset'],
  gold:        ['physical','sgb','gold_etf','gold_fund_of_fund'],
  silver:      ['physical','silver_etf'],
  reit:        ['reit'],
  invit:       ['invit'],
  crypto:      ['crypto'],
  other:       ['other'],
};

export const EXCHANGES = ['NSE','BSE','NYSE','NASDAQ','MCX','AMFI','OTHER'];

// Helper to format sub_category for display
const formatSubCategory = (cat) => {
  if (!cat) return '—';
  return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Initial form state matching your schema
const initialFormState = {
  id: null,
  symbol: "",
  name: "",
  asset_class: "equity",
  sub_category: "",
  exchange: "NSE",
  isin: "",
  sector: "",
  industry: "",
  series: "",
  expense_ratio: "",
  exit_load_pct: "",
  exit_load_days: "",
  stamp_duty_rate: 0.005,
  tax_category: "",
  ltcg_months: "",
  plan_type: "direct",
};

export default function InstrumentsManager() {
  const [filters, setFilters] = useState({
    assetClass: "all",
    exchange: "all",
    searchTerm: "",
  });
  const [showFilters, setShowFilters] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Hooks
  const { data: instruments = [], isLoading, refetch } = useInstruments({
    assetClass: filters.assetClass !== "all" ? filters.assetClass : undefined,
    exchange: filters.exchange !== "all" ? filters.exchange : undefined,
    searchTerm: filters.searchTerm,
  });

  const addInstrument = useAddInstrument();
  const updateInstrument = useUpdateInstrument();
  const deleteInstrument = useDeleteInstrument();

  // Available sub-categories based on selected asset class
  const availableSubCategories = SUB_CATEGORIES[formData.asset_class] || SUB_CATEGORIES.other || [];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : "") : value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  // Start editing
  const startEdit = (instrument) => {
    setFormData({
      id: instrument.id,
      symbol: instrument.symbol || "",
      name: instrument.name || "",
      asset_class: instrument.asset_class || "equity",
      sub_category: instrument.sub_category || "",
      exchange: instrument.exchange || "NSE",
      isin: instrument.isin || "",
      sector: instrument.sector || "",
      industry: instrument.industry || "",
      series: instrument.series || "",
      expense_ratio: instrument.expense_ratio || "",
      exit_load_pct: instrument.exit_load_pct || "",
      exit_load_days: instrument.exit_load_days || "",
      stamp_duty_rate: instrument.stamp_duty_rate || 0.005,
      tax_category: instrument.tax_category || "",
      ltcg_months: instrument.ltcg_months || "",
      plan_type: instrument.plan_type || "direct",
    });
    setEditingId(instrument.id);
  };

  // Save instrument
  const handleSave = async () => {
    // Validation
    if (!formData.symbol.trim()) {
      setMessage({ type: "error", text: "Symbol is required" });
      return;
    }
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    if (!formData.asset_class) {
      setMessage({ type: "error", text: "Asset class is required" });
      return;
    }
    if (!formData.exchange) {
      setMessage({ type: "error", text: "Exchange is required" });
      return;
    }

    try {
      if (editingId) {
        await updateInstrument.mutateAsync({
          id: editingId,
          ...formData,
        });
        setMessage({ type: "success", text: "✅ Instrument updated successfully" });
      } else {
        await addInstrument.mutateAsync(formData);
        setMessage({ type: "success", text: "✅ Instrument added successfully" });
      }
      resetForm();
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${error.message}` });
    }
  };

  // Handle delete
  const handleDelete = async (id, symbol) => {
    if (!confirm(`Are you sure you want to delete ${symbol}?`)) return;

    try {
      await deleteInstrument.mutateAsync(id);
      setMessage({ type: "success", text: `✅ ${symbol} deleted successfully` });
      
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setMessage({ type: "error", text: `❌ ${error.message}` });
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Get asset class details
  const getAssetClassDetails = (value) => {
    return ASSET_CLASSES.find(ac => ac.value === value) || ASSET_CLASSES[0];
  };

  const isPending = addInstrument.isPending || updateInstrument.isPending || deleteInstrument.isPending;

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
            <Database size={28} color={theme.accent} />
            Instruments Manager
          </h1>
          <p style={{ fontFamily: theme.mono, fontSize: 12, color: theme.muted }}>
            Manage all investment instruments (stocks, funds, ETFs, etc.)
          </p>
        </div>
        <Btn onClick={() => refetch()} color={theme.accent} disabled={isLoading}>
          <RefreshCw size={14} style={{ marginRight: 8 }} />
          Refresh
        </Btn>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            background: message.type === "success" ? theme.green + "20" : theme.red + "20",
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
          {message.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
<Card style={{ marginBottom: 24, padding: 20 }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <h3 style={{ fontFamily: theme.syne, fontSize: 18, fontWeight: 600 }}>
      {editingId ? "Edit Instrument" : "Add New Instrument"}
    </h3>
    {editingId && (
      <Btn sm ghost onClick={resetForm} color={theme.muted}>
        <X size={14} style={{ marginRight: 4 }} />
        Cancel
      </Btn>
    )}
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
    {/* Left Column */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Symbol *
        </div>
        <Input
          name="symbol"
          value={formData.symbol}
          onChange={(val) => setFormData({...formData, symbol: val})}
          placeholder="RELIANCE"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Name *
        </div>
        <Input
          name="name"
          value={formData.name}
          onChange={(val) => setFormData({...formData, name: val})}
          placeholder="Reliance Industries"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Asset Class *
        </div>
        <Select
          value={formData.asset_class}
          onChange={(val) => setFormData({...formData, asset_class: val, sub_category: ""})}
        >
          {ASSET_CLASSES.map((ac) => (
            <option key={ac.value} value={ac.value}>
              {ac.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Sub Category
        </div>
        <Select
          value={formData.sub_category}
          onChange={(val) => setFormData({...formData, sub_category: val})}
        >
          <option value="">None</option>
          {availableSubCategories.map((sc) => (
            <option key={sc} value={sc}>
              {formatSubCategory(sc)}
            </option>
          ))}
        </Select>
      </div>
    </div>

    {/* Middle Column */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Exchange *
        </div>
        <Select
          value={formData.exchange}
          onChange={(val) => setFormData({...formData, exchange: val})}
        >
          {EXCHANGES.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          ISIN
        </div>
        <Input
          name="isin"
          value={formData.isin}
          onChange={(val) => setFormData({...formData, isin: val})}
          placeholder="INE002A01018"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Sector
        </div>
        <Input
          name="sector"
          value={formData.sector}
          onChange={(val) => setFormData({...formData, sector: val})}
          placeholder="Oil & Gas"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Industry
        </div>
        <Input
          name="industry"
          value={formData.industry}
          onChange={(val) => setFormData({...formData, industry: val})}
          placeholder="Refining"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Series
        </div>
        <Input
          name="series"
          value={formData.series}
          onChange={(val) => setFormData({...formData, series: val})}
          placeholder="EQ"
        />
      </div>
    </div>

    {/* Right Column */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Expense Ratio (%)
        </div>
        <Input
          name="expense_ratio"
          type="number"
          step="0.01"
          value={formData.expense_ratio}
          onChange={(val) => setFormData({...formData, expense_ratio: val})}
          placeholder="0.49"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Exit Load (%)
        </div>
        <Input
          name="exit_load_pct"
          type="number"
          step="0.1"
          value={formData.exit_load_pct}
          onChange={(val) => setFormData({...formData, exit_load_pct: val})}
          placeholder="1.0"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Exit Load Days
        </div>
        <Input
          name="exit_load_days"
          type="number"
          value={formData.exit_load_days}
          onChange={(val) => setFormData({...formData, exit_load_days: val})}
          placeholder="365"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Stamp Duty Rate (%)
        </div>
        <Input
          name="stamp_duty_rate"
          type="number"
          step="0.001"
          value={formData.stamp_duty_rate}
          onChange={(val) => setFormData({...formData, stamp_duty_rate: val})}
          placeholder="0.005"
        />
      </div>

      <div>
        <div style={{ 
          fontFamily: theme.mono, 
          fontSize: '0.6rem', 
          color: theme.muted, 
          marginBottom: 4,
          letterSpacing: '0.04em'
        }}>
          Plan Type
        </div>
        <Select
          value={formData.plan_type}
          onChange={(val) => setFormData({...formData, plan_type: val})}
        >
          <option value="direct">Direct</option>
          <option value="regular">Regular</option>
        </Select>
      </div>
    </div>
  </div>

  <div style={{ marginTop: 16 }}>
    <Btn onClick={handleSave} disabled={isPending} style={{ width: "100%" }}>
      {isPending ? <Spinner size={14} /> : <Save size={14} style={{ marginRight: 8 }} />}
      {editingId ? "Update Instrument" : "Add Instrument"}
    </Btn>
  </div>
</Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showFilters ? 16 : 0,
            cursor: "pointer",
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={16} color={theme.muted} />
            <span style={{ fontFamily: theme.mono, fontSize: 13, color: theme.muted }}>
              Filters & Search
            </span>
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <Input
              value={filters.searchTerm}
              onChange={(val) => setFilters({...filters, searchTerm: val})}
              placeholder="Search by symbol, name, ISIN..."
            >
              <Search size={14} />
            </Input>

            <Select value={filters.assetClass} onChange={(val) => setFilters({...filters, assetClass: val})}>
              <option value="all">All Asset Classes</option>
              {ASSET_CLASSES.map((ac) => (
                <option key={ac.value} value={ac.value}>
                  {ac.label}
                </option>
              ))}
            </Select>

            <Select value={filters.exchange} onChange={(val) => setFilters({...filters, exchange: val})}>
              <option value="all">All Exchanges</option>
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div style={{ marginTop: 12, color: theme.muted, fontSize: 12 }}>
          <Filter size={12} style={{ display: "inline", marginRight: 4 }} />
          {instruments.length} instruments found
        </div>
      </Card>

      {/* Instruments Table */}
      <Card style={{ overflow: "auto" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Spinner />
          </div>
        ) : (
          <div style={{ minWidth: 1400 }}>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 1.2fr 1fr 1fr 0.8fr 0.8fr 1fr 1fr 80px",
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
              <div>Symbol</div>
              <div>Name</div>
              <div>Asset Class</div>
              <div>Sub Category</div>
              <div>Exchange</div>
              <div>Exp Ratio</div>
              <div>Exit Load</div>
              <div>ISIN</div>
              <div>Plan Type</div>
              <div>Actions</div>
            </div>

            {/* Table Rows */}
            {instruments.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.muted }}>
                No instruments found
              </div>
            ) : (
              instruments.map((item, i) => {
                const assetClass = getAssetClassDetails(item.asset_class);
                const isEditing = editingId === item.id;
                
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.5fr 1.2fr 1fr 1fr 0.8fr 0.8fr 1fr 1fr 80px",
                      gap: 8,
                      padding: "10px 0",
                      borderBottom: `1px solid ${theme.border}`,
                      alignItems: "center",
                      fontSize: 12,
                      fontFamily: theme.mono,
                      background: isEditing ? `${assetClass.color}10` : (i % 2 === 0 ? "transparent" : theme.bg2),
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.symbol}</div>
                    <div style={{ color: theme.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div>
                      <span
                        style={{
                          background: `${assetClass.color}20`,
                          color: assetClass.color,
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 10,
                        }}
                      >
                        {item.asset_class}
                      </span>
                    </div>
                    <div>{formatSubCategory(item.sub_category)}</div>
                    <div>{item.exchange || "—"}</div>
                    <div>{item.expense_ratio ? `${item.expense_ratio}%` : "—"}</div>
                    <div>{item.exit_load_pct ? `${item.exit_load_pct}%` : "—"}</div>
                    <div>{item.isin || "—"}</div>
                    <div>{item.plan_type || "direct"}</div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => startEdit(item)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.accent,
                          cursor: "pointer",
                          padding: 4,
                        }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.symbol)}
                        disabled={deleteInstrument.isPending}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.red,
                          cursor: deleteInstrument.isPending ? "wait" : "pointer",
                          padding: 4,
                          opacity: deleteInstrument.isPending ? 0.5 : 1,
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ padding: "12px 16px", flex: 1 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Total Instruments</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{instruments.length}</div>
        </Card>
        <Card style={{ padding: "12px 16px", flex: 1 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Asset Classes</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {new Set(instruments.map(i => i.asset_class)).size}
          </div>
        </Card>
        <Card style={{ padding: "12px 16px", flex: 1 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Exchanges</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {new Set(instruments.map(i => i.exchange)).size}
          </div>
        </Card>
      </div>
    </div>
  );
}