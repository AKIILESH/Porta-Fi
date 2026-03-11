// ── PortaFi Design Tokens ────────────────────────────────────────────────────
// Dual theme: Pure Monochrome — no tints, no colour casts anywhere

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT — White Glass
// ─────────────────────────────────────────────────────────────────────────────
export const lightTheme = {
  mode: 'light',

  bg:   'transparent',
  bg2:  'rgba(255, 255, 255, 0.82)',
  bg3:  'rgba(0, 0, 0, 0.04)',
  bg4:  'rgba(0, 0, 0, 0.08)',

  border:   'rgba(0, 0, 0, 0.08)',
  borderHi: 'rgba(0, 0, 0, 0.22)',

  accent:    'rgba(0, 0, 0, 0.85)',
  accentLt:  'rgba(0, 0, 0, 0.55)',
  accentDim: 'rgba(0, 0, 0, 0.05)',
  accentGlow:'rgba(0, 0, 0, 0.03)',

  // Semantic — only place colour appears, vivid but small surface area
  green:  '#16a34a',
  red:    '#dc2626',
  yellow: '#d97706',
  blue:   '#2563eb',
  purple: '#7c3aed',
  orange: '#ea580c',
  pink:   '#db2777',
  teal:   '#0891b2',
  indigo: '#4338ca',
  mint:   '#059669',

  text:   'rgba(0, 0, 0, 0.88)',
  muted:  'rgba(0, 0, 0, 0.35)',

  display: "-apple-system, 'SF Pro Display', 'Inter', system-ui, sans-serif",
  sans:    "-apple-system, 'SF Pro Text',    'Inter', system-ui, sans-serif",
  mono:    "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",

  get head() { return this.display },
  get syne() { return this.display },
  get card() { return this.bg3     },

  shadow:   '0 2px 16px rgba(0, 0, 0, 0.08)',
  shadowLg: '0 16px 48px rgba(0, 0, 0, 0.14)',
  glow:     '0 0 32px rgba(0, 0, 0, 0.04)',

  glass:       'backdrop-filter: blur(24px) saturate(160%) brightness(1.04); -webkit-backdrop-filter: blur(24px) saturate(160%) brightness(1.04);',
  glassBorder: '1px solid rgba(0, 0, 0, 0.08)',
  specular:    'linear-gradient(135deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.25) 40%, transparent 60%)',
  innerShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.06), inset 1px 0 0 rgba(255,255,255,0.80), inset -1px 0 0 rgba(0,0,0,0.04)',
}

// ─────────────────────────────────────────────────────────────────────────────
// DARK — Black Glass
// ─────────────────────────────────────────────────────────────────────────────
export const darkTheme = {
  mode: 'dark',

  bg:   'transparent',
  bg2:  'rgba(10, 10, 10, 0.84)',
  bg3:  'rgba(255, 255, 255, 0.05)',
  bg4:  'rgba(255, 255, 255, 0.09)',

  border:   'rgba(255, 255, 255, 0.10)',
  borderHi: 'rgba(255, 255, 255, 0.26)',

  accent:    'rgba(255, 255, 255, 0.90)',
  accentLt:  'rgba(255, 255, 255, 0.60)',
  accentDim: 'rgba(255, 255, 255, 0.07)',
  accentGlow:'rgba(255, 255, 255, 0.04)',

  // Semantic — same hues, slightly brighter to pop on black
  green:  '#22c55e',
  red:    '#ef4444',
  yellow: '#f59e0b',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
  pink:   '#ec4899',
  teal:   '#06b6d4',
  indigo: '#6366f1',
  mint:   '#10b981',

  text:   'rgba(255, 255, 255, 0.90)',
  muted:  'rgba(255, 255, 255, 0.35)',

  display: "-apple-system, 'SF Pro Display', 'Inter', system-ui, sans-serif",
  sans:    "-apple-system, 'SF Pro Text',    'Inter', system-ui, sans-serif",
  mono:    "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",

  get head() { return this.display },
  get syne() { return this.display },
  get card() { return this.bg3     },

  shadow:   '0 4px 24px rgba(0, 0, 0, 0.50)',
  shadowLg: '0 20px 60px rgba(0, 0, 0, 0.70)',
  glow:     '0 0 40px rgba(255, 255, 255, 0.05)',

  glass:       'backdrop-filter: blur(24px) saturate(160%) brightness(1.08); -webkit-backdrop-filter: blur(24px) saturate(160%) brightness(1.08);',
  glassBorder: '1px solid rgba(255, 255, 255, 0.10)',
  specular:    'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 60%)',
  innerShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.22), inset 1px 0 0 rgba(255,255,255,0.06), inset -1px 0 0 rgba(0,0,0,0.12)',
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const prefersDark = typeof window !== 'undefined'
  ? localStorage.getItem('portafi-theme') === 'dark' ||
    (!localStorage.getItem('portafi-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  : true

const theme = prefersDark ? darkTheme : lightTheme

export { theme }
export default theme