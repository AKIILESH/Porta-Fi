// ── PortaFi Design Tokens ────────────────────────────────────────────────────
// Dual theme: Pure Monochrome — no tints, no colour casts anywhere

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT — White Glass
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// LIGHT — Premium White + Purple
// ─────────────────────────────────────────────────────────────────────────────

export const lightTheme = {
  mode: 'light',

  bg: 'transparent',

  // Softer surfaces
  bg2: 'rgba(255,255,255,0.84)',
  bg3: 'rgba(248,248,252,0.92)',
  bg4: 'rgba(236,236,245,0.92)',

  border: 'rgba(0,0,0,0.06)',
  borderHi: 'rgba(109,94,248,0.18)',

  // Brand Purple
  accent: '#6D5EF8',
  accentLt: 'rgba(109,94,248,0.65)',
  accentDim: 'rgba(109,94,248,0.08)',
  accentGlow: 'rgba(109,94,248,0.18)',

  // Semantic
  green: '#6D5EF8',
  red: '#dc2626',
  yellow: '#d97706',
  blue: '#2563eb',
  purple: '#7C3AED',
  orange: '#ea580c',
  pink: '#db2777',
  teal: '#0891b2',
  indigo: '#4338ca',
  mint: '#059669',

  text: 'rgba(17,17,17,0.92)',
  muted: 'rgba(0,0,0,0.48)',
  white: 'rgba(255,255,255,0.92)',

  display: "-apple-system,'SF Pro Display','Inter',system-ui,sans-serif",
  sans: "-apple-system,'SF Pro Text','Inter',system-ui,sans-serif",
  mono: "'SF Mono','JetBrains Mono','Fira Code',monospace",

  get head() { return this.display },
  get syne() { return this.display },
  get card() { return this.bg3 },

  shadow: '0 6px 24px rgba(0,0,0,0.08)',
  shadowLg: '0 18px 60px rgba(0,0,0,0.14)',

  glow: '0 0 36px rgba(109,94,248,0.10)',

  glass:
    'backdrop-filter: blur(24px) saturate(180%) brightness(1.04); -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.04);',

  glassBorder: '1px solid rgba(255,255,255,0.35)',

  specular:
    'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.35) 45%, transparent 65%)',

  innerShadow:
    'inset 0 1px 0 rgba(255,255,255,.96), inset 0 -1px 0 rgba(0,0,0,.04), inset 1px 0 0 rgba(255,255,255,.8), inset -1px 0 0 rgba(0,0,0,.03)',

  // Brand gradients & interaction feedback
  brandGradient:
    'linear-gradient(135deg, #6D5EF8 0%, #8B5CF6 50%, #A855F7 100%)',
  brandGradientSoft:
    'linear-gradient(135deg, rgba(109,94,248,.15), rgba(168,85,247,.08))',
  focusRing: '0 0 0 4px rgba(109,94,248,.18)',
  successGlow: '0 0 24px rgba(34,197,94,.22)',
  dangerGlow: '0 0 24px rgba(239,68,68,.22)',
}

// ─────────────────────────────────────────────────────────────────────────────
// DARK — Black Glass
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// DARK — Premium Black + Purple
// ─────────────────────────────────────────────────────────────────────────────

export const darkTheme = {
  mode: 'dark',

  bg: 'transparent',

  bg2: 'rgba(15,15,18,0.86)',
  bg3: 'rgba(255,255,255,0.05)',
  bg4: 'rgba(255,255,255,0.08)',

  border: 'rgba(255,255,255,0.08)',
  borderHi: 'rgba(139,125,255,0.22)',

  accent: '#8B7DFF',
  accentLt: 'rgba(139,125,255,0.72)',
  accentDim: 'rgba(139,125,255,0.10)',
  accentGlow: 'rgba(139,125,255,0.24)',

  green: '#8B7DFF',
  red: '#ef4444',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  purple: '#A78BFA',
  orange: '#f97316',
  pink: '#ec4899',
  teal: '#06b6d4',
  indigo: '#818CF8',
  mint: '#10b981',

  text: 'rgba(255,255,255,0.92)',
  muted: 'rgba(255,255,255,0.50)',
  white: 'rgba(255,255,255,0.92)',

  display: "-apple-system,'SF Pro Display','Inter',system-ui,sans-serif",
  sans: "-apple-system,'SF Pro Text','Inter',system-ui,sans-serif",
  mono: "'SF Mono','JetBrains Mono','Fira Code',monospace",

  get head() { return this.display },
  get syne() { return this.display },
  get card() { return this.bg3 },

  shadow: '0 10px 30px rgba(0,0,0,.55)',
  shadowLg: '0 24px 70px rgba(0,0,0,.72)',

  glow: '0 0 42px rgba(139,125,255,.14)',

  glass:
    'backdrop-filter: blur(24px) saturate(180%) brightness(1.08); -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.08);',

  glassBorder: '1px solid rgba(255,255,255,.08)',

  specular:
    'linear-gradient(135deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.04) 45%, transparent 65%)',

  innerShadow:
    'inset 0 1px 0 rgba(255,255,255,.10), inset 0 -1px 0 rgba(0,0,0,.20), inset 1px 0 0 rgba(255,255,255,.05), inset -1px 0 0 rgba(0,0,0,.10)',

  // Brand gradients & interaction feedback (brighter on dark)
  brandGradient:
    'linear-gradient(135deg, #7B6FFF 0%, #9B7BFF 50%, #B57BFF 100%)',
  brandGradientSoft:
    'linear-gradient(135deg, rgba(139,125,255,.18), rgba(181,123,255,.10))',
  focusRing: '0 0 0 4px rgba(139,125,255,.24)',
  successGlow: '0 0 24px rgba(34,197,94,.28)',
  dangerGlow: '0 0 24px rgba(239,68,68,.28)',
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL CSS CUSTOM PROPERTIES
// ─────────────────────────────────────────────────────────────────────────────
// Call this whenever the theme changes to push every token onto :root as
// CSS custom properties. Any element can then use  var(--bg), var(--text), etc.
// without importing the theme object or calling useTheme().
export function injectThemeVars(isDark) {
  const t = isDark ? darkTheme : lightTheme
  const r = document.documentElement.style

  // Core surfaces
  r.setProperty('--bg', t.bg)
  r.setProperty('--bg2', t.bg2)
  r.setProperty('--bg3', t.bg3)
  r.setProperty('--bg4', t.bg4)

  // Borders
  r.setProperty('--border', t.border)
  r.setProperty('--border-hi', t.borderHi)

  // Accent
  r.setProperty('--accent', t.accent)
  r.setProperty('--accent-lt', t.accentLt)
  r.setProperty('--accent-dim', t.accentDim)
  r.setProperty('--accent-glow', t.accentGlow)

  // Semantic colours
  r.setProperty('--green', t.green)
  r.setProperty('--red', t.red)
  r.setProperty('--yellow', t.yellow)
  r.setProperty('--blue', t.blue)
  r.setProperty('--purple', t.purple)
  r.setProperty('--orange', t.orange)
  r.setProperty('--pink', t.pink)
  r.setProperty('--teal', t.teal)
  r.setProperty('--indigo', t.indigo)
  r.setProperty('--mint', t.mint)

  // Typography colours
  r.setProperty('--text', t.text)
  r.setProperty('--muted', t.muted)
  r.setProperty('--white', t.white ?? 'rgba(255,255,255,0.90)')

  // Font families
  r.setProperty('--font-display', t.display)
  r.setProperty('--font-sans', t.sans)
  r.setProperty('--font-mono', t.mono)

  // Shadows & effects
  r.setProperty('--shadow', t.shadow)
  r.setProperty('--shadow-lg', t.shadowLg)
  r.setProperty('--glow', t.glow)

  // Glass
  r.setProperty('--glass-border', t.glassBorder)
  r.setProperty('--specular', t.specular)
  r.setProperty('--inner-shadow', t.innerShadow)

  // Card alias
  r.setProperty('--card', t.card)

  // Brand gradients & interaction feedback
  r.setProperty('--brand-gradient', t.brandGradient)
  r.setProperty('--brand-gradient-soft', t.brandGradientSoft)
  r.setProperty('--focus-ring', t.focusRing)
  r.setProperty('--success-glow', t.successGlow)
  r.setProperty('--danger-glow', t.dangerGlow)
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
const prefersDark = typeof window !== 'undefined'
  ? localStorage.getItem('portafi-theme') === 'dark' ||
  (!localStorage.getItem('portafi-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  : true

const theme = prefersDark ? darkTheme : lightTheme

// Inject vars on first load so they're available before React mounts
if (typeof window !== 'undefined') {
  injectThemeVars(prefersDark)
}

export { theme }
export default theme