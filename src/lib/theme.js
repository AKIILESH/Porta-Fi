// ── PortaFi Design Tokens ────────────────────────────────────────────────────
// Gold × Obsidian luxury theme

const theme = {

  // ── Backgrounds ────────────────────────────────────────────────────────────
  bg:       '#09090e',   // deepest ink — page background
  bg2:      '#0f0e0a',   // surface — sidebar, panels
  bg3:      '#131109',   // card background
  bg4:      '#181610',   // card hover / elevated surfaces

  // ── Borders ────────────────────────────────────────────────────────────────
  border:   'rgba(201,168,76,0.16)',   // resting border
  borderHi: 'rgba(201,168,76,0.36)',   // hover / active border

  // ── Brand Accent — Gold ────────────────────────────────────────────────────
  accent:   '#c9a84c',               // primary gold
  accentLt: '#e8c96b',               // light gold — highlights, headings
  accentDim: 'rgba(201,168,76,0.10)', // tinted backgrounds
  accentGlow:'rgba(201,168,76,0.06)', // subtle ambient glow

  // ── Semantic Colors ────────────────────────────────────────────────────────
  green:    '#5cb87a',   // positive / gain
  red:      '#d96b6b',   // negative / loss / danger
  yellow:   '#d4a842',   // warning (matches gold family)
  blue:     '#4f8eff',   // info / US equity
  purple:   '#9b5cff',   // ELSS / crypto tags
  orange:   '#e07d3c',   // debt / expense accent

  // ── Typography ─────────────────────────────────────────────────────────────
  text:     '#f0ebe0',   // primary text — warm parchment
  muted:    '#6e6558',   // secondary / labels

  // ── Font Stacks ────────────────────────────────────────────────────────────
  // Load via: https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap
  display:  "'Cormorant Garamond', Georgia, serif",   // display / financial figures
  sans:     "'DM Sans', system-ui, sans-serif",       // body / UI copy
  mono:     "'DM Mono', 'Courier New', monospace",    // labels / data / code

  // Legacy aliases — keeps old components working without changes
  get head()  { return this.display },
  get syne()  { return this.display },
  get card()  { return this.bg3     },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadow:   '0 4px 24px rgba(0,0,0,0.5)',
  shadowLg: '0 12px 48px rgba(0,0,0,0.65)',
  glow:     `0 0 32px rgba(201,168,76,0.14)`,

}

export { theme }
export default theme