import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  Wallet,
  Target,
  CreditCard,
  TrendingUp,
  Bot,
  Scale,
  Landmark,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { id: 'portfolio', icon: PieChart, label: 'Portfolio', path: '/portfolio' },
  { id: 'taxcost', icon: Scale, label: 'Tax & Costs', path: '/taxcost' },
  { id: 'cash', icon: Landmark, label: 'Cash', path: '/cash' },
  { id: 'budget', icon: Wallet, label: 'Budget', path: '/budget' },
  { id: 'goals', icon: Target, label: 'Goals', path: '/goals' },
  { id: 'debt', icon: CreditCard, label: 'Debt', path: '/debt' },
  { id: 'markets', icon: TrendingUp, label: 'Markets', path: '/markets' },
  { id: 'ai', icon: Bot, label: 'AI Agent', path: '/ai' },
];

export default function DesktopHeader({ tab, setTab, onSignOut }) {
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleNavClick = (id, path) => {
    setTab(id);
    navigate(path);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '64px',
        background: theme.bg2,
        borderBottom: `1px solid ${theme.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        flexShrink: 0,
      }}
    >
      {/* Brand Logo */}
      <div
        onClick={() => handleNavClick('dashboard', '/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontFamily: theme.display,
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}
      >
        <span style={{ color: theme.accent }}>Porta</span>
        <span style={{ color: theme.text }}>Fi</span>
      </div>

      {/* Navigation Items */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {NAV.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: active ? theme.accentDim : 'transparent',
                color: active ? theme.accent : theme.muted,
                fontFamily: theme.mono,
                fontSize: '0.68rem',
                fontWeight: active ? 600 : 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = theme.bg3;
                  e.currentTarget.style.color = theme.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.muted;
                }
              }}
            >
              <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />

        {/* Profile Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 10,
              border: `1px solid ${profileOpen ? theme.borderHi : theme.border}`,
              background: profileOpen ? theme.bg3 : 'transparent',
              color: theme.text,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!profileOpen) e.currentTarget.style.background = theme.bg3;
            }}
            onMouseLeave={(e) => {
              if (!profileOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: theme.accentDim,
                border: `1px solid ${theme.borderHi}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.accent,
              }}
            >
              <User size={14} strokeWidth={2} />
            </div>
            <span
              style={{
                fontFamily: theme.mono,
                fontSize: '0.7rem',
                color: theme.text,
                fontWeight: 500,
              }}
            >
              Profile
            </span>
            <ChevronDown
              size={14}
              style={{
                color: theme.muted,
                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 160,
                background: theme.bg2,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: '6px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: theme.shadowLg,
                zIndex: 100,
              }}
            >
              {onSignOut && (
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onSignOut();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: theme.red,
                    fontFamily: theme.mono,
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.bg3)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} strokeWidth={1.8} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
