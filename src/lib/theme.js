// ── PortaFi Design Tokens ────────────────────────────────────────────────────
// Liquid Glass × Futuristic theme

const theme = {

  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg:       'transparent',                              // page — animated canvas behind
  bg2:      'rgba(6, 18, 32, 0.55)',                   // sidebar / panels
  bg3:      'rgba(255, 255, 255, 0.04)',               // card glass base
  bg4:      'rgba(255, 255, 255, 0.08)',               // card hover / elevated

  // ── Borders ────────────────────────────────────────────────────────────────
  border:   'rgba(255, 255, 255, 0.10)',               // resting glass edge
  borderHi: 'rgba(120, 220, 255, 0.35)',               // hover / active — cyan lit

  // ── Brand Accent — Electric Cyan ───────────────────────────────────────────
  accent:    '#00d4ff',                                // primary cyan
  accentLt:  '#7eeeff',                               // light — highlights, headings
  accentDim: 'rgba(0, 212, 255, 0.10)',               // tinted backgrounds
  accentGlow:'rgba(0, 212, 255, 0.06)',               // ambient glow

  // ── Semantic Colors ────────────────────────────────────────────────────────
  green:    '#00e5a0',   // positive / gain — neon mint
  red:      '#ff4d6d',   // negative / loss
  yellow:   '#ffd166',   // warning
  blue:     '#4f8eff',   // info / US equity
  purple:   '#b57bee',   // ELSS / crypto tags
  orange:   '#ff8c42',   // debt / expense accent

  // ── Typography ─────────────────────────────────────────────────────────────
  text:     '#e8f4ff',   // primary — cool ice white
  muted:    '#4a7fa5',   // secondary / labels — deep blue-grey

  // ── Font Stacks ────────────────────────────────────────────────────────────
  // Load via: https://fonts.googleapis.com/css2?family=Syne:wght@300;400;600;700&family=Space+Grotesk:wght@300;400;500&family=Space+Mono:wght@400&display=swap
  display:  "'Syne', system-ui, sans-serif",
  sans:     "'Space Grotesk', system-ui, sans-serif",
  mono:     "'Space Mono', 'Courier New', monospace",

  // Legacy aliases
  get head()  { return this.display },
  get syne()  { return this.display },
  get card()  { return this.bg3     },

  // ── Shadows & Glows ────────────────────────────────────────────────────────
  shadow:   '0 4px 24px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 12px 48px rgba(0, 0, 0, 0.6)',
  glow:     '0 0 40px rgba(0, 212, 255, 0.15)',

  // ── Glass Mixins (use as inline style helpers) ─────────────────────────────
  glass:       'backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%);',
  glassBorder: '1px solid rgba(255,255,255,0.10)',
}

export { theme }
export default theme