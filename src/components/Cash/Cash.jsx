import { useState, useEffect, useRef } from "react";
import { useFinance } from "../../context/FinanceContext.jsx";
import { useCashAccounts, useAddCashAccount, useUpdateCashAccount, useDeleteCashAccount } from "../../hooks/useCashAccounts.js";
import {
  Card,
  Btn,
  Input,
  Select,
  Badge,
  KpiCard,
  EmptyState,
  Spinner,
  ProgressBar,
} from "../shared/ui.jsx";
import { inr, inrCompact, pct, todayISO } from "../../lib/formatters.js";
import theme from "../../lib/theme.js";
import {
  Landmark,
  Calendar,
  Percent,
  Plus,
  X,
  Edit,
  Trash2,
  Clock,
  IndianRupee,
} from "lucide-react";

// ── Gold Tokens ───────────────────────────────────────────────────────────────
const G = {
  ink: "#09090e",
  surface: "#0f0e0a",
  card: "#131109",
  cardHover: "#181610",
  border: "rgba(201,168,76,0.16)",
  borderHi: "rgba(201,168,76,0.36)",
  gold: "#c9a84c",
  goldLight: "#e8c96b",
  goldDim: "rgba(201,168,76,0.10)",
  goldGlow: "rgba(201,168,76,0.05)",
  text: "#f0ebe0",
  muted: "#6e6558",
  green: "#5cb87a",
  red: "#d96b6b",
  blue: "#4f8eff",
  amber: "#d4a842",
  teal: "#3eb489",
  mono: "'DM Mono','Courier New',monospace",
  display: "'Cormorant Garamond',Georgia,serif",
  sans: "'DM Sans',system-ui,sans-serif",
};

// ── Account Types ─────────────────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings Account", icon: "◈", color: G.gold },
  { value: "current", label: "Current Account", icon: "◉", color: G.gold },
  { value: "fd", label: "Fixed Deposit", icon: "◆", color: G.gold },
  { value: "rd", label: "Recurring Deposit", icon: "◇", color: G.gold },
  { value: "cash", label: "Physical Cash", icon: "◎", color: G.gold },
  { value: "digital", label: "Digital Wallet", icon: "▣", color: G.gold },
  { value: "investment", label: "Investment A/C", icon: "▲", color: G.gold },
  { value: "expense", label: "Expense Account", icon: "▼", color: G.gold },
  { value: "salary", label: "Salary Account", icon: "✦", color: G.gold },
];

const BANK_NAMES = [
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "State Bank of India (SBI)",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Punjab National Bank (PNB)",
  "Canara Bank",
  "Union Bank of India",
  "Indian Bank",
  "IDBI Bank",
  "Yes Bank",
  "IndusInd Bank",
  "Federal Bank",
  "IDFC FIRST Bank",
  "Bandhan Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "City Union Bank",
  "RBL Bank",
  "Bank of India",
  "Slice",
  "Other",
].sort();

const BANK_LOGOS = {
  "HDFC Bank": "/HDFC.png",
  "IDFC FIRST Bank": "/IDFC.png",
  "Kotak Mahindra Bank": "/KOTAK.png",
  "Slice":"/SLICE.png",
  "Axis Bank":"/AXIS.png",
  "ICICI Bank":"/ICICI.png",
  "State Bank of India (SBI)":"/SBI.png",
  "Indian Bank":"/INDIANBANK.png"
};

const INTEREST_FREQUENCY = [
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
  "maturity",
];

const daysBetween = (s, e) =>
  Math.ceil(Math.abs(new Date(e) - new Date(s)) / 86400000);

const calcProgress = (start, end) => {
  if (!start || !end) return 0;
  const today = new Date(),
    s = new Date(start),
    e = new Date(end);
  if (today >= e) return 100;
  if (today <= s) return 0;
  return Math.min(
    100,
    Math.round((daysBetween(s, today) / daysBetween(s, e)) * 100),
  );
};

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function CashSkeleton() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ height: 80, background: G.card, animation: "pulse 1.5s infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 120, background: G.card, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    </div>
  )
}

// ── Shared primitives ─────────────────────────────────────────────────────────
const FL = ({ children, required }) => (
  <div
    style={{
      fontFamily: G.mono,
      fontSize: "0.52rem",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: G.muted,
      marginBottom: 5,
    }}
  >
    {children}
    {required && <span style={{ color: G.red, marginLeft: 3 }}>*</span>}
  </div>
);

const SL = ({ children }) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}
  >
    <span
      style={{
        width: 18,
        height: 1,
        background: G.gold,
        display: "inline-block",
      }}
    />
    <span
      style={{
        fontFamily: G.mono,
        fontSize: "0.58rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: G.gold,
      }}
    >
      {children}
    </span>
  </div>
);

const fieldBase = {
  background: G.surface,
  border: `1px solid ${G.border}`,
  color: G.text,
  fontFamily: G.mono,
  fontSize: "0.73rem",
  padding: "9px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};
const GInput = ({
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
  readOnly,
  style = {},
}) => (
  <input
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    type={type}
    placeholder={placeholder}
    min={min}
    step={step}
    readOnly={readOnly}
    style={{ ...fieldBase, ...style }}
    onFocus={(e) => !readOnly && (e.target.style.borderColor = G.gold)}
    onBlur={(e) => (e.target.style.borderColor = G.border)}
  />
);
const GSelect = ({ value, onChange, children, style = {} }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      ...fieldBase,
      ...style,
      cursor: "pointer",
      appearance: "none",
      WebkitAppearance: "none",
    }}
  >
    {children}
  </select>
);

function BankLogo({ bankName, size = 40 }) {
  const [hasError, setHasError] = useState(false)
    const logoPath = BANK_LOGOS[bankName]

  if (!bankName || hasError) {
    return (
      <div style={{
        width: size,
        height: size,
        background: `${G.gold}14`,
        border: `1px solid ${G.gold}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.1rem",
        color: G.gold,
        fontFamily: G.mono,
        flexShrink: 0,
      }}>
        {bankName?.[0] || 'B'}
      </div>
    )
  }
  
  return (
    <img
      src={logoPath}
      alt={bankName}
      onError={() => setHasError(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        background: 'white',
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  )
}

// Bank Select
function BankSelect({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const filteredBanks = BANK_NAMES.filter((bank) =>
    bank.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={search || value}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
            if (!BANK_NAMES.includes(e.target.value)) {
              onChange(e.target.value);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search or enter bank name"
          style={{
            flex: 1,
            background: "rgba(16,14,10,0.3)",
            border: `1px solid ${G.border}`,
            color: G.text,
            fontFamily: G.mono,
            fontSize: "0.75rem",
            padding: "9px 12px",
            outline: "none",
          }}
        />
        <button
          onClick={() => setShowDropdown((v) => !v)}
          style={{
            background: "transparent",
            border: `1px solid ${G.border}`,
            color: G.muted,
            padding: "0 12px",
            cursor: "pointer",
          }}
        >
          ▼
        </button>
      </div>

      {showDropdown && filteredBanks.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: G.card,
            border: `1px solid ${G.border}`,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {filteredBanks.map((bank) => (
            <button
              key={bank}
              onClick={() => {
                onChange(bank);
                setSearch(bank);
                setShowDropdown(false);
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${G.border}`,
                color: G.text,
                textAlign: "left",
                cursor: "pointer",
                fontFamily: G.mono,
                fontSize: "0.7rem",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = G.goldDim)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {bank}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add / Edit Form ───────────────────────────────────────────────────────────
function AddCashAccountForm({ onDone, editAccount = null }) {
  const { userId } = useFinance();
  const addCashAccount = useAddCashAccount(userId);
  const updateCashAccount = useUpdateCashAccount(userId);
  const isEdit = !!editAccount;

  const [form, setForm] = useState({
    name: editAccount?.name || "",
    type: editAccount?.type || "savings",
    bank_name: editAccount?.bank_name || "",
    account_number: editAccount?.account_number || "",
    balance: editAccount?.balance || "",
    currency: editAccount?.currency || "INR",
    interest_rate: editAccount?.interest_rate || "",
    interest_frequency: editAccount?.interest_frequency || "yearly",
    opening_date: editAccount?.opening_date || todayISO(),
    maturity_date: editAccount?.maturity_date || "",
    maturity_amount: editAccount?.maturity_amount || "",
    deposit_amount: editAccount?.deposit_amount || "",
    deposit_frequency: editAccount?.deposit_frequency || "monthly",
    tenure_months: editAccount?.tenure_months || "",
    nominee: editAccount?.nominee || "",
    joint_holders: editAccount?.joint_holders || "",
    notes: editAccount?.notes || "",
  });
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState({ tenure: false, maturity: false });

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const isFD = form.type === "fd";
  const isRD = form.type === "rd";
  const isDep = isFD || isRD;

  useEffect(() => {
    if (isDep && form.opening_date && form.tenure_months && editing.tenure) {
      const s = new Date(form.opening_date),
        m = parseFloat(form.tenure_months);
      if (!isNaN(m) && m > 0) {
        const d = new Date(s);
        d.setMonth(s.getMonth() + Math.floor(m));
        const rem = Math.round((m % 1) * 30.44);
        if (rem > 0) d.setDate(d.getDate() + rem);
        const iso = d.toISOString().split("T")[0];
        if (form.maturity_date !== iso) set("maturity_date")(iso);
      }
    }
  }, [form.opening_date, form.tenure_months, isDep, editing.tenure]);

  useEffect(() => {
    if (isDep && form.opening_date && form.maturity_date && editing.maturity) {
      const months = (
        daysBetween(form.opening_date, form.maturity_date) / 30.44
      ).toFixed(2);
      if (form.tenure_months !== months) set("tenure_months")(months);
    }
  }, [form.opening_date, form.maturity_date, isDep, editing.maturity]);

  const submit = async () => {
    if (!form.name || !form.type) {
      setErr("Name and type are required");
      return;
    }
    if (!isDep && !form.balance) {
      setErr("Balance is required");
      return;
    }
    if (isDep && !form.deposit_amount) {
      setErr("Deposit amount is required");
      return;
    }
    
    setErr("");
    
    try {
      const data = {
        name: form.name,
        type: form.type,
        bank_name: form.bank_name,
        account_number: form.account_number,
        balance: Number(form.balance),
        current_value: isDep ? Number(form.deposit_amount) : null,
        maturity_amount: form.maturity_amount
          ? Number(form.maturity_amount)
          : null,
        currency: form.currency,
        interest_rate: form.interest_rate ? Number(form.interest_rate) : null,
        interest_frequency: form.interest_frequency,
        opening_date: form.opening_date || null,
        maturity_date: form.maturity_date || null,
        deposit_amount: form.deposit_amount
          ? Number(form.deposit_amount)
          : null,
        deposit_frequency: form.deposit_frequency,
        tenure_months: form.tenure_months ? Number(form.tenure_months) : null,
        nominee: form.nominee,
        joint_holders: form.joint_holders,
        notes: form.notes,
      };
      
      if (isEdit) {
        await updateCashAccount.mutateAsync({ id: editAccount.id, updates: data });
      } else {
        await addCashAccount.mutateAsync(data);
      }
      onDone();
    } catch (e) {
      setErr(e.message);
    }
  };

  const isPending = addCashAccount.isPending || updateCashAccount.isPending;

  return (
    <div
      style={{
        background: G.surface,
        border: `1px solid ${G.border}`,
        borderLeft: `2px solid ${G.gold}`,
        padding: 24,
        marginBottom: 20,
        position: "relative",
        animation: "fadeUp 0.3s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, ${G.gold}60, transparent)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Landmark size={15} color={G.gold} strokeWidth={1.5} />
          <span
            style={{
              fontFamily: G.mono,
              fontSize: "0.58rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: G.gold,
            }}
          >
            {isEdit ? "Edit Cash Account" : "Add New Cash Account"}
          </span>
        </div>
        <button
          onClick={onDone}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: G.muted,
            padding: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = G.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = G.muted)}
        >
          <X size={16} />
        </button>
      </div>

      {/* Row 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <FL required>Account Name</FL>
          <GInput
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. HDFC Savings"
          />
        </div>
        <div>
          <FL required>Account Type</FL>
          <GSelect value={form.type} onChange={set("type")}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </GSelect>
        </div>
        <div>
          <FL>Bank Name</FL>
          <BankSelect value={form.bank_name} onChange={set("bank_name")} />
        </div>{" "}
        <div>
          <FL>Account Number</FL>
          <GInput
            value={form.account_number}
            onChange={set("account_number")}
            placeholder="Last 4 digits"
          />
        </div>
      </div>

      {/* Row 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {!isDep ? (
          <div>
            <FL required>Current Balance (₹)</FL>
            <GInput
              value={form.balance}
              onChange={set("balance")}
              type="number"
              min="0"
              step="0.01"
              placeholder="50000"
            />
          </div>
        ) : (
          <>
            <div>
              <FL required>
                {isFD ? "Deposit Amount (₹)" : "Monthly Deposit (₹)"}
              </FL>
              <GInput
                value={form.deposit_amount}
                onChange={set("deposit_amount")}
                type="number"
                min="0"
                step="0.01"
                placeholder={isFD ? "100000" : "5000"}
              />
            </div>
            <div>
              <FL>Interest Rate (%)</FL>
              <GInput
                value={form.interest_rate}
                onChange={set("interest_rate")}
                type="number"
                step="0.01"
                min="0"
                placeholder="7.5"
              />
            </div>
            <div>
              <FL>Opening Date</FL>
              <GInput
                value={form.opening_date}
                onChange={set("opening_date")}
                type="date"
              />
            </div>
            <div>
              <FL>Currency</FL>
              <GSelect value={form.currency} onChange={set("currency")}>
                {[
                  ["INR", "INR (₹)"],
                  ["USD", "USD ($)"],
                  ["EUR", "EUR (€)"],
                  ["GBP", "GBP (£)"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </GSelect>
            </div>
          </>
        )}
      </div>

      {/* Deposit-specific rows */}
      {isDep && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <FL>Tenure (Months)</FL>
              <GInput
                value={form.tenure_months}
                onChange={(v) => {
                  setEditing({ tenure: true, maturity: false });
                  set("tenure_months")(v);
                }}
                type="number"
                step="0.01"
                min="0"
                placeholder="12"
              />
            </div>
            <div>
              <FL>Maturity Date</FL>
              <GInput
                value={form.maturity_date}
                onChange={(v) => {
                  setEditing({ tenure: false, maturity: true });
                  set("maturity_date")(v);
                }}
                type="date"
              />
            </div>
            <div>
              <FL>Maturity Amount (₹)</FL>
              <GInput
                value={form.maturity_amount}
                onChange={set("maturity_amount")}
                type="number"
                step="0.01"
                placeholder="Auto-calc"
              />
            </div>
            <div>
              <FL>Interest Frequency</FL>
              <GSelect
                value={form.interest_frequency}
                onChange={set("interest_frequency")}
              >
                {INTEREST_FREQUENCY.map((f) => (
                  <option key={f} value={f}>
                    {f.replace("_", " ")}
                  </option>
                ))}
              </GSelect>
            </div>
            {isRD && (
              <div>
                <FL>Deposit Frequency</FL>
                <GSelect
                  value={form.deposit_frequency}
                  onChange={set("deposit_frequency")}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </GSelect>
              </div>
            )}
          </div>

          {form.opening_date && form.maturity_date && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                background: G.ink,
                border: `1px solid ${G.border}`,
                borderLeft: `2px solid ${G.gold}`,
                marginBottom: 12,
                fontFamily: G.mono,
                fontSize: "0.62rem",
                color: G.muted,
              }}
            >
              <Calendar size={12} color={G.gold} strokeWidth={1.5} />
              Tenure:{" "}
              <span style={{ color: G.text }}>
                {daysBetween(form.opening_date, form.maturity_date)} days
              </span>
              <span style={{ color: G.border }}>·</span>
              <span style={{ color: G.text }}>{form.tenure_months} months</span>
            </div>
          )}
        </>
      )}

      {/* Row: nominee / notes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <FL>Nominee</FL>
          <GInput
            value={form.nominee}
            onChange={set("nominee")}
            placeholder="Name"
          />
        </div>
        <div>
          <FL>Joint Holders</FL>
          <GInput
            value={form.joint_holders}
            onChange={set("joint_holders")}
            placeholder="Comma separated"
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <FL>Notes</FL>
          <GInput
            value={form.notes}
            onChange={set("notes")}
            placeholder="Additional notes"
          />
        </div>
      </div>

      {err && (
        <div
          style={{
            fontFamily: G.mono,
            fontSize: "0.62rem",
            color: G.red,
            padding: "8px 12px",
            background: `${G.red}12`,
            border: `1px solid ${G.red}30`,
            marginBottom: 14,
            letterSpacing: "0.06em",
          }}
        >
          {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={submit}
          disabled={isPending}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: G.gold,
            color: G.ink,
            border: "none",
            padding: "10px 24px",
            cursor: isPending ? "not-allowed" : "pointer",
            fontFamily: G.mono,
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: isPending ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {isPending ? (
            <Spinner size={12} />
          ) : isEdit ? (
            "Update Account"
          ) : (
            "Add Account"
          )}
        </button>
        <button
          onClick={onDone}
          style={{
            background: "transparent",
            border: `1px solid ${G.border}`,
            color: G.muted,
            padding: "10px 20px",
            cursor: "pointer",
            fontFamily: G.mono,
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = G.gold;
            e.currentTarget.style.color = G.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = G.border;
            e.currentTarget.style.color = G.muted;
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const aType =
    ACCOUNT_TYPES.find((t) => t.value === account.type) || ACCOUNT_TYPES[0];
  const isDep = ["fd", "rd"].includes(account.type);
  const display = isDep
    ? account.current_value || account.deposit_amount || 0
    : account.balance;
  const progress = calcProgress(account.opening_date, account.maturity_date);

  const matStatus = () => {
    if (!account.maturity_date) return null;
    const days = Math.ceil(
      (new Date(account.maturity_date) - new Date()) / 86400000,
    );
    if (days < 0) return { label: "Matured", color: G.green };
    if (days < 30) return { label: `${days} days left`, color: G.amber };
    return {
      label: `${Math.floor(days / 30)}m ${days % 30}d left`,
      color: G.muted,
    };
  };
  const mat = matStatus();

  const estValue =
    isDep &&
    account.maturity_amount &&
    account.opening_date &&
    account.maturity_date
      ? Math.round(
          account.deposit_amount +
            (account.maturity_amount - account.deposit_amount) *
              (progress / 100),
        )
      : display;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? G.cardHover : G.card,
        border: `1px solid ${hov ? G.borderHi : G.border}`,
        padding: 22,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: aType.color,
          opacity: hov ? 0.8 : 0.4,
          transition: "opacity 0.3s",
        }}
      />
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 130,
          height: 130,
          background: `radial-gradient(circle, ${aType.color}10 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BankLogo bankName={account.bank_name} />

          <div>
            <div
              style={{
                fontFamily: G.sans,
                fontWeight: 500,
                fontSize: "0.88rem",
                color: G.text,
                marginBottom: 4,
              }}
            >
              {account.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontFamily: G.mono,
                  fontSize: "0.58rem",
                  letterSpacing: "0.08em",
                  background: `${aType.color}14`,
                  color: aType.color,
                  padding: "2px 8px",
                  border: `1px solid ${aType.color}28`,
                }}
              >
                {aType.label}
              </span>
              {account.bank_name && (
                <span
                  style={{
                    fontFamily: G.mono,
                    fontSize: "0.57rem",
                    color: G.muted,
                  }}
                >
                  {account.bank_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {[
            {
              icon: <Edit size={13} />,
              action: () => onEdit(account),
              hoverColor: G.gold,
            },
            {
              icon: <Trash2 size={13} />,
              action: () => onDelete(account.id),
              hoverColor: G.red,
            },
          ].map(({ icon, action, hoverColor }, i) => (
            <button
              key={i}
              onClick={action}
              style={{
                background: "transparent",
                border: `1px solid transparent`,
                padding: "6px 7px",
                cursor: "pointer",
                color: G.muted,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = hoverColor;
                e.currentTarget.style.borderColor = `${hoverColor}40`;
                e.currentTarget.style.background = `${hoverColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = G.muted;
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Value */}
      <div style={{ marginBottom: 16 }}>
        <FL>{isDep ? "Current Value" : "Balance"}</FL>
        <div
          style={{
            fontFamily: G.display,
            fontSize: "2rem",
            fontWeight: 300,
            color: G.text,
            lineHeight: 1,
          }}
        >
          {inrCompact(estValue)}
        </div>
        {account.currency !== "INR" && (
          <span
            style={{
              fontFamily: G.mono,
              fontSize: "0.6rem",
              color: G.muted,
              letterSpacing: "0.1em",
            }}
          >
            {account.currency}
          </span>
        )}
        {isDep && account.maturity_amount > 0 && (
          <div
            style={{
              fontFamily: G.mono,
              fontSize: "0.58rem",
              color: G.muted,
              marginTop: 5,
            }}
          >
            Maturity:{" "}
            <span style={{ color: G.goldLight }}>
              {inrCompact(account.maturity_amount)}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      {isDep && account.opening_date && account.maturity_date && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: G.mono,
                fontSize: "0.52rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: G.muted,
              }}
            >
              Progress to Maturity
            </span>
            <span
              style={{
                fontFamily: G.mono,
                fontSize: "0.58rem",
                color: progress >= 100 ? G.green : G.gold,
              }}
            >
              {progress}%
            </span>
          </div>
          {/* Custom progress bar */}
          <div
            style={{
              height: 3,
              background: `${G.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: `${progress}%`,
                background: progress >= 100 ? G.green : G.gold,
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 5,
            }}
          >
            <span
              style={{ fontFamily: G.mono, fontSize: "0.5rem", color: G.muted }}
            >
              {new Date(account.opening_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span
              style={{ fontFamily: G.mono, fontSize: "0.5rem", color: G.muted }}
            >
              {new Date(account.maturity_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          padding: "14px 0",
          borderTop: `1px solid ${G.border}`,
          borderBottom: `1px solid ${G.border}`,
          marginBottom: 14,
        }}
      >
        {account.interest_rate > 0 && (
          <div>
            <FL>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Percent size={9} />
                Interest Rate
              </span>
            </FL>
            <div
              style={{
                fontFamily: G.display,
                fontSize: "1rem",
                color: G.goldLight,
              }}
            >
              {account.interest_rate}% p.a.
            </div>
          </div>
        )}
        {isDep && account.deposit_amount > 0 && (
          <div>
            <FL>{account.type === "fd" ? "Principal" : "Monthly Dep."}</FL>
            <div
              style={{ fontFamily: G.display, fontSize: "1rem", color: G.text }}
            >
              {inr(account.deposit_amount)}
            </div>
          </div>
        )}
        {account.maturity_date && (
          <div>
            <FL>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={9} />
                Maturity
              </span>
            </FL>
            <div
              style={{
                fontFamily: G.mono,
                fontSize: "0.7rem",
                color: mat?.color || G.text,
              }}
            >
              {new Date(account.maturity_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        )}
        {account.account_number && (
          <div>
            <FL>A/C No.</FL>
            <div
              style={{ fontFamily: G.mono, fontSize: "0.7rem", color: G.text }}
            >
              ••••{account.account_number.slice(-4)}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {mat && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={11} color={mat.color} strokeWidth={1.5} />
            <span
              style={{
                fontFamily: G.mono,
                fontSize: "0.6rem",
                color: mat.color,
                letterSpacing: "0.06em",
              }}
            >
              {mat.label}
            </span>
          </div>
        )}
        {account.nominee && (
          <span
            style={{ fontFamily: G.mono, fontSize: "0.57rem", color: G.muted }}
          >
            Nominee: {account.nominee}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Summary KPIs ──────────────────────────────────────────────────────────────
function CashSummary({ accounts }) {
  const total = accounts.reduce(
    (s, a) =>
      s +
      (["fd", "rd"].includes(a.type)
        ? a.current_value || a.deposit_amount || 0
        : a.balance),
    0,
  );
  const bankTotal = accounts
    .filter((a) => ["savings", "current"].includes(a.type))
    .reduce((s, a) => s + a.balance, 0);
  const fdTotal = accounts
    .filter((a) => a.type === "fd")
    .reduce((s, a) => s + (a.current_value || a.deposit_amount || 0), 0);
  const rdTotal = accounts
    .filter((a) => a.type === "rd")
    .reduce((s, a) => s + (a.current_value || a.deposit_amount || 0), 0);
  const soonMat = accounts.filter((a) => {
    if (!a.maturity_date) return false;
    const d = daysBetween(new Date(), new Date(a.maturity_date));
    return d > 0 && d <= 30;
  }).length;

  const kpis = [
    {
      label: "Total Cash",
      value: inrCompact(total),
      accent: G.gold,
      sub: `${accounts.length} accounts`,
    },
    {
      label: "Bank Accounts",
      value: inrCompact(bankTotal),
      accent: G.blue,
      sub: `${accounts.filter((a) => ["savings", "current"].includes(a.type)).length} accounts`,
    },
    {
      label: "Fixed Deposits",
      value: inrCompact(fdTotal),
      accent: G.amber,
      sub: `${accounts.filter((a) => a.type === "fd").length} FDs`,
    },
    {
      label: "Recurring Deposits",
      value: inrCompact(rdTotal),
      accent: G.teal,
      sub: `${accounts.filter((a) => a.type === "rd").length} RDs${soonMat ? ` · ${soonMat} maturing soon` : ""}`,
    },
  ];

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}
    >
      {kpis.map((k, i) => (
        <div
          key={i}
          style={{
            background: G.card,
            border: `1px solid ${G.border}`,
            padding: "22px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: k.accent,
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 110,
              height: 110,
              background: `radial-gradient(circle, ${k.accent}10 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
          <FL>{k.label}</FL>
          <div
            style={{
              fontFamily: G.display,
              fontSize: "1.9rem",
              fontWeight: 300,
              color: G.text,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {k.value}
          </div>
          <div
            style={{ fontFamily: G.mono, fontSize: "0.58rem", color: k.accent }}
          >
            {k.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Cash() {
  const { userId } = useFinance();
  const { 
    data: cashAccounts = [], 
    isLoading, 
    error,
    refetch 
  } = useCashAccounts(userId);
  
  const deleteCashAccount = useDeleteCashAccount(userId);
  
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [filterType, setFilterType] = useState("all");

  const filtered = cashAccounts.filter(
    (a) => filterType === "all" || a.type === filterType,
  );

  const handleEdit = (a) => {
    setEditingAccount(a);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Delete this account?")) {
      try {
        await deleteCashAccount.mutateAsync(id);
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };
  
  const handleClose = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  if (isLoading) {
    return <CashSkeleton />
  }

  if (error) {
    return (
      <div style={{ 
        padding: "40px", 
        textAlign: "center", 
        background: G.card, 
        border: `1px solid ${G.border}`,
        color: G.red,
        fontFamily: G.mono
      }}>
        Error loading cash accounts: {error.message}
        <button 
          onClick={() => refetch()}
          style={{
            display: "block",
            margin: "20px auto 0",
            padding: "8px 20px",
            background: G.gold,
            border: "none",
            color: G.ink,
            fontFamily: G.mono,
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 20, fontFamily: G.sans }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: 20,
          borderBottom: `1px solid ${G.border}`,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                width: 20,
                height: 1,
                background: G.gold,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontFamily: G.mono,
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: G.gold,
              }}
            >
              PortaFi
            </span>
          </div>
          <h1
            style={{
              fontFamily: G.display,
              fontSize: "2rem",
              fontWeight: 300,
              color: G.text,
              margin: 0,
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            Cash Management
          </h1>
          <p
            style={{
              fontFamily: G.mono,
              fontSize: "0.6rem",
              color: G.muted,
              marginTop: 6,
              letterSpacing: "0.1em",
            }}
          >
            Bank accounts · Fixed deposits · Recurring deposits
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: showForm ? "transparent" : G.gold,
            color: showForm ? G.muted : G.ink,
            border: `1px solid ${showForm ? G.border : G.gold}`,
            padding: "10px 22px",
            cursor: "pointer",
            fontFamily: G.mono,
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!showForm) {
              e.currentTarget.style.boxShadow = `0 0 28px ${G.goldDim}`;
            }
          }}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          {showForm ? (
            <>
              <X size={13} /> Cancel
            </>
          ) : (
            <>
              <Plus size={13} /> Add Account
            </>
          )}
        </button>
      </div>

      {/* KPIs */}
      <CashSummary accounts={cashAccounts} />

      {/* Form */}
      {showForm && (
        <AddCashAccountForm onDone={handleClose} editAccount={editingAccount} />
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[
          {
            value: "all",
            label: `All (${cashAccounts.length})`,
            color: G.text,
          },
          ...ACCOUNT_TYPES,
        ].map((t) => {
          const count =
            t.value === "all"
              ? cashAccounts.length
              : cashAccounts.filter((a) => a.type === t.value).length;
          if (t.value !== "all" && count === 0) return null;
          const active = filterType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                background: active ? `${t.color}18` : "transparent",
                border: `1px solid ${active ? t.color : G.border}`,
                color: active ? t.color : G.muted,
                fontFamily: G.mono,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = G.gold;
                  e.currentTarget.style.color = G.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = G.border;
                  e.currentTarget.style.color = G.muted;
                }
              }}
            >
              {t.icon && <span>{t.icon}</span>}
              {t.value === "all" ? `All (${count})` : `${t.label} (${count})`}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: "60px 0",
            textAlign: "center",
            fontFamily: G.mono,
            fontSize: "0.72rem",
            color: G.muted,
            letterSpacing: "0.1em",
          }}
        >
          No accounts found. Add your first bank account, FD, or RD above.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px,1fr))",
            gap: 14,
          }}
        >
          {filtered.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}